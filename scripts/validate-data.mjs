#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DATA_FILE = resolve(ROOT, "app/data.js");
const REQUESTED_MODELS_FILE = resolve(HERE, "data/requested-models-2026-08-15.json");
const ENRICHMENT_FILE = resolve(HERE, "data/official-enrichment.json");
const CATALOG_AUDIT_FILE = resolve(HERE, "data/catalog-feature-audit.json");
const FEATURE_EXPLAINER_PARTS_FILE = resolve(HERE, "data/feature-explainer-parts.json");
const COMPARISON_SUPPLEMENTS_FILE = resolve(HERE, "data/comparison-supplements.json");
const ALLOWED_YEARS = new Set([2022, 2023, 2024, 2025, 2026]);
const ALLOWED_HOSTS = [
  "panasonic.jp",
  "news.panasonic.com",
  "kadenfan.hitachi.co.jp",
  "www.hitachi.co.jp",
  "jp.sharp",
  "cgi.jp.sharp",
  "corporate.jp.sharp",
  "www.toshiba-lifestyle.com",
  "www.hisense.co.jp",
  "web.archive.org"
];

const errors = [];
const warnings = [];

function error(message) { errors.push(message); }
function warn(message) { warnings.push(message); }

const context = { window: {} };
try {
  vm.runInNewContext(readFileSync(DATA_FILE, "utf8"), context, { filename: DATA_FILE });
} catch (cause) {
  console.error(`データを解析できません: ${cause.message}`);
  process.exit(1);
}

const data = context.window.APPLIANCE_DATA;
if (!data || typeof data !== "object") error("window.APPLIANCE_DATA がありません");

const requiredTopLevel = ["app", "makers", "capacityGroups", "washerTypes", "featureGroups", "featureExplainerParts", "catalogAudit", "sources", "products"];
for (const key of requiredTopLevel) if (!(key in data)) error(`トップレベル ${key} がありません`);

const expectedFeatureParts = JSON.parse(readFileSync(FEATURE_EXPLAINER_PARTS_FILE, "utf8"));
if (JSON.stringify(data.featureExplainerParts) !== JSON.stringify(expectedFeatureParts)) error("機能トグルの分割データが元データと一致しません");
const featureNames = new Set((data.products || []).flatMap((product) => (product.features || []).map((feature) => feature.name)));
for (const [combinedName, parts] of Object.entries(expectedFeatureParts)) {
  if (!featureNames.has(combinedName)) error(`分割元の機能が製品データにありません: ${combinedName}`);
  if (!Array.isArray(parts) || parts.length < 2) {
    error(`機能トグルは2項目以上に分割してください: ${combinedName}`);
    continue;
  }
  if (new Set(parts.map((part) => part.name)).size !== parts.length) error(`分割後の機能名が重複しています: ${combinedName}`);
  for (const part of parts) {
    if (!part.name?.trim() || !part.description?.trim()) error(`分割後の機能名か説明が空です: ${combinedName}`);
    if (part.name === combinedName) error(`分割後も複数機能の名称が残っています: ${combinedName}`);
  }
}

const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const makerIds = new Set(data.makers?.map((item) => item.id));
const typeIds = new Set(data.washerTypes?.map((item) => item.id));
const groupIds = new Set(data.featureGroups?.map((item) => item.id));
const sourceIds = new Set(data.sources?.map((item) => item.id));

for (const [label, items] of [["メーカー", data.makers], ["タイプ", data.washerTypes], ["機能分類", data.featureGroups], ["情報源", data.sources], ["製品", data.products]]) {
  const duplicates = duplicateValues((items || []).map((item) => item.id));
  if (duplicates.length) error(`${label}ID重複: ${duplicates.join(", ")}`);
}

const modelOwners = new Map();
for (const product of data.products || []) {
  const path = `製品 ${product.id || "(IDなし)"}`;
  if (!product.id || !/^[a-z0-9][a-z0-9-]*$/.test(product.id)) error(`${path}: ID形式が不正です`);
  if (!makerIds.has(product.makerId)) error(`${path}: makerId ${product.makerId} が未定義です`);
  if (!typeIds.has(product.type)) error(`${path}: type ${product.type} が未定義です`);
  if (!ALLOWED_YEARS.has(product.modelYear)) error(`${path}: 対象外の発売年 ${product.modelYear}`);
  if (!product.releaseLabel || /予定|未発売/.test(product.releaseLabel)) error(`${path}: 発売済みとして扱えない releaseLabel です`);
  if (!Array.isArray(product.models) || !product.models.length) error(`${path}: models が空です`);
  if (!product.capacities) error(`${path}: capacities がありません`);
  if (product.type === "ultrasonic-washer") {
    if (product.capacities?.washingKg != null) error(`${path}: 超音波ウォッシャーに洗濯容量が設定されています`);
    if (!product.capacityNote) error(`${path}: 超音波ウォッシャーに用途説明がありません`);
  } else if (typeof product.capacities?.washingKg !== "number" || product.capacities.washingKg <= 0) {
    error(`${path}: 洗濯容量が数値でありません`);
  }
  if (product.capacities?.dryingKg != null && (typeof product.capacities.dryingKg !== "number" || product.capacities.dryingKg <= 0)) error(`${path}: 乾燥容量が不正です`);
  if (product.type.includes("washer-dryer") && product.capacities?.dryingKg == null) error(`${path}: 洗濯乾燥機に乾燥容量がありません`);
  if (!product.type.includes("washer-dryer") && product.capacities?.dryingKg != null) error(`${path}: 乾燥非搭載製品に乾燥容量が設定されています`);
  if (!Array.isArray(product.sourceIds) || !product.sourceIds.length) error(`${path}: 情報源がありません`);
  if (!product.differenceSummary) error(`${path}: 違いの要点がありません`);
  for (const sourceId of product.sourceIds || []) if (!sourceIds.has(sourceId)) error(`${path}: 情報源 ${sourceId} が未定義です`);
  for (const model of product.models || []) {
    if (modelOwners.has(model)) error(`型番重複: ${model} (${modelOwners.get(model)} / ${product.id})`);
    modelOwners.set(model, product.id);
  }
  for (const feature of product.features || []) {
    if (!groupIds.has(feature.groupId)) error(`${path}: 機能 ${feature.name} の groupId ${feature.groupId} が未定義です`);
    if (!feature.description) error(`${path}: 機能 ${feature.name} の説明がありません`);
    if (/対象機種欄で搭載を確認/.test(feature.description || "")) error(`${path}: 機能 ${feature.name} に汎用説明が残っています`);
    if (!Array.isArray(feature.sourceIds) || !feature.sourceIds.length) error(`${path}: 機能 ${feature.name} に情報源がありません`);
    for (const sourceId of feature.sourceIds || []) if (!sourceIds.has(sourceId)) error(`${path}: 機能 ${feature.name} の情報源 ${sourceId} が未定義です`);
  }
  const duplicateFeatureNames = duplicateValues((product.features || []).map((feature) => feature.name));
  if (duplicateFeatureNames.length) error(`${path}: 機能名が重複しています (${duplicateFeatureNames.join(", ")})`);
  for (const item of product.additionalSpecs || []) {
    if (!item?.label || !item?.value) error(`${path}: additionalSpecs は label と value が必要です`);
  }
  if (product.comparisonFacts) {
    const facts = product.comparisonFacts;
    for (const key of Object.keys(facts)) {
      if (key !== "evidence" && !["inverter", "dehumidification", "reservation", "blanketCapacity", "bodyWidthMm"].includes(key)) error(`${path}: 未定義の比較補完項目 ${key} です`);
      if (key === "bodyWidthMm" && (!Number.isInteger(facts[key]) || facts[key] <= 0 || facts[key] !== product.dimensions.bodyWidthMm)) error(`${path}: 本体幅の比較補完値が不正です`);
      if (key !== "evidence" && key !== "bodyWidthMm" && (typeof facts[key] !== "string" || !facts[key])) error(`${path}: 比較補完項目 ${key} が空です`);
    }
    if (!facts.evidence || !sourceIds.has(facts.evidence.sourceId) || !product.sourceIds.includes(facts.evidence.sourceId)) error(`${path}: 比較補完項目の出典がありません`);
    if (!Array.isArray(facts.evidence?.pages) || !facts.evidence.pages.length) error(`${path}: 比較補完項目のページがありません`);
  }
  for (const [key, value] of Object.entries(product.performance || {})) {
    if (key === "noise") continue;
    if (value != null && typeof value !== "number") error(`${path}: performance.${key} は単位を含まない数値またはnullにしてください`);
  }
  if (product.performance?.waterL != null && (product.performance.waterL < 20 || product.performance.waterL > 500)) error(`${path}: 標準使用水量 ${product.performance.waterL}L が想定範囲外です`);
  if (product.performance?.washTimeMin != null && (product.performance.washTimeMin < 1 || product.performance.washTimeMin > 1000)) error(`${path}: 洗濯時間 ${product.performance.washTimeMin}分 が想定範囲外です`);
  for (const [key, value] of Object.entries(product.performance?.noise || {})) {
    if (value != null && typeof value !== "number") error(`${path}: performance.noise.${key} は数値またはnullにしてください`);
  }
  for (const [key, value] of Object.entries(product.dimensions || {})) {
    if (key === "pan" || key === "doorDirection") continue;
    if (value != null && typeof value !== "number") error(`${path}: dimensions.${key} は単位を含まない数値またはnullにしてください`);
  }
}

let catalogAuditedCount = 0;
if (!existsSync(CATALOG_AUDIT_FILE)) {
  error("カタログ機能照合台帳がありません");
} else {
  const catalogAudit = JSON.parse(readFileSync(CATALOG_AUDIT_FILE, "utf8"));
  if (catalogAudit.checkedAt > data.app.updatedAt) error(`カタログ機能照合日がアプリ更新日より新しいです: ${catalogAudit.checkedAt} / ${data.app.updatedAt}`);
  const auditedModels = new Set();
  for (const rule of catalogAudit.rules || []) {
    for (const model of rule.models || []) {
      if (auditedModels.has(model)) {
        error(`カタログ機能照合台帳で機種が重複しています: ${model}`);
        continue;
      }
      auditedModels.add(model);
      const product = (data.products || []).find((item) => item.name === model);
      if (!product) {
        error(`カタログ機能照合台帳の機種がアプリにありません: ${model}`);
        continue;
      }
      catalogAuditedCount += 1;
      const sourceId = rule.sourceByModel?.[model] || rule.sourceId;
      const pages = rule.pagesByModel?.[model] || rule.pages;
      const expectedFeatures = (rule.features || []).map(([name, groupId]) => ({ name, groupId }));
      const actualFeatures = (product.features || []).map(({ name, groupId }) => ({ name, groupId }));
      if (JSON.stringify(actualFeatures) !== JSON.stringify(expectedFeatures)) error(`${model}: 生成された機能一覧がカタログ機能照合台帳と一致しません`);
      if ((product.features || []).some((feature) => JSON.stringify(feature.sourceIds) !== JSON.stringify([sourceId]))) error(`${model}: カタログ照合機能の情報源が ${sourceId} に限定されていません`);
      if (product.catalogEvidence?.sourceId !== sourceId) error(`${model}: catalogEvidence.sourceId が一致しません`);
      if (JSON.stringify(product.catalogEvidence?.pages) !== JSON.stringify(pages)) error(`${model}: catalogEvidence.pages が一致しません`);
      if (product.catalogEvidence?.checkedAt !== catalogAudit.checkedAt) error(`${model}: catalogEvidence.checkedAt が一致しません`);
      if (Object.hasOwn(rule, "dryingMethod") && product.drying?.method !== rule.dryingMethod) error(`${model}: 乾燥方式がカタログ機能照合台帳と一致しません`);
      if (Object.hasOwn(rule, "autoDosing") && product.specDetails?.autoDosing !== rule.autoDosing) error(`${model}: 自動投入情報がカタログ機能照合台帳と一致しません`);
      if (Object.hasOwn(rule, "smartphone") && product.specDetails?.smartphone !== rule.smartphone) error(`${model}: スマートフォン連携情報がカタログ機能照合台帳と一致しません`);
      const highlightsByGroup = { washing: "washHighlights", drying: "dryingHighlights", care: "careHighlights", convenience: "convenienceHighlights" };
      for (const [groupId, key] of Object.entries(highlightsByGroup)) {
        const expectedHighlights = expectedFeatures.filter((feature) => feature.groupId === groupId).map((feature) => feature.name);
        if (JSON.stringify(product.specDetails?.[key]) !== JSON.stringify(expectedHighlights)) error(`${model}: specDetails.${key} がカタログ機能照合台帳と一致しません`);
      }
      const panelFeature = expectedFeatures.find((feature) => /操作パネル|タッチパネル|タッチナビ|バック操作/.test(feature.name));
      if (panelFeature && product.specDetails?.panel !== panelFeature.name) error(`${model}: 操作パネル情報がカタログ機能照合台帳と一致しません`);
      if (product.specDetails?.panel === "寸法") error(`${model}: 操作パネルへ仕様見出し「寸法」が誤登録されています`);
    }
  }
  if (data.catalogAudit?.checkedAt !== catalogAudit.checkedAt) error("生成データのカタログ照合日が台帳と一致しません");
  if (data.catalogAudit?.auditedProducts !== catalogAuditedCount) error(`生成データのカタログ照合件数が不一致です: ${data.catalogAudit?.auditedProducts} / ${catalogAuditedCount}`);
  if (data.catalogAudit?.totalProducts !== (data.products || []).length) error("生成データの総機種数が catalogAudit.totalProducts と一致しません");
}

function assertFeatureExcluded(model, patterns) {
  const product = (data.products || []).find((item) => item.name === model);
  if (!product) return;
  const falselyIncluded = (product.features || []).filter((feature) => patterns.some((pattern) => pattern.test(feature.name)));
  if (falselyIncluded.length) error(`${model}: 非搭載を確認した機能が含まれています (${falselyIncluded.map((feature) => feature.name).join(", ")})`);
}

for (const model of ["NA-SD10UA", "NA-SD10HA", "NA-SD10UB", "NA-SD10HB"]) assertFeatureExcluded(model, [/ヒートポンプ/]);
for (const model of ["NA-SD10HA", "NA-SD10HB"]) assertFeatureExcluded(model, [/スマホ/]);
assertFeatureExcluded("NA-LX113E", [/トリプル自動投入/, /スマホ/, /ナノイー/, /汚れはがし/]);
assertFeatureExcluded("NA-LX125E", [/スマホ/, /ナノイー/]);
assertFeatureExcluded("NA-LX127E", [/ナノイー/]);
assertFeatureExcluded("ES-8XS1", [/COCORO WASH/i, /音声/]);
assertFeatureExcluded("BD-SX130M", [/ワイドカラー液晶タッチパネル/]);

if (!existsSync(ENRICHMENT_FILE)) {
  error("公式仕様補完データがありません");
} else {
  const enrichment = JSON.parse(readFileSync(ENRICHMENT_FILE, "utf8"));
  if (enrichment.failures?.length) error(`公式仕様取得に失敗があります: ${enrichment.failures.join(" / ")}`);
  const missingEnrichment = (data.products || []).filter((product) => !enrichment.products?.[product.id]).map((product) => product.name);
  if (missingEnrichment.length) error(`公式仕様補完データがない機種: ${missingEnrichment.join(", ")}`);
}

if (!existsSync(REQUESTED_MODELS_FILE)) {
  error("追加画像の型番台帳がありません");
} else {
  const requested = JSON.parse(readFileSync(REQUESTED_MODELS_FILE, "utf8")).models || [];
  const normalizeModel = (value) => String(value || "").normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const searchableModels = new Set((data.products || []).flatMap((product) => [product.name, ...(product.models || [])]).map(normalizeModel));
  const duplicateRequested = duplicateValues(requested.map(normalizeModel));
  if (duplicateRequested.length) error(`追加画像の型番台帳に重複があります: ${duplicateRequested.join(", ")}`);
  const missingRequested = requested.filter((model) => !searchableModels.has(normalizeModel(model)));
  if (missingRequested.length) error(`追加画像の未収録型番: ${missingRequested.join(", ")}`);
  if (requested.length !== 101) error(`追加画像の型番件数は101件を想定していますが${requested.length}件です`);
}

for (const source of data.sources || []) {
  let url;
  try { url = new URL(source.url); } catch { error(`情報源 ${source.id}: URLが不正です`); continue; }
  if (url.protocol !== "https:") error(`情報源 ${source.id}: HTTPSではありません`);
  if (!ALLOWED_HOSTS.includes(url.hostname)) error(`情報源 ${source.id}: メーカー公式外ドメイン ${url.hostname}`);
  if (source.checkedAt > data.app.updatedAt) error(`情報源 ${source.id}: 確認日がアプリ更新日より新しいです`);
}

const forbiddenKeys = [];
function inspect(value, path = "data") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/score|rating|rank|points?/i.test(key) || /点数|総合評価|ランキング/.test(key)) forbiddenKeys.push(`${path}.${key}`);
    inspect(child, `${path}.${key}`);
  }
}
inspect(data);
if (forbiddenKeys.length) error(`点数・順位関連フィールドを検出: ${forbiddenKeys.join(", ")}`);

for (const group of ["drum-representatives", "top-representatives"]) {
  const preset = (data.products || []).filter((product) => product.presetGroups?.includes(group));
  const makersInPreset = preset.map((product) => product.makerId);
  if (preset.length > data.app.compareLimit) error(`${group}: 比較上限を超えています`);
  if (duplicateValues(makersInPreset).length) error(`${group}: 同一メーカーが重複しています`);
  const expectedPresetSize = Math.min(data.app.compareLimit, data.makers.length);
  if (preset.length !== expectedPresetSize) warn(`${group}: 代表比較は${expectedPresetSize}機種を想定していますが${preset.length}機種です`);
}

for (const maker of data.makers || []) {
  if (maker.logo && !existsSync(resolve(ROOT, "app", maker.logo))) warn(`${maker.name}: ロゴが見つかりません (${maker.logo})`);
}

for (const file of ["app/index.html", "app/styles.css", "app/app.js", "app/data.js", "SOURCE_NOTES.md", "scripts/data/catalog-feature-audit.json", "scripts/data/feature-explainer-parts.json", "netlify.toml", "洗濯機説明ナビ.command"]) {
  if (!existsSync(resolve(ROOT, file))) error(`必須ファイルがありません: ${file}`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const message of errors) console.error(`ERROR: ${message}`);
  console.error(`\n検証失敗: ${errors.length}件のエラー`);
  process.exit(1);
}

const byMakerYearType = {};
for (const product of data.products) {
  const key = `${product.makerId}/${product.modelYear}/${product.type}`;
  byMakerYearType[key] = (byMakerYearType[key] || 0) + 1;
}
console.log(`検証成功: ${data.makers.length}メーカー / ${data.products.length}基本機種 / ${modelOwners.size}型番 / カタログ機能照合 ${catalogAuditedCount}機種`);
for (const [key, count] of Object.entries(byMakerYearType).sort()) console.log(`${key}: ${count}`);
