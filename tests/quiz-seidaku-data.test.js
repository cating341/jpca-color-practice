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

// 測驗使用的色調：10 個、不含 v（純色）與 s（加灰量低，視覺接近清色）
assert.strictEqual(quiz.SEIDAKU_TONES.length, 10, "10 個測驗色調");
assert.ok(quiz.SEIDAKU_TONES.indexOf("v") === -1, "不含 v");
assert.ok(quiz.SEIDAKU_TONES.indexOf("s") === -1, "不含 s");

console.log("Task 1 tests passed");

// ---- 題庫枚舉 ----
// 1 清 + 3 濁：C(6,1)×C(4,3) = 24；1 濁 + 3 清：C(4,1)×C(6,3) = 80；共 104
assert.strictEqual(quiz.SEIDAKU_COMBOS.length, 104, "題庫共 104 組");

quiz.SEIDAKU_COMBOS.forEach(function (combo, idx) {
  // 每組剛好 4 個互異色調、不含 v 與 s
  assert.strictEqual(combo.tones.length, 4, "組合 " + idx + " 有 4 個色調");
  assert.strictEqual(new Set(combo.tones).size, 4, "組合 " + idx + " 色調互異");
  assert.ok(combo.tones.indexOf("v") === -1, "組合 " + idx + " 不含 v");
  assert.ok(combo.tones.indexOf("s") === -1, "組合 " + idx + " 不含 s");

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
// lt/sf/d/g（中央相連，1 清 3 濁）vs b/ltg/d/g（右上到左下分散，1 清 3 濁）
function findCombo(tones) {
  var key = tones.slice().sort().join(",");
  for (var i = 0; i < quiz.SEIDAKU_COMBOS.length; i++) {
    if (quiz.SEIDAKU_COMBOS[i].tones.slice().sort().join(",") === key) return quiz.SEIDAKU_COMBOS[i];
  }
  return null;
}
var compactCombo = findCombo(["lt", "sf", "d", "g"]);
var spreadCombo = findCombo(["b", "ltg", "d", "g"]);
assert.ok(compactCombo, "緊湊組合 lt/sf/d/g 在題庫中");
assert.ok(spreadCombo, "分散組合 b/ltg/d/g 在題庫中");
assert.ok(compactCombo.weight > spreadCombo.weight, "緊湊組合權重 > 分散組合權重");

console.log("Task 2 tests passed");

// ---- 出題 ----

// 驗證一題的合法性（共用檢查函式）
function assertValidQuestion(q, label) {
  assert.ok(q.hueNum >= 1 && q.hueNum <= 24, label + "：色相 1–24");
  assert.strictEqual(Math.floor(q.hueNum), q.hueNum, label + "：色相為整數");
  assert.strictEqual(q.choices.length, 4, label + "：4 個選項");
  assert.strictEqual(new Set(q.choices).size, 4, label + "：選項互異");
  assert.ok(q.choices.indexOf("v") === -1, label + "：不含 v");
  assert.ok(q.choices.indexOf("s") === -1, label + "：不含 s");
  assert.ok(q.answerIndex >= 0 && q.answerIndex <= 3, label + "：answerIndex 0–3");
  // answerIndex 指向清濁屬性與其他三個不同的那一個
  var answerIsClear = quiz.isClearTone(q.choices[q.answerIndex]);
  q.choices.forEach(function (t, i) {
    if (i === q.answerIndex) return;
    assert.strictEqual(quiz.isClearTone(t), !answerIsClear, label + "：其他選項清濁與答案相反");
  });
}

// 固定 rng → 結果合法且可重現（同樣的 rng 序列產生同樣的題目）
var qa = quiz.generateQuestion(function () { return 0; });
var qb = quiz.generateQuestion(function () { return 0; });
assertValidQuestion(qa, "固定 rng=0");
assert.deepStrictEqual(qa, qb, "同樣 rng 產生同樣題目");

var qc = quiz.generateQuestion(function () { return 0.999999; });
assertValidQuestion(qc, "固定 rng≈1");

// 預設 rng（Math.random）：大量出題每題都合法
for (var qi = 0; qi < 500; qi++) {
  assertValidQuestion(quiz.generateQuestion(), "隨機第 " + qi + " 題");
}

// 加權抽樣統計：高權重（緊湊）組合整體出現頻率 > 低權重（分散）組合
// 將題庫依權重排序，比較前 1/3 與後 1/3 的總出現次數（統計上極穩定）
(function () {
  var sorted = quiz.SEIDAKU_COMBOS.slice().sort(function (a, b) { return b.weight - a.weight; });
  var third = Math.floor(sorted.length / 3);
  var topKeys = new Set(sorted.slice(0, third).map(function (c) { return c.tones.slice().sort().join(","); }));
  var bottomKeys = new Set(sorted.slice(-third).map(function (c) { return c.tones.slice().sort().join(","); }));

  var topCount = 0, bottomCount = 0;
  for (var i = 0; i < 6000; i++) {
    var q = quiz.generateQuestion();
    var key = q.choices.slice().sort().join(",");
    if (topKeys.has(key)) topCount++;
    if (bottomKeys.has(key)) bottomCount++;
  }
  assert.ok(topCount > bottomCount,
    "緊湊組合出現次數（" + topCount + "）應多於分散組合（" + bottomCount + "）");
})();

console.log("Task 3 tests passed");
