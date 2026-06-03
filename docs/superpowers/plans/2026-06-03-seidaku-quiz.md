# 清濁度測驗單元 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增清濁度測驗頁面：每題顯示四個同色相、不同色調的色塊（其中一個清濁屬性與其他不同），使用者選出後公布答案，可連續作答並計算連續答對數。

**Architecture:** 沿用 PCCS 頁面 pattern — 純邏輯資料層（`quiz-seidaku-data.js`，Node 可測）與 DOM 渲染層（`quiz-seidaku.js`）分離。資料層在載入時枚舉 160 組「3:1 清濁」色調組合並以緊湊度加權；渲染層只負責畫面與事件。

**Tech Stack:** Vanilla HTML/CSS/JS（無框架、無建置步驟）、Node 內建 `assert`（測試）。

**Spec:** `docs/superpowers/specs/2026-06-03-seidaku-quiz-design.md`

**領域規則（核心）：**
- 清色（6 個）= 明清色 b/lt/p（純色＋白）＋ 暗清色 dp/dk/dkg（純色＋黑）
- 濁色（5 個）= s/sf/d/ltg/g（純色＋灰）
- v（純色）排除，不出現在題目中

---

## 檔案結構

| 檔案 | 動作 | 職責 |
|------|------|------|
| `src/js/quiz-seidaku-data.js` | Create | 純邏輯：清濁分類、題庫、出題（依賴 `pccs-data.js`） |
| `tests/quiz-seidaku-data.test.js` | Create | 資料層測試（node assert，無框架） |
| `src/quiz-seidaku.html` | Create | 測驗頁面骨架 |
| `src/css/quiz-seidaku.css` | Create | 測驗頁面樣式 |
| `src/js/quiz-seidaku.js` | Create | DOM 渲染與互動 |
| `src/index.html` | Modify | topic-nav 加入測驗入口卡片 |

執行所有測試的指令：`node tests/pccs-data.test.js; node tests/quiz-seidaku-data.test.js`

---

### Task 1: 資料層 — 清濁分類

**Files:**
- Create: `tests/quiz-seidaku-data.test.js`
- Create: `src/js/quiz-seidaku-data.js`

- [ ] **Step 1: Write the failing test**

建立 `tests/quiz-seidaku-data.test.js`，內容：

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: FAIL — `Cannot find module '.../src/js/quiz-seidaku-data.js'`

- [ ] **Step 3: Write minimal implementation**

建立 `src/js/quiz-seidaku-data.js`，內容：

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: `Task 1 tests passed`

另外確認既有測試未被破壞 — Run: `node tests/pccs-data.test.js`
Expected: `Task 2 tests passed` 與 `Task 3 tests passed`

- [ ] **Step 5: Commit**

```bash
git add tests/quiz-seidaku-data.test.js src/js/quiz-seidaku-data.js
git commit -m "feat: add seidaku quiz data layer with clear/muddy classification"
```

---

### Task 2: 資料層 — 題庫枚舉與緊湊度加權

**Files:**
- Modify: `tests/quiz-seidaku-data.test.js`（檔尾附加）
- Modify: `src/js/quiz-seidaku-data.js`

- [ ] **Step 1: Write the failing test**

在 `tests/quiz-seidaku-data.test.js` 檔尾（`console.log("Task 1 tests passed");` 之後）附加：

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: 先印出 `Task 1 tests passed`，然後 FAIL — `quiz.SEIDAKU_COMBOS is undefined`（讀取 `.length` 時 TypeError）

- [ ] **Step 3: Write minimal implementation**

在 `src/js/quiz-seidaku-data.js` 的 `// ---- Node 匯出` 區塊**之前**插入：

```js
// ---- 題庫枚舉 ----

// 色調表格座標（欄 = 彩度低→高，列 = 明度高→低）— 緊湊度計算用
// 對應 PCCS 色調圖位置；b/s/dp 欄實際有半格偏移，鬆散相鄰不需精確，忽略
var SEIDAKU_TONE_GRID = {
  p:   { col: 0, row: 0 }, lt: { col: 1, row: 0 }, b:  { col: 2, row: 0 },
  ltg: { col: 0, row: 1 }, sf: { col: 1, row: 1 }, s:  { col: 2, row: 1 },
  g:   { col: 0, row: 2 }, d:  { col: 1, row: 2 }, dp: { col: 2, row: 2 },
  dkg: { col: 0, row: 3 }, dk: { col: 1, row: 3 }
};

// 題庫：所有「3 個同清濁 + 1 個不同」的 4 色調組合，附緊湊度權重
var SEIDAKU_COMBOS = (function () {
  var clearTones = SEIDAKU_TONES.filter(isClearTone);
  var muddyTones = SEIDAKU_TONES.filter(function (t) { return !isClearTone(t); });

  // 從 arr 中取 k 個的所有組合
  function choose(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    var withFirst = choose(arr.slice(1), k - 1).map(function (c) { return [arr[0]].concat(c); });
    return withFirst.concat(choose(arr.slice(1), k));
  }

  // 分散度 = 四色調在表格座標上的兩兩歐氏距離總和
  function spread(tones) {
    var sum = 0;
    for (var i = 0; i < tones.length; i++) {
      for (var j = i + 1; j < tones.length; j++) {
        var a = SEIDAKU_TONE_GRID[tones[i]], b = SEIDAKU_TONE_GRID[tones[j]];
        sum += Math.sqrt(Math.pow(a.col - b.col, 2) + Math.pow(a.row - b.row, 2));
      }
    }
    return sum;
  }

  // oddGroup 每個色調 × mainGroup 取 3 個的每種組合
  var combos = [];
  function addCombos(oddGroup, mainGroup) {
    oddGroup.forEach(function (odd) {
      choose(mainGroup, 3).forEach(function (three) {
        var tones = [odd].concat(three);
        // 權重與分散度平方成反比 → 緊湊組合最常被抽中
        combos.push({ tones: tones, oddTone: odd, weight: 1 / Math.pow(spread(tones), 2) });
      });
    });
  }

  addCombos(clearTones, muddyTones); // 1 清 + 3 濁
  addCombos(muddyTones, clearTones); // 1 濁 + 3 清
  return combos;
})();
```

並在檔尾的 `module.exports` 物件中加入一行（`SEIDAKU_TONES: SEIDAKU_TONES,` 之後）：

```js
    SEIDAKU_COMBOS: SEIDAKU_COMBOS,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: `Task 1 tests passed` 與 `Task 2 tests passed`

- [ ] **Step 5: Commit**

```bash
git add tests/quiz-seidaku-data.test.js src/js/quiz-seidaku-data.js
git commit -m "feat: enumerate 160 seidaku quiz combos with compactness weighting"
```

---

### Task 3: 資料層 — 出題函式

**Files:**
- Modify: `tests/quiz-seidaku-data.test.js`（檔尾附加）
- Modify: `src/js/quiz-seidaku-data.js`

- [ ] **Step 1: Write the failing test**

在 `tests/quiz-seidaku-data.test.js` 檔尾（`console.log("Task 2 tests passed");` 之後）附加：

```js
// ---- 出題 ----

// 驗證一題的合法性（共用檢查函式）
function assertValidQuestion(q, label) {
  assert.ok(q.hueNum >= 1 && q.hueNum <= 24, label + "：色相 1–24");
  assert.strictEqual(Math.floor(q.hueNum), q.hueNum, label + "：色相為整數");
  assert.strictEqual(q.choices.length, 4, label + "：4 個選項");
  assert.strictEqual(new Set(q.choices).size, 4, label + "：選項互異");
  assert.ok(q.choices.indexOf("v") === -1, label + "：不含 v");
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
// 將 160 組依權重排序，比較前 1/3 與後 1/3 的總出現次數（統計上極穩定）
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: 先印出 Task 1、Task 2 passed，然後 FAIL — `quiz.generateQuestion is not a function`

- [ ] **Step 3: Write minimal implementation**

在 `src/js/quiz-seidaku-data.js` 的 `// ---- Node 匯出` 區塊**之前**插入：

```js
// ---- 出題 ----

// 產生一題：加權抽組合 × 隨機色相（1–24）× 隨機排列
// rng：回傳 [0,1) 的隨機函式（預設 Math.random；測試可注入固定函式以重現結果）
// 回傳：{ hueNum, choices: [toneId×4], answerIndex }
function generateQuestion(rng) {
  rng = rng || Math.random;

  // 加權抽樣：權重越高的組合越常被抽中
  var totalWeight = 0;
  SEIDAKU_COMBOS.forEach(function (c) { totalWeight += c.weight; });
  var r = rng() * totalWeight;
  var combo = SEIDAKU_COMBOS[SEIDAKU_COMBOS.length - 1]; // 浮點誤差時的保底
  for (var i = 0; i < SEIDAKU_COMBOS.length; i++) {
    r -= SEIDAKU_COMBOS[i].weight;
    if (r <= 0) { combo = SEIDAKU_COMBOS[i]; break; }
  }

  // 隨機色相 1–24
  var hueNum = Math.min(Math.floor(rng() * 24) + 1, 24);

  // Fisher–Yates 隨機排列
  var choices = combo.tones.slice();
  for (var j = choices.length - 1; j > 0; j--) {
    var k = Math.floor(rng() * (j + 1));
    var tmp = choices[j]; choices[j] = choices[k]; choices[k] = tmp;
  }

  return {
    hueNum: hueNum,
    choices: choices,
    answerIndex: choices.indexOf(combo.oddTone)
  };
}
```

並在檔尾的 `module.exports` 物件中加入一行（`SEIDAKU_COMBOS: SEIDAKU_COMBOS,` 之後）：

```js
    generateQuestion: generateQuestion,
```

注意：`module.exports` 物件最後一個屬性不可有尾逗號嗎？— ES5 物件字面值允許尾逗號（IE8 以前才有問題），但為與既有 `pccs-data.js` 風格一致，最後一個屬性後不加逗號。最終 exports 物件為：

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isClearTone: isClearTone,
    seidakuLabel: seidakuLabel,
    SEIDAKU_TONES: SEIDAKU_TONES,
    SEIDAKU_COMBOS: SEIDAKU_COMBOS,
    generateQuestion: generateQuestion
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/quiz-seidaku-data.test.js`
Expected: `Task 1 tests passed`、`Task 2 tests passed`、`Task 3 tests passed`

既有測試回歸 — Run: `node tests/pccs-data.test.js`
Expected: `Task 2 tests passed` 與 `Task 3 tests passed`

- [ ] **Step 5: Commit**

```bash
git add tests/quiz-seidaku-data.test.js src/js/quiz-seidaku-data.js
git commit -m "feat: add weighted question generator for seidaku quiz"
```

---

### Task 4: 測驗頁面（HTML + CSS + JS）

**Files:**
- Create: `src/quiz-seidaku.html`
- Create: `src/css/quiz-seidaku.css`
- Create: `src/js/quiz-seidaku.js`

DOM 層無自動測試（沿用本專案 pattern：資料層 Node 測試、DOM 層瀏覽器驗證）。

- [ ] **Step 1: 建立頁面 HTML**

建立 `src/quiz-seidaku.html`，內容：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>清濁度測驗 | JPCA Practice</title>
  <link rel="stylesheet" href="./css/style.css" />
  <link rel="stylesheet" href="./css/quiz-seidaku.css" />
</head>
<body>
  <header class="quiz-header">
    <h1>清濁度測驗</h1>
    <a href="./index.html" class="back-link">← 回到首頁</a>
  </header>

  <main class="quiz-main">
    <section class="quiz-section">
      <p class="quiz-question">下面四個顏色中，哪一個的<b>清濁屬性</b>和其他三個不同？</p>
      <p class="quiz-streak">連續答對：<b id="streak-count">0</b></p>

      <div id="choices" class="quiz-choices"></div>

      <p id="quiz-explanation" class="quiz-explanation hidden"></p>

      <button id="quiz-submit" class="quiz-button" disabled>送出答案</button>
    </section>
  </main>

  <script src="./js/pccs-data.js"></script>
  <script src="./js/quiz-seidaku-data.js"></script>
  <script src="./js/quiz-seidaku.js"></script>
</body>
</html>
```

- [ ] **Step 2: 建立頁面樣式**

建立 `src/css/quiz-seidaku.css`，內容：

```css
/* 清濁度測驗頁面樣式 */

/* ---- 版面（沿用 PCCS 頁面 header pattern） ---- */
.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  max-width: 768px;
  margin: 0 auto;
  padding: 1.5rem;
}

.back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; }
.back-link:hover { text-decoration: underline; }

.quiz-main { max-width: 768px; margin: 0 auto; padding: 0 1.5rem 3rem; }

.quiz-question { font-size: 1.05rem; }
.quiz-streak { color: #555; font-size: 0.9rem; }
.quiz-streak b { color: var(--accent); font-size: 1.1rem; }

/* ---- 選項色塊 ---- */
.quiz-choices {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.choice { cursor: pointer; text-align: center; }

.choice-swatch {
  width: 100%;
  aspect-ratio: 1 / 1;
  min-height: 120px;
  border-radius: 8px;
  border: 4px solid transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s, border-color 0.15s;
}
.choice:hover .choice-swatch { transform: scale(1.03); }
.choice.selected .choice-swatch { border-color: var(--accent); }
.choice.answered { cursor: default; }
.choice.answered:hover .choice-swatch { transform: none; }

/* ---- 公布答案後的標籤 ---- */
.choice-label { font-size: 0.8rem; margin-top: 0.5rem; min-height: 3.2em; line-height: 1.5; }
.choice-label .seidaku-tag {
  display: block;
  font-size: 0.75rem;
  color: #555;
}
.choice-label .mark { font-weight: bold; margin-right: 0.2em; }
.choice-label .mark.correct { color: #16a34a; }
.choice-label .mark.wrong { color: #dc2626; }

/* ---- 解說與按鈕 ---- */
.quiz-explanation {
  background: #f5f7ff;
  border-left: 4px solid var(--accent);
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}

.quiz-button {
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.6rem 2.5rem;
  font-size: 1rem;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.quiz-button:hover:not(:disabled) { filter: brightness(1.1); }
.quiz-button:disabled { background: #c5c5c5; cursor: not-allowed; }

.hidden { display: none; }

/* ---- 窄螢幕：色塊 2×2 ---- */
@media (max-width: 600px) {
  .quiz-choices { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: 建立渲染與互動 JS**

建立 `src/js/quiz-seidaku.js`，內容：

```js
// 清濁度測驗頁面 — DOM 渲染與互動，邏輯來自 quiz-seidaku-data.js
(function () {
  "use strict";

  // 防禦：資料載入檢查
  if (typeof generateQuestion === "undefined" || typeof getColor === "undefined") {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="color:#c00;padding:1rem;">資料載入失敗：請確認 pccs-data.js 與 quiz-seidaku-data.js 已正確載入。</p>'
    );
    return;
  }

  var state = {
    question: null,     // 目前題目（generateQuestion 回傳值）
    selectedIndex: null, // 使用者選擇的選項索引
    answered: false,    // 是否已公布答案
    streak: 0           // 連續答對數
  };

  var choicesEl = document.getElementById("choices");
  var submitBtn = document.getElementById("quiz-submit");
  var streakEl = document.getElementById("streak-count");
  var explanationEl = document.getElementById("quiz-explanation");

  // ---- 出新題 ----

  function newQuestion() {
    state.question = generateQuestion();
    state.selectedIndex = null;
    state.answered = false;

    explanationEl.classList.add("hidden");
    explanationEl.innerHTML = "";
    submitBtn.textContent = "送出答案";
    submitBtn.disabled = true;

    choicesEl.innerHTML = "";
    state.question.choices.forEach(function (toneId, i) {
      var item = document.createElement("div");
      item.className = "choice";
      item.id = "choice-" + i;

      var swatch = document.createElement("div");
      swatch.className = "choice-swatch";
      swatch.style.backgroundColor = getColor(toneId, state.question.hueNum);
      item.appendChild(swatch);

      var label = document.createElement("div");
      label.className = "choice-label";
      item.appendChild(label);

      item.addEventListener("click", function () { selectChoice(i); });
      choicesEl.appendChild(item);
    });
  }

  // ---- 選擇色塊 ----

  function selectChoice(index) {
    if (state.answered) return;
    state.selectedIndex = index;
    state.question.choices.forEach(function (_, i) {
      document.getElementById("choice-" + i).classList.toggle("selected", i === index);
    });
    submitBtn.disabled = false;
  }

  // ---- 送出答案 → 公布 ----

  function revealAnswer() {
    state.answered = true;
    var q = state.question;
    var correct = state.selectedIndex === q.answerIndex;
    state.streak = correct ? state.streak + 1 : 0;
    streakEl.textContent = state.streak;

    // 每個色塊下方顯示色調名稱、清濁分類、✓／✗
    q.choices.forEach(function (toneId, i) {
      var tone = findTone(toneId);
      var item = document.getElementById("choice-" + i);
      item.classList.add("answered");
      var mark = "";
      if (i === q.answerIndex) mark = '<span class="mark correct">✓</span>';
      else if (i === state.selectedIndex) mark = '<span class="mark wrong">✗</span>';
      item.querySelector(".choice-label").innerHTML =
        mark + "<b>" + tone.id + "</b>　" + tone.jpName + "　" + tone.zhName +
        '<span class="seidaku-tag">' + seidakuLabel(toneId) + "</span>";
    });

    // 總結解說
    var oddTone = findTone(q.choices[q.answerIndex]);
    var oddIsClear = isClearTone(oddTone.id);
    explanationEl.innerHTML =
      "<b>" + (correct ? "答對了！" : "答錯了。") + "</b>" +
      "<b>" + oddTone.id + "（" + oddTone.zhName + "）是" + (oddIsClear ? "清色" : "濁色") + "</b>" +
      (oddIsClear ? "（純色＋白或＋黑）" : "（純色＋灰）") +
      "，其他三個都是" + (oddIsClear ? "濁色（純色＋灰）" : "清色（純色＋白或＋黑）") + "。";
    explanationEl.classList.remove("hidden");

    submitBtn.textContent = "下一題";
    submitBtn.disabled = false;
  }

  // ---- 初始化 ----

  submitBtn.addEventListener("click", function () {
    if (state.answered) newQuestion();
    else revealAnswer();
  });

  newQuestion();
})();
```

- [ ] **Step 4: 瀏覽器驗證**

確認 port 8080 伺服器執行中（若無：`npm start` 於背景執行）。

驗證方式（二擇一）：
- **Playwright**（若 `%TEMP%\pccs-verify` 環境仍在）：寫驗證腳本載入 `http://localhost:8080/quiz-seidaku.html`，檢查：
  1. `.choice` 元素共 4 個，每個 `.choice-swatch` 有背景色且互異
  2. `#quiz-submit` 初始為 disabled
  3. 點擊第一個色塊 → `.selected` class 出現、按鈕 enabled
  4. 點擊送出 → `.choice-label` 出現色調名稱與清濁標籤、解說顯示、按鈕文字變「下一題」
  5. 點擊下一題 → 色塊重置、標籤清空、按鈕回到 disabled「送出答案」
  6. 截圖作答前、公布後兩個畫面
- **人工**：瀏覽器開啟 `http://localhost:8080/quiz-seidaku.html` 依上述清單操作確認

Expected: 全部通過

- [ ] **Step 5: Commit**

```bash
git add src/quiz-seidaku.html src/css/quiz-seidaku.css src/js/quiz-seidaku.js
git commit -m "feat: add seidaku quiz page with swatch selection and answer reveal"
```

---

### Task 5: 首頁入口卡片

**Files:**
- Modify: `src/index.html:15-20`（topic-nav 區塊）

- [ ] **Step 1: 加入測驗入口卡片**

修改 `src/index.html` 的 `<nav class="topic-nav">` 區塊，在 PCCS 卡片之後加入測驗卡片：

```html
    <nav class="topic-nav">
      <a href="./pccs.html" class="topic-card">
        <h2>PCCS 色彩體系</h2>
        <p>色相環・トーン別色相環・色調印象（中日對照）</p>
      </a>
      <a href="./quiz-seidaku.html" class="topic-card">
        <h2>清濁度測驗</h2>
        <p>目視分辨清色／濁色 — 四選一測驗・連續答對計數</p>
      </a>
    </nav>
```

注意：`style.css` 的 `.topic-nav` 沒有卡片間距設定（先前只有一張卡片）。在 `src/css/style.css` 的 `.topic-nav { margin-top: 1.5rem; }` 改為：

```css
.topic-nav { margin-top: 1.5rem; display: grid; gap: 1rem; }
```

- [ ] **Step 2: 瀏覽器驗證**

瀏覽器（或 Playwright）開啟 `http://localhost:8080/`：
1. 首頁顯示兩張卡片（PCCS 色彩體系、清濁度測驗），間距正常
2. 點擊「清濁度測驗」卡片 → 進入測驗頁
3. 測驗頁「← 回到首頁」 → 回到首頁

Expected: 全部通過

- [ ] **Step 3: 全部測試回歸**

Run: `node tests/pccs-data.test.js; node tests/quiz-seidaku-data.test.js`
Expected: 兩個測試檔全部 passed

- [ ] **Step 4: Commit**

```bash
git add src/index.html src/css/style.css
git commit -m "feat: add seidaku quiz entry card to home page"
```

---

## Self-Review 紀錄

1. **Spec coverage**：清濁分類（Task 1）、題庫枚舉與鬆散相鄰加權（Task 2）、出題（Task 3）、UI 與互動流程／答案公布／響應式／錯誤處理（Task 4）、首頁入口（Task 5）、資料層自動測試（Task 1–3）、頁面手動驗證（Task 4–5）— spec 各節皆有對應 task。YAGNI 排除項未實作。✓
2. **Placeholder scan**：所有程式碼步驟皆含完整程式碼，無 TBD。✓
3. **Type consistency**：`isClearTone`／`seidakuLabel`／`SEIDAKU_TONES`／`SEIDAKU_COMBOS`／`generateQuestion` 命名在 Task 1–4 一致；`generateQuestion` 回傳 `{ hueNum, choices, answerIndex }` 與 Task 4 的使用一致；`combo.tones`／`combo.oddTone`／`combo.weight` 在 Task 2–3 一致。✓
