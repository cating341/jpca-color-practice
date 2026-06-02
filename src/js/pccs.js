// PCCS 頁面渲染與互動 — 從 pccs-data.js 讀取資料，只負責 DOM
(function () {
  "use strict";

  // 防禦：資料載入檢查
  if (typeof PCCS_HUES === "undefined" || typeof PCCS_TONES === "undefined") {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="color:#c00;padding:1rem;">資料載入失敗：請確認 pccs-data.js 已正確載入。</p>'
    );
    return;
  }

  var state = { selectedHue: 8 };
  var SVG_NS = "http://www.w3.org/2000/svg";

  // ---- 工具 ----

  // 角度（0° = 正上方，順時針）→ 座標
  function polar(radius, angleDeg) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
  }

  // 色塊上的文字用深色或白色（依背景亮度）
  function textColorFor(hex) {
    var rgb = hexToRgb(hex);
    var luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return luma > 150 ? "#1a1a1a" : "#ffffff";
  }

  // ---- 區塊 2：色相環 ----

  function renderHueWheel() {
    var svg = document.getElementById("hue-wheel");
    var R_OUT = 150, R_IN = 95, R_LABEL = 162;

    PCCS_HUES.forEach(function (hue) {
      // 色相 n 的中心角度 = (n - 8) × 15°（8:Y 在正上方，順時針遞增）
      var centerAngle = (hue.num - 8) * 15;
      var a0 = centerAngle - 7.5, a1 = centerAngle + 7.5;
      var p1 = polar(R_OUT, a0), p2 = polar(R_OUT, a1);
      var p3 = polar(R_IN, a1), p4 = polar(R_IN, a0);

      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d",
        "M " + p1.x + " " + p1.y +
        " A " + R_OUT + " " + R_OUT + " 0 0 1 " + p2.x + " " + p2.y +
        " L " + p3.x + " " + p3.y +
        " A " + R_IN + " " + R_IN + " 0 0 0 " + p4.x + " " + p4.y + " Z");
      path.setAttribute("class", "hue-seg");
      path.setAttribute("id", "hue-seg-" + hue.num);
      path.setAttribute("fill", hue.vivid);
      path.addEventListener("click", function () { selectHue(hue.num); });
      svg.appendChild(path);

      var lp = polar(R_LABEL, centerAngle);
      var label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", lp.x);
      label.setAttribute("y", lp.y);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("id", "hue-label-" + hue.num);
      label.textContent = hue.symbol;
      svg.appendChild(label);
    });
  }

  // ---- 區塊 2：色調圖 spots ----

  function renderToneSpots() {
    var map = document.getElementById("tone-spot-map");
    PCCS_TONES.forEach(function (tone) {
      var spot = document.createElement("div");
      spot.className = "tone-spot";
      spot.id = "tone-spot-" + tone.id;
      spot.style.left = tone.spotPos.x + "px";
      spot.style.top = tone.spotPos.y + "px";
      spot.innerHTML = "<b>" + tone.id + "</b><span>" + tone.zhName + "</span>";
      spot.addEventListener("click", function () {
        showDetail(tone.id, state.selectedHue);
      });
      map.appendChild(spot);
    });
  }

  function updateToneSpots() {
    PCCS_TONES.forEach(function (tone) {
      var color = getColor(tone.id, state.selectedHue);
      var spot = document.getElementById("tone-spot-" + tone.id);
      spot.style.backgroundColor = color;
      spot.style.color = textColorFor(color);
    });
  }

  // ---- 色相選擇（連動） ----

  function selectHue(hueNum) {
    state.selectedHue = hueNum;
    var hue = findHue(hueNum);
    document.getElementById("selected-hue-name").textContent = hue.symbol + "　" + hue.jpName;

    PCCS_HUES.forEach(function (h) {
      var seg = document.getElementById("hue-seg-" + h.num);
      var label = document.getElementById("hue-label-" + h.num);
      if (h.num === hueNum) {
        seg.classList.add("active");
        label.classList.add("active");
      } else {
        seg.classList.remove("active");
        label.classList.remove("active");
      }
    });

    updateToneSpots();
  }

  // ---- 詳情彈窗 ----

  function showDetail(toneId, hueNum) {
    var tone = findTone(toneId);
    var hue = findHue(hueNum);
    var color = getColor(toneId, hueNum);
    var notation = toneId === "v" ? "v" + hueNum : toneId + hueNum;

    document.getElementById("popup-body").innerHTML =
      '<div class="popup-color-chip" style="background:' + color + '"></div>' +
      '<p class="popup-notation">' + notation + "</p>" +
      '<p class="popup-detail-row"><b>色調：</b>' + tone.id + "　" + tone.jpName + "（" + tone.jpKana + "）｜" + tone.zhName + "</p>" +
      '<p class="popup-detail-row"><b>色相：</b>' + hue.symbol + "　" + hue.jpName + "</p>" +
      '<p class="popup-detail-row"><b>HEX：</b>' + color + "</p>" +
      '<p class="popup-detail-row"><b>清濁分類：</b>' + tone.category + describeMix(tone) + "</p>";

    document.getElementById("detail-popup").classList.remove("hidden");
    document.getElementById("popup-backdrop").classList.remove("hidden");
  }

  // 無彩色（灰階）詳情
  function showGrayDetail(gray) {
    document.getElementById("popup-body").innerHTML =
      '<div class="popup-color-chip" style="background:' + gray.hex + '"></div>' +
      '<p class="popup-notation">' + gray.symbol + "-" + gray.value + "</p>" +
      '<p class="popup-detail-row"><b>名稱：</b>' + gray.jpName + "</p>" +
      '<p class="popup-detail-row"><b>明度：</b>' + gray.value + "</p>" +
      '<p class="popup-detail-row"><b>HEX：</b>' + gray.hex + "</p>" +
      '<p class="popup-detail-row"><b>分類：</b>無彩色</p>';

    document.getElementById("detail-popup").classList.remove("hidden");
    document.getElementById("popup-backdrop").classList.remove("hidden");
  }

  function describeMix(tone) {
    if (!tone.mix) return "（未混合）";
    var pct = Math.round(tone.mix.amount * 100) + "%";
    if (tone.mix.type === "white") return "（純色＋白 " + pct + "）";
    if (tone.mix.type === "black") return "（純色＋黑 " + pct + "）";
    return "（純色＋灰 " + pct + "）";
  }

  function hideDetail() {
    document.getElementById("detail-popup").classList.add("hidden");
    document.getElementById("popup-backdrop").classList.add("hidden");
  }

  // ---- 初始化 ----

  document.getElementById("popup-close").addEventListener("click", hideDetail);
  document.getElementById("popup-backdrop").addEventListener("click", hideDetail);

  renderHueWheel();
  renderToneSpots();
  selectHue(8); // 預設 8:Y
})();
