// 清濁度測驗頁面 — DOM 渲染與互動，邏輯來自 quiz-seidaku-data.js
(function () {
  "use strict";

  // 防禦：資料載入檢查
  if (typeof generateQuestion === "undefined" || typeof getColor === "undefined" ||
      typeof findTone === "undefined" || typeof isClearTone === "undefined" ||
      typeof seidakuLabel === "undefined") {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="color:#c00;padding:1rem;">資料載入失敗：請確認 pccs-data.js 與 quiz-seidaku-data.js 已正確載入。</p>'
    );
    return;
  }

  var state = {
    question: null,      // 目前題目（generateQuestion 回傳值）
    selectedIndex: null, // 使用者選擇的選項索引
    answered: false,     // 是否已公布答案
    streak: 0            // 連續答對數
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
