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

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    interpolateHex: interpolateHex,
    mixColor: mixColor
  };
}
