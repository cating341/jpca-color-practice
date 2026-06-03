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
assert.throws(function () { quiz.seidakuLabel("xx"); }, /unknown/, "未知色調標籤拋出錯誤");

// 測驗使用的色調：11 個、不含 v
assert.strictEqual(quiz.SEIDAKU_TONES.length, 11, "11 個測驗色調");
assert.ok(quiz.SEIDAKU_TONES.indexOf("v") === -1, "不含 v");

console.log("Task 1 tests passed");

// ---- 題庫枚舉 ----
// 1 清 + 3 濁：C(6,1)×C(5,3) = 60；1 濁 + 3 清：C(5,1)×C(6,3) = 100；共 160
assert.strictEqual(quiz.SEIDAKU_COMBOS.length, 160, "題庫共 160 組");

quiz.SEIDAKU_COMBOS.forEach(function (combo, idx) {
  // 每組剛好 4 個互異色調、不含 v
  assert.strictEqual(combo.tones.length, 4, "組合 " + idx + " 有 4 個色調");
  assert.strictEqual(new Set(combo.tones).size, 4, "組合 " + idx + " 色調互異");
  assert.ok(combo.tones.indexOf("v") === -1, "組合 " + idx + " 不含 v");

  // oddTone 在組合中，且清濁屬性與其他三個相反
  assert.ok(combo.tones.indexOf(combo.oddTone) !== -1, "組合 " + idx + " oddTone 在組合中");
  var oddIsClear = quiz.isClearTone(combo.oddTone);
  combo.tones.forEach(function (t) {
    if (t === combo.oddTone) return;
    assert.strictEqual(quiz.isClearTone(t), !oddIsClear, "組合 " + idx + " 其他色調清濁與 oddTone 相反");
  });

  // 權重為正數
  assert.ok(combo.weight > 0, "組合 " + idx + " 權重 > 0");
});

// 緊湊度加權：相鄰緊湊的組合權重高於分散的組合
// lt/sf/d/g（中央相連，1 清 3 濁）vs p/s/d/g（左上到右中分散，1 清 3 濁）
function findCombo(tones) {
  var key = tones.slice().sort().join(",");
  for (var i = 0; i < quiz.SEIDAKU_COMBOS.length; i++) {
    if (quiz.SEIDAKU_COMBOS[i].tones.slice().sort().join(",") === key) return quiz.SEIDAKU_COMBOS[i];
  }
  return null;
}
var compactCombo = findCombo(["lt", "sf", "d", "g"]);
var spreadCombo = findCombo(["p", "s", "d", "g"]);
assert.ok(compactCombo, "緊湊組合 lt/sf/d/g 在題庫中");
assert.ok(spreadCombo, "分散組合 p/s/d/g 在題庫中");
assert.ok(compactCombo.weight > spreadCombo.weight, "緊湊組合權重 > 分散組合權重");

console.log("Task 2 tests passed");
