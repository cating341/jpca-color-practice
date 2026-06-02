// 資料層測試 — 以 node tests/pccs-data.test.js 執行，無框架
const assert = require("node:assert");
const path = require("path");
const data = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));

// ---- 色彩工具函式 ----
assert.deepStrictEqual(data.hexToRgb("#ff0000"), { r: 255, g: 0, b: 0 }, "hexToRgb 紅色");
assert.deepStrictEqual(data.hexToRgb("#e60033"), { r: 230, g: 0, b: 51 }, "hexToRgb v2");
assert.strictEqual(data.rgbToHex(255, 0, 0), "#ff0000", "rgbToHex 紅色");
assert.strictEqual(data.rgbToHex(230, 0, 51), "#e60033", "rgbToHex v2");

// 內插：黑白中點為灰
assert.strictEqual(data.interpolateHex("#000000", "#ffffff"), "#808080", "內插中點");

// ---- 混色（清濁嚴格定義） ----
// 純色：mix 為 null 時原色返回
assert.strictEqual(data.mixColor("#e60033", null), "#e60033", "純色不混色");
// 明清色：純色 + 白
assert.strictEqual(data.mixColor("#000000", { type: "white", amount: 0.5 }), "#808080", "加白 50%");
// 暗清色：純色 + 黑
assert.strictEqual(data.mixColor("#ffffff", { type: "black", amount: 0.5 }), "#808080", "加黑 50%");
// 濁色：純色 + 灰
assert.strictEqual(
  data.mixColor("#ff0000", { type: "gray", amount: 1, gray: "#808080" }),
  "#808080",
  "加灰 100% 等於灰本身"
);
// 加白後每個通道都不會變暗（清色無濁感的數學保證）
(function () {
  const base = data.hexToRgb("#e60033");
  const mixed = data.hexToRgb(data.mixColor("#e60033", { type: "white", amount: 0.25 }));
  assert.ok(mixed.r >= base.r && mixed.g >= base.g && mixed.b >= base.b, "加白不變暗");
})();

console.log("Task 2 tests passed");

// ---- 色相資料 ----
assert.strictEqual(data.PCCS_HUES.length, 24, "24 色相");
// 編號 1–24 依序排列
data.PCCS_HUES.forEach(function (h, i) {
  assert.strictEqual(h.num, i + 1, "色相編號 " + (i + 1));
});
// 已確認的純色基底值（與設計文件一致）
assert.strictEqual(data.findHue(2).vivid, "#e60033", "v2 赤");
assert.strictEqual(data.findHue(8).vivid, "#ffd400", "v8 黄");
assert.strictEqual(data.findHue(12).vivid, "#009154", "v12 緑（加深版）");
assert.strictEqual(data.findHue(18).vivid, "#19438c", "v18 青（加深版）");
assert.strictEqual(data.findHue(24).vivid, "#b73165", "v24 赤紫（加深版）");
// 奇數色相 = 相鄰偶數內插
assert.strictEqual(
  data.findHue(3).vivid,
  data.interpolateHex(data.findHue(2).vivid, data.findHue(4).vivid),
  "v3 = v2/v4 內插"
);
assert.strictEqual(
  data.findHue(1).vivid,
  data.interpolateHex(data.findHue(24).vivid, data.findHue(2).vivid),
  "v1 = v24/v2 內插（環狀）"
);
// 色相記號
assert.strictEqual(data.findHue(8).symbol, "8:Y", "8:Y 記號");
assert.strictEqual(data.findHue(2).symbol, "2:R", "2:R 記號");

// ---- 色調資料 ----
assert.strictEqual(data.PCCS_TONES.length, 12, "12 色調");
// 清濁分類（JPCA 考點）
// 清色 = 色立體邊界上的色調：明清色（純色+白）p/lt/b、暗清色（純色+黑）dp/dk/dkg
// 濁色（中間色）= 含灰的內部色調：s/sf/d/ltg/g
var expectedCategories = {
  v: "純色",
  b: "明清色", lt: "明清色", p: "明清色",
  dp: "暗清色", dk: "暗清色", dkg: "暗清色",
  s: "濁色", sf: "濁色", d: "濁色", ltg: "濁色", g: "濁色"
};
Object.keys(expectedCategories).forEach(function (id) {
  assert.strictEqual(data.findTone(id).category, expectedCategories[id], id + " 清濁分類");
});
// 混色類型必須與清濁分類一致
data.PCCS_TONES.forEach(function (t) {
  if (t.category === "純色") assert.strictEqual(t.mix, null, t.id + " 純色無混色");
  if (t.category === "明清色") assert.strictEqual(t.mix.type, "white", t.id + " 明清色加白");
  if (t.category === "暗清色") assert.strictEqual(t.mix.type, "black", t.id + " 暗清色加黑");
  if (t.category === "濁色") assert.strictEqual(t.mix.type, "gray", t.id + " 濁色加灰");
});
// 加白量遞增：b < lt < p；加黑量遞增：dp < dk < dkg
assert.ok(data.findTone("b").mix.amount < data.findTone("lt").mix.amount, "b < lt 加白量");
assert.ok(data.findTone("lt").mix.amount < data.findTone("p").mix.amount, "lt < p 加白量");
assert.ok(data.findTone("dp").mix.amount < data.findTone("dk").mix.amount, "dp < dk 加黑量");
assert.ok(data.findTone("dk").mix.amount < data.findTone("dkg").mix.amount, "dk < dkg 加黑量");
// 每個色調都有中日文印象詞
data.PCCS_TONES.forEach(function (t) {
  assert.ok(t.impressions.zh.length > 0, t.id + " 中文印象詞");
  assert.ok(t.impressions.jp.length > 0, t.id + " 日文印象詞");
});

// ---- getColor ----
assert.strictEqual(data.getColor("v", 8), "#ffd400", "v8 = 純色");
// 明清色比純色亮（每通道 >=）
(function () {
  var vivid = data.hexToRgb(data.getColor("v", 2));
  var pale = data.hexToRgb(data.getColor("p", 2));
  assert.ok(pale.r >= vivid.r && pale.g >= vivid.g && pale.b >= vivid.b, "p2 比 v2 亮");
})();
// 暗清色比純色暗（每通道 <=）
(function () {
  var vivid = data.hexToRgb(data.getColor("v", 2));
  var dark = data.hexToRgb(data.getColor("dk", 2));
  assert.ok(dark.r <= vivid.r && dark.g <= vivid.g && dark.b <= vivid.b, "dk2 比 v2 暗");
})();

// ---- 無彩色 ----
assert.strictEqual(data.PCCS_GRAYS.length, 9, "9 個無彩色");
assert.strictEqual(data.PCCS_GRAYS[0].symbol, "W", "第一個是白");
assert.strictEqual(data.PCCS_GRAYS[8].symbol, "Bk", "最後一個是黑");
// 明度值遞減
for (var gi = 1; gi < data.PCCS_GRAYS.length; gi++) {
  assert.ok(data.PCCS_GRAYS[gi].value < data.PCCS_GRAYS[gi - 1].value, "灰階明度遞減 " + gi);
}

// getColor 防護：未知輸入應拋出描述性錯誤
assert.throws(function () { data.getColor("xx", 8); }, /unknown toneId/, "未知色調拋錯");
assert.throws(function () { data.getColor("v", 99); }, /unknown hueNum/, "未知色相拋錯");

console.log("Task 3 tests passed");
