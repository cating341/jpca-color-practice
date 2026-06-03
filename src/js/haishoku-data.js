// 基本配色法 — 純邏輯資料層，不碰 DOM
// 瀏覽器：以 <script> 載入（需先載入 pccs-data.js）；Node：可 require（測試用）

// 取得 PCCS 資料（Node：require；瀏覽器：pccs-data.js 已定義全域變數）
var _pccs = (typeof module !== "undefined" && module.exports)
  ? require("./pccs-data.js")
  : { PCCS_GRAYS: PCCS_GRAYS, findTone: findTone, getColor: getColor,
      hexToRgb: hexToRgb, rgbToHex: rgbToHex };

// ---- 記號解析 ----

// 解析 PCCS 配色記號：
//   有彩色："v2"、"ltg20" → { type: "chromatic", toneId, hueNum }
//   無彩色："N2"、"N9.5" → { type: "neutral", value }；"W" 視同 N9.5
function parseColorNotation(notation) {
  if (typeof notation !== "string" || notation.length === 0) {
    throw new Error("parseColorNotation: invalid notation " + notation);
  }
  if (notation === "W") return { type: "neutral", value: 9.5 };

  var neutralMatch = notation.match(/^N(\d+(?:\.\d+)?)$/);
  if (neutralMatch) {
    var nval = parseFloat(neutralMatch[1]);
    if (nval < 1.5 || nval > 9.5) {
      throw new Error("parseColorNotation: neutral value out of range in " + notation);
    }
    return { type: "neutral", value: nval };
  }

  var chromaticMatch = notation.match(/^([a-z]+)(\d+)$/);
  if (chromaticMatch) {
    var toneId = chromaticMatch[1];
    var hueNum = parseInt(chromaticMatch[2], 10);
    if (!_pccs.findTone(toneId)) {
      throw new Error("parseColorNotation: unknown tone in " + notation);
    }
    if (hueNum < 1 || hueNum > 24) {
      throw new Error("parseColorNotation: hue out of range in " + notation);
    }
    return { type: "chromatic", toneId: toneId, hueNum: hueNum };
  }

  throw new Error("parseColorNotation: invalid notation " + notation);
}

// ---- 無彩色灰階插值 ----

// 依明度值在 PCCS_GRAYS 之間線性插值；超出範圍 clamp 到 [1.5, 9.5]
function getNeutralColor(value) {
  var grays = _pccs.PCCS_GRAYS; // 明度由大到小排列（9.5 → 1.5）
  if (value >= grays[0].value) return grays[0].hex;
  if (value <= grays[grays.length - 1].value) return grays[grays.length - 1].hex;

  for (var i = 0; i < grays.length - 1; i++) {
    var upper = grays[i], lower = grays[i + 1];
    if (value <= upper.value && value >= lower.value) {
      var t = (value - lower.value) / (upper.value - lower.value);
      var up = _pccs.hexToRgb(upper.hex), lo = _pccs.hexToRgb(lower.hex);
      return _pccs.rgbToHex(
        lo.r + (up.r - lo.r) * t,
        lo.g + (up.g - lo.g) * t,
        lo.b + (up.b - lo.b) * t
      );
    }
  }
  throw new Error("getNeutralColor: unexpected value " + value); // 防禦：不應到達
}

// ---- 顏色計算 ----

// 取得任意記號的顏色（有彩色 → getColor；無彩色 → 灰階插值）
function getSchemeColor(notation) {
  var parsed = parseColorNotation(notation);
  if (parsed.type === "neutral") return getNeutralColor(parsed.value);
  return _pccs.getColor(parsed.toneId, parsed.hueNum);
}

// ---- 配色法內容資料 ----
// 內容依據 ref/u5-color-schemes.json（M1-U5 配色基礎）；
// 各小節補足至 2 個範例（補足範例見 docs/superpowers/specs/2026-06-03-haishoku-design.md）
// rule：領域規則（測試用，驗證範例符合該配色法定義）
// layout：equal（等寬色塊）｜accent（基調/配合/重點 面積比例）｜separation（主色｜分離帶｜主色）

var HAISHOKU_OVERVIEW = "配色是指兩個以上的色彩組合。好的配色能傳達特定的情感和印象。在此單元中，我們將學習基於 PCCS 色相與色調系統的基礎配色法則。";

var HAISHOKU_CATEGORIES = [
  {
    id: "hue-schemes",
    title: "色相配色",
    description: "以色相環上的相對位置為基準的配色法。色相環上的距離決定配色性質：相鄰 1–3 號為類似、相隔 8–10 號為對照、正對面（11–12 號）則為補色。",
    layout: "equal",
    schemes: [
      { title: "同一色相配色", titleEn: "Identity Hue",
        description: "在色相環上角度差為 0°（即相同色相號碼）。給人統一、穩定但可能單調的感覺。",
        rule: { type: "hue-diff", min: 0, max: 0 },
        examples: [
          { colors: ["v18", "p18"], label: "鮮豔藍＋淡藍" },
          { colors: ["dp8", "ltg8"], label: "深黃＋淺灰黃" }
        ] },
      { title: "類似色相配色", titleEn: "Analogy Hue",
        description: "色相差在 1~3 的配色。因色相相近，易於調和且帶有些微變化。",
        rule: { type: "hue-diff", min: 1, max: 3 },
        examples: [
          { colors: ["v10", "v12"], label: "黃綠＋綠" },
          { colors: ["sf12", "sf14"], label: "柔綠＋柔藍綠" }
        ] },
      { title: "對照色相配色", titleEn: "Contrast Hue",
        description: "色相差 8~10 的配色。具備明顯對比感，視覺效果強烈。",
        rule: { type: "hue-diff", min: 8, max: 10 },
        examples: [
          { colors: ["v6", "v16"], label: "黃橙＋綠藍" },
          { colors: ["dp8", "dp18"], label: "深黃＋深藍" }
        ] },
      { title: "補色／互補色相配色", titleEn: "Complementary Hue",
        description: "色相差 11~12 的配色，即色相環正對面的顏色。對比最為強烈、刺激。",
        rule: { type: "hue-diff", min: 11, max: 12 },
        examples: [
          { colors: ["v2", "v14"], label: "紅＋藍綠" },
          { colors: ["b8", "b20"], label: "明亮黃＋明亮藍紫" }
        ] }
    ]
  },
  {
    id: "tone-schemes",
    title: "色調配色",
    description: "以 PCCS 色調（Tone）為基準的配色法。",
    layout: "equal",
    schemes: [
      { title: "同一色調配色", titleEn: "Identity Tone",
        description: "使用完全相同的色調（Tone）但不同色相。印象統一由該色調的特徵決定（例如全用 v 色調會極度華麗）。",
        rule: { type: "same-tone" },
        examples: [
          { colors: ["v6", "v18"], label: "鮮豔橙＋鮮豔藍" },
          { colors: ["ltg8", "ltg20"], label: "淺灰黃＋淺灰紫" }
        ] },
      { title: "類似色調配色", titleEn: "Analogy Tone",
        description: "在色調圖上相鄰的色調配色（如 v 與 b，或 p 與 ltg）。印象和諧且帶有層次。",
        rule: { type: "different-tone-same-hue" },
        examples: [
          { colors: ["v22", "b22"], label: "鮮豔紫＋明亮紫" },
          { colors: ["sf8", "d8"], label: "柔黃＋濁黃" }
        ] },
      { title: "對照色調配色", titleEn: "Contrast Tone",
        description: "在色調圖上距離較遠（明度或彩度差異大）的色調配色。",
        rule: { type: "contrast-tone" },
        examples: [
          { colors: ["p20", "dkg20"], label: "淡藍紫＋暗灰藍紫" },
          { colors: ["v8", "ltg8"], label: "鮮黃＋淺灰黃" }
        ] }
    ]
  },
  {
    id: "dominant-schemes",
    title: "主調配色",
    description: "畫面中由某一特定色彩屬性佔據主導地位，產生強烈的整體統一感。M1 介紹基本概念，M2 會有更綜合的服裝應用。",
    layout: "equal",
    schemes: [
      { title: "主調顏色／主調色調", titleEn: "Dominant Color / Dominant Tone",
        description: "統一色相或統一色調，讓整體有一個明顯的「主角」。",
        rule: { type: "dominant" },
        examples: [
          { colors: ["v18", "ltg18", "dp18"], label: "統一藍色相（Dominant Color）" },
          { colors: ["v8", "v12", "v16"], label: "統一鮮豔色調（Dominant Tone）" }
        ] }
    ]
  },
  {
    id: "gradation",
    title: "漸層配色（Gradation／グラデーション）",
    description: "顏色按照一定的規律作階梯式的變化。",
    layout: "equal",
    schemes: [
      { title: "色相漸層", titleEn: "Hue Gradation",
        description: "色相依序變化。",
        rule: { type: "hue-gradation" },
        examples: [
          { colors: ["v6", "v8", "v10", "v12"], label: "黃橙→黃→黃綠→綠" },
          { colors: ["v14", "v16", "v18", "v20"], label: "藍綠→帶綠藍→藍→藍紫" }
        ] },
      { title: "明度漸層", titleEn: "Lightness Gradation",
        description: "明度由亮到暗或由暗到亮變化。",
        rule: { type: "lightness-gradation" },
        examples: [
          { colors: ["p8", "lt8", "b8", "dp8"], label: "由淺黃到深黃" },
          { colors: ["lt16", "sf16", "d16", "dk16"], label: "由淺藍到暗藍（明度遞減）" }
        ] },
      { title: "彩度漸層", titleEn: "Saturation Gradation",
        description: "彩度由高到低或由低到高變化。注意：彩度高低不等於清濁——清濁取決於混入的是白／黑（清色）或灰（濁色），而非彩度。例如 p（淡）與 ltg（淺灰）彩度相近，p 卻是清色、ltg 是濁色。",
        rule: { type: "saturation-gradation" },
        examples: [
          { colors: ["v24", "b24", "sf24", "ltg24"], label: "鮮豔紅紫→明亮→柔→淺灰（彩度遞減）" },
          { colors: ["v18", "s18", "d18", "g18"], label: "鮮藍→強藍→鈍藍→灰藍" }
        ] },
      { title: "色調漸層", titleEn: "Tone Gradation",
        description: "色調圖上有規律的移動（如淡→淺→明亮→鮮豔）。",
        rule: { type: "tone-gradation" },
        examples: [
          { colors: ["p16", "lt16", "b16", "v16"], label: "藍色調漸層（淡→淺→明亮→鮮豔）" },
          { colors: ["v4", "dp4", "dk4", "dkg4"], label: "橙色調漸層（鮮豔→深→暗→暗灰）" }
        ] }
    ]
  },
  {
    id: "accent",
    title: "重點配色（Accent／アクセントカラー）",
    description: "在單調或大面積的統一配色中，加入小面積的強烈對比色，達到畫龍點睛的效果。面積最大的稱為基調色（Base color），次要的稱為配合色（Assorted color），面積最小的為重點色（Accent color）。",
    layout: "accent",
    schemes: [
      { title: "無彩色＋高彩度重點色", titleEn: "",
        description: "",
        rule: { type: "accent" },
        examples: [
          { colors: ["N2", "N6", "v12"], label: "基調 N2／配合 N6／重點 v12（綠）" },
          { colors: ["N9.5", "N5.5", "v18"], label: "基調 N9.5（白）／配合 N5.5／重點 v18（藍）" }
        ] },
      { title: "低明度配色＋高彩度重點色", titleEn: "",
        description: "",
        rule: { type: "accent" },
        examples: [
          { colors: ["dkg16", "dk16", "v8"], label: "基調 dkg16／配合 dk16／重點 v8（黃）" },
          { colors: ["dkg20", "dk20", "v6"], label: "基調 dkg20／配合 dk20／重點 v6（橙黃）" }
        ] },
      { title: "低彩度明度差小的配色＋高彩度暖色系重點色", titleEn: "",
        description: "",
        rule: { type: "accent-warm" },
        examples: [
          { colors: ["ltg12", "ltg14", "v6"], label: "基調 ltg12／配合 ltg14／重點 v6（橙黃）" },
          { colors: ["ltg16", "ltg18", "v4"], label: "基調 ltg16／配合 ltg18／重點 v4（橙）" }
        ] }
    ]
  },
  {
    id: "separation",
    title: "分離配色（Separation／セパレーション）",
    description: "在兩種對比過強或過於模糊的顏色之間，加入無彩色或低彩度顏色作分隔，使整體和諧或輪廓清晰。",
    layout: "separation",
    schemes: [
      { title: "高彩度強烈配色＋無彩色分離色", titleEn: "",
        description: "",
        rule: { type: "separation" },
        examples: [
          { colors: ["v18", "N9.5", "v6"], label: "v18（藍）／N9.5（白）分離／v6（橙）" },
          { colors: ["v8", "N1.5", "v20"], label: "v8（黃）／N1.5（黑）分離／v20（藍紫）" }
        ] },
      { title: "低彩度模糊配色＋低明度分離色", titleEn: "",
        description: "",
        rule: { type: "separation" },
        examples: [
          { colors: ["p8", "N2", "p10"], label: "p8（淡黃）／N2（深灰）分離／p10（淡黃綠）" },
          { colors: ["p16", "N2", "p18"], label: "p16（淡藍）／N2（深灰）分離／p18（淡藍紫）" }
        ] },
      { title: "低明度配色＋高明度分離色", titleEn: "",
        description: "",
        rule: { type: "separation" },
        examples: [
          { colors: ["dp16", "N9.5", "dp20"], label: "dp16（深藍）／N9.5（白）分離／dp20（深藍紫）" },
          { colors: ["dk10", "N9.5", "dk14"], label: "dk10（暗黃綠）／N9.5（白）分離／dk14（暗藍綠）" }
        ] }
    ]
  }
];

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseColorNotation: parseColorNotation,
    getNeutralColor: getNeutralColor,
    getSchemeColor: getSchemeColor,
    HAISHOKU_OVERVIEW: HAISHOKU_OVERVIEW,
    HAISHOKU_CATEGORIES: HAISHOKU_CATEGORIES
  };
}
