#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = resolve(HERE, "data");
const OUT = resolve(OUT_DIR, "official-enrichment.json");
const context = { window: {} };
vm.runInNewContext(readFileSync(resolve(ROOT, "app/data.js"), "utf8"), context);
const data = context.window.APPLIANCE_DATA;

const FEATURE_DEFINITIONS = {
  panasonic: [
    ["トリプル自動投入", /トリプル自動投入/, "convenience", "液体洗剤・柔軟剤に加え、選べる剤を含む3つのタンクから自動投入します。"],
    ["液体洗剤・柔軟剤 自動投入", /液体洗剤・柔軟剤\s*自動投入|自動投入機能/, "convenience", "洗濯物に合わせて液体洗剤と柔軟剤を自動で計量・投入します。"],
    ["温水機能", /温水機能\s*[○〇]|約(?:30|40|60)\s*℃/, "washing", "温水を使う対応コースで、皮脂汚れや黄ばみなどに配慮して洗います。"],
    ["スゴ落ち泡洗浄", /スゴ落ち泡洗浄/, "washing", "洗剤を泡立てて衣類へ浸透させ、水流と組み合わせて洗う機能です。"],
    ["パワフル滝洗い", /パワフル滝洗い/, "washing", "大きな水流で衣類を動かして洗う縦型の洗浄コースです。"],
    ["ヒートポンプ乾燥", /ヒ[―ー－-]?トポンプ(?:方式|乾燥)/, "drying", "ヒートポンプで除湿しながら乾燥する方式です。"],
    ["ジェット乾燥", /ジェット乾燥|ふんわりジェット/, "drying", "風を衣類へ当て、乾燥時の仕上がりに配慮します。"],
    ["ナノイーX", /ナノイーX/, "care", "ナノイーXを使う対応コースで衣類や槽の衛生ケアを行います。"],
    ["自動槽洗浄", /自動槽洗浄\s*[○〇]/, "care", "すすぎ工程の水などを利用して洗濯槽を自動で洗浄します。"],
    ["熱交換器洗浄", /熱交換器洗浄\s*[○〇]/, "care", "乾燥時に使う熱交換器を自動で洗浄します。"],
    ["窓パッキング洗い", /窓パッキング洗い\s*[○〇]/, "care", "ドア窓のパッキング部へ水を流して汚れを洗い流します。"],
    ["スマホで洗濯", /スマホで洗濯|IoT機能/, "convenience", "対応アプリからコース設定や運転状況の確認などができます。"],
    ["カラータッチパネル", /カラ[―ー]タッチパネル/, "convenience", "カラー表示のタッチパネルでコースや設定を確認できます。"],
    ["AI エコナビ", /AI\s*エコナビ/, "convenience", "センサー情報を使って運転を調整します。"],
    ["汚れはがし", /汚れはがし/, "washing", "専用の対応コース・剤を使って、落ちにくい汚れに対応します。"]
  ],
  hitachi: [
    ["液体洗剤・柔軟剤 自動投入", /液体洗剤・柔軟剤\s*自動投入|自動投入/, "convenience", "液体洗剤と柔軟剤を自動で計量・投入します。"],
    ["ナイアガラ洗浄", /ナイアガラ洗浄/, "washing", "高濃度の洗剤液と大流量の水流を組み合わせて洗います。"],
    ["高濃度洗浄", /高濃度洗浄/, "washing", "高濃度の洗剤液を衣類へ浸透させて洗います。"],
    ["AIお洗濯", /AIお洗濯/, "washing", "複数のセンシング情報を使って洗い方や運転時間を調整します。"],
    ["温水ナイアガラ洗浄", /温水[^\n]{0,20}ナイアガラ洗浄/, "washing", "温水を使う対応コースで黄ばみなどの汚れに対応します。"],
    ["ナイアガラすすぎ", /ナイアガラすすぎ/, "washing", "大流量の水を循環させてすすぐ機能です。"],
    ["ほぐし脱水", /ほぐし脱水/, "convenience", "脱水後に衣類をほぐして取り出しやすくします。"],
    ["らくはや 風アイロン", /らくはや\s*風アイロン|風アイロン/, "drying", "高速の風で乾燥しながら衣類のシワを伸ばすことに配慮します。"],
    ["ヒートポンプ式", /ヒートポンプ式/, "drying", "ヒートポンプで除湿しながら乾燥する方式です。"],
    ["らくメンテ", /らくメンテ/, "care", "乾燥フィルターレスなど、日常のお手入れ負担を抑える機能群です。"],
    ["洗濯槽自動おそうじ", /洗濯槽自動おそうじ/, "care", "すすぎ後に洗濯槽を自動で洗い流します。"],
    ["乾燥経路自動おそうじ", /乾燥経路自動おそうじ/, "care", "乾燥経路に付着したほこりを自動で洗い流します。"],
    ["ドアパッキン自動おそうじ", /ドアパッキン自動おそうじ/, "care", "ドアパッキン部に付着した糸くずなどを自動で洗い流します。"],
    ["スマートフォン連携", /ハピネスアップ/, "convenience", "対応アプリで運転状況の確認や対応コースの設定などができます。"]
  ],
  sharp: [
    ["液体洗剤・柔軟剤自動投入", /液体洗剤・柔軟剤自動投入/, "convenience", "液体洗剤と柔軟剤を自動で計量・投入します。"],
    ["マイクロ高圧洗浄", /マイクロ高圧洗浄/, "washing", "微細な水滴を高圧で衣類へ噴射して洗います。"],
    ["穴なしサイクロン洗浄", /穴なしサイクロン洗浄/, "washing", "穴なし槽と水流を組み合わせて衣類を洗います。"],
    ["穴なし槽", /穴なし槽|穴なしサイクロン/, "care", "洗濯槽の外側へ水が流れにくい穴なし構造です。"],
    ["ハイブリッド乾燥NEXT", /ハイブリッド乾燥NEXT/, "drying", "ヒートポンプとサポートヒーターを組み合わせた乾燥方式です。"],
    ["ヒートポンプ乾燥", /ヒートポンプ/, "drying", "ヒートポンプで除湿しながら乾燥します。"],
    ["プラズマクラスター", /プラズマクラスター/, "care", "プラズマクラスターを使う対応コースで除菌・消臭や槽ケアを行います。"],
    ["乾燥フィルター自動お掃除", /乾燥フィルター自動お掃除/, "care", "乾燥フィルターにたまるほこりを自動で集めます。"],
    ["乾燥ダクト自動お掃除", /乾燥ダクト自動お掃除/, "care", "乾燥ダクト内を自動で洗い流します。"],
    ["洗濯槽自動お掃除", /洗濯槽自動お掃除|自動槽洗い/, "care", "すすぎ水などで洗濯槽を自動洗浄します。"],
    ["ドアパッキン自動洗浄", /ドアパッキン自動洗浄/, "care", "ドアパッキン部を自動で洗い流します。"],
    ["COCORO WASH", /COCORO\s*WASH/, "convenience", "無線LAN対応モデルでは、アプリからコース追加や運転状況確認などができます。"],
    ["音声機能", /音声機能/, "convenience", "音声で操作内容や運転状況を案内します。"],
    ["AI標準", /AI標準/, "washing", "対応サービスで洗濯状況に合わせた標準運転を利用できます。"],
    ["するポイフィルター", /するポイフィルター/, "care", "糸くずをまとめて捨てやすいフィルターです。"]
  ],
  toshiba: [
    ["液体洗剤・柔軟剤 自動投入", /液体洗剤・柔軟剤\s*自動投入/, "convenience", "液体洗剤と柔軟剤を自動で計量・投入します。"],
    ["温水抗菌ウルトラファインバブル洗浄EX", /温水抗菌ウルトラファインバブル洗浄EX/, "washing", "温水と微細な泡を組み合わせ、汚れや黄ばみに対応する洗浄機能です。"],
    ["温水抗菌ウルトラファインバブル洗浄W", /温水抗菌ウルトラファインバブル洗浄W/, "washing", "温水とウルトラファインバブルを使う対応コースで洗います。"],
    ["抗菌ウルトラファインバブル洗浄W", /抗菌ウルトラファインバブル洗浄W/, "washing", "微細な泡を含む水で洗剤の洗浄成分を繊維へ届けます。"],
    ["Ag+抗菌水", /Ag\+抗菌水/, "care", "抗菌成分を含む水で洗濯物をすすぎます。"],
    ["ふんわリッチ速乾", /ふんわリッチ速乾/, "drying", "ヒートポンプ除湿乾燥で衣類を乾燥し、仕上がりに配慮します。"],
    ["ヒートポンプ除湿乾燥", /ヒートポンプ除湿乾燥/, "drying", "ヒートポンプで除湿しながら乾燥します。"],
    ["UV温風除菌", /UV温風除菌/, "care", "UVと温風を組み合わせる対応コースで衣類を除菌します。"],
    ["除菌乾燥モード", /除菌乾燥モード/, "care", "乾燥運転を使う対応モードで衣類の除菌を行います。"],
    ["ドアパッキン洗浄", /ドアパッキン洗浄/, "care", "ドアパッキン部に付着した糸くずなどを洗い流します。"],
    ["低振動・低騒音設計", /低振動・低騒音設計/, "convenience", "振動や運転音を抑えることに配慮した設計です。"],
    ["スマートフォン連携", /スマートフォン連携|IoLIFE/, "convenience", "対応アプリから運転状況の確認やコース設定などができます。"],
    ["ロー＆ビッグ投入口", /ロー[＆&]ビッグ投入口/, "convenience", "投入口を広く、槽の底を浅くして衣類を出し入れしやすくした設計です。"]
  ],
  hisense: [
    ["液体洗剤・柔軟剤 自動投入", /液体洗剤・柔軟剤(?:「)?自動投入|自動投入\s*液体洗剤/, "convenience", "液体洗剤と柔軟剤を自動で計量・投入します。"],
    ["立体シャワー水流", /立体シャワー水流/, "washing", "タテとヨコの水流を組み合わせて衣類を動かしながら洗います。"],
    ["激流パルセーター", /激流パルセーター|独自形状パルセーター/, "washing", "独自形状の回転翼で立体的な水流を生み出します。"],
    ["銀イオン抗菌", /銀イオン|Ag\+/, "care", "銀イオンを使って衣類や洗濯槽の清潔に配慮します。"],
    ["ヒートポンプ乾燥", /ヒートポンプ/, "drying", "ヒートポンプで除湿しながら乾燥します。"],
    ["ヒーター式乾燥", /ヒーター式/, "drying", "ヒーターで温めた風を使って衣類を乾燥します。"],
    ["乾燥フィルター自動洗浄", /乾燥フィルター自動洗浄|自動洗浄乾燥フィルター/, "care", "乾燥フィルターを自動で洗浄します。"],
    ["3つの槽洗浄コース", /3つの槽洗浄|槽洗浄3/, "care", "使用状況に合わせて時間の異なる槽洗浄コースを選べます。"],
    ["ナイトコース", /ナイトコース/, "convenience", "夜間の使用に配慮した運転コースです。"],
    ["＋機能", /[＋+]機能/, "convenience", "選んだコースへ対応する追加機能を組み合わせられます。"]
  ]
};

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html) {
  return decodeEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function compact(value) {
  return String(value || "").replace(/[\s\n]+/g, " ").trim();
}

function number(value) {
  if (value == null) return null;
  const parsed = Number(String(value).replaceAll(",", "").replace(/\s+/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function capture(text, pattern, group = 1) {
  const match = text.match(pattern);
  return match ? number(match[group]) : null;
}

function captureString(text, pattern, group = 1) {
  const match = text.match(pattern);
  return match ? compact(match[group]) : "";
}

function trimProductText(text, makerId) {
  let scoped = text;
  if (makerId === "toshiba") {
    const start = text.search(/洗濯機・洗濯乾燥機\s+メニュー/);
    if (start >= 0) scoped = text.slice(start);
  }
  return scoped.split(/関連商品/)[0];
}

async function fetchText(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
        headers: { "user-agent": "Mozilla/5.0 washer-official-research/1.0" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveWait) => setTimeout(resolveWait, 500 * attempt));
    }
  }
  throw lastError;
}

function officialSpecSource(product) {
  return data.sources.find((source) => source.id === `${product.id}-spec`);
}

function featurePageUrl(product) {
  if (product.makerId === "panasonic") return `https://panasonic.jp/wash/products/${product.models[0]}.html`;
  if (product.makerId === "hitachi" && product.name !== "NW-R706") return `https://kadenfan.hitachi.co.jp/wash/lineup/${product.name.toLowerCase()}/`;
  if (product.makerId === "sharp") return `https://jp.sharp/sentaku/products/${product.name.toLowerCase().replaceAll("-", "")}/`;
  if (product.makerId === "toshiba") {
    const sharedPage = {
      "AW-8DP5": "aw-9dp5",
      "AW-8DH5": "aw-9dh5",
      "AW-8DPB6": "aw-9dpb6",
      "AW-8DHB6": "aw-9dhb6"
    }[product.name] || product.name.toLowerCase();
    return `https://www.toshiba-lifestyle.com/jp/laundries/${sharedPage}/`;
  }
  if (product.makerId === "hisense") return `https://www.hisense.co.jp/washer/${product.name.toLowerCase().replace(/-b$/, "-w")}/`;
  return "";
}

function getFeatures(makerId, text) {
  return (FEATURE_DEFINITIONS[makerId] || [])
    .filter(([, pattern]) => pattern.test(text))
    .map(([name, , groupId, description]) => ({ name, description, groupId }));
}

function dedupeFeatures(features) {
  const seen = new Set();
  return features.filter((feature) => {
    if (seen.has(feature.name)) return false;
    seen.add(feature.name);
    return true;
  });
}

function commonDetails(text, features) {
  return {
    autoDosing: features.find((feature) => /自動投入/.test(feature.name))?.name || "",
    smartphone: features.find((feature) => /スマホ|スマートフォン|COCORO|IoT/.test(feature.name))?.name || "",
    washHighlights: features.filter((feature) => feature.groupId === "washing").map((feature) => feature.name),
    dryingHighlights: features.filter((feature) => feature.groupId === "drying").map((feature) => feature.name),
    careHighlights: features.filter((feature) => feature.groupId === "care").map((feature) => feature.name),
    convenienceHighlights: features.filter((feature) => feature.groupId === "convenience").map((feature) => feature.name),
    drainage: captureString(text, /(?:排水ホース(?:取り出し|取出)|排水方向)[：:\s]*([^\n]{1,60})/),
    panel: captureString(text, /(?:操作部\s*)?パネル\s+([^\n]{1,60})/)
  };
}

function parsePanasonic(text, features) {
  const hoseDimensions = text.match(/(?:総外形寸法\(幅×奥行×高さ\)[^\n]*|本体寸法\(幅×高さ×奥行\)\(給[･・]排水ホース含む\))\s*([0-9,]+)×([0-9,]+)×([0-9,]+)\s*mm/);
  const bodyDimensions = text.match(/本体寸法\(幅×高さ×奥行\)\s*([0-9,]+)×([0-9,]+)×([0-9,]+)\s*mm/);
  const pan = captureString(text, /対応防水フロアー\s*([^\n]{1,100})/);
  const isTotal = hoseDimensions && /総外形寸法/.test(hoseDimensions[0]);
  return {
    performance: {
      washTimeMin: capture(text, /目安時間\(約\).*?定格洗濯時\s*([0-9,]+)\s*分/s),
      washDryTimeMin: capture(text, /定格洗濯乾燥時(?:\(標準乾燥モード\))?\s*([0-9,]+)\s*分/),
      washDryEcoTimeMin: capture(text, /定格洗濯乾燥時\(省エネ乾燥モード\)\s*([0-9,]+)\s*分/),
      waterL: capture(text, /標準使用水量\(約\).*?定格洗濯時\s*([0-9,]+)L/s),
      washDryWaterL: capture(text, /定格洗濯乾燥時\s*([0-9,]+)L/),
      energyWh: capture(text, /消費電力量\(約\).*?定格洗濯時\s*([0-9,]+)Wh/s),
      washDryEnergyWh: capture(text, /定格洗濯乾燥時\(標準乾燥モード\)\s*([0-9,]+)Wh/),
      washDryEcoEnergyWh: capture(text, /定格洗濯乾燥時\(省エネ乾燥モード\)\s*([0-9,]+)Wh/),
      washDb: capture(text, /運転音\(約\).*?洗濯時\s*([0-9,]+)dB/s),
      spinDb: capture(text, /脱水時\s*([0-9,]+)dB/),
      dryDb: capture(text, /乾燥時\s*([0-9,]+)dB/)
    },
    dimensions: {
      widthMm: hoseDimensions ? number(hoseDimensions[1]) : null,
      depthMm: hoseDimensions ? number(isTotal ? hoseDimensions[2] : hoseDimensions[3]) : null,
      heightMm: hoseDimensions ? number(isTotal ? hoseDimensions[3] : hoseDimensions[2]) : null,
      massKg: capture(text, /本体質量\(約\)\s*([0-9,.]+)kg/),
      pan,
      bodyWidthMm: bodyDimensions ? number(bodyDimensions[1]) : null
    },
    drying: { method: captureString(text, /乾燥方式\s+乾燥方式\s+([^\n]{1,80})/) },
    specDetails: commonDetails(text, features)
  };
}

function parseSharp(text, features) {
  const dimensions = text.match(/外形寸法（幅×奥行×高さ）\s*([0-9,]+)×([0-9,]+)×([0-9,]+)mm/);
  const noise = text.match(/運転音（洗い時／脱水時／乾燥時）\s*([0-9,]+)dB\s*\/\s*([0-9,]+)dB(?:\s*\/\s*([0-9,]+)dB)?/);
  return {
    performance: {
      washTimeMin: capture(text, /目安時間（50\/60Hz）\s*洗濯\s*約?\s*([0-9,]+)分/),
      washDryTimeMin: capture(text, /目安時間（50\/60Hz）[\s\S]{0,120}?洗濯[〜～]乾燥\s*約?\s*([0-9,]+)分/),
      waterL: capture(text, /標準使用水量(?:（[^）]*）)?\s*洗濯\s*([0-9,]+)L/),
      washDryWaterL: capture(text, /標準使用水量[\s\S]{0,120}?洗濯[〜～]乾燥\s*([0-9,]+)L/),
      energyWh: capture(text, /消費電力量（50\/60Hz）\s*洗濯\s*([0-9,]+)Wh/),
      washDryEnergyWh: capture(text, /消費電力量（50\/60Hz）[\s\S]{0,120}?洗濯[〜～]乾燥\s*([0-9,]+)Wh/),
      washDb: noise ? number(noise[1]) : null,
      spinDb: noise ? number(noise[2]) : null,
      dryDb: noise ? number(noise[3]) : null
    },
    dimensions: {
      widthMm: dimensions ? number(dimensions[1]) : null,
      depthMm: dimensions ? number(dimensions[2]) : null,
      heightMm: dimensions ? number(dimensions[3]) : null,
      massKg: capture(text, /質量\s*約?\s*([0-9,.]+)kg/),
      pan: captureString(text, /設置可能な防水パン（内寸奥行）\s*([^\n]{1,50})/),
      bodyWidthMm: capture(text, /ボディ幅\s*([0-9,]+)mm/),
      doorDirection: /左開き[\s\S]{0,100}?右開き|右開き[\s\S]{0,100}?左開き/.test(text) ? "左開き / 右開き" : /左開き/.test(text) ? "左開き" : /右開き/.test(text) ? "右開き" : ""
    },
    drying: { method: features.find((feature) => feature.groupId === "drying")?.name || captureString(text, /乾燥機能\s+([^\n]{1,80})/) },
    specDetails: commonDetails(text, features)
  };
}

function valuesBetween(text, startLabel, endLabel, pattern) {
  const start = text.indexOf(startLabel);
  if (start < 0) return [];
  const end = text.indexOf(endLabel, start + startLabel.length);
  const section = text.slice(start, end >= 0 ? end : start + 400);
  return [...section.matchAll(pattern)].map((match) => number(match[1])).filter(hasValue);
}

function parseToshiba(text, features, product) {
  const dimensions = text.match(/総外形寸法\/質量[\s\S]{0,120}?([0-9,]+)\s*×\s*([0-9,]+)\s*×\s*([0-9,]+)mm\s*\/?\s*約?\s*([0-9,.]+)kg/);
  const noise = text.match(/運転音\s*洗い\s*約?\s*([0-9,]+)dB\s*\/\s*脱水\s*約?\s*([0-9,]+)dB(?:\s*\/\s*乾燥\s*約?\s*([0-9,]+)dB)?/);
  const result = {
    performance: {
      washTimeMin: capture(text, /目安時間\s*洗濯時\s*約?\s*([0-9,]+)分/),
      washDryTimeMin: capture(text, /洗濯[～〜]乾燥時\s*約?\s*([0-9,]+)分/),
      washDryEcoTimeMin: capture(text, /洗濯[～〜]乾燥時（乾燥節電）\s*約?\s*([0-9,]+)分/),
      waterL: capture(text, /標準使用水量\s*洗濯時\s*約?\s*([0-9,]+)L/),
      washDryWaterL: capture(text, /標準使用水量[\s\S]{0,100}?洗濯[～〜]乾燥時\s*約?\s*([0-9,]+)L/),
      energyWh: capture(text, /消費電力量\s*洗濯時\s*約?\s*([0-9,]+)Wh/),
      washDryEnergyWh: capture(text, /消費電力量[\s\S]{0,120}?洗濯[～〜]乾燥時\s*約?\s*([0-9,]+)Wh/),
      washDryEcoEnergyWh: capture(text, /洗濯[～〜]乾燥時（乾燥節電）\s*約?\s*([0-9,]+)Wh/),
      washDb: noise ? number(noise[1]) : null,
      spinDb: noise ? number(noise[2]) : null,
      dryDb: noise ? number(noise[3]) : null
    },
    dimensions: {
      widthMm: dimensions ? number(dimensions[1]) : null,
      depthMm: dimensions ? number(dimensions[2]) : null,
      heightMm: dimensions ? number(dimensions[3]) : null,
      massKg: dimensions ? number(dimensions[4]) : null,
      pan: captureString(text, /設置可能防水パン\s*([^\n]{1,80})/),
      bodyWidthMm: capture(text, /ボディ幅\s*([0-9,]+)mm/)
    },
    drying: { method: features.find((feature) => /ヒートポンプ|乾燥/.test(feature.name) && feature.groupId === "drying")?.name || "" },
    specDetails: commonDetails(text, features)
  };

  // 東芝の一部縦型は9kg/8kgを同じ仕様表に掲載しているため、2列目の値を明示的に選ぶ。
  const secondColumnModels = new Set(["AW-8DP5", "AW-8DH5", "AW-8DPB6", "AW-8DHB6"]);
  if (secondColumnModels.has(product?.name)) {
    const times = valuesBetween(text, "目安時間", "標準使用水量", /約?\s*([0-9,]+)分/g);
    const waters = valuesBetween(text, "標準使用水量", "消費電力", /約?\s*([0-9,]+)L/g);
    const energies = valuesBetween(text, "消費電力量", "ボディ幅", /約?\s*([0-9,]+)Wh/g);
    if (hasValue(times[1])) result.performance.washTimeMin = times[1];
    if (hasValue(waters[1])) result.performance.waterL = waters[1];
    if (hasValue(energies[1])) result.performance.energyWh = energies[1];
  }

  return result;
}

function parseHisense(text, features) {
  const dimensions = text.match(/外形寸法[\s\S]{0,100}?幅\s*([0-9,\s]+?)\s*mm\s*×\s*奥行\s*([0-9,\s]+?)\s*mm\s*×\s*高さ\s*([0-9,\s]+?)\s*mm/);
  const noise = text.match(/運転音[\s\S]{0,80}?約?\s*([0-9,]+)dB\s*\/\s*約?\s*([0-9,]+)dB(?:\s*\/\s*約?\s*([0-9,]+)dB)?/);
  const panDepth = captureString(text, /設置可能防水パン[\s\S]{0,50}?奥行内寸法[^0-9]{0,15}([0-9,]+mm[^\n]{0,15})/);
  const panWidth = captureString(text, /設置可能防水パン[\s\S]{0,50}?幅内寸法[^0-9]{0,15}([0-9,]+mm[^\n]{0,15})/);
  return {
    performance: {
      washTimeMin: capture(text, /(?:標準コース運転\s*)?目安時間(?:（[^）]*）|\([^)]*\))?[^0-9]{0,30}約?\s*([0-9,]+)分/),
      washDryTimeMin: capture(text, /目安時間[\s\S]{0,50}?洗濯[〜～]乾燥[^0-9]{0,20}約?\s*([0-9,]+)分/),
      waterL: capture(text, /標準使用水量(?:（洗濯）)?[^0-9]{0,30}([0-9,]+)L/),
      washDryWaterL: capture(text, /標準使用水量[\s\S]{0,80}?洗濯[〜～]乾燥[^0-9]{0,30}([0-9,]+)L/),
      energyWh: capture(text, /消費電力量[\s\S]{0,120}?([0-9,]+)Wh/),
      washDryEnergyWh: capture(text, /消費電力量[\s\S]{0,160}?洗濯[〜～]乾燥[^0-9]{0,30}([0-9,]+)Wh/),
      washDb: noise ? number(noise[1]) : null,
      spinDb: noise ? number(noise[2]) : null,
      dryDb: noise ? number(noise[3]) : null
    },
    dimensions: {
      widthMm: dimensions ? number(dimensions[1]) : null,
      depthMm: dimensions ? number(dimensions[2]) : null,
      heightMm: dimensions ? number(dimensions[3]) : null,
      massKg: capture(text, /(?:本体|製品)質量\s*約?\s*([0-9,.]+)kg/),
      pan: [panDepth && `奥行${panDepth}`, panWidth && `幅${panWidth}`].filter(Boolean).join(" / "),
      bodyWidthMm: capture(text, /(?:本体|ボディ)幅\s*([0-9,]+)mm/)
    },
    drying: { method: features.find((feature) => feature.groupId === "drying")?.name || "" },
    specDetails: commonDetails(text, features)
  };
}

function findHitachiRow(json, label) {
  const rows = json.dataArray.flatMap((section) => section.data || []);
  return rows.find((row) => compact(htmlToText(row.column)).startsWith(label));
}

function hitachiValue(json, label) {
  const row = findHitachiRow(json, label);
  return row ? compact(htmlToText(row.value)) : "";
}

function parseHitachi(json) {
  const time = hitachiValue(json, "目安時間");
  const energy = hitachiValue(json, "消費電力量");
  const water = hitachiValue(json, "標準使用水量");
  const noiseText = hitachiValue(json, "運転音");
  const noise = noiseText.match(/([0-9,]+)\s*[／/]\s*([0-9,]+)\s*[／/]\s*([0-9,]+)/);
  const dimensionsText = hitachiValue(json, "外形寸法");
  const dimensions = dimensionsText.match(/幅\s*([0-9,]+)mm.*?奥行\s*([0-9,]+)mm.*?高さ\s*([0-9,]+)mm/);
  const relevantText = compact(json.dataArray.filter((section) => !["pdcAnnotation", "pdcParts"].includes(section.domId)).flatMap((section) => section.data || []).map((row) => `${htmlToText(row.column)} ${htmlToText(row.value)}`).join(" "));
  const features = getFeatures("hitachi", relevantText);
  return {
    performance: {
      washTimeMin: capture(time, /洗濯（標準コース）\s*([0-9,]+)分/),
      washDryTimeMin: capture(time, /洗濯[～〜]乾燥（標準コース）\s*約?\s*([0-9,]+)分/),
      washDryEcoTimeMin: capture(time, /洗濯[～〜]乾燥（省エネコース）\s*約?\s*([0-9,]+)分/),
      waterL: capture(water, /洗濯\s*([0-9,]+)L/),
      washDryWaterL: capture(water, /洗濯[～〜]乾燥\s*約?\s*([0-9,]+)L/),
      energyWh: capture(energy, /洗濯（標準コース）\s*([0-9,]+)Wh/),
      washDryEnergyWh: capture(energy, /洗濯[～〜]乾燥（標準コース）\s*約?\s*([0-9,]+)Wh/),
      washDryEcoEnergyWh: capture(energy, /洗濯[～〜]乾燥（省エネコース）\s*約?\s*([0-9,]+)Wh/),
      washDb: noise ? number(noise[1]) : null,
      spinDb: noise ? number(noise[2]) : null,
      dryDb: noise ? number(noise[3]) : null
    },
    dimensions: {
      widthMm: dimensions ? number(dimensions[1]) : null,
      depthMm: dimensions ? number(dimensions[2]) : null,
      heightMm: dimensions ? number(dimensions[3]) : null,
      massKg: capture(hitachiValue(json, "質量"), /約?\s*([0-9,.]+)kg/),
      pan: hitachiValue(json, "設置可能な防水パンサイズ"),
      bodyWidthMm: capture(hitachiValue(json, "本体幅"), /([0-9,]+)mm/)
    },
    drying: { method: hitachiValue(json, "乾燥方式").replace(/^ー$/, "") },
    features,
    specDetails: {
      ...commonDetails(relevantText, features),
      panel: hitachiValue(json, "操作パネル"),
      smartphone: hitachiValue(json, "スマートフォン連携").replace(/^ー$/, "") || commonDetails(relevantText, features).smartphone,
      drainHoseLength: hitachiValue(json, "排水ホースの長さ")
    }
  };
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function cleanObject(value) {
  if (Array.isArray(value)) return value.map(cleanObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([, child]) => hasValue(child)).map(([key, child]) => [key, cleanObject(child)]));
}

async function researchProduct(product) {
  const specSource = officialSpecSource(product);
  if (!specSource) throw new Error("公式仕様URLが未定義");

  if (product.makerId === "hitachi" && product.name !== "NW-R706") {
    const jsonUrl = `https://kadenfan.hitachi.co.jp/wash/common/json/${product.name.toLowerCase()}.json`;
    const json = JSON.parse(await fetchText(jsonUrl));
    return cleanObject({ ...parseHitachi(json), officialUrl: specSource.url, featureUrl: featurePageUrl(product) });
  }

  if (product.name === "NW-R706") {
    return {
      performance: { waterL: 110 },
      dimensions: { widthMm: 560, depthMm: 563, heightMm: 890, massKg: 32 },
      features: [{ name: "シャワー浸透洗浄", description: "洗剤液を衣類へ浸透させて洗う機能です。", groupId: "washing" }],
      specDetails: { washHighlights: ["シャワー浸透洗浄"], dryingHighlights: [], careHighlights: [], convenienceHighlights: [] },
      officialUrl: specSource.url
    };
  }

  const [specHtml, featureHtml] = await Promise.all([
    fetchText(specSource.url),
    featurePageUrl(product) ? fetchText(featurePageUrl(product)) : Promise.resolve("")
  ]);
  const specText = trimProductText(htmlToText(specHtml), product.makerId);
  const featureText = trimProductText(htmlToText(featureHtml), product.makerId);
  const combined = `${specText}\n${featureText}`;
  const features = dedupeFeatures(getFeatures(product.makerId, combined));
  const parser = { panasonic: parsePanasonic, sharp: parseSharp, toshiba: parseToshiba, hisense: parseHisense }[product.makerId];
  if (!parser) throw new Error(`抽出処理がありません: ${product.makerId}`);
  return cleanObject({ ...parser(specText, features, product), features, officialUrl: specSource.url, featureUrl: featurePageUrl(product) });
}

const queue = [...data.products];
const output = {};
const failures = [];
let completed = 0;

async function worker() {
  while (queue.length) {
    const product = queue.shift();
    try {
      output[product.id] = await researchProduct(product);
      completed += 1;
      console.log(`[${completed}/${data.products.length}] ${product.id}`);
    } catch (error) {
      failures.push(`${product.id}: ${error.message}`);
      console.error(`FAIL ${product.id}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 6 }, worker));
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ checkedAt: data.app.updatedAt, products: output, failures }, null, 2)}\n`, "utf8");
console.log(`\n公式仕様補完データ: ${Object.keys(output).length}/${data.products.length}機種`);
console.log(`失敗: ${failures.length}件`);
console.log(`出力: ${OUT}`);
if (failures.length) process.exit(1);
