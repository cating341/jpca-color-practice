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
  // 標準配色用：小色相環，標出範例取色點並連出幾何
  function renderHueWheelMini(colors) {
    var SVG_NS = "http://www.w3.org/2000/svg";
    // rDot：取色點軌道半徑（44+5=49 < 60，確保高亮圓不超出邊界）
    var size = 120, cx = 60, cy = 60, rDot = 44;
    function polar(r, hueNum) {            // 8:Y 正上方、順時針
      var deg = (hueNum - 8) * 15;
      var rad = (deg - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "hue-wheel-mini");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);

    // 背景 24 點（淡）
    for (var n = 1; n <= 24; n++) {
      var p = polar(rDot, n);
      var dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
      dot.setAttribute("r", 2.5);
      dot.setAttribute("fill", getColor("v", n));
      dot.setAttribute("opacity", "0.25");
      svg.appendChild(dot);
    }

    // 取出有彩色範例色的色相（依色相排序以連出多邊形）
    var hues = colors
      .map(function (notation) { return parseColorNotation(notation); })
      .filter(function (pc) { return pc.type === "chromatic"; })
      .map(function (pc) { return pc.hueNum; })
      // 依色相數值排序連線；分裂補色三角形本身不對稱（如 2,13,15），非 bug
      .sort(function (a, b) { return a - b; });

    // 連線（2 點＝線；≥3 點＝封閉多邊形）
    if (hues.length >= 2) {
      var pts = hues.map(function (hn) { var q = polar(rDot, hn); return q.x + "," + q.y; });
      var shape = document.createElementNS(SVG_NS, hues.length >= 3 ? "polygon" : "polyline");
      shape.setAttribute("points", pts.join(" "));
      shape.setAttribute("fill", hues.length >= 3 ? "rgba(80,80,80,0.08)" : "none");
      shape.setAttribute("stroke", "#666");
      shape.setAttribute("stroke-width", "1.2");
      svg.appendChild(shape);
    }

    // 標出取色點（實心、較大）
    hues.forEach(function (hn) {
      var q = polar(rDot, hn);
      var c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", q.x); c.setAttribute("cy", q.y);
      c.setAttribute("r", 5);
      c.setAttribute("fill", getColor("v", hn));
      c.setAttribute("stroke", "#333");
      c.setAttribute("stroke-width", "1");
      svg.appendChild(c);
    });
    return svg;
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
    var container = document.createElement("div");
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
    return container;
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
  document.getElementById("harmony-matrix").appendChild(renderMatrix(HARMONY_MATRIX));
  var container = document.getElementById("harmony-sections");
  HARMONY_SECTIONS.forEach(function (sec) { container.appendChild(renderSection(sec)); });
})();
