// 進階配色頁 — DOM 渲染，內容來自 harmony-data.js
(function () {
  "use strict";

  if (typeof HARMONY_SECTIONS === "undefined" || typeof HARMONY_MATRIX === "undefined" ||
      typeof HARMONY_OVERVIEW === "undefined" || typeof getSchemeColor === "undefined") {
    document.body.insertAdjacentHTML("afterbegin",
      '<p style="color:#c00;padding:1rem;">資料載入失敗：請確認 pccs-data.js 與 harmony-data.js 已載入。</p>');
    return;
  }

  // ---- 色卡 ----
  function renderSwatch(notation, grow) {
    var s = document.createElement("div");
    s.className = "scheme-swatch";
    s.style.backgroundColor = getSchemeColor(notation);
    s.style.flexGrow = grow;
    return s;
  }
  function renderNote(text, grow) {
    var l = document.createElement("div");
    l.className = "scheme-note";
    l.style.flexGrow = grow;
    l.textContent = text;
    return l;
  }
  function renderExample(example, geometry) {
    var wrap = document.createElement("div");
    wrap.className = "scheme-example";
    var row = document.createElement("div");
    row.className = "scheme-swatch-row";
    var noteRow = document.createElement("div");
    noteRow.className = "scheme-note-row";
    example.colors.forEach(function (n) {
      row.appendChild(renderSwatch(n, 1));
      noteRow.appendChild(renderNote(n, 1));
    });
    if (geometry && typeof renderHueWheelMini === "function") {
      wrap.appendChild(renderHueWheelMini(example.colors)); // Task 5
    }
    wrap.appendChild(row);
    wrap.appendChild(noteRow);
    var cap = document.createElement("div");
    cap.className = "scheme-caption";
    cap.textContent = example.label;
    wrap.appendChild(cap);
    return wrap;
  }

  // ---- 分類表 ----
  function matrixItem(it) {
    var a = document.createElement("a");
    a.className = "matrix-item";
    a.href = "#scheme-" + it.id;
    a.textContent = it.name;
    return a;
  }
  function renderMatrix(m) {
    var grid = document.createElement("div");
    grid.className = "matrix-grid";
    // 表頭列
    grid.appendChild(cellEl("matrix-corner", ""));
    m.cols.forEach(function (c) { grid.appendChild(cellEl("matrix-colhead", c)); });
    // 資料列
    m.rows.forEach(function (r) {
      grid.appendChild(cellEl("matrix-rowhead", r));
      m.cols.forEach(function (c) {
        var cell = cellEl("matrix-cell", "");
        (m.cells[r + "|" + (c === "類似配色" ? "類似" : "對比")] || []).forEach(function (it) {
          cell.appendChild(matrixItem(it));
        });
        grid.appendChild(cell);
      });
    });
    var container = document.getElementById("harmony-matrix");
    container.appendChild(grid);
    // 跨界特例（顯示於表格下方，標明跨界語意）
    var straddleWrap = document.createElement("div");
    straddleWrap.className = "matrix-straddle";
    m.straddle.forEach(function (it) {
      var box = document.createElement("div");
      box.className = "straddle-box straddle-" + it.span;
      var note = (it.span === "camaieu") ? "（跨 色相↔色調，類似側）" : "（跨 類似↔對比）";
      box.appendChild(matrixItem(it));
      var n = document.createElement("span");
      n.className = "straddle-note";
      n.textContent = note;
      box.appendChild(n);
      straddleWrap.appendChild(box);
    });
    container.appendChild(straddleWrap);
  }
  function cellEl(cls, text) {
    var d = document.createElement("div");
    d.className = cls;
    if (text) d.textContent = text;
    return d;
  }

  // ---- 區段 ----
  function renderSection(sec) {
    var section = document.createElement("section");
    section.className = "harmony-group";
    section.id = sec.id;
    var h2 = document.createElement("h2");
    h2.className = "group-title";
    h2.textContent = sec.title;
    section.appendChild(h2);
    var desc = document.createElement("p");
    desc.className = "group-desc";
    desc.textContent = sec.description;
    section.appendChild(desc);

    sec.schemes.forEach(function (sc) {
      var el = document.createElement("div");
      el.className = "scheme";
      el.id = "scheme-" + sc.id;
      var h4 = document.createElement("h4");
      h4.className = "scheme-title";
      h4.textContent = sc.title + (sc.titleEn ? "（" + sc.titleEn + "）" : "");
      el.appendChild(h4);
      var d = document.createElement("p");
      d.className = "scheme-desc";
      d.textContent = sc.description;
      el.appendChild(d);
      var exs = document.createElement("div");
      exs.className = "scheme-examples";
      sc.examples.forEach(function (ex) {
        exs.appendChild(renderExample(ex, sec.geometry));
      });
      el.appendChild(exs);
      section.appendChild(el);
    });
    return section;
  }

  // ---- 初始化 ----
  document.getElementById("harmony-overview").textContent = HARMONY_OVERVIEW;
  renderMatrix(HARMONY_MATRIX);
  var container = document.getElementById("harmony-sections");
  HARMONY_SECTIONS.forEach(function (sec) { container.appendChild(renderSection(sec)); });
})();
