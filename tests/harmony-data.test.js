// 進階配色資料層測試 — node tests/harmony-data.test.js，無框架
const assert = require("node:assert");
const path = require("path");
const pccs = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));
const h = require(path.join(__dirname, "..", "src", "js", "harmony-data.js"));

// ---- 概說 ----
assert.ok(h.HARMONY_OVERVIEW && h.HARMONY_OVERVIEW.length > 0, "有概說");

// ---- 分類表 ----
assert.ok(h.HARMONY_MATRIX, "有分類表");
assert.deepStrictEqual(h.HARMONY_MATRIX.cols, ["類似配色", "對比配色"], "兩欄");
assert.deepStrictEqual(h.HARMONY_MATRIX.rows, ["色相", "色調"], "兩列");
assert.ok(h.HARMONY_MATRIX.cells["色相|類似"].length >= 1, "色相|類似 有項目");
assert.ok(Array.isArray(h.HARMONY_MATRIX.straddle), "有跨界特例");

// ---- 區段／配色法／範例 ----
assert.ok(Array.isArray(h.HARMONY_SECTIONS) && h.HARMONY_SECTIONS.length > 0, "有區段");
var allSchemes = [];
h.HARMONY_SECTIONS.forEach(function (sec) {
  assert.ok(sec.id && sec.title, "區段有 id/title");
  assert.ok(Array.isArray(sec.schemes), sec.id + " 有 schemes");
  sec.schemes.forEach(function (sc) {
    allSchemes.push(sc);
    assert.ok(sc.id && sc.title, "配色法有 id/title");
    assert.ok(sc.rule && sc.rule.type, sc.title + " 有 rule");
    assert.ok(sc.description && sc.description.length > 0, sc.title + " 有說明");
    assert.ok(sc.examples.length >= 2, sc.title + " ≥2 範例");
    sc.examples.forEach(function (ex) {
      assert.ok(ex.colors.length >= 2, sc.title + " 範例 ≥2 色");
      assert.ok(ex.label, sc.title + " 範例有 label");
      ex.colors.forEach(function (n) {
        assert.ok(/^#[0-9a-f]{6}$/.test(pccs.getSchemeColor(n)), n + " 合法顏色");
      });
    });
  });
});

// id 唯一
var ids = allSchemes.map(function (s) { return s.id; });
assert.strictEqual(new Set(ids).size, ids.length, "配色法 id 唯一");

// 分類表所有 id（cells + straddle）都對應到實際 scheme
var matrixIds = [];
Object.keys(h.HARMONY_MATRIX.cells).forEach(function (k) {
  h.HARMONY_MATRIX.cells[k].forEach(function (it) { matrixIds.push(it.id); });
});
h.HARMONY_MATRIX.straddle.forEach(function (it) { matrixIds.push(it.id); });
matrixIds.forEach(function (id) {
  assert.ok(ids.indexOf(id) !== -1, "分類表 id 對應到 scheme: " + id);
});

console.log("Harmony structure tests passed");

// ---- 領域規則驗證 ----

function hueDiff(a, b) {            // 環狀色相差（1–24）
  var d = Math.abs(a - b);
  return Math.min(d, 24 - d);
}
function lumaOf(n) {
  var c = pccs.hexToRgb(pccs.getSchemeColor(n));
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}
// 「偏藍程度」：與最黃色相 8 的環狀距離越大越偏藍（0=最黃，12=最藍）
function bluenessOf(hueNum) { return hueDiff(hueNum, 8); }
// 色調圖座標距離
function toneDist(a, b) {
  var pa = pccs.findTone(a).spotPos, pb = pccs.findTone(b).spotPos;
  return Math.sqrt(Math.pow(pa.x - pb.x, 2) + Math.pow(pa.y - pb.y, 2));
}

h.HARMONY_SECTIONS.forEach(function (sec) {
  sec.schemes.forEach(function (sc) {
    sc.examples.forEach(function (ex, idx) {
      var label = sc.title + " 範例" + (idx + 1);
      var parsed = ex.colors.map(function (n) { return pccs.parseColorNotation(n); });
      var chrom = parsed.filter(function (p) { return p.type === "chromatic"; });
      var tones = chrom.map(function (p) { return p.toneId; });
      var hues = chrom.map(function (p) { return p.hueNum; });
      var t = sc.rule.type;

      if (t === "dyad") {
        assert.strictEqual(chrom.length, 2, label + "：2 色");
        assert.strictEqual(hueDiff(hues[0], hues[1]), 12, label + "：色相差 12（補色）");
      }
      if (t === "triad") {
        assert.strictEqual(chrom.length, 3, label + "：3 色");
        for (var i = 0; i < 3; i++)
          for (var j = i + 1; j < 3; j++)
            assert.strictEqual(hueDiff(hues[i], hues[j]), 8, label + "：兩兩差 8");
      }
      if (t === "tetrad") {
        assert.strictEqual(chrom.length, 4, label + "：4 色");
        var sorted = hues.slice().sort(function (a, b) { return a - b; });
        for (var k = 1; k < 4; k++)
          assert.strictEqual(sorted[k] - sorted[k - 1], 6, label + "：間隔 6");
      }
      if (t === "split-complement") {
        assert.strictEqual(chrom.length, 3, label + "：3 色");
        // 存在一基底，另兩色等距分居其補色兩側（距離 ≤2）
        var ok = false;
        for (var b = 0; b < 3 && !ok; b++) {
          var others = [0, 1, 2].filter(function (x) { return x !== b; });
          var comp = ((hues[b] + 12 - 1) % 24) + 1; // 補色（1-24 環：+12 取模，維持 1-based）
          var d0 = hueDiff(hues[others[0]], comp);
          var d1 = hueDiff(hues[others[1]], comp);
          if (d0 === d1 && d0 >= 1 && d0 <= 2) ok = true;
        }
        assert.ok(ok, label + "：兩色分居補色兩側等距");
      }
      if (t === "dominant-color") {
        assert.strictEqual(new Set(hues).size, 1, label + "：色相統一");
      }
      if (t === "dominant-tone") {
        assert.strictEqual(new Set(tones).size, 1, label + "：色調統一");
      }
      if (t === "natural") {
        // 較黃（blueness 小）者 luma 較高
        // 註：若兩色與色相 8 等距（blueness 相同），預設取 index 0；新增範例應避免此情境
        var yellower = bluenessOf(hues[0]) <= bluenessOf(hues[1]) ? 0 : 1;
        var bluer = 1 - yellower;
        assert.ok(lumaOf(ex.colors[yellower]) > lumaOf(ex.colors[bluer]),
          label + "：偏黃較亮、偏藍較暗");
      }
      if (t === "complex") {
        var y = bluenessOf(hues[0]) <= bluenessOf(hues[1]) ? 0 : 1;
        var bl = 1 - y;
        assert.ok(lumaOf(ex.colors[y]) < lumaOf(ex.colors[bl]),
          label + "：反自然（偏黃較暗、偏藍較亮）");
      }
      if (t === "tonal") {
        tones.forEach(function (id) {
          assert.ok(["sf", "d", "ltg", "g"].indexOf(id) !== -1,
            label + "：色調 " + id + " 應 ∈ {sf,d,ltg,g}");
        });
      }
      if (t === "tone-in-tone") {
        // 現有範例均同一色調；若日後新增「類似色調」範例，需改為 toneDist 門檻檢查
        assert.strictEqual(new Set(tones).size, 1, label + "：色調統一");
        assert.ok(tones.indexOf("v") === -1, label + "：不含 v");
      }
      if (t === "camaieu") {
        assert.strictEqual(new Set(hues).size, 1, label + "：色相統一");
        for (var ci = 0; ci < tones.length; ci++)
          for (var cj = ci + 1; cj < tones.length; cj++)
            assert.ok(tones[ci] === tones[cj] || toneDist(tones[ci], tones[cj]) <= 100,
              label + "：色調極類似（距離 ≤100）");
      }
      if (t === "faux-camaieu") {
        assert.strictEqual(chrom.length, 2, label + "：2 色");
        var hd = hueDiff(hues[0], hues[1]);
        assert.ok(hd >= 1 && hd <= 2, label + "：色相差 1~2");
        assert.ok(tones[0] === tones[1] || toneDist(tones[0], tones[1]) <= 120,
          label + "：色調類似");
      }
      if (t === "bicolor") {
        assert.strictEqual(parsed.length, 2, label + "：2 色");
        var hasStrong = parsed.some(function (p) {
          return p.type === "neutral" || p.toneId === "v";
        });
        assert.ok(hasStrong, label + "：含 v 或無彩色（高對比）");
      }
      if (t === "tricolor") {
        assert.strictEqual(parsed.length, 3, label + "：3 色");
        // 通常含高彩度色與黑／白：至少一個無彩色或 v 色調
        var triStrong = parsed.some(function (p) {
          return p.type === "neutral" || p.toneId === "v";
        });
        assert.ok(triStrong, label + "：含 v 或無彩色（高對比）");
      }
      if (t === "tone-on-tone") {
        // 假設 tone-on-tone 範例均為 2 色；若新增 3 色範例需改為全對比較
        assert.strictEqual(tones.length, 2, label + "：目前僅限 2 色範例");
        assert.strictEqual(new Set(hues).size, 1, label + "：色相統一");
        assert.ok(toneDist(tones[0], tones[1]) >= 150,
          label + "：色調明度差顯著（距離 ≥150）");
      }
    });
  });
});

console.log("Harmony rule tests passed");
