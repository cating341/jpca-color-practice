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

// 測驗使用的 10 個色調
// 排除 v（純色，無清濁屬性）與 s（ストロング：加灰量僅 20%，視覺上接近清色，
// 且為配色カード199a未収録色調，不適合作為清濁判斷題目）
var SEIDAKU_TONES = _pccs.PCCS_TONES
  .filter(function (t) { return t.category !== "純色" && t.id !== "s"; })
  .map(function (t) { return t.id; });

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

// 題庫總權重（載入時計算一次，供加權抽樣使用）
var SEIDAKU_TOTAL_WEIGHT = (function () {
  var total = 0;
  SEIDAKU_COMBOS.forEach(function (c) { total += c.weight; });
  return total;
})();

// ---- 出題 ----

// 產生一題：加權抽組合 × 隨機色相（1–24）× 隨機排列
// rng：回傳 [0,1) 的隨機函式（預設 Math.random；測試可注入固定函式以重現結果）
// 回傳：{ hueNum, choices: [toneId×4], answerIndex }
function generateQuestion(rng) {
  rng = rng || Math.random;

  // 加權抽樣：權重越高的組合越常被抽中
  var r = rng() * SEIDAKU_TOTAL_WEIGHT;
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

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isClearTone: isClearTone,
    seidakuLabel: seidakuLabel,
    SEIDAKU_TONES: SEIDAKU_TONES,
    SEIDAKU_COMBOS: SEIDAKU_COMBOS,
    generateQuestion: generateQuestion
  };
}
