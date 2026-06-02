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
