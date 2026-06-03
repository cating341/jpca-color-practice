// 基本配色法頁面 — DOM 渲染，內容來自 haishoku-data.js
(function () {
  "use strict";

  // 防禦：資料載入檢查
  if (typeof HAISHOKU_CATEGORIES === "undefined" || typeof HAISHOKU_OVERVIEW === "undefined" ||
      typeof getSchemeColor === "undefined" || typeof hexToRgb === "undefined") {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="color:#c00;padding:1rem;">資料載入失敗：請確認 pccs-data.js 與 haishoku-data.js 已正確載入。</p>'
    );
    return;
  }

  // ---- 色卡渲染 ----

  // 單一色塊（記號不放在色塊上，改於色塊下方註記）
  function renderSwatch(notation, flexGrow) {
    var hex = getSchemeColor(notation);
    var swatch = document.createElement("div");
    swatch.className = "scheme-swatch";
    swatch.style.backgroundColor = hex;
    swatch.style.flexGrow = flexGrow;
    return swatch;
  }

  // 重點色小方形（疊在基調色塊內，呈現「大面積中的小面積點綴」）
  function renderAccentMark(notation) {
    var hex = getSchemeColor(notation);
    var mark = document.createElement("div");
    mark.className = "accent-mark";
    mark.style.backgroundColor = hex;
    return mark;
  }

  // 色塊下方的註記格（flex 比例與色塊列對齊）
  function makeNoteCell(flexGrow) {
    var label = document.createElement("div");
    label.className = "scheme-note";
    label.style.flexGrow = flexGrow;
    return label;
  }

  // 純記號註記（等寬／分離配色用）
  function renderNoteLabel(text, flexGrow) {
    var label = makeNoteCell(flexGrow);
    label.textContent = text;
    return label;
  }

  // 角色＋記號（重點配色用，標出基調／配合／重點）
  function renderRolePart(role, notation) {
    var part = document.createElement("span");
    part.className = "scheme-note-part";
    var roleEl = document.createElement("span");
    roleEl.className = "scheme-note-role";
    roleEl.textContent = role;
    part.appendChild(roleEl);
    part.appendChild(document.createTextNode(notation));
    return part;
  }

  // 一個範例（色卡列）
  // layout：
  //   equal      → 等寬色塊
  //   accent     → 基調色（大，內疊重點色小方形）＋配合色；資料順序為 [基調, 配合, 重點]
  //   separation → 主色4:分離1:主色4
  function renderExample(example, layout) {
    var wrap = document.createElement("div");
    wrap.className = "scheme-example";

    var row = document.createElement("div");
    row.className = "scheme-swatch-row layout-" + layout;

    var noteRow = document.createElement("div");
    noteRow.className = "scheme-note-row layout-" + layout;

    if (layout === "accent") {
      // [基調, 配合, 重點]：基調最寬、配合次之，重點色作小方形疊在基調色塊內
      var base = renderSwatch(example.colors[0], 5);
      base.classList.add("accent-base");
      base.appendChild(renderAccentMark(example.colors[2]));
      row.appendChild(base);
      row.appendChild(renderSwatch(example.colors[1], 3));
      // 基調欄同時標出疊在其上的重點色（基調 ＋ 重點），配合欄標出配合色；皆標角色說明
      var baseNote = makeNoteCell(5);
      baseNote.appendChild(renderRolePart("基調 ", example.colors[0]));
      baseNote.appendChild(document.createTextNode(" ＋ "));
      baseNote.appendChild(renderRolePart("重點 ", example.colors[2]));
      noteRow.appendChild(baseNote);
      var assortNote = makeNoteCell(3);
      assortNote.appendChild(renderRolePart("配合 ", example.colors[1]));
      noteRow.appendChild(assortNote);
    } else {
      // equal：全部等寬；separation：主色4:分離1:主色4
      var flexRatios = (layout === "separation") ? [4, 1, 4] : null;
      example.colors.forEach(function (notation, i) {
        var grow = flexRatios ? flexRatios[i] : 1;
        row.appendChild(renderSwatch(notation, grow));
        noteRow.appendChild(renderNoteLabel(notation, grow));
      });
    }

    wrap.appendChild(row);
    wrap.appendChild(noteRow);
    // 顏色名稱不顯示；PCCS 記號於色塊下方註記，角色與配色性質由版面比例與區塊標題傳達
    return wrap;
  }

  // ---- 大類區塊渲染 ----

  function renderCategory(category, index) {
    var section = document.createElement("section");
    section.className = "haishoku-section";
    section.id = category.id;

    var h2 = document.createElement("h2");
    h2.textContent = (index + 1) + ". " + category.title;
    section.appendChild(h2);

    var desc = document.createElement("p");
    desc.className = "section-desc";
    desc.textContent = category.description;
    section.appendChild(desc);

    category.schemes.forEach(function (scheme) {
      var schemeEl = document.createElement("div");
      schemeEl.className = "scheme";

      var h3 = document.createElement("h3");
      h3.textContent = scheme.title + (scheme.titleEn ? "（" + scheme.titleEn + "）" : "");
      schemeEl.appendChild(h3);

      if (scheme.description) {
        var schemeDesc = document.createElement("p");
        schemeDesc.className = "scheme-desc";
        schemeDesc.textContent = scheme.description;
        schemeEl.appendChild(schemeDesc);
      }

      var examplesWrap = document.createElement("div");
      examplesWrap.className = "scheme-examples";
      scheme.examples.forEach(function (example) {
        examplesWrap.appendChild(renderExample(example, category.layout));
      });
      schemeEl.appendChild(examplesWrap);

      section.appendChild(schemeEl);
    });

    return section;
  }

  // ---- 初始化 ----

  document.getElementById("haishoku-overview").textContent = HAISHOKU_OVERVIEW;

  var container = document.getElementById("haishoku-sections");
  HAISHOKU_CATEGORIES.forEach(function (category, index) {
    container.appendChild(renderCategory(category, index));
  });
})();
