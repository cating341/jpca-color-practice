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

  // 色塊上的文字用深色或白色（依背景亮度）
  function textColorFor(hex) {
    var rgb = hexToRgb(hex);
    var luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return luma > 150 ? "#1a1a1a" : "#ffffff";
  }

  // ---- 色卡渲染 ----

  // 單一色塊（含記號標籤）
  function renderSwatch(notation, flexGrow) {
    var hex = getSchemeColor(notation);
    var swatch = document.createElement("div");
    swatch.className = "scheme-swatch";
    swatch.style.backgroundColor = hex;
    swatch.style.color = textColorFor(hex);
    swatch.style.flexGrow = flexGrow;
    swatch.textContent = notation;
    return swatch;
  }

  // 一個範例（色卡列＋說明）
  // layout：equal → 等寬；accent → 基調5:配合3:重點1；separation → 主色4:分離1:主色4
  function renderExample(example, layout) {
    var wrap = document.createElement("div");
    wrap.className = "scheme-example";

    var row = document.createElement("div");
    row.className = "scheme-swatch-row layout-" + layout;

    var flexRatios = null; // equal：全部等寬
    if (layout === "accent") flexRatios = [5, 3, 1];
    else if (layout === "separation") flexRatios = [4, 1, 4];

    example.colors.forEach(function (notation, i) {
      var grow = flexRatios ? flexRatios[i] : 1;
      row.appendChild(renderSwatch(notation, grow));
    });
    wrap.appendChild(row);

    var label = document.createElement("p");
    label.className = "scheme-example-label";
    label.textContent = example.label;
    wrap.appendChild(label);

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
