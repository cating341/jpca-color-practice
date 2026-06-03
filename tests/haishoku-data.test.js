// 基本配色法資料層測試 — 以 node tests/haishoku-data.test.js 執行，無框架
const assert = require("node:assert");
const path = require("path");
const pccs = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));
const haishoku = require(path.join(__dirname, "..", "src", "js", "haishoku-data.js"));

// ---- 記號解析 ----
assert.deepStrictEqual(haishoku.parseColorNotation("v2"),
  { type: "chromatic", toneId: "v", hueNum: 2 }, "v2");
assert.deepStrictEqual(haishoku.parseColorNotation("ltg20"),
  { type: "chromatic", toneId: "ltg", hueNum: 20 }, "ltg20");
assert.deepStrictEqual(haishoku.parseColorNotation("dkg24"),
  { type: "chromatic", toneId: "dkg", hueNum: 24 }, "dkg24");
assert.deepStrictEqual(haishoku.parseColorNotation("N2"),
  { type: "neutral", value: 2 }, "N2");
assert.deepStrictEqual(haishoku.parseColorNotation("N9.5"),
  { type: "neutral", value: 9.5 }, "N9.5");
assert.deepStrictEqual(haishoku.parseColorNotation("W"),
  { type: "neutral", value: 9.5 }, "W = N9.5");

// 非法記號全部拋出描述性錯誤
["xx", "v99", "v0", "v", "N", "", "2v", "zz8"].forEach(function (bad) {
  assert.throws(function () { haishoku.parseColorNotation(bad); },
    /parseColorNotation/, "非法記號拋錯: " + JSON.stringify(bad));
});

// 無彩色明度值超出 PCCS 範圍 [1.5, 9.5] 視為非法記號
["N0", "N1", "N10", "N12"].forEach(function (bad) {
  assert.throws(function () { haishoku.parseColorNotation(bad); },
    /parseColorNotation/, "無彩色明度超範圍拋錯: " + JSON.stringify(bad));
});

// ---- 無彩色灰階插值 ----
assert.strictEqual(haishoku.getNeutralColor(9.5), "#f5f5f5", "N9.5 = 白");
assert.strictEqual(haishoku.getNeutralColor(1.5), "#262626", "N1.5 = 黑");
assert.strictEqual(haishoku.getNeutralColor(5.5), "#8c8c8c", "N5.5 命中既有灰階");
// 插值：N2 介於 2.5 (#404040) 與 1.5 (#262626) 中點
assert.strictEqual(haishoku.getNeutralColor(2), "#333333", "N2 = 2.5/1.5 中點");
// 插值：N7 介於 7.5 (#bfbfbf) 與 6.5 (#a6a6a6) 中點
assert.strictEqual(haishoku.getNeutralColor(7), "#b3b3b3", "N7 = 7.5/6.5 中點");
// clamp
assert.strictEqual(haishoku.getNeutralColor(0), "#262626", "N0 clamp 到 1.5");
assert.strictEqual(haishoku.getNeutralColor(10), "#f5f5f5", "N10 clamp 到 9.5");
// 明度越高顏色越亮（灰階 r=g=b，取 r 比較）
(function () {
  var prev = -1;
  [1.5, 2, 3, 4.5, 6, 7, 8.5, 9.5].forEach(function (v) {
    var r = pccs.hexToRgb(haishoku.getNeutralColor(v)).r;
    assert.ok(r > prev, "灰階明度單調遞增 N" + v);
    prev = r;
  });
})();

// ---- 顏色計算 ----
assert.strictEqual(haishoku.getSchemeColor("v8"), pccs.getColor("v", 8), "v8 與 getColor 一致");
assert.strictEqual(haishoku.getSchemeColor("ltg20"), pccs.getColor("ltg", 20), "ltg20 與 getColor 一致");
assert.strictEqual(haishoku.getSchemeColor("N9.5"), haishoku.getNeutralColor(9.5), "N9.5 與 getNeutralColor 一致");
assert.strictEqual(haishoku.getSchemeColor("W"), "#f5f5f5", "W = 白");

console.log("Task 1 tests passed");
