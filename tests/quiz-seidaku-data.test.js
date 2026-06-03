// 清濁度測驗資料層測試 — 以 node tests/quiz-seidaku-data.test.js 執行，無框架
const assert = require("node:assert");
const path = require("path");
const quiz = require(path.join(__dirname, "..", "src", "js", "quiz-seidaku-data.js"));

// ---- 清濁分類 ----
// 清色 = 明清色（b/lt/p）+ 暗清色（dp/dk/dkg）
["b", "lt", "p", "dp", "dk", "dkg"].forEach(function (id) {
  assert.strictEqual(quiz.isClearTone(id), true, id + " 是清色");
});
// 濁色 = 中間色（s/sf/d/ltg/g）
["s", "sf", "d", "ltg", "g"].forEach(function (id) {
  assert.strictEqual(quiz.isClearTone(id), false, id + " 是濁色");
});
// v（純色）不參與清濁測驗 → 拋出錯誤
assert.throws(function () { quiz.isClearTone("v"); }, /純色/, "v 拋出錯誤");
// 未知色調 → 拋出錯誤
assert.throws(function () { quiz.isClearTone("xx"); }, /unknown/, "未知色調拋出錯誤");

// 清濁標籤（公布答案時顯示用）
assert.strictEqual(quiz.seidakuLabel("b"), "清色（明清色）", "b 標籤");
assert.strictEqual(quiz.seidakuLabel("p"), "清色（明清色）", "p 標籤");
assert.strictEqual(quiz.seidakuLabel("dk"), "清色（暗清色）", "dk 標籤");
assert.strictEqual(quiz.seidakuLabel("dkg"), "清色（暗清色）", "dkg 標籤");
assert.strictEqual(quiz.seidakuLabel("g"), "濁色（中間色）", "g 標籤");
assert.throws(function () { quiz.seidakuLabel("v"); }, /純色/, "v 標籤拋出錯誤");

// 測驗使用的色調：11 個、不含 v
assert.strictEqual(quiz.SEIDAKU_TONES.length, 11, "11 個測驗色調");
assert.ok(quiz.SEIDAKU_TONES.indexOf("v") === -1, "不含 v");

console.log("Task 1 tests passed");
