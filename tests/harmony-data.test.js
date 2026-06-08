// 進階配色資料層測試 — node tests/harmony-data.test.js，無框架
const assert = require("node:assert");
const path = require("path");
const pccs = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));
const h = require(path.join(__dirname, "..", "src", "js", "harmony-data.js"));

// ---- 概說 ----
assert.ok(h.HARMONY_OVERVIEW && h.HARMONY_OVERVIEW.length > 0, "有概說");

// ---- 分類表 ----
assert.ok(h.HARMONY_MATRIX, "有分類表");
assert.deepStrictEqual(h.HARMONY_MATRIX.cols, ["類似配色", "對比配色"], "兩欄");
assert.deepStrictEqual(h.HARMONY_MATRIX.rows, ["色相", "色調"], "兩列");
assert.ok(h.HARMONY_MATRIX.cells["色相|類似"].length >= 1, "色相|類似 有項目");
assert.ok(Array.isArray(h.HARMONY_MATRIX.straddle), "有跨界特例");

// ---- 區段／配色法／範例 ----
assert.ok(Array.isArray(h.HARMONY_SECTIONS) && h.HARMONY_SECTIONS.length > 0, "有區段");
var allSchemes = [];
h.HARMONY_SECTIONS.forEach(function (sec) {
  assert.ok(sec.id && sec.title, "區段有 id/title");
  assert.ok(Array.isArray(sec.schemes), sec.id + " 有 schemes");
  sec.schemes.forEach(function (sc) {
    allSchemes.push(sc);
    assert.ok(sc.id && sc.title, "配色法有 id/title");
    assert.ok(sc.rule && sc.rule.type, sc.title + " 有 rule");
    assert.ok(sc.description && sc.description.length > 0, sc.title + " 有說明");
    assert.ok(sc.examples.length >= 2, sc.title + " ≥2 範例");
    sc.examples.forEach(function (ex) {
      assert.ok(ex.colors.length >= 2, sc.title + " 範例 ≥2 色");
      assert.ok(ex.label, sc.title + " 範例有 label");
      ex.colors.forEach(function (n) {
        assert.ok(/^#[0-9a-f]{6}$/.test(pccs.getSchemeColor(n)), n + " 合法顏色");
      });
    });
  });
});

// id 唯一
var ids = allSchemes.map(function (s) { return s.id; });
assert.strictEqual(new Set(ids).size, ids.length, "配色法 id 唯一");

// 分類表所有 id（cells + straddle）都對應到實際 scheme
var matrixIds = [];
Object.keys(h.HARMONY_MATRIX.cells).forEach(function (k) {
  h.HARMONY_MATRIX.cells[k].forEach(function (it) { matrixIds.push(it.id); });
});
h.HARMONY_MATRIX.straddle.forEach(function (it) { matrixIds.push(it.id); });
matrixIds.forEach(function (id) {
  assert.ok(ids.indexOf(id) !== -1, "分類表 id 對應到 scheme: " + id);
});

console.log("Harmony structure tests passed");
