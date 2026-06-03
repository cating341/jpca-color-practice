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

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseColorNotation: parseColorNotation,
    getNeutralColor: getNeutralColor,
    getSchemeColor: getSchemeColor
  };
}
