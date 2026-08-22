#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../app/data.js");
const NOTES_OUT = resolve(HERE, "../SOURCE_NOTES.md");
const ENRICHMENT_FILE = resolve(HERE, "data/official-enrichment.json");
const VERIFIED_AT = "2026-08-22";
const CATALOG_CHECKED_AT = "2026-08-22";

const sources = [
  { id: "panasonic-lineup", makerId: "panasonic", title: "洗濯機・衣類乾燥機 ラインアップ", url: "https://panasonic.jp/wash/", checkedAt: VERIFIED_AT },
  { id: "panasonic-sd-a", makerId: "panasonic", title: "ななめドラム洗濯乾燥機 SDシリーズ 発表（2024年11月19日）", url: "https://news.panasonic.com/jp/press/jn241119-1", checkedAt: VERIFIED_AT },
  { id: "panasonic-lx-e", makerId: "panasonic", title: "ななめドラム洗濯乾燥機 LXシリーズ Eモデル 発表", url: "https://news.panasonic.com/jp/press/jn250819-2", checkedAt: VERIFIED_AT },
  { id: "panasonic-sd-b", makerId: "panasonic", title: "ななめドラム洗濯乾燥機 SDシリーズ Bモデル 発表", url: "https://news.panasonic.com/jp/press/jn250821-2", checkedAt: VERIFIED_AT },
  { id: "panasonic-fa-2025", makerId: "panasonic", title: "全自動洗濯機 FAシリーズ 2025年モデル", url: "https://news.panasonic.com/jp/topics/206195", checkedAt: VERIFIED_AT },
  { id: "panasonic-fa-2026", makerId: "panasonic", title: "全自動洗濯機 FAシリーズ 2026年モデル", url: "https://news.panasonic.com/jp/topics/206684", checkedAt: VERIFIED_AT },
  { id: "panasonic-fa-feature", makerId: "panasonic", title: "FAシリーズ 洗浄機能", url: "https://panasonic.jp/wash/feature/FA/washing.html", checkedAt: VERIFIED_AT },
  { id: "panasonic-lx-d", makerId: "panasonic", title: "ななめドラム洗濯乾燥機 LXシリーズ Dモデル 発表", url: "https://news.panasonic.com/jp/press/jn240827-3", checkedAt: VERIFIED_AT },
  { id: "panasonic-fa-2022", makerId: "panasonic", title: "全自動洗濯機 FAシリーズ 2022年モデル 発表", url: "https://news.panasonic.com/jp/press/jn220419-2", checkedAt: VERIFIED_AT },
  { id: "panasonic-jfa-2023", makerId: "panasonic", title: "全自動洗濯機 JFAシリーズ 2023年モデル", url: "https://news.panasonic.com/jp/topics/205106", checkedAt: VERIFIED_AT },
  { id: "panasonic-model-years", makerId: "panasonic", title: "音声プッシュ通知 対応機種・モデル年一覧", url: "https://panasonic.jp/voicepush/products.html", checkedAt: VERIFIED_AT },
  { id: "hitachi-2025", makerId: "hitachi", title: "日立 洗濯機 2025年発売商品", url: "https://kadenfan.hitachi.co.jp/support/wash/item/2025.html", checkedAt: VERIFIED_AT },
  { id: "hitachi-2026", makerId: "hitachi", title: "日立 洗濯機 2026年発売商品", url: "https://kadenfan.hitachi.co.jp/support/wash/item/2026.html", checkedAt: VERIFIED_AT },
  { id: "hitachi-2023", makerId: "hitachi", title: "日立 洗濯機 2023年発売商品", url: "https://kadenfan.hitachi.co.jp/support/wash/item/2023.html", checkedAt: VERIFIED_AT },
  { id: "hitachi-2024", makerId: "hitachi", title: "日立 洗濯機 2024年発売商品", url: "https://kadenfan.hitachi.co.jp/support/wash/item/2024.html", checkedAt: VERIFIED_AT },
  { id: "hitachi-full-2026", makerId: "hitachi", title: "日立 洗濯機・衣類乾燥機 フルラインアップ", url: "https://kadenfan.hitachi.co.jp/wash/full/", checkedAt: VERIFIED_AT },
  { id: "sharp-spec", makerId: "sharp", title: "シャープ 洗濯機 仕様一覧", url: "https://jp.sharp/support/washer/spec/index.html", checkedAt: VERIFIED_AT },
  { id: "sharp-lineup", makerId: "sharp", title: "シャープ 洗濯機 ラインアップ", url: "https://jp.sharp/sentaku/", checkedAt: VERIFIED_AT },
  { id: "sharp-uw-x1-press", makerId: "sharp", title: "超音波ウォッシャー UW-X1 発表", url: "https://corporate.jp.sharp/news/230613-a.html", checkedAt: VERIFIED_AT },
  { id: "toshiba-2025", makerId: "toshiba", title: "東芝 2025年 洗濯機トピックス", url: "https://www.toshiba-lifestyle.com/jp/topics/2025/", checkedAt: VERIFIED_AT },
  { id: "toshiba-drum-2025", makerId: "toshiba", title: "ドラム式洗濯乾燥機 2025年モデル 発表", url: "https://www.toshiba-lifestyle.com/jp/press/2025/08/26/3413/", checkedAt: VERIFIED_AT },
  { id: "toshiba-top-2026", makerId: "toshiba", title: "全自動洗濯機 2026年モデル 発表", url: "https://www.toshiba-lifestyle.com/jp/press/2026/04/13/3990/", checkedAt: VERIFIED_AT },
  { id: "toshiba-lineup", makerId: "toshiba", title: "東芝 洗濯機 ラインアップ", url: "https://www.toshiba-lifestyle.com/jp/laundries/lineup/", checkedAt: VERIFIED_AT },
  { id: "hisense-l-2025", makerId: "hisense", title: "全自動洗濯機 Lシリーズ 2025年モデル 発表", url: "https://www.hisense.co.jp/news/detail.php?id=174", checkedAt: VERIFIED_AT },
  { id: "hisense-d120", makerId: "hisense", title: "ドラム式洗濯乾燥機 HWF-D120XL-W 発表", url: "https://www.hisense.co.jp/news/detail.php?id=194&news_category_id=1", checkedAt: VERIFIED_AT },
  { id: "hisense-l-black", makerId: "hisense", title: "全自動洗濯機 Lシリーズ ブラックモデル 発表", url: "https://www.hisense.co.jp/news/detail.php?id=205&news_category_id=1", checkedAt: VERIFIED_AT },
  { id: "hisense-d100", makerId: "hisense", title: "ドラム式洗濯乾燥機 HWF-D100SL-W 発表", url: "https://www.hisense.co.jp/news/detail.php?id=206&news_category_id=1", checkedAt: VERIFIED_AT },
  { id: "panasonic-catalog-2026-drum", makerId: "panasonic", title: "洗濯機カタログ 2026春夏（ドラム式 p.2–9）", url: "https://panasonic.jp/content/dam/panasonic/jp/ja/catalog/pdf/wash.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "panasonic-catalog-2026-top", makerId: "panasonic", title: "洗濯機カタログ 2026春夏（縦型 p.10–13）", url: "https://panasonic.jp/content/dam/panasonic/jp/ja/catalog/pdf/wash.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "hitachi-catalog-2026", makerId: "hitachi", title: "洗濯機総合カタログ 2026-02（機能・ラインアップ p.2–10）", url: "https://kadenfan.hitachi.co.jp/catalog/wash/book/data/Target.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-catalog-2026-drum", makerId: "sharp", title: "洗濯機総合カタログ 2026-04（ドラム式 p.2–9）", url: "https://cgi.jp.sharp/catalog/pdf/ha/SHARP-sentaku-2026-06.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-catalog-2026-top", makerId: "sharp", title: "洗濯機総合カタログ 2026-04（縦型 p.10–15）", url: "https://cgi.jp.sharp/catalog/pdf/ha/SHARP-sentaku-2026-06.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "toshiba-catalog-2026-top", makerId: "toshiba", title: "洗濯機総合カタログ 2026-02（縦型 p.8–12）", url: "https://www.toshiba-lifestyle.com/sites/default/files/2026-04/laundries-2026-04.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "hisense-catalog-2026-drum", makerId: "hisense", title: "洗濯機総合カタログ 2026-02（ドラム式 p.2–4）", url: "https://www.hisense.co.jp/support/catalog/pdf/catalog_wash.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "hisense-catalog-2026-top", makerId: "hisense", title: "洗濯機総合カタログ 2026-02（縦型 p.6–8）", url: "https://www.hisense.co.jp/support/catalog/pdf/catalog_wash.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-catalog-2025", makerId: "sharp", title: "洗濯機総合カタログ 2025-09（仕様 p.6–15）", url: "https://jp.sharp/catalog/pdf/ha/SHARP-sentaku-2025-09.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "toshiba-catalog-2025", makerId: "toshiba", title: "洗濯機総合カタログ 2025-03（機能・仕様 p.2–13）", url: "https://www.toshiba-lifestyle.com/sites/default/files/2025-08/laundries-2025-08.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "hisense-catalog-2025-top", makerId: "hisense", title: "洗濯機総合カタログ 2025-07（縦型 p.2–6）", url: "https://web.archive.org/web/20250905035958id_/https://www.hisense.co.jp/support/catalog/pdf/catalog_wash.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-catalog-2024", makerId: "sharp", title: "洗濯機総合カタログ 2024-03", url: "https://jp.sharp/catalog/pdf/ha/SHARP-sentaku-2024-3.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-es-x11b-pdf", makerId: "sharp", title: "ES-X11B 公式仕様表", url: "https://jp.sharp/support/washer/spec/spec_77.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "sharp-uw-x1-catalog", makerId: "sharp", title: "超音波ウォッシャー UW-X1 公式カタログ", url: "https://jp.sharp/catalog/pdf/ha/SHARP_sentaku_uw-x1.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "toshiba-catalog-2024", makerId: "toshiba", title: "洗濯機総合カタログ 2024-09", url: "https://www.toshiba-lifestyle.com/sites/default/files/2024-09/laundries-2024-09.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "toshiba-catalog-2022", makerId: "toshiba", title: "洗濯機総合カタログ 2022-11", url: "https://www.toshiba-lifestyle.com/sites/default/files/2022-11/laundries-2022-11.pdf", checkedAt: CATALOG_CHECKED_AT },
  { id: "toshiba-xp4-2024", makerId: "toshiba", title: "TW-127XP4 公式製品カタログ", url: "https://www.toshiba-lifestyle.com/sites/default/files/2024-08/laundries-xp4-2024-08.pdf", checkedAt: CATALOG_CHECKED_AT }
];

const makers = [
  { id: "panasonic", name: "Panasonic", shortName: "Panasonic", accent: "#0c7f8c", logo: "assets/logos/panasonic.png", guide: "ドラムはヒートポンプ乾燥のLXとコンパクトなSD、縦型は容量・投入口・自動投入の有無を軸に案内します。" },
  { id: "hitachi", name: "日立", shortName: "HITACHI", accent: "#1f5aa6", logo: "assets/logos/hitachi.png", guide: "ドラムは容量とお手入れ機能、縦型は洗濯乾燥の有無と容量差を先に確認すると整理しやすい構成です。" },
  { id: "sharp", name: "シャープ", shortName: "SHARP", accent: "#d71920", logo: "assets/logos/sharp.png", guide: "縦型は穴なし槽、ドラムは乾燥方式と本体サイズを中心に、設置条件まで一緒に確認します。" },
  { id: "toshiba", name: "東芝", shortName: "TOSHIBA", accent: "#e31b23", logo: "assets/logos/toshiba.png", guide: "抗菌ウルトラファインバブル洗浄の搭載範囲と、容量・投入口・低振動性を用途に合わせて案内します。" },
  { id: "hisense", name: "Hisense", shortName: "Hisense", accent: "#00a6a6", logo: "assets/logos/hisense.png", guide: "必要容量と本体サイズを先に確認し、ドラムは乾燥方式の違い、縦型はシンプルな操作性を説明します。" }
];

const typeNames = {
  "drum-washer-dryer": "ドラム式洗濯乾燥機",
  "top-washer-dryer": "縦型洗濯乾燥機",
  "top-full-auto": "縦型全自動洗濯機",
  "ultrasonic-washer": "超音波ウォッシャー"
};

const featureTemplates = {
  panasonicDrum: [{ name: "スゴ落ち泡洗浄", description: "濃密泡と洗濯槽の動きを組み合わせた洗浄機能です。", groupId: "washing" }],
  panasonicAuto: [{ name: "液体洗剤・柔軟剤 自動投入", description: "対象タンクへ補充しておくと、洗濯時に自動で計量・投入します。", groupId: "convenience" }],
  panasonicTop: [{ name: "スゴ落ち泡洗浄", description: "洗剤を泡立てて衣類へ浸透させる縦型の洗浄機能です。", groupId: "washing" }],
  panasonicCompact: [{ name: "ビッグウェーブ洗浄", description: "立体水流で衣類を動かして洗うコンパクト縦型の洗浄機能です。", groupId: "washing" }],
  hitachiDrum: [{ name: "らくメンテ", description: "乾燥経路やフィルターまわりのお手入れ負担に配慮した機能群です。", groupId: "care" }],
  hitachiTop: [{ name: "ナイアガラ ビート洗浄", description: "高濃度洗剤液と大流量の水流で洗う機能です。", groupId: "washing" }],
  hitachiSimple: [{ name: "シャワー浸透洗浄", description: "洗剤液を衣類へ浸透させて洗う機能です。", groupId: "washing" }],
  sharpDrum: [{ name: "プラズマクラスター", description: "洗濯槽内の清潔ケアに使うシャープ独自のイオン技術です。", groupId: "care" }],
  sharpTop: [{ name: "穴なし槽", description: "洗濯槽の外側へ水が流れにくい穴なし構造です。", groupId: "care" }],
  toshiba: [{ name: "抗菌ウルトラファインバブル洗浄", description: "微細な泡を含む水で洗剤の洗浄成分を繊維へ届ける洗浄機能です。", groupId: "washing" }],
  hisenseL: [{ name: "液体洗剤・柔軟剤 自動投入", description: "液体洗剤と柔軟剤を自動で計量・投入する機能です。", groupId: "convenience" }],
  hisenseDrum: [{ name: "ドラム式洗濯乾燥", description: "洗濯から乾燥までを一台で行えるモデルです。", groupId: "drying" }]
};

const products = [];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addProduct(config) {
  const model = config.model;
  const sourceIds = [...config.sourceIds];
  const features = (config.features || []).map((feature) => ({ ...feature, sourceIds }));
  const models = config.models || [model];
  const hasLeft = models.some((item) => /L$/.test(item));
  const hasRight = models.some((item) => /R$/.test(item));
  const doorDirection = config.doorDirection || (config.type.startsWith("top-") ? "上開き" : hasLeft && hasRight ? "左開き / 右開き" : hasLeft ? "左開き" : "");
  products.push({
    id: `${config.makerId}-${slug(model)}`,
    name: config.name || model,
    makerId: config.makerId,
    models,
    modelYear: config.year,
    releaseLabel: config.release,
    type: config.type,
    capacities: { washingKg: config.wash ?? null, dryingKg: config.dry ?? null },
    capacityNote: config.capacityNote || "",
    drying: { method: config.drying || "", notes: config.dryingNotes || "" },
    performance: {
      washTimeMin: config.performance?.washTimeMin ?? null,
      washDryTimeMin: config.performance?.washDryTimeMin ?? null,
      waterL: config.performance?.waterL ?? null,
      energyWh: config.performance?.energyWh ?? null,
      energyWh50Hz: config.performance?.energyWh50Hz ?? null,
      energyWh60Hz: config.performance?.energyWh60Hz ?? null,
      noise: {
        washDb: config.performance?.washDb ?? null,
        spinDb: config.performance?.spinDb ?? null,
        dryDb: config.performance?.dryDb ?? null
      }
    },
    dimensions: {
      widthMm: config.dimensions?.widthMm ?? null,
      depthMm: config.dimensions?.depthMm ?? null,
      heightMm: config.dimensions?.heightMm ?? null,
      massKg: config.dimensions?.massKg ?? null,
      bodyWidthMm: config.dimensions?.bodyWidthMm ?? null,
      pan: config.dimensions?.pan || "",
      doorDirection
    },
    headline: config.headline || (config.wash != null ? `${typeNames[config.type]}・洗濯${config.wash}kg` : typeNames[config.type]),
    fit: config.fit || "容量と設置寸法を公式仕様で確認したいお客様",
    features,
    cautions: config.cautions || ["搬入経路、防水パン、蛇口の高さ、排水位置を設置前に確認してください。"],
    sourceIds,
    presetGroups: config.presetGroups || [],
    additionalSpecs: config.additionalSpecs || [],
    preserveCopy: Boolean(config.preserveCopy)
  });
}

function addRows(defaults, rows) {
  for (const row of rows) addProduct({ ...defaults, ...row });
}

// Panasonic: 2025 / 2026
addRows({ makerId: "panasonic", type: "drum-washer-dryer", drying: "ヒートポンプ式", features: featureTemplates.panasonicDrum, sourceIds: ["panasonic-lx-e"] }, [
  { model: "NA-LX129E", models: ["NA-LX129EL", "NA-LX129ER"], year: 2025, release: "2025年10月上旬", wash: 12, dry: 6, features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto], presetGroups: ["drum-representatives"], fit: "乾燥までの省エネ性と自動投入を重視するお客様" },
  { model: "NA-LX127E", models: ["NA-LX127EL", "NA-LX127ER"], year: 2025, release: "2025年10月上旬", wash: 12, dry: 6, features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto] },
  { model: "NA-LX125E", models: ["NA-LX125EL", "NA-LX125ER"], year: 2025, release: "2025年10月上旬", wash: 12, dry: 6 },
  { model: "NA-LX113E", models: ["NA-LX113EL"], year: 2025, release: "2025年10月上旬", wash: 11, dry: 6 }
]);
addRows({ makerId: "panasonic", type: "drum-washer-dryer", drying: "低温風パワフル乾燥（ヒーター式）", features: featureTemplates.panasonicDrum }, [
  { model: "NA-SD10UA", models: ["NA-SD10UAL"], year: 2025, release: "2025年1月上旬", wash: 10, dry: 5, sourceIds: ["panasonic-sd-a"], features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto], fit: "奥行を抑えたドラム式と自動投入を両立したいお客様" },
  { model: "NA-SD10HA", models: ["NA-SD10HAL"], year: 2025, release: "2025年1月上旬", wash: 10, dry: 5, sourceIds: ["panasonic-sd-a"] },
  { model: "NA-SD10UB", models: ["NA-SD10UBL"], year: 2025, release: "2025年11月上旬", wash: 10, dry: 5, sourceIds: ["panasonic-sd-b"], features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto] },
  { model: "NA-SD10HB", models: ["NA-SD10HBL"], year: 2025, release: "2025年11月上旬", wash: 10, dry: 5, sourceIds: ["panasonic-sd-b"] }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", year: 2025, release: "2025年", features: featureTemplates.panasonicTop, sourceIds: ["panasonic-fa-2025", "panasonic-fa-feature"] }, [
  { model: "NA-FA12V5", wash: 12 }, { model: "NA-FA11K5", wash: 11 }, { model: "NA-FA10K5", wash: 10 }, { model: "NA-FA9K5", wash: 9 },
  { model: "NA-FA8K5", wash: 8 }, { model: "NA-FA10H5", wash: 10 }, { model: "NA-FA8H5", wash: 8 }, { model: "NA-FA7H5", wash: 7 }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", year: 2025, release: "2025年11月", features: featureTemplates.panasonicCompact, sourceIds: ["panasonic-lineup"] }, [
  { model: "NA-F7PB5", wash: 7 }, { model: "NA-F7B5", wash: 7 }, { model: "NA-F6B5", wash: 6 }, { model: "NA-F5B5", wash: 5 }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", year: 2026, release: "2026年", features: featureTemplates.panasonicTop, sourceIds: ["panasonic-fa-2026", "panasonic-fa-feature"] }, [
  { model: "NA-FA12V6", wash: 12, release: "2026年6月", presetGroups: ["top-representatives"], performance: { washTimeMin: 36, waterL: 139, energyWh: 70, washDb: 37, spinDb: 39 }, dimensions: { widthMm: 637, depthMm: 694, heightMm: 1086, massKg: 51, pan: "内寸 奥行540mm以上（公式仕様）" }, fit: "大容量の縦型と自動投入を重視するお客様" },
  { model: "NA-FA10K6", wash: 10 }, { model: "NA-FA9K6", wash: 9 }, { model: "NA-FA8K6", wash: 8 },
  { model: "NA-FA10H6", wash: 10 }, { model: "NA-FA8H6", wash: 8 }, { model: "NA-FA7H6", wash: 7 }, { model: "NA-JFA8K6", wash: 8 }
]);

// Panasonic: requested historical models
addRows({ makerId: "panasonic", type: "drum-washer-dryer", year: 2024, release: "2024年10月上旬", wash: 12, dry: 6, drying: "ヒートポンプ式", features: featureTemplates.panasonicDrum, sourceIds: ["panasonic-lx-d"] }, [
  { model: "NA-LX129D", models: ["NA-LX129DL", "NA-LX129DR"], features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto] },
  { model: "NA-LX127D", models: ["NA-LX127DL", "NA-LX127DR"], features: [...featureTemplates.panasonicDrum, ...featureTemplates.panasonicAuto] }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", release: "2024年", features: featureTemplates.panasonicTop, sourceIds: ["panasonic-model-years", "panasonic-fa-feature"] }, [
  { model: "NA-FA10K3", year: 2024, wash: 10, dimensions: { widthMm: 599, depthMm: 635, heightMm: 1071, massKg: 44 } }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", year: 2022, release: "2022年6月", features: featureTemplates.panasonicTop, sourceIds: ["panasonic-fa-2022"] }, [
  { model: "NA-FA10K1", wash: 10, dimensions: { widthMm: 599, depthMm: 635, heightMm: 1071, massKg: 45 } },
  { model: "NA-FA8K1", wash: 8, dimensions: { widthMm: 599, depthMm: 635, heightMm: 1071, massKg: 45 } }
]);
addRows({ makerId: "panasonic", type: "top-full-auto", year: 2023, features: featureTemplates.panasonicTop, sourceIds: ["panasonic-jfa-2023", "panasonic-model-years"] }, [
  { model: "NA-JFA8K2", release: "2023年6月", wash: 8, dimensions: { widthMm: 599, depthMm: 643, heightMm: 1047, massKg: 43 } },
  { model: "NA-F6B2", release: "2023年", wash: 6, features: featureTemplates.panasonicCompact, performance: { energyWh50Hz: 103, energyWh60Hz: 104 }, dimensions: { widthMm: 562, depthMm: 572, heightMm: 880, massKg: 28 } }
]);

// Hitachi
addRows({ makerId: "hitachi", type: "drum-washer-dryer", year: 2025, release: "2025年", features: featureTemplates.hitachiDrum, sourceIds: ["hitachi-2025"] }, [
  { model: "BD-STX130M", models: ["BD-STX130ML", "BD-STX130MR"], wash: 13, dry: 7, drying: "ヒートポンプ式", presetGroups: ["drum-representatives"], fit: "13kgの大容量と乾燥・お手入れ機能を重視するお客様" },
  { model: "BD-SX130M", models: ["BD-SX130ML", "BD-SX130MR"], wash: 13, dry: 7, drying: "ヒートポンプ式" },
  { model: "BD-SW120M", models: ["BD-SW120ML", "BD-SW120MR"], wash: 12, dry: 6, drying: "ヒーター式" },
  { model: "BD-SV120M", models: ["BD-SV120ML", "BD-SV120MR"], wash: 12, dry: 6, drying: "ヒーター式" }
]);
addRows({ makerId: "hitachi", type: "top-washer-dryer", year: 2025, release: "2025年", features: featureTemplates.hitachiTop, sourceIds: ["hitachi-2025"], drying: "速乾ビート乾燥（ヒーター式）" }, [
  { model: "BW-DX100M", wash: 10, dry: 5.5 }, { model: "BW-DV80M", wash: 8, dry: 4.5 }
]);
addRows({ makerId: "hitachi", type: "top-full-auto", year: 2025, release: "2025年", features: featureTemplates.hitachiTop, sourceIds: ["hitachi-2025"] }, [
  { model: "BW-X120M", wash: 12 }, { model: "BW-X100M", wash: 10 }, { model: "BW-X90M", wash: 9 }, { model: "BW-V100M", wash: 10 },
  { model: "BW-V80M", wash: 8 }, { model: "BW-V70M", wash: 7 }, { model: "BW-G70M", wash: 7 }
]);
addRows({ makerId: "hitachi", type: "top-full-auto", year: 2026, release: "2026年", features: featureTemplates.hitachiTop, sourceIds: ["hitachi-2026"] }, [
  { model: "BW-X120P", wash: 12, presetGroups: ["top-representatives"], fit: "大容量の縦型と自動投入を重視するお客様" },
  { model: "BW-X100P", wash: 10 }, { model: "BW-X90P", wash: 9 }, { model: "BW-V100P", wash: 10 }, { model: "BW-V80P", wash: 8 },
  { model: "BW-V70P", wash: 7 }, { model: "BW-G70P", wash: 7 }, { model: "NW-R706", wash: 7, features: featureTemplates.hitachiSimple, performance: { waterL: 110 }, dimensions: { widthMm: 560, depthMm: 563, heightMm: 890, massKg: 32 } }
]);
addRows({ makerId: "hitachi", type: "drum-washer-dryer", year: 2026, release: "2026年8月", drying: "ヒートポンプ式", features: featureTemplates.hitachiDrum, sourceIds: ["hitachi-2026", "hitachi-full-2026"] }, [
  { model: "BD-STX130P", models: ["BD-STX130PL", "BD-STX130PR"], wash: 13, dry: 7 },
  { model: "BD-SX130P", models: ["BD-SX130PL", "BD-SX130PR"], wash: 13, dry: 7 },
  { model: "BD-SVX120P", models: ["BD-SVX120PL", "BD-SVX120PR"], wash: 12, dry: 6 },
  { model: "BD-CX100P", models: ["BD-CX100PL", "BD-CX100PR"], wash: 10, dry: 5.5, drying: "低温ヒート式" }
]);
addRows({ makerId: "hitachi", type: "drum-washer-dryer", features: featureTemplates.hitachiDrum }, [
  { model: "BD-SG110K", models: ["BD-SG110KL"], year: 2024, release: "2024年", wash: 11, dry: 6, drying: "ヒーター式", sourceIds: ["hitachi-2024"] },
  { model: "BD-STX130J", models: ["BD-STX130JL", "BD-STX130JR"], year: 2023, release: "2023年", wash: 13, dry: 7, drying: "ヒートポンプ式", sourceIds: ["hitachi-2023"] }
]);
addRows({ makerId: "hitachi", type: "top-full-auto", features: featureTemplates.hitachiTop }, [
  { model: "BW-X120K", year: 2024, release: "2024年", wash: 12, sourceIds: ["hitachi-2024"] },
  { model: "BW-X90J", year: 2023, release: "2023年", wash: 9, sourceIds: ["hitachi-2023"] }
]);

// Sharp
addRows({ makerId: "sharp", type: "drum-washer-dryer", year: 2025, release: "2025年", features: featureTemplates.sharpDrum, sourceIds: ["sharp-spec", "sharp-lineup"] }, [
  { model: "ES-12X1", wash: 12, dry: 6, drying: "ヒートポンプ式", presetGroups: ["drum-representatives"], fit: "大容量とヒートポンプ乾燥を重視するお客様" },
  { model: "ES-12P1", wash: 12, dry: 6, drying: "ヒートポンプ式" },
  { model: "ES-11K1", wash: 11, dry: 6, drying: "ヒーターセンサー乾燥" },
  { model: "ES-8XS1", wash: 8, dry: 4, drying: "ヒートポンプ式" },
  { model: "ES-7S1", wash: 7, dry: 3.5, drying: "ヒーターセンサー乾燥（水冷除湿）" }
]);
addRows({ makerId: "sharp", type: "drum-washer-dryer", year: 2026, release: "2026年", features: featureTemplates.sharpDrum, sourceIds: ["sharp-spec", "sharp-lineup"] }, [
  { model: "ES-7S2", wash: 7, dry: 3.5, drying: "ヒーターセンサー乾燥（水冷除湿）" }
]);
addRows({ makerId: "sharp", type: "top-washer-dryer", year: 2025, release: "2025年", features: featureTemplates.sharpTop, sourceIds: ["sharp-spec"], drying: "ヒーター式" }, [
  { model: "ES-PW11K", wash: 11, dry: 6 }, { model: "ES-TX8K", wash: 8, dry: 4.5 }, { model: "ES-TX6K", wash: 6.5, dry: 3.5 }
]);
addRows({ makerId: "sharp", type: "top-washer-dryer", year: 2026, release: "2026年", features: featureTemplates.sharpTop, sourceIds: ["sharp-spec", "sharp-lineup"], drying: "ヒーター式" }, [
  { model: "ES-PT11L", wash: 11, dry: 6 }, { model: "ES-TX8L", wash: 8, dry: 4.5 }
]);
addRows({ makerId: "sharp", type: "top-full-auto", year: 2025, release: "2025年", features: featureTemplates.sharpTop, sourceIds: ["sharp-spec"] }, [
  { model: "ES-SW11K", wash: 11 }, { model: "ES-SW10K", wash: 10 }, { model: "ES-SV8K", wash: 8 }, { model: "ES-GV10K", wash: 10 },
  { model: "ES-GV8K", wash: 8 }, { model: "ES-GV7K", wash: 7 }, { model: "ES-GE7K", wash: 7 }, { model: "ES-GE6K", wash: 6 }, { model: "ES-GE5K", wash: 5 }
]);
addRows({ makerId: "sharp", type: "top-full-auto", year: 2026, release: "2026年", features: featureTemplates.sharpTop, sourceIds: ["sharp-spec", "sharp-lineup"] }, [
  { model: "ES-SW11L", wash: 11, presetGroups: ["top-representatives"], fit: "穴なし槽と11kg容量を重視するお客様" },
  { model: "ES-SW10L", wash: 10 }, { model: "ES-GV10L", wash: 10 }, { model: "ES-SV8L", wash: 8 }, { model: "ES-SV7L", wash: 7 },
  { model: "ES-GV8L", wash: 8 }, { model: "ES-GV7L", wash: 7 }
]);
addRows({ makerId: "sharp", type: "drum-washer-dryer", year: 2024, release: "2024年", features: featureTemplates.sharpDrum, sourceIds: ["sharp-catalog-2024"] }, [
  { model: "ES-X12C", wash: 12, dry: 6, drying: "ハイブリッド乾燥NEXT" },
  { model: "ES-K11C", wash: 11, dry: 6, drying: "ヒーターセンサー乾燥（水冷除湿）" }
]);
addProduct({ makerId: "sharp", model: "ES-X11B", type: "drum-washer-dryer", year: 2023, release: "2023年", wash: 11, dry: 6, drying: "ハイブリッド乾燥NEXT", features: featureTemplates.sharpDrum, sourceIds: ["sharp-es-x11b-pdf"] });
addProduct({
  makerId: "sharp",
  model: "UW-X1",
  type: "ultrasonic-washer",
  year: 2023,
  release: "2023年7月14日",
  capacityNote: "衣類・布製品の部分洗い用（洗濯容量の設定なし）",
  features: [{ name: "毎秒約38,000回の超音波振動", description: "水を含んだ繊維の隙間に発生する泡の力で、部分汚れを落とします。", groupId: "washing" }],
  sourceIds: ["sharp-uw-x1-press", "sharp-uw-x1-catalog"],
  dimensions: { widthMm: 40, depthMm: 40, heightMm: 168 },
  additionalSpecs: [
    { label: "超音波周波数", value: "約38kHz（約38,000回/秒）" },
    { label: "充電時間", value: "約5時間" },
    { label: "使用可能時間", value: "約15分（満充電時）" },
    { label: "消費電力", value: "約10W" },
    { label: "本体質量", value: "約206g（キャップ・充電台除く）" }
  ],
  headline: "衣類や布製品の部分汚れを超音波で洗うハンディタイプです。",
  fit: "襟・袖などの予洗いや、丸洗いしにくい布製品の部分洗いをしたいお客様",
  cautions: ["水洗いできる衣類・布製品に使用します。色落ちするもの、皮革、防水性素材などには使用できません。", "塩素系漂白剤は使用できません。"],
  preserveCopy: true
});

// Toshiba
addRows({ makerId: "toshiba", type: "drum-washer-dryer", year: 2025, release: "2025年10月", features: featureTemplates.toshiba, sourceIds: ["toshiba-drum-2025", "toshiba-lineup"] }, [
  { model: "TW-127XP5", models: ["TW-127XP5L", "TW-127XP5R"], wash: 12, dry: 7, drying: "ヒートポンプ除湿乾燥", presetGroups: ["drum-representatives"], fit: "7kg乾燥と洗浄・乾燥機能を重視するお客様" },
  { model: "TW-127XH5", models: ["TW-127XH5L", "TW-127XH5R"], wash: 12, dry: 7, drying: "ヒートポンプ除湿乾燥" },
  { model: "TW-127XM5", models: ["TW-127XM5L", "TW-127XM5R"], wash: 12, dry: 7, drying: "ヒートポンプ除湿乾燥" },
  { model: "TW-84GS5", models: ["TW-84GS5L"], wash: 8, dry: 4, drying: "ヒーター式" }
]);
addRows({ makerId: "toshiba", type: "top-full-auto", year: 2025, features: featureTemplates.toshiba, sourceIds: ["toshiba-2025"] }, [
  { model: "AW-12DPB5", wash: 12, release: "2025年8月" }, { model: "AW-10DPB5", wash: 10, release: "2025年8月" }, { model: "AW-10DHB5", wash: 10, release: "2025年8月" },
  { model: "AW-9DP5", wash: 9, release: "2025年6月" }, { model: "AW-8DP5", wash: 8, release: "2025年6月" },
  { model: "AW-9DH5", wash: 9, release: "2025年6月" }, { model: "AW-8DH5", wash: 8, release: "2025年6月" }, { model: "AW-7DH5", wash: 7, release: "2025年5月" }
]);
addRows({ makerId: "toshiba", type: "top-full-auto", year: 2026, features: featureTemplates.toshiba, sourceIds: ["toshiba-top-2026", "toshiba-lineup"] }, [
  { model: "AW-12DPB6", wash: 12, release: "2026年6月", presetGroups: ["top-representatives"], fit: "12kg容量と出し入れしやすい投入口を重視するお客様" },
  { model: "AW-10DPB6", wash: 10, release: "2026年6月" }, { model: "AW-10DHB6", wash: 10, release: "2026年6月" },
  { model: "AW-9DPB6", wash: 9, release: "2026年7月", performance: { washTimeMin: 36, washDb: 29, spinDb: 37 } },
  { model: "AW-8DPB6", wash: 8, release: "2026年7月", performance: { washTimeMin: 33, washDb: 29, spinDb: 37 } },
  { model: "AW-9DHB6", wash: 9, release: "2026年7月" }, { model: "AW-8DHB6", wash: 8, release: "2026年7月" }, { model: "AW-7DH6", wash: 7, release: "2026年6月", performance: { washTimeMin: 39 } }
]);
addRows({ makerId: "toshiba", type: "drum-washer-dryer", wash: 12, dry: 7, drying: "ヒートポンプ除湿乾燥", features: featureTemplates.toshiba }, [
  { model: "TW-127XP4", models: ["TW-127XP4L", "TW-127XP4R"], year: 2024, release: "2024年", sourceIds: ["toshiba-xp4-2024", "toshiba-catalog-2024"], features: [
    { name: "液体洗剤・柔軟剤 自動投入", description: "液体洗剤と柔軟剤を自動で計量・投入します。", groupId: "convenience" },
    { name: "温水抗菌ウルトラファインバブル洗浄EX", description: "温水と微細な泡を組み合わせ、汚れや黄ばみに対応する洗浄機能です。", groupId: "washing" },
    { name: "ふんわリッチ速乾", description: "ヒートポンプ除湿乾燥で衣類を乾燥し、仕上がりに配慮します。", groupId: "drying" },
    { name: "ヒートポンプ除湿乾燥", description: "ヒートポンプで除湿しながら乾燥します。", groupId: "drying" },
    { name: "ハイパワーUV除菌", description: "ハイパワーUVを使う対応コースで衣類の除菌・ウイルス抑制に配慮します。", groupId: "care" },
    { name: "ドアパッキン洗浄", description: "ドアパッキン部に付着した糸くずなどを洗い流します。", groupId: "care" },
    { name: "低振動・低騒音設計", description: "振動や運転音を抑えることに配慮した設計です。", groupId: "convenience" },
    { name: "スマートフォン連携", description: "対応アプリから運転状況の確認やコース設定などができます。", groupId: "convenience" }
  ] },
  { model: "TW-127XP3", models: ["TW-127XP3L", "TW-127XP3R"], year: 2023, release: "2023年", sourceIds: ["toshiba-lineup"] }
]);
addRows({ makerId: "toshiba", type: "top-full-auto" }, [
  { model: "AW-10GM3", year: 2022, release: "2022年", wash: 10, sourceIds: ["toshiba-catalog-2022"], features: [{ name: "パワフル洗浄", description: "循環水流で洗剤液を衣類へ浸透させて洗います。", groupId: "washing" }], performance: { washTimeMin: 53, waterL: 138, energyWh50Hz: 121, energyWh60Hz: 132, washDb: 38, spinDb: 52 }, dimensions: { widthMm: 622, depthMm: 639, heightMm: 1052, massKg: 42, bodyWidthMm: 580 } },
  { model: "AW-7GM4", year: 2024, release: "2024年11月", wash: 7, sourceIds: ["toshiba-catalog-2024"], features: [{ name: "Wシャワー洗浄", description: "2本のシャワーで洗浄液を衣類全体へ浸透させて洗います。", groupId: "washing" }] },
  { model: "AW-6GA4", year: 2024, release: "2024年11月", wash: 6, sourceIds: ["toshiba-catalog-2024"], features: [{ name: "Wシャワー洗浄", description: "2本のシャワーで洗浄液を衣類全体へ浸透させて洗います。", groupId: "washing" }] },
  { model: "AW-5GA4", year: 2024, release: "2024年11月", wash: 5, sourceIds: ["toshiba-catalog-2024"], features: [{ name: "Wシャワー洗浄", description: "2本のシャワーで洗浄液を衣類全体へ浸透させて洗います。", groupId: "washing" }] }
]);

// Hisense
addRows({ makerId: "hisense", type: "top-full-auto", year: 2025, release: "2025年7月上旬", features: featureTemplates.hisenseL, sourceIds: ["hisense-l-2025"] }, [
  { model: "HW-G55XL-W", wash: 5.5 }, { model: "HW-G70XL-W", wash: 7 }
]);
addProduct({ makerId: "hisense", model: "HWF-D120XL-W", type: "drum-washer-dryer", year: 2025, release: "2025年10月上旬", wash: 12, dry: 6, drying: "ヒートポンプ式", features: featureTemplates.hisenseDrum, sourceIds: ["hisense-d120"], performance: { washDryTimeMin: 124 }, dimensions: { widthMm: 598, depthMm: 630, heightMm: 1007 }, fit: "12kg容量とヒートポンプ乾燥を重視するお客様" });
addRows({ makerId: "hisense", type: "top-full-auto", year: 2026, release: "2026年2月上旬", features: featureTemplates.hisenseL, sourceIds: ["hisense-l-black"] }, [
  { model: "HW-G55XL-B", wash: 5.5 }, { model: "HW-G70XL-B", wash: 7, fit: "ブラックカラーのシンプルな縦型を希望するお客様" }
]);
addProduct({ makerId: "hisense", model: "HWF-D100SL-W", type: "drum-washer-dryer", year: 2026, release: "2026年2月上旬", wash: 10, dry: 6, drying: "ヒーター式", features: featureTemplates.hisenseDrum, sourceIds: ["hisense-d100"], dimensions: { widthMm: 598, depthMm: 630, heightMm: 1007 }, cautions: ["公式製品ページの幅598mmは排水ホースを含まない値です。", "搬入経路、防水パン、蛇口の高さ、排水位置を設置前に確認してください。"], fit: "10kg洗濯・6kg乾燥のドラム式を検討するお客様" });

function catalogSourceIds(product) {
  if (product.modelYear === 2022 && product.makerId === "toshiba") return ["toshiba-catalog-2022"];
  if (product.modelYear === 2023 && product.name === "ES-X11B") return ["sharp-es-x11b-pdf"];
  if (product.modelYear === 2023 && product.name === "UW-X1") return ["sharp-uw-x1-catalog"];
  if (product.modelYear === 2024 && product.makerId === "sharp") return ["sharp-catalog-2024"];
  if (product.modelYear === 2024 && product.makerId === "toshiba") return ["toshiba-catalog-2024"];
  if (product.modelYear === 2025) {
    if (product.makerId === "panasonic" && product.type === "drum-washer-dryer") return ["panasonic-catalog-2026-drum"];
    if (product.makerId === "hitachi" && product.type !== "top-full-auto") return ["hitachi-catalog-2026"];
    if (product.makerId === "sharp") return ["sharp-catalog-2025"];
    if (product.makerId === "toshiba") return ["toshiba-catalog-2025"];
    if (product.makerId === "hisense") return [product.type === "drum-washer-dryer" ? "hisense-catalog-2026-drum" : "hisense-catalog-2025-top"];
    return [];
  }
  if (product.modelYear !== 2026) return [];
  if (product.makerId === "panasonic" && product.type === "top-full-auto") return ["panasonic-catalog-2026-top"];
  if (product.makerId === "hitachi" && product.type === "top-full-auto") return ["hitachi-catalog-2026"];
  if (product.makerId === "sharp") return [product.type === "drum-washer-dryer" ? "sharp-catalog-2026-drum" : "sharp-catalog-2026-top"];
  if (product.makerId === "toshiba" && product.type === "top-full-auto") return ["toshiba-catalog-2026-top"];
  if (product.makerId === "hisense") return [product.type === "drum-washer-dryer" ? "hisense-catalog-2026-drum" : "hisense-catalog-2026-top"];
  return [];
}

function productSpecUrl(product) {
  if (product.makerId === "panasonic") return `https://panasonic.jp/wash/products/${product.models[0]}/spec.html`;
  if (product.name === "NW-R706") return "https://kadenfan.hitachi.co.jp/support/wash/item/docs/nw-r706_1new.pdf";
  if (product.makerId === "hitachi") return `https://kadenfan.hitachi.co.jp/wash/lineup/${product.name.toLowerCase()}/spec.html`;
  if (product.name === "UW-X1") return "https://jp.sharp/sentaku/uw/products/uwx1/spec/";
  if (product.makerId === "sharp") return `https://jp.sharp/sentaku/products/${product.name.toLowerCase().replaceAll("-", "")}/spec/`;
  if (product.makerId === "toshiba") {
    const sharedPage = {
      "AW-8DP5": "aw-9dp5",
      "AW-8DH5": "aw-9dh5",
      "AW-8DPB6": "aw-9dpb6",
      "AW-8DHB6": "aw-9dhb6",
      "AW-5GA4": "aw-6ga4"
    }[product.name] || product.name.toLowerCase();
    return `https://www.toshiba-lifestyle.com/jp/laundries/${sharedPage}/spec/`;
  }
  if (product.makerId === "hisense") return `https://www.hisense.co.jp/washer/${product.name.toLowerCase().replace(/-b$/, "-w")}/d1.php`;
  return "";
}

for (const product of products) {
  product.sourceIds.push(...catalogSourceIds(product));
  product.sourceIds = [...new Set(product.sourceIds)];
  for (const feature of product.features) feature.sourceIds = [...new Set(feature.sourceIds)];
  const id = `${product.id}-spec`;
  sources.push({ id, makerId: product.makerId, title: `${product.name} 公式仕様`, url: productSpecUrl(product), checkedAt: VERIFIED_AT });
  product.sourceIds.push(id);
}

function present(value) {
  return value !== null && value !== undefined && value !== "";
}

function mergePresent(base, extra) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    if (present(value)) merged[key] = value;
  }
  return merged;
}

function normalizeOfficialText(value) {
  if (typeof value === "string") return value.replaceAll("―", "ー");
  if (Array.isArray(value)) return value.map(normalizeOfficialText);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalizeOfficialText(child)]));
  return value;
}

function conciseFeatureNames(product) {
  const preferred = ["washing", "drying", "care", "convenience"];
  const result = [];
  for (const groupId of preferred) {
    const feature = product.features.find((item) => item.groupId === groupId && !result.includes(item.name));
    if (feature) result.push(feature.name);
  }
  return result.slice(0, 3);
}

function updateDifferenceCopy(product) {
  if (product.capacities.washingKg == null) {
    product.differenceSummary = product.additionalSpecs.slice(0, 2).map((item) => `${item.label} ${item.value}`).join("・") || typeNames[product.type];
    if (!product.preserveCopy) product.headline = `${product.name}は、${product.differenceSummary}が比較時の確認ポイントです。`;
    delete product.preserveCopy;
    return;
  }
  const points = [];
  if (product.capacities.dryingKg != null && product.drying.method) points.push(product.drying.method);
  if (product.performance.washTimeMin != null) points.push(`洗濯約${product.performance.washTimeMin}分`);
  if (product.performance.washDryTimeMin != null) points.push(`洗乾約${product.performance.washDryTimeMin}分`);
  for (const name of conciseFeatureNames(product)) {
    if (!points.some((point) => point.includes(name))) points.push(name);
  }
  product.differenceSummary = points.slice(0, 4).join("・") || `${typeNames[product.type]}・洗濯${product.capacities.washingKg}kg`;
  const fitPoints = conciseFeatureNames(product).slice(0, 2);
  product.fit = fitPoints.length
    ? `洗濯${product.capacities.washingKg}kg${product.capacities.dryingKg != null ? `・乾燥${product.capacities.dryingKg}kg` : ""}と${fitPoints.join("、")}を重視するお客様`
    : product.fit;
  product.headline = `${product.name}は、${product.differenceSummary}が比較時の確認ポイントです。`;
  delete product.preserveCopy;
}

if (existsSync(ENRICHMENT_FILE)) {
  const enrichment = JSON.parse(readFileSync(ENRICHMENT_FILE, "utf8")).products || {};
  for (const product of products) {
    const extra = normalizeOfficialText(enrichment[product.id]);
    if (!extra) continue;
    const flatPerformance = { ...(extra.performance || {}) };
    const noise = mergePresent(product.performance.noise, {
      washDb: flatPerformance.washDb,
      spinDb: flatPerformance.spinDb,
      dryDb: flatPerformance.dryDb
    });
    delete flatPerformance.washDb;
    delete flatPerformance.spinDb;
    delete flatPerformance.dryDb;
    product.performance = { ...mergePresent(product.performance, flatPerformance), noise };
    product.dimensions = mergePresent(product.dimensions, extra.dimensions);
    if (extra.drying?.method) product.drying.method = extra.drying.method;
    if (extra.features?.length) {
      let officialFeatures = extra.features;
      if (officialFeatures.some((feature) => feature.name === "トリプル自動投入")) {
        officialFeatures = officialFeatures.filter((feature) => feature.name !== "液体洗剤・柔軟剤 自動投入");
      }
      product.features = officialFeatures.map((feature) => ({ ...feature, sourceIds: [`${product.id}-spec`] }));
    }
    product.specDetails = extra.specDetails || {};
    if (product.features.some((feature) => feature.name === "トリプル自動投入")) product.specDetails.autoDosing = "トリプル自動投入";
  }
}

for (const product of products) updateDifferenceCopy(product);

const data = {
  app: {
    categoryId: "washer",
    categoryName: "洗濯機",
    title: "洗濯機説明ナビ 2022–2026",
    kicker: "ノジマ店頭スタッフ向け",
    updatedAt: CATALOG_CHECKED_AT,
    cutoffDate: VERIFIED_AT,
    itemLabel: "機種",
    compareLimit: 4,
    searchPlaceholder: "型番・メーカー・機能・用途で検索",
    salesNote: "掲載値はメーカー公式情報で確認できた項目のみです。搬入経路・蛇口・排水位置・防水パン・扉方向を成約前に必ず確認してください。"
  },
  makers,
  capacityGroups: [
    { id: "under-6", name: "6kg以下", min: 0, max: 6 },
    { id: "7-8", name: "7–8kg", min: 7, max: 8 },
    { id: "9-10", name: "9–10kg", min: 9, max: 10 },
    { id: "over-11", name: "11kg以上", min: 11, max: null }
  ],
  washerTypes: Object.entries(typeNames).map(([id, name]) => ({ id, name })),
  featureGroups: [
    { id: "washing", name: "洗浄" }, { id: "drying", name: "乾燥" }, { id: "care", name: "清潔・お手入れ" }, { id: "convenience", name: "使いやすさ・自動化" }
  ],
  sources,
  products
};

writeFileSync(OUT, `window.APPLIANCE_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");

const missingLabels = {
  washTimeMin: "洗濯時間",
  waterL: "使用水量",
  energyWh: "消費電力量"
};
const noteRows = products.map((product) => {
  const missing = product.type === "ultrasonic-washer" ? [] : Object.entries(missingLabels)
    .filter(([key]) => key === "energyWh"
      ? product.performance.energyWh == null && product.performance.energyWh50Hz == null && product.performance.energyWh60Hz == null
      : product.performance[key] == null)
    .map(([, label]) => label);
  if (product.capacities.dryingKg != null && product.performance.washDryTimeMin == null) missing.push("洗濯乾燥時間");
  if (product.type !== "ultrasonic-washer" && [product.performance.noise.washDb, product.performance.noise.spinDb, product.performance.noise.dryDb].every((value) => value == null)) missing.push("運転音");
  if ([product.dimensions.widthMm, product.dimensions.depthMm, product.dimensions.heightMm].some((value) => value == null)) missing.push("外形寸法");
  if (product.type !== "ultrasonic-washer" && product.dimensions.massKg == null) missing.push("質量");
  if (product.type !== "ultrasonic-washer" && !product.dimensions.pan) missing.push("防水パン条件");
  const basis = product.sourceIds.map((id) => sources.find((source) => source.id === id)?.title).filter(Boolean).join(" / ");
  const urls = product.sourceIds.map((id) => sources.find((source) => source.id === id)?.url).filter(Boolean).map((url) => `[公式](${url})`).join("・");
  return `| ${makers.find((maker) => maker.id === product.makerId)?.name} | ${product.modelYear} | ${typeNames[product.type]} | ${product.models.join(" / ")} | 採用 | ${product.releaseLabel}（${basis}） | ${urls} | ${VERIFIED_AT} | ${missing.length ? missing.join("、") : "なし"} |`;
});

const counts = {};
for (const product of products) {
  const key = `${product.makerId}-${product.modelYear}-${product.type}`;
  counts[key] = (counts[key] || 0) + 1;
}
const years = [...new Set(products.map((product) => product.modelYear))].sort((a, b) => a - b);
const countRows = makers.flatMap((maker) => years.flatMap((year) => Object.entries(typeNames).map(([typeId, typeName]) => {
  const count = counts[`${maker.id}-${year}-${typeId}`] || 0;
  return count ? `| ${maker.name} | ${year} | ${typeName} | ${count} |` : null;
}).filter(Boolean)));

const notes = `# 洗濯機説明ナビ 2022–2026 調査メモ

最終確認日: ${CATALOG_CHECKED_AT}
メーカー公式Web仕様確認日: ${VERIFIED_AT}
保存済み公式カタログ確認日: ${CATALOG_CHECKED_AT}
発売済み判定の基準日: ${VERIFIED_AT}（日本時間）

## 収録方針

- 国内メーカー公式サイトの年別一覧、ニュースリリース、製品・仕様ページだけを根拠にしています。
- 2026年8月15日に追加された13枚の型番画像（IMG_3121.PNG〜IMG_3133.PNG）から101型番を転記し、全件が検索できることを自動検証しています。
- 作業フォルダ内の公式カタログPDFは全ページを画像化して確認し、旧モデルはメーカー公式の製品・仕様ページ、ニュースリリース、過去カタログを併用しています。
- 公式表記より細かい発売日は推測せず、年までしか確認できない場合は年のみを記載しています。
- 左右開きは主要仕様と発売時期が同じ場合に1レコードへまとめ、色違いでも発売年が異なる場合は別レコードにしています。
- 公式記載が確認できないスペックはアプリで「公式情報なし」とし、非対応とは扱っていません。
- 価格、在庫、販売終了状態は固定データにしていません。
- 点数、順位、星、総合評価はデータ・画面ともに使用していません。

## 掲載件数

| メーカー | 年 | タイプ | 件数 |
|---|---:|---|---:|
${countRows.join("\n")}

合計: ${products.length}基本機種

## 採否・根拠・未収録項目

| メーカー | 年 | タイプ | 型番 | 採否 | 発売根拠 | 公式URL | 確認日 | 現在未収録の主な項目 |
|---|---:|---|---|---|---|---|---|---|
${noteRows.join("\n")}

## 除外・保留

| メーカー | 型番・範囲 | 理由 |
|---|---|---|
| 日立 | BD-STX130ME5L/R、BW-V80ME5、BW-V70ME5、BW-X100ME5、BW-X90ME5 | 公式年別一覧では確認できるが、小売専用を示す枝番で、ノジマ専売であることをメーカー公式情報から確認できないため除外。 |
| 日立 | BW-V100MR | 標準モデルと異なる流通枝番の位置付けをメーカー公式情報だけで確定できないため保留。 |
| 日立 | BW-V100PE6、BW-V80PE6、BW-V70PE6、BW-X100PE6、BW-X90PE6 | 2026年の小売専用枝番。ノジマ専売の公式根拠がないため除外。 |
| 各社 | 追加画像に記載のない二槽式、衣類乾燥機単体、業務用、海外専用 | 今回の追加対象外。 |
| 各社 | 2026年8月22日より後に発売予定と表記されたモデル | 基準日時点で未発売のため除外。発売後に再調査する。 |

## 次回更新時の確認順

1. 「現在未収録の主な項目」だけを個別仕様表・取扱説明書で再確認する。
2. 公式ページの改訂に伴う、機能名・乾燥方式・設置条件の変更有無を再照合する。
3. 基準日後に発売された2026年モデルを、発売済み確認後に追加する。
`;

writeFileSync(NOTES_OUT, notes, "utf8");
console.log(`wrote ${products.length} products to ${OUT}`);
console.log(`wrote research notes to ${NOTES_OUT}`);
