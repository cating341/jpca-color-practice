// PCCS 色彩資料與純函式 — 不碰 DOM
// 瀏覽器：以 <script> 載入（定義全域變數）；Node：可 require（測試用）

// ---- 色彩工具函式 ----

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function rgbToHex(r, g, b) {
  function c(v) { return ("0" + Math.round(v).toString(16)).slice(-2); }
  return "#" + c(r) + c(g) + c(b);
}

// 兩色 sRGB 中點內插（用於由偶數色相生成奇數色相）
function interpolateHex(hexA, hexB) {
  var a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex((a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2);
}

// 混色 — 清濁色嚴格定義：
//   明清色 = 純色 + 白（type: "white"）
//   暗清色 = 純色 + 黑（type: "black"）
//   濁色   = 純色 + 灰（type: "gray"，灰階值由 mix.gray 指定）
//   純色   = mix 為 null
function mixColor(vividHex, mix) {
  if (!mix) return vividHex;
  var base = hexToRgb(vividHex);
  var target;
  if (mix.type === "white") target = { r: 255, g: 255, b: 255 };
  else if (mix.type === "black") target = { r: 0, g: 0, b: 0 };
  else target = hexToRgb(mix.gray);
  var a = mix.amount;
  return rgbToHex(
    base.r * (1 - a) + target.r * a,
    base.g * (1 - a) + target.g * a,
    base.b * (1 - a) + target.b * a
  );
}

// ---- 色相資料 ----
// 偶數 12 色相為基底（純色 HEX 已與 ref 參考圖比對確認；v12–v24 為加深版）
var PCCS_HUE_BASE = [
  { num: 2,  symbol: "2:R",   jpName: "赤",             vivid: "#e60033" },
  { num: 4,  symbol: "4:rO",  jpName: "赤みのだいだい", vivid: "#eb6101" },
  { num: 6,  symbol: "6:yO",  jpName: "黄みのだいだい", vivid: "#f8a900" },
  { num: 8,  symbol: "8:Y",   jpName: "黄",             vivid: "#ffd400" },
  { num: 10, symbol: "10:YG", jpName: "黄緑",           vivid: "#aacf53" },
  { num: 12, symbol: "12:G",  jpName: "緑",             vivid: "#009154" },
  { num: 14, symbol: "14:BG", jpName: "青緑",           vivid: "#007d79" },
  { num: 16, symbol: "16:gB", jpName: "緑みの青",       vivid: "#006491" },
  { num: 18, symbol: "18:B",  jpName: "青",             vivid: "#19438c" },
  { num: 20, symbol: "20:V",  jpName: "青紫",           vivid: "#4c3982" },
  { num: 22, symbol: "22:P",  jpName: "紫",             vivid: "#863f86" },
  { num: 24, symbol: "24:RP", jpName: "赤紫",           vivid: "#b73165" }
];

// 奇數色相的記號與名稱（顏色由相鄰偶數色相內插）
var PCCS_HUE_ODD_INFO = [
  { num: 1,  symbol: "1:pR",  jpName: "紫みの赤" },
  { num: 3,  symbol: "3:yR",  jpName: "黄みの赤" },
  { num: 5,  symbol: "5:O",   jpName: "だいだい" },
  { num: 7,  symbol: "7:rY",  jpName: "赤みの黄" },
  { num: 9,  symbol: "9:gY",  jpName: "緑みの黄" },
  { num: 11, symbol: "11:yG", jpName: "黄みの緑" },
  { num: 13, symbol: "13:bG", jpName: "青みの緑" },
  { num: 15, symbol: "15:BG", jpName: "青緑" },
  { num: 17, symbol: "17:B",  jpName: "青" },
  { num: 19, symbol: "19:pB", jpName: "紫みの青" },
  { num: 21, symbol: "21:bP", jpName: "青みの紫" },
  { num: 23, symbol: "23:rP", jpName: "赤みの紫" }
];

// 組合成 1–24 完整色相清單
var PCCS_HUES = (function () {
  var hues = [];
  for (var i = 0; i < 12; i++) {
    var even = PCCS_HUE_BASE[i];
    var prevEven = PCCS_HUE_BASE[(i + 11) % 12]; // 環狀：1 在 24 與 2 之間
    var odd = PCCS_HUE_ODD_INFO[i];
    hues.push({
      num: odd.num, symbol: odd.symbol, jpName: odd.jpName,
      vivid: interpolateHex(prevEven.vivid, even.vivid)
    });
    hues.push({ num: even.num, symbol: even.symbol, jpName: even.jpName, vivid: even.vivid });
  }
  return hues;
})();

// ---- 色調資料 ----
// category：純色｜明清色（純色+白）｜暗清色（純色+黑）｜濁色（純色+灰）
// spotPos：區塊 2 色調圖座標（px，容器 400×400，見 pccs.css .tone-spot-map）
// wheelPos：區塊 3 Tone Map 花環左上角座標（px，容器 920×660）
var PCCS_TONES = [
  { id: "v", jpName: "ビビッド", jpKana: "さえた", zhName: "鮮豔", category: "純色",
    mix: null,
    spotPos: { x: 290, y: 135 }, wheelPos: { x: 600, y: 170 },
    impressions: { zh: ["鮮豔", "活潑", "強烈", "醒目"], jp: ["派手な", "いきいきした", "強い", "鮮やかな"] } },
  { id: "b", jpName: "ブライト", jpKana: "あかるい", zhName: "明亮", category: "明清色",
    mix: { type: "white", amount: 0.25 },
    spotPos: { x: 200, y: 45 }, wheelPos: { x: 430, y: 80 },
    impressions: { zh: ["明亮", "健康", "開朗"], jp: ["明るい", "健康的な", "陽気な"] } },
  { id: "s", jpName: "ストロング", jpKana: "つよい", zhName: "強烈", category: "濁色",
    mix: { type: "gray", amount: 0.20, gray: "#808080" },
    spotPos: { x: 200, y: 135 }, wheelPos: { x: 430, y: 240 },
    impressions: { zh: ["強烈", "熱情", "有活力"], jp: ["強い", "情熱的な", "動的な"] } },
  { id: "dp", jpName: "ディープ", jpKana: "こい", zhName: "深", category: "暗清色",
    mix: { type: "black", amount: 0.35 },
    spotPos: { x: 200, y: 225 }, wheelPos: { x: 430, y: 400 },
    impressions: { zh: ["深沉", "充實", "傳統", "和風"], jp: ["深い", "充実した", "伝統的な", "和風の"] } },
  { id: "lt", jpName: "ライト", jpKana: "あさい", zhName: "淺", category: "明清色",
    mix: { type: "white", amount: 0.50 },
    spotPos: { x: 110, y: 10 }, wheelPos: { x: 270, y: 20 },
    impressions: { zh: ["淺淡", "輕盈", "清爽", "童趣"], jp: ["浅い", "軽い", "さわやかな", "子供っぽい"] } },
  { id: "sf", jpName: "ソフト", jpKana: "やわらかい", zhName: "柔和", category: "濁色",
    mix: { type: "gray", amount: 0.50, gray: "#b0b0b0" },
    spotPos: { x: 110, y: 100 }, wheelPos: { x: 270, y: 180 },
    impressions: { zh: ["柔和", "溫和", "朦朧"], jp: ["やわらかい", "おだやかな", "ぼんやりした"] } },
  { id: "d", jpName: "ダル", jpKana: "にぶい", zhName: "鈍", category: "濁色",
    mix: { type: "gray", amount: 0.50, gray: "#787878" },
    spotPos: { x: 110, y: 190 }, wheelPos: { x: 270, y: 340 },
    impressions: { zh: ["鈍重", "黯淡", "中性"], jp: ["にぶい", "くすんだ", "中間的な"] } },
  { id: "dk", jpName: "ダーク", jpKana: "くらい", zhName: "暗", category: "暗清色",
    mix: { type: "black", amount: 0.60 },
    spotPos: { x: 110, y: 280 }, wheelPos: { x: 270, y: 500 },
    impressions: { zh: ["暗沉", "成熟", "堅實", "圓融"], jp: ["暗い", "大人っぽい", "丈夫な", "円熟した"] } },
  { id: "p", jpName: "ペール", jpKana: "うすい", zhName: "淡", category: "明清色",
    mix: { type: "white", amount: 0.75 },
    spotPos: { x: 20, y: 10 }, wheelPos: { x: 110, y: 20 },
    impressions: { zh: ["輕薄", "輕柔", "溫柔", "可愛", "清淡"], jp: ["薄い", "軽い", "やさしい", "かわいい", "あっさりした"] } },
  { id: "ltg", jpName: "ライトグレイッシュ", jpKana: "あかるいはいみの", zhName: "淺灰", category: "濁色",
    mix: { type: "gray", amount: 0.70, gray: "#c0c0c0" },
    spotPos: { x: 20, y: 100 }, wheelPos: { x: 110, y: 180 },
    impressions: { zh: ["帶亮灰的", "沉穩", "文靜", "雅緻"], jp: ["明るい灰みの", "落ち着いた", "おとなしい", "しぶい"] } },
  { id: "g", jpName: "グレイッシュ", jpKana: "はいみの", zhName: "灰", category: "濁色",
    mix: { type: "gray", amount: 0.75, gray: "#707070" },
    spotPos: { x: 20, y: 190 }, wheelPos: { x: 110, y: 340 },
    impressions: { zh: ["帶灰的", "混濁", "樸素"], jp: ["灰みの", "濁った", "地味な"] } },
  { id: "dkg", jpName: "ダークグレイッシュ", jpKana: "くらいはいみの", zhName: "暗灰", category: "濁色",
    mix: { type: "gray", amount: 0.80, gray: "#383838" },
    spotPos: { x: 20, y: 280 }, wheelPos: { x: 110, y: 500 },
    impressions: { zh: ["帶暗灰的", "陰鬱", "厚重", "堅硬", "陽剛"], jp: ["暗い灰みの", "陰気な", "重い", "固い", "男性的な"] } }
];

// ---- 無彩色（灰階軸） ----
var PCCS_GRAYS = [
  { symbol: "W",    jpName: "ホワイト",         value: 9.5, hex: "#f5f5f5" },
  { symbol: "ltGy", jpName: "ライトグレイ",     value: 8.5, hex: "#d9d9d9" },
  { symbol: "ltGy", jpName: "ライトグレイ",     value: 7.5, hex: "#bfbfbf" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 6.5, hex: "#a6a6a6" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 5.5, hex: "#8c8c8c" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 4.5, hex: "#737373" },
  { symbol: "dkGy", jpName: "ダークグレイ",     value: 3.5, hex: "#595959" },
  { symbol: "dkGy", jpName: "ダークグレイ",     value: 2.5, hex: "#404040" },
  { symbol: "Bk",   jpName: "ブラック",         value: 1.5, hex: "#262626" }
];

// ---- 查詢函式 ----
function findHue(num) {
  for (var i = 0; i < PCCS_HUES.length; i++) {
    if (PCCS_HUES[i].num === num) return PCCS_HUES[i];
  }
  return null;
}

function findTone(id) {
  for (var i = 0; i < PCCS_TONES.length; i++) {
    if (PCCS_TONES[i].id === id) return PCCS_TONES[i];
  }
  return null;
}

// 取得「色調 × 色相」的顏色（例：getColor("lt", 8) = 淺色調的黃）
function getColor(toneId, hueNum) {
  var hue = findHue(hueNum);
  var tone = findTone(toneId);
  if (!hue) throw new Error("getColor: unknown hueNum " + hueNum);
  if (!tone) throw new Error("getColor: unknown toneId " + toneId);
  return mixColor(hue.vivid, tone.mix);
}

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    interpolateHex: interpolateHex,
    mixColor: mixColor,
    PCCS_HUES: PCCS_HUES,
    PCCS_TONES: PCCS_TONES,
    PCCS_GRAYS: PCCS_GRAYS,
    findHue: findHue,
    findTone: findTone,
    getColor: getColor
  };
}
