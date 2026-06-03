// 清濁度測驗 — 純邏輯，不碰 DOM
// 瀏覽器：以 <script> 載入（需先載入 pccs-data.js）；Node：可 require（測試用）

// 取得 PCCS 資料（Node：require；瀏覽器：pccs-data.js 已定義全域變數）
var _pccs = (typeof module !== "undefined" && module.exports)
  ? require("./pccs-data.js")
  : { PCCS_TONES: PCCS_TONES, findTone: findTone };

// ---- 清濁分類 ----
// 清色 = 明清色（純色＋白）＋ 暗清色（純色＋黑）；濁色 = 中間色（純色＋灰）
// v（純色）不參與清濁測驗
function isClearTone(toneId) {
  var tone = _pccs.findTone(toneId);
  if (!tone) throw new Error("isClearTone: unknown toneId " + toneId);
  if (tone.category === "純色") throw new Error("isClearTone: 純色 (v) 不參與清濁測驗");
  return tone.category === "明清色" || tone.category === "暗清色";
}

// 清濁標籤（公布答案時顯示用）
function seidakuLabel(toneId) {
  var tone = _pccs.findTone(toneId);
  if (!tone) throw new Error("seidakuLabel: unknown toneId " + toneId);
  if (tone.category === "明清色") return "清色（明清色）";
  if (tone.category === "暗清色") return "清色（暗清色）";
  if (tone.category === "濁色") return "濁色（中間色）";
  throw new Error("seidakuLabel: 純色 (v) 不參與清濁測驗");
}

// 測驗使用的 11 個色調（排除 v）
var SEIDAKU_TONES = _pccs.PCCS_TONES
  .filter(function (t) { return t.category !== "純色"; })
  .map(function (t) { return t.id; });

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isClearTone: isClearTone,
    seidakuLabel: seidakuLabel,
    SEIDAKU_TONES: SEIDAKU_TONES
  };
}
