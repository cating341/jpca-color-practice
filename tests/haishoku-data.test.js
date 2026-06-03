// 基本配色法資料層測試 — 以 node tests/haishoku-data.test.js 執行，無框架
const assert = require("node:assert");
const path = require("path");
const pccs = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));
const haishoku = require(path.join(__dirname, "..", "src", "js", "haishoku-data.js"));

// ---- 記號解析 ----
assert.deepStrictEqual(haishoku.parseColorNotation("v2"),
  { type: "chromatic", toneId: "v", hueNum: 2 }, "v2");
assert.deepStrictEqual(haishoku.parseColorNotation("ltg20"),
  { type: "chromatic", toneId: "ltg", hueNum: 20 }, "ltg20");
assert.deepStrictEqual(haishoku.parseColorNotation("dkg24"),
  { type: "chromatic", toneId: "dkg", hueNum: 24 }, "dkg24");
assert.deepStrictEqual(haishoku.parseColorNotation("N2"),
  { type: "neutral", value: 2 }, "N2");
assert.deepStrictEqual(haishoku.parseColorNotation("N9.5"),
  { type: "neutral", value: 9.5 }, "N9.5");
assert.deepStrictEqual(haishoku.parseColorNotation("W"),
  { type: "neutral", value: 9.5 }, "W = N9.5");

// 非法記號全部拋出描述性錯誤
["xx", "v99", "v0", "v", "N", "", "2v", "zz8"].forEach(function (bad) {
  assert.throws(function () { haishoku.parseColorNotation(bad); },
    /parseColorNotation/, "非法記號拋錯: " + JSON.stringify(bad));
});

// 無彩色明度值超出 PCCS 範圍 [1.5, 9.5] 視為非法記號
["N0", "N1", "N10", "N12"].forEach(function (bad) {
  assert.throws(function () { haishoku.parseColorNotation(bad); },
    /parseColorNotation/, "無彩色明度超範圍拋錯: " + JSON.stringify(bad));
});

// ---- 無彩色灰階插值 ----
assert.strictEqual(haishoku.getNeutralColor(9.5), "#f5f5f5", "N9.5 = 白");
assert.strictEqual(haishoku.getNeutralColor(1.5), "#262626", "N1.5 = 黑");
assert.strictEqual(haishoku.getNeutralColor(5.5), "#8c8c8c", "N5.5 命中既有灰階");
// 插值：N2 介於 2.5 (#404040) 與 1.5 (#262626) 中點
assert.strictEqual(haishoku.getNeutralColor(2), "#333333", "N2 = 2.5/1.5 中點");
// 插值：N7 介於 7.5 (#bfbfbf) 與 6.5 (#a6a6a6) 中點
assert.strictEqual(haishoku.getNeutralColor(7), "#b3b3b3", "N7 = 7.5/6.5 中點");
// clamp
assert.strictEqual(haishoku.getNeutralColor(0), "#262626", "N0 clamp 到 1.5");
assert.strictEqual(haishoku.getNeutralColor(10), "#f5f5f5", "N10 clamp 到 9.5");
// 明度越高顏色越亮（灰階 r=g=b，取 r 比較）
(function () {
  var prev = -1;
  [1.5, 2, 3, 4.5, 6, 7, 8.5, 9.5].forEach(function (v) {
    var r = pccs.hexToRgb(haishoku.getNeutralColor(v)).r;
    assert.ok(r > prev, "灰階明度單調遞增 N" + v);
    prev = r;
  });
})();

// ---- 顏色計算 ----
assert.strictEqual(haishoku.getSchemeColor("v8"), pccs.getColor("v", 8), "v8 與 getColor 一致");
assert.strictEqual(haishoku.getSchemeColor("ltg20"), pccs.getColor("ltg", 20), "ltg20 與 getColor 一致");
assert.strictEqual(haishoku.getSchemeColor("N9.5"), haishoku.getNeutralColor(9.5), "N9.5 與 getNeutralColor 一致");
assert.strictEqual(haishoku.getSchemeColor("W"), "#f5f5f5", "W = 白");

console.log("Task 1 tests passed");

// ---- 配色法資料結構 ----
assert.strictEqual(haishoku.HAISHOKU_CATEGORIES.length, 6, "6 大類");
assert.ok(haishoku.HAISHOKU_OVERVIEW.length > 0, "有概說文字");

var totalSchemes = 0, totalExamples = 0;
haishoku.HAISHOKU_CATEGORIES.forEach(function (cat) {
  assert.ok(cat.id && cat.title && cat.layout && cat.description, cat.id + " 有 id/title/layout/description");
  assert.ok(["equal", "accent", "separation"].indexOf(cat.layout) !== -1, cat.id + " layout 合法");
  cat.schemes.forEach(function (scheme) {
    totalSchemes++;
    assert.ok(scheme.title, "小節有標題");
    assert.ok(scheme.rule && scheme.rule.type, scheme.title + " 有領域規則");
    assert.strictEqual(scheme.examples.length, 2, scheme.title + " 恰好 2 個範例");
    scheme.examples.forEach(function (ex) {
      totalExamples++;
      assert.ok(ex.colors.length >= 2, scheme.title + " 範例至少 2 色");
      assert.ok(ex.label, scheme.title + " 範例有說明");
      ex.colors.forEach(function (notation) {
        var hex = haishoku.getSchemeColor(notation);
        assert.ok(/^#[0-9a-f]{6}$/.test(hex), notation + " 可取得合法顏色");
      });
    });
  });
});
assert.strictEqual(totalSchemes, 18, "18 個小節");
assert.strictEqual(totalExamples, 36, "36 個範例");

// ---- 領域規則驗證（每個範例自動檢查其配色法規則） ----

// 環狀色相差（1–24 色相環）
function hueDiff(a, b) {
  var d = Math.abs(a - b);
  return Math.min(d, 24 - d);
}

// 彩度等級：純色剩餘比例（v=1；其他 = 1 − 混合量）
function saturationLevel(toneId) {
  var tone = pccs.findTone(toneId);
  return tone.mix ? 1 - tone.mix.amount : 1;
}

// 渲染色的亮度（luma）
function lumaOf(notation) {
  var rgb = pccs.hexToRgb(haishoku.getSchemeColor(notation));
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

haishoku.HAISHOKU_CATEGORIES.forEach(function (cat) {
  cat.schemes.forEach(function (scheme) {
    var rule = scheme.rule;
    scheme.examples.forEach(function (ex, exIdx) {
      var label = scheme.title + " 範例" + (exIdx + 1);
      var parsed = ex.colors.map(function (n) { return haishoku.parseColorNotation(n); });
      var chrom = parsed.filter(function (p) { return p.type === "chromatic"; });
      var tones = chrom.map(function (p) { return p.toneId; });
      var hues = chrom.map(function (p) { return p.hueNum; });

      if (rule.type === "hue-diff") {
        // 兩兩色相差都在 [min, max]
        for (var i = 0; i < chrom.length; i++) {
          for (var j = i + 1; j < chrom.length; j++) {
            var d = hueDiff(hues[i], hues[j]);
            assert.ok(d >= rule.min && d <= rule.max,
              label + "：色相差 " + d + " 應在 " + rule.min + "~" + rule.max);
          }
        }
        // 同一色相配色（差 0）需色調互異，否則是同一個顏色
        if (rule.max === 0) {
          assert.strictEqual(new Set(tones).size, tones.length, label + "：色調互異");
        }
      }

      if (rule.type === "same-tone") {
        assert.strictEqual(new Set(tones).size, 1, label + "：色調相同");
        assert.strictEqual(new Set(hues).size, chrom.length, label + "：色相互異");
      }

      if (rule.type === "different-tone-same-hue") {
        assert.strictEqual(new Set(tones).size, chrom.length, label + "：色調互異");
        assert.strictEqual(new Set(hues).size, 1, label + "：色相相同");
      }

      if (rule.type === "contrast-tone") {
        assert.strictEqual(new Set(tones).size, chrom.length, label + "：色調互異");
        assert.strictEqual(new Set(hues).size, 1, label + "：色相相同");
        // 對照色調：兩色調在色調圖上距離大（明度或彩度差異明顯）
        for (var ci = 0; ci < tones.length; ci++) {
          for (var cj = ci + 1; cj < tones.length; cj++) {
            var sa = pccs.findTone(tones[ci]).spotPos, sb = pccs.findTone(tones[cj]).spotPos;
            var dist = Math.sqrt(Math.pow(sa.x - sb.x, 2) + Math.pow(sa.y - sb.y, 2));
            assert.ok(dist >= 200, label + "：色調距離 " + Math.round(dist) + " 應 ≥ 200（對照）");
          }
        }
      }

      if (rule.type === "dominant") {
        // 統一色相或統一色調（其一即可）
        assert.ok(new Set(tones).size === 1 || new Set(hues).size === 1,
          label + "：色相或色調統一");
      }

      if (rule.type === "hue-gradation") {
        assert.strictEqual(new Set(tones).size, 1, label + "：色調相同");
        for (var hi = 1; hi < hues.length; hi++) {
          assert.ok(hues[hi] > hues[hi - 1], label + "：色相遞增");
        }
      }

      if (rule.type === "lightness-gradation") {
        assert.strictEqual(new Set(hues).size, 1, label + "：色相相同");
        var lumas = ex.colors.map(lumaOf);
        for (var li = 1; li < lumas.length; li++) {
          assert.ok(lumas[li] < lumas[li - 1], label + "：明度嚴格遞減");
        }
      }

      if (rule.type === "saturation-gradation") {
        assert.strictEqual(new Set(hues).size, 1, label + "：色相相同");
        var sats = tones.map(saturationLevel);
        for (var si = 1; si < sats.length; si++) {
          assert.ok(sats[si] < sats[si - 1], label + "：彩度嚴格遞減");
        }
      }

      if (rule.type === "tone-gradation") {
        assert.strictEqual(new Set(tones).size, chrom.length, label + "：色調互異");
        assert.strictEqual(new Set(hues).size, 1, label + "：色相相同");
      }

      if (rule.type === "accent" || rule.type === "accent-warm") {
        // 順序固定：基調、配合、重點 — 最後一個是 v 色調重點色，其餘非 v
        var accent = parsed[parsed.length - 1];
        assert.strictEqual(accent.type, "chromatic", label + "：重點色為有彩色");
        assert.strictEqual(accent.toneId, "v", label + "：重點色為 v 色調");
        parsed.slice(0, -1).forEach(function (p) {
          assert.ok(p.type === "neutral" || p.toneId !== "v", label + "：基調/配合色非 v 色調");
        });
        // 暖色系重點：色相 1~8（紅～黃）
        if (rule.type === "accent-warm") {
          assert.ok(accent.hueNum >= 1 && accent.hueNum <= 8,
            label + "：重點色為暖色系（色相 1~8）");
        }
      }

      if (rule.type === "separation") {
        // 順序固定：主色、分離色、主色 — 中間為無彩色
        assert.strictEqual(parsed.length, 3, label + "：3 個顏色");
        assert.strictEqual(parsed[1].type, "neutral", label + "：中間為無彩色分離色");
      }
    });
  });
});

console.log("Task 2 tests passed");
