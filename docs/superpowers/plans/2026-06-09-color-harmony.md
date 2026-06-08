# 色彩調和論與進階配色（M2-U6）教材頁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個獨立的閱讀式教材頁 `harmony.html`，完整、準確呈現 JPCA M2-U6 的進階配色技法（含官方分類表、標準配色幾何示意、各配色法色卡與說明）。

**Architecture:** 鏡像既有 haishoku 頁的三層模式——`pccs-data.js`（PCCS 核心＋記號工具）→ `harmony-data.js`（內容資料＋領域規則）→ `harmony.js`（DOM 渲染）。資料層與領域規則以 Node 測試保護；渲染／HTML／CSS 沿用專案既有「無 DOM 測試、瀏覽器人工驗證」慣例。

**Tech Stack:** Vanilla HTML/CSS/JS（無框架、無 build step）、Node 內建 `assert`（無測試框架）。

設計來源：`docs/superpowers/specs/2026-06-09-color-harmony-design.md`。

---

## File Structure

| 檔案 | 責任 |
|---|---|
| `src/js/pccs-data.js`（修改） | PCCS 核心資料＋色彩工具；**新增**記號解析工具 `parseColorNotation`／`getNeutralColor`／`getSchemeColor`（含 `Bk`/`Wh`）。 |
| `src/js/haishoku-data.js`（修改） | 改為從 pccs-data re-export 上述三函式；對外 API 不變。 |
| `tests/pccs-data.test.js`（修改） | 新增記號工具的測試。 |
| `src/js/harmony-data.js`（新增） | `HARMONY_OVERVIEW`／`HARMONY_MATRIX`／`HARMONY_SECTIONS`（含 rule、examples）。 |
| `tests/harmony-data.test.js`（新增） | 結構檢查＋逐例領域規則驗證＋分類表/詳解 id 一致性。 |
| `src/harmony.html`（新增） | 頁面骨架，依序載入三支 JS＋兩支 CSS。 |
| `src/js/harmony.js`（新增） | 渲染：概說、分類表 grid、各區段色卡列、標準配色 SVG 色相環。 |
| `src/css/harmony.css`（新增） | 分類表 grid、色卡、SVG 色相環、響應式樣式。 |
| `src/index.html`（修改） | 新增第 4 張首頁卡片。 |

---

## Task 1: 下放記號工具到 pccs-data.js（含 Bk/Wh）

**Files:**
- Modify: `src/js/pccs-data.js`（在 `getColor` 之後、Node 匯出之前插入；並擴充匯出）
- Modify: `src/js/haishoku-data.js:10-44`（移除本地定義，改為 re-export）
- Test: `tests/pccs-data.test.js`（檔尾新增）

- [ ] **Step 1: 在 `tests/pccs-data.test.js` 檔尾新增失敗測試**

在檔案最後（`console.log("Task 3 tests passed");` 之後）加入：

```javascript
// ---- 記號解析工具（自 haishoku 下放） ----
assert.deepStrictEqual(data.parseColorNotation("v2"),
  { type: "chromatic", toneId: "v", hueNum: 2 }, "v2");
assert.deepStrictEqual(data.parseColorNotation("ltg20"),
  { type: "chromatic", toneId: "ltg", hueNum: 20 }, "ltg20");
assert.deepStrictEqual(data.parseColorNotation("N2"),
  { type: "neutral", value: 2 }, "N2");
assert.deepStrictEqual(data.parseColorNotation("N9.5"),
  { type: "neutral", value: 9.5 }, "N9.5");
assert.deepStrictEqual(data.parseColorNotation("W"),
  { type: "neutral", value: 9.5 }, "W = N9.5");
// 新增：Bk = 黑(N1.5)、Wh = 白(N9.5)
assert.deepStrictEqual(data.parseColorNotation("Bk"),
  { type: "neutral", value: 1.5 }, "Bk = N1.5");
assert.deepStrictEqual(data.parseColorNotation("Wh"),
  { type: "neutral", value: 9.5 }, "Wh = N9.5");

// 非法記號拋錯
["xx", "v99", "v0", "v", "N", "", "2v", "zz8", "N0", "N10"].forEach(function (bad) {
  assert.throws(function () { data.parseColorNotation(bad); },
    /parseColorNotation/, "非法記號拋錯: " + JSON.stringify(bad));
});

// 灰階插值與顏色計算
assert.strictEqual(data.getNeutralColor(9.5), "#f5f5f5", "N9.5 = 白");
assert.strictEqual(data.getNeutralColor(1.5), "#262626", "N1.5 = 黑");
assert.strictEqual(data.getSchemeColor("v8"), data.getColor("v", 8), "v8 一致");
assert.strictEqual(data.getSchemeColor("Bk"), "#262626", "Bk = 黑");
assert.strictEqual(data.getSchemeColor("Wh"), "#f5f5f5", "Wh = 白");

console.log("Task 4 tests passed");
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node tests/pccs-data.test.js`
Expected: FAIL — `data.parseColorNotation is not a function`

- [ ] **Step 3: 在 `src/js/pccs-data.js` 的 `getColor` 函式之後插入記號工具**

在 `src/js/pccs-data.js` 第 184 行（`getColor` 函式結尾 `}`）之後、`// ---- Node 匯出` 之前插入：

```javascript

// ---- PCCS 記號解析（供配色頁使用） ----

// 解析 PCCS 配色記號：
//   有彩色："v2"、"ltg20" → { type: "chromatic", toneId, hueNum }
//   無彩色："N2"、"N9.5" → { type: "neutral", value }
//   別名："W"、"Wh" 視同 N9.5（白）；"Bk" 視同 N1.5（黑）
function parseColorNotation(notation) {
  if (typeof notation !== "string" || notation.length === 0) {
    throw new Error("parseColorNotation: invalid notation " + notation);
  }
  if (notation === "W" || notation === "Wh") return { type: "neutral", value: 9.5 };
  if (notation === "Bk") return { type: "neutral", value: 1.5 };

  var neutralMatch = notation.match(/^N(\d+(?:\.\d+)?)$/);
  if (neutralMatch) {
    var nval = parseFloat(neutralMatch[1]);
    if (nval < 1.5 || nval > 9.5) {
      throw new Error("parseColorNotation: neutral value out of range in " + notation);
    }
    return { type: "neutral", value: nval };
  }

  var chromaticMatch = notation.match(/^([a-z]+)(\d+)$/);
  if (chromaticMatch) {
    var toneId = chromaticMatch[1];
    var hueNum = parseInt(chromaticMatch[2], 10);
    if (!findTone(toneId)) {
      throw new Error("parseColorNotation: unknown tone in " + notation);
    }
    if (hueNum < 1 || hueNum > 24) {
      throw new Error("parseColorNotation: hue out of range in " + notation);
    }
    return { type: "chromatic", toneId: toneId, hueNum: hueNum };
  }

  throw new Error("parseColorNotation: invalid notation " + notation);
}

// 依明度值在 PCCS_GRAYS 之間線性插值；超出範圍 clamp 到 [1.5, 9.5]
function getNeutralColor(value) {
  var grays = PCCS_GRAYS; // 明度由大到小排列（9.5 → 1.5）
  if (value >= grays[0].value) return grays[0].hex;
  if (value <= grays[grays.length - 1].value) return grays[grays.length - 1].hex;

  for (var i = 0; i < grays.length - 1; i++) {
    var upper = grays[i], lower = grays[i + 1];
    if (value <= upper.value && value >= lower.value) {
      var t = (value - lower.value) / (upper.value - lower.value);
      var up = hexToRgb(upper.hex), lo = hexToRgb(lower.hex);
      return rgbToHex(
        lo.r + (up.r - lo.r) * t,
        lo.g + (up.g - lo.g) * t,
        lo.b + (up.b - lo.b) * t
      );
    }
  }
  throw new Error("getNeutralColor: unexpected value " + value);
}

// 取得任意記號的顏色（有彩色 → getColor；無彩色 → 灰階插值）
function getSchemeColor(notation) {
  var parsed = parseColorNotation(notation);
  if (parsed.type === "neutral") return getNeutralColor(parsed.value);
  return getColor(parsed.toneId, parsed.hueNum);
}
```

- [ ] **Step 4: 擴充 `src/js/pccs-data.js` 的 Node 匯出**

把 `module.exports` 物件（第 188-199 行）改為加入三個新函式（在 `getColor: getColor` 後加逗號續行）：

```javascript
  module.exports = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    interpolateHex: interpolateHex,
    mixColor: mixColor,
    PCCS_HUES: PCCS_HUES,
    PCCS_TONES: PCCS_TONES,
    PCCS_GRAYS: PCCS_GRAYS,
    findHue: findHue,
    findTone: findTone,
    getColor: getColor,
    parseColorNotation: parseColorNotation,
    getNeutralColor: getNeutralColor,
    getSchemeColor: getSchemeColor
  };
```

- [ ] **Step 5: 執行 pccs-data 測試確認通過**

Run: `node tests/pccs-data.test.js`
Expected: PASS（輸出含 `Task 4 tests passed`）

- [ ] **Step 6: 把 `haishoku-data.js` 改為 re-export**

`src/js/haishoku-data.js` 目前在第 10-76 行本地定義 `parseColorNotation`／`getNeutralColor`／`getSchemeColor`。將第 10 行（`// ---- 記號解析 ----`）到 `getSchemeColor` 函式結尾（第 76 行 `}`）整段刪除，改為：

```javascript
// ---- 記號工具（已下放至 pccs-data.js，此處取得供測試 re-export） ----
var parseColorNotation = _pccs.parseColorNotation;
var getNeutralColor = _pccs.getNeutralColor;
var getSchemeColor = _pccs.getSchemeColor;
```

並把第 5-8 行的 `_pccs` 取得補上新函式（瀏覽器分支）：

```javascript
var _pccs = (typeof module !== "undefined" && module.exports)
  ? require("./pccs-data.js")
  : { PCCS_GRAYS: PCCS_GRAYS, findTone: findTone, getColor: getColor,
      hexToRgb: hexToRgb, rgbToHex: rgbToHex,
      parseColorNotation: parseColorNotation, getNeutralColor: getNeutralColor,
      getSchemeColor: getSchemeColor };
```

> 注意：瀏覽器分支中 `parseColorNotation` 等已是 pccs-data.js 定義的全域變數，此處引用全域即可；Node 分支則走 require。

- [ ] **Step 7: 執行 haishoku 測試確認未被破壞**

Run: `node tests/haishoku-data.test.js`
Expected: PASS（輸出 `Task 1 tests passed` 與 `Task 2 tests passed`）

- [ ] **Step 8: Commit**

```bash
git add src/js/pccs-data.js src/js/haishoku-data.js tests/pccs-data.test.js
git commit -m "refactor: move PCCS notation helpers into pccs-data.js, add Bk/Wh"
```

---

## Task 2: 建立 harmony-data.js 內容資料

**Files:**
- Create: `src/js/harmony-data.js`
- Test: `tests/harmony-data.test.js`（先建結構檢查段）

- [ ] **Step 1: 建立 `tests/harmony-data.test.js` 結構檢查（失敗測試）**

```javascript
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
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node tests/harmony-data.test.js`
Expected: FAIL — `Cannot find module '.../harmony-data.js'`

- [ ] **Step 3: 建立 `src/js/harmony-data.js`**

```javascript
// 進階配色（M2-U6 色彩調和論）— 純邏輯資料層，不碰 DOM
// 瀏覽器：以 <script> 載入（需先載入 pccs-data.js）；Node：可 require（測試用）

var _pccs = (typeof module !== "undefined" && module.exports)
  ? require("./pccs-data.js")
  : { getSchemeColor: getSchemeColor };

var HARMONY_OVERVIEW = "延續基礎配色法，本單元進入色彩調和論：透過色相環的幾何關係，以及「依色相或色調組織、產生類似或對比效果」的分類框架，理解各種進階配色技法在服裝上的印象與應用。";

// 配色技法分類表（重建自課本「スタンダードな配色技法の分類」）
// 兩軸：cols＝類似／對比；rows＝色相／色調。straddle 為跨界特例。
var HARMONY_MATRIX = {
  cols: ["類似配色", "對比配色"],
  rows: ["色相", "色調"],
  cells: {
    "色相|類似": [
      { id: "dominant-color", name: "主調色相配色" },
      { id: "natural", name: "自然配色" }
    ],
    "色相|對比": [
      { id: "bicolor", name: "雙色配色" },
      { id: "tricolor", name: "三色配色" }
    ],
    "色調|類似": [
      { id: "dominant-tone", name: "主調色調配色" },
      { id: "tonal", name: "Tonal" },
      { id: "tone-in-tone", name: "tone in tone" }
    ],
    "色調|對比": [
      { id: "tone-on-tone", name: "tone on tone" }
    ]
  },
  // span: "camaieu" = 跨色相↔色調（類似側）；"complex" = 跨類似↔對比（置中）
  straddle: [
    { id: "camaieu", name: "Camaieu", span: "camaieu" },
    { id: "faux-camaieu", name: "Faux Camaieu", span: "camaieu" },
    { id: "complex", name: "Complex", span: "complex" }
  ]
};

// 各區段 → 配色法 → 範例。geometry:true 觸發 SVG 色相環。
var HARMONY_SECTIONS = [
  {
    id: "standard", title: "標準配色（幾何）", geometry: true,
    description: "基於色相環幾何位置的經典配色理論。",
    schemes: [
      { id: "dyad", title: "二色配色", titleEn: "Dyad",
        description: "色相環上相對（色相差 12）的兩色，即補色。對比最強烈、最醒目。印象：強烈、活潑、現代。服裝應用：運動／街頭風，或想營造視覺焦點時；面積宜一大一小以免衝突。",
        rule: { type: "dyad" },
        examples: [
          { colors: ["v2", "v14"], label: "v2 紅＋v14 藍綠" },
          { colors: ["b8", "b20"], label: "b8 黃＋b20 藍紫" }
        ] },
      { id: "triad", title: "三色配色", titleEn: "Triad",
        description: "色相環上等距三色（兩兩差 8，形成正三角）。色彩豐富又保持平衡。印象：活潑、明快、富節奏感。服裝應用：童裝、休閒風；以一色為主、另兩色點綴較易駕馭。",
        rule: { type: "triad" },
        examples: [
          { colors: ["v2", "v10", "v18"], label: "v2 紅＋v10 黃綠＋v18 藍" },
          { colors: ["dp4", "dp12", "dp20"], label: "dp4 紅橙＋dp12 綠＋dp20 藍紫" }
        ] },
      { id: "tetrad", title: "四色配色", titleEn: "Tetrad",
        description: "色相環上等距四色（間隔 6，形成正方，含兩組補色）。最為華麗多變。印象：豐富、華麗、熱鬧。服裝應用：派對／表演服；日常宜降低部分色的彩度或面積。",
        rule: { type: "tetrad" },
        examples: [
          { colors: ["v2", "v8", "v14", "v20"], label: "v2 紅＋v8 黃＋v14 藍綠＋v20 藍紫" },
          { colors: ["b5", "b11", "b17", "b23"], label: "b5 橙＋b11 黃綠＋b17 藍＋b23 紅紫" }
        ] },
      { id: "split-complement", title: "分裂補色", titleEn: "Split Complementary",
        description: "一色搭配其補色兩側的相鄰色（形成 Y 字）。保有補色對比但更柔和易調和。印象：對比中帶協調、有變化。服裝應用：想要對比又不過於刺激時的安全選擇。",
        rule: { type: "split-complement" },
        examples: [
          { colors: ["v2", "v13", "v15"], label: "v2 紅＋v13 青綠＋v15 藍綠" },
          { colors: ["b8", "b19", "b21"], label: "b8 黃＋b19 藍紫＋b21 紫" }
        ] }
    ]
  },
  {
    id: "analogy", title: "類似配色（Analogy）",
    description: "以相似的色相或色調搭配，營造高雅、安定的質感。",
    schemes: [
      { id: "dominant-color", title: "主調色相配色", titleEn: "Dominant Color",
        description: "全身由單一色相主導（M1 p80 複習），以同色相的不同色調組成，產生強烈統一感。印象：統一、有整體感、個性鮮明。服裝應用：單色系穿搭（同色不同深淺），高雅俐落。",
        rule: { type: "dominant-color" },
        examples: [
          { colors: ["sf16", "b16", "lt16"], label: "統一藍色相（柔／明亮／淺）" },
          { colors: ["p4", "lt4", "sf4"], label: "統一橙色相（淡／淺／柔）" }
        ] },
      { id: "natural", title: "自然配色", titleEn: "Natural",
        description: "依自然界光影規律：偏黃的顏色明度高（受光、亮），偏藍的顏色明度低（陰影、暗）。最自然、安定、易調和。印象：自然、安定、和諧。服裝應用：大地色系、戶外休閒；最不易出錯的配色法。",
        rule: { type: "natural" },
        examples: [
          { colors: ["lt8", "dp16"], label: "lt8 黃（明）＋dp16 藍（暗）" },
          { colors: ["p6", "dk18"], label: "p6 黃橙（明）＋dk18 藍紫（暗）" }
        ] },
      { id: "dominant-tone", title: "主調色調配色", titleEn: "Dominant Tone",
        description: "全身由單一色調主導（M1 p80 複習），色相可不同但色調一致，印象由該色調特性決定。印象：依色調而定（淺色調＝清爽、暗色調＝沉穩）。服裝應用：想統一氛圍又要色彩變化時。",
        rule: { type: "dominant-tone" },
        examples: [
          { colors: ["lt4", "lt12", "lt20"], label: "統一淺色調（橙／綠／藍紫）" },
          { colors: ["d2", "d10", "d18"], label: "統一鈍色調（紅／黃綠／藍）" }
        ] },
      { id: "tonal", title: "Tonal 中間色調配色", titleEn: "Tonal",
        description: "使用中・低彩度的四個濁色調（sf、d、ltg、g；不使用高彩度的 s）。色相自由，多色更有效果。印象：沉穩、穩重、內斂、成熟。服裝應用：知性上班族、秋冬大地濁色系。",
        rule: { type: "tonal" },
        examples: [
          { colors: ["sf2", "d8", "ltg14"], label: "sf2 柔紅＋d8 濁黃＋ltg14 淺灰藍綠" },
          { colors: ["g4", "d16"], label: "g4 灰橙＋d16 濁藍" }
        ] },
      { id: "tone-in-tone", title: "tone in tone 同色調配色", titleEn: "Tone in Tone",
        description: "基本上同一色調（類似色調亦可），色相自由變化，統一感由色調維繫；通常用中～低彩度（不用 v）。印象：協調中有色相變化、雅緻。服裝應用：想多色又不雜亂時的好方法。",
        rule: { type: "tone-in-tone" },
        examples: [
          { colors: ["d2", "d8", "d14"], label: "d2 濁紅＋d8 濁黃＋d14 濁藍綠" },
          { colors: ["p4", "p12", "p20"], label: "p4 淡橙＋p12 淡綠＋p20 淡藍紫" }
        ] },
      { id: "camaieu", title: "Camaieu 卡邁厄配色", titleEn: "Camaieu",
        description: "同一色相、同一～類似色調，色差極小到幾乎難以分辨，常靠材質差異呈現變化。印象：極致統一、朦朧、高雅。服裝應用：同色同調的疊穿，以材質（針織、絲、麂皮）製造層次。",
        rule: { type: "camaieu" },
        examples: [
          { colors: ["lt2", "p2"], label: "lt2 亮紅＋p2 淡紅" },
          { colors: ["sf8", "ltg8"], label: "sf8 柔黃＋ltg8 淺灰黃" }
        ] },
      { id: "faux-camaieu", title: "Faux Camaieu 仿卡邁厄配色", titleEn: "Faux Camaieu",
        description: "比 Camaieu 色差再大一點點，稍微不同的色相或色調。印象：柔和、隱約的變化、細膩。服裝應用：近似色的優雅疊穿，比 Camaieu 多一分層次。",
        rule: { type: "faux-camaieu" },
        examples: [
          { colors: ["lt2", "p4"], label: "lt2 亮紅＋p4 淡橙" },
          { colors: ["dp16", "dk18"], label: "dp16 深藍＋dk18 暗藍紫" }
        ] }
    ]
  },
  {
    id: "contrast", title: "對比配色（Contrast）",
    description: "利用色相或明度的強烈差異，打造搶眼、俐落的視覺效果。",
    schemes: [
      { id: "bicolor", title: "雙色配色", titleEn: "Bicolor",
        description: "兩種強烈對比色構成，常見於國旗。使用高彩度明快色相，或搭一個無彩色（黑／白）。印象：俐落、明確、強烈。服裝應用：撞色穿搭、運動風；黑白＋一彩色最易駕馭。",
        rule: { type: "bicolor" },
        examples: [
          { colors: ["v2", "v16"], label: "v2 紅＋v16 藍" },
          { colors: ["v8", "Bk"], label: "v8 黃＋黑" }
        ] },
      { id: "tricolor", title: "三色配色", titleEn: "Tricolor",
        description: "三種對比強烈的顏色，通常含高彩度色與黑、白。印象：鮮明、活力、節奏感。服裝應用：三色塊穿搭（如紅白藍），需注意面積比例。",
        rule: { type: "tricolor" },
        examples: [
          { colors: ["v2", "Wh", "v16"], label: "v2 紅＋白＋v16 藍（法國國旗）" },
          { colors: ["v8", "v12", "v2"], label: "v8 黃＋v12 綠＋v2 紅" }
        ] }
    ]
  },
  {
    id: "tone-contrast", title: "對比配色（色調型）",
    description: "同色相但色調明度差顯著，於統一中製造對比。",
    schemes: [
      { id: "tone-on-tone", title: "tone on tone 同色系配色", titleEn: "Tone on Tone",
        description: "同一～類似色相（維持統一），但色調明度差顯著（製造對比）。印象：統一中有明確層次、立體。服裝應用：深淺同色（如深藍＋淺藍）的層次穿搭，實用百搭。",
        rule: { type: "tone-on-tone" },
        examples: [
          { colors: ["p2", "dp2"], label: "p2 淡紅＋dp2 深紅" },
          { colors: ["ltg16", "dk16"], label: "ltg16 淺灰藍＋dk16 暗藍" }
        ] }
    ]
  },
  {
    id: "complex", title: "Complex（反自然）",
    description: "與自然配色相反的法則，創造現代、前衛的效果。",
    schemes: [
      { id: "complex", title: "Complex 反自然配色", titleEn: "Complex",
        description: "刻意讓偏黃色明度低（暗）、偏藍色明度高（亮），與自然配色相反。印象：現代、前衛、不可思議、都會感。服裝應用：時尚前衛造型、想製造反差驚喜時使用。",
        rule: { type: "complex" },
        examples: [
          { colors: ["dp8", "lt16"], label: "dp8 深黃（暗）＋lt16 淺藍（亮）" },
          { colors: ["dp6", "lt18"], label: "dp6 深黃橙（暗）＋lt18 亮藍紫（亮）" }
        ] }
    ]
  }
];

// ---- Node 匯出 ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    HARMONY_OVERVIEW: HARMONY_OVERVIEW,
    HARMONY_MATRIX: HARMONY_MATRIX,
    HARMONY_SECTIONS: HARMONY_SECTIONS
  };
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node tests/harmony-data.test.js`
Expected: PASS（輸出 `Harmony structure tests passed`）

- [ ] **Step 5: Commit**

```bash
git add src/js/harmony-data.js tests/harmony-data.test.js
git commit -m "feat: add M2-U6 color harmony content data with classification matrix"
```

---

## Task 3: 領域規則驗證（逐例自動把關）

**Files:**
- Test: `tests/harmony-data.test.js`（檔尾新增規則驗證段）

- [ ] **Step 1: 在 `tests/harmony-data.test.js` 檔尾新增規則驗證**

在 `console.log("Harmony structure tests passed");` 之後加入：

```javascript
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
          var comp = ((hues[b] + 12 - 1) % 24) + 1; // 補色
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
      }
      if (t === "tone-on-tone") {
        assert.strictEqual(new Set(hues).size, 1, label + "：色相統一");
        assert.ok(toneDist(tones[0], tones[1]) >= 150,
          label + "：色調明度差顯著（距離 ≥150）");
      }
    });
  });
});

console.log("Harmony rule tests passed");
```

- [ ] **Step 2: 執行測試**

Run: `node tests/harmony-data.test.js`
Expected: PASS（`Harmony structure tests passed` 與 `Harmony rule tests passed`）

> 若某例未過，**先判斷是資料錯還是門檻錯**：門檻（toneDist 的 100/120/150）依實際 spotPos 微調，但色相幾何（dyad/triad/tetrad/split）與明度方向（natural/complex）為硬規則，不可放寬，應修正資料。

- [ ] **Step 3: Commit**

```bash
git add tests/harmony-data.test.js
git commit -m "test: validate every harmony example against its domain rule"
```

---

## Task 4: 頁面骨架、CSS 與基本渲染（概說＋分類表＋色卡）

> 本專案 DOM 渲染無自動測試，沿用既有慣例：實作後以瀏覽器人工驗證。

**Files:**
- Create: `src/harmony.html`
- Create: `src/css/harmony.css`
- Create: `src/js/harmony.js`

- [ ] **Step 1: 建立 `src/harmony.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>色彩調和論（進階） | JPCA Practice</title>
  <link rel="stylesheet" href="./css/style.css" />
  <link rel="stylesheet" href="./css/harmony.css" />
</head>
<body>
  <header class="harmony-header">
    <h1>色彩調和論與進階配色</h1>
    <a href="./index.html" class="back-link">← 回到首頁</a>
  </header>
  <main class="harmony-main">
    <p id="harmony-overview" class="harmony-overview"></p>
    <section id="harmony-matrix-section">
      <h2 class="group-title">配色技法分類表</h2>
      <div id="harmony-matrix"></div>
    </section>
    <div id="harmony-sections"></div>
  </main>
  <script src="./js/pccs-data.js"></script>
  <script src="./js/harmony-data.js"></script>
  <script src="./js/harmony.js"></script>
</body>
</html>
```

- [ ] **Step 2: 建立 `src/js/harmony.js`（概說＋分類表＋色卡；SVG 於 Task 5 補上）**

```javascript
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
```

- [ ] **Step 3: 建立 `src/css/harmony.css`**

```css
.harmony-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e0e0e0; }
.harmony-header h1 { margin: 0 0 .25rem; font-size: 1.4rem; }
.harmony-main { max-width: 860px; margin: 0 auto; padding: 1rem 1.25rem 4rem; }
.harmony-overview { color: #444; line-height: 1.7; }
.back-link { color: #06c; text-decoration: none; font-size: .9rem; }

.group-title { font-size: 1.15rem; margin: 2rem 0 .5rem; padding-bottom: .3rem;
  border-bottom: 2px solid #333; }
.group-desc { color: #555; line-height: 1.6; margin: 0 0 1rem; }

/* 分類表 */
.matrix-grid { display: grid; grid-template-columns: auto 1fr 1fr; gap: 6px; }
.matrix-corner { background: transparent; }
.matrix-colhead { background: #eef0e6; font-weight: 600; text-align: center;
  padding: .5rem; border-radius: 4px; }
.matrix-rowhead { background: #e8e8e8; font-weight: 600; writing-mode: vertical-rl;
  text-align: center; padding: .5rem .3rem; border-radius: 4px; display: flex;
  align-items: center; justify-content: center; }
.matrix-cell { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px;
  padding: .6rem; display: flex; flex-direction: column; gap: .4rem; min-height: 64px; }
.matrix-item { display: inline-block; color: #06c; text-decoration: none; }
.matrix-item:hover { text-decoration: underline; }
.matrix-straddle { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .75rem; }
.straddle-box { border: 1px dashed #999; border-radius: 4px; padding: .4rem .7rem;
  background: #fff; }
.straddle-note { color: #888; font-size: .8rem; margin-left: .4rem; }

/* 色卡 */
.scheme { margin: 1.25rem 0 1.75rem; }
.scheme-title { font-size: 1rem; margin: 0 0 .3rem; }
.scheme-desc { color: #555; line-height: 1.6; margin: 0 0 .75rem; }
.scheme-examples { display: flex; flex-direction: column; gap: 1rem; }
.scheme-example { }
.scheme-swatch-row { display: flex; height: 56px; border-radius: 4px; overflow: hidden; }
.scheme-swatch { min-width: 0; }
.scheme-note-row { display: flex; margin-top: 4px; }
.scheme-note { text-align: center; font-size: .8rem; color: #666; }
.scheme-caption { font-size: .85rem; color: #444; margin-top: .35rem; }

/* SVG 色相環（Task 5） */
.hue-wheel-mini { display: block; margin: 0 auto .5rem; }

@media (max-width: 480px) {
  .matrix-grid { grid-template-columns: auto 1fr; }
  .matrix-grid .matrix-colhead:nth-child(3) { display: none; }
  .matrix-rowhead { writing-mode: horizontal-tb; }
}
```

> 響應式註記：375px 下分類表退化為單欄堆疊由 Task 4 Step 4 人工檢視微調。

- [ ] **Step 4: 瀏覽器人工驗證**

Run: `node server/index.js`，瀏覽 `http://localhost:8080/harmony.html`
確認：
- 概說顯示；分類表 2×2 grid 正確（色相/色調列、類似/對比欄、各格列出配色法名稱）
- 跨界特例（Camaieu/Faux/Complex）顯示於表下並標明跨界語意
- 點分類表項目可捲動到對應 `#scheme-<id>` 詳解
- 各區段色卡正確上色、PCCS 記號註記對齊、caption 顯示
- 375px 寬度下版面不破

- [ ] **Step 5: Commit**

```bash
git add src/harmony.html src/js/harmony.js src/css/harmony.css
git commit -m "feat: render harmony page — overview, classification matrix, scheme cards"
```

---

## Task 5: 標準配色 SVG 小色相環幾何示意

**Files:**
- Modify: `src/js/harmony.js`（新增 `renderHueWheelMini`，置於 IIFE 內 `renderExample` 之前）
- Modify: `src/css/harmony.css`（已含 `.hue-wheel-mini` 基本樣式，視需要補強）

- [ ] **Step 1: 在 `src/js/harmony.js` 新增 `renderHueWheelMini`**

在 `renderExample` 函式定義之前插入（與既有 pccs 頁同一角度慣例：8:Y 正上方、順時針、色相步進 15°）：

```javascript
  // 標準配色用：小色相環，標出範例取色點並連出幾何
  function renderHueWheelMini(colors) {
    var SVG_NS = "http://www.w3.org/2000/svg";
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
```

> 注意：`renderExample`（Task 4 Step 2）已含 `if (geometry && typeof renderHueWheelMini === "function")` 的呼叫；本任務補上該函式後即自動生效。`getColor` 與 `parseColorNotation` 為 pccs-data.js 提供的全域函式。

- [ ] **Step 2: 瀏覽器人工驗證**

Run: `node server/index.js`，瀏覽 `http://localhost:8080/harmony.html`
確認「標準配色（幾何）」區段每個範例上方出現小色相環：
- Dyad：兩點對向、連線過中心（補色）
- Triad：正三角形
- Tetrad：正方形
- Split Complementary：細長三角（Y 字感）
- 取色點顏色 = 對應 v 色相、8:Y 在正上方

- [ ] **Step 3: Commit**

```bash
git add src/js/harmony.js src/css/harmony.css
git commit -m "feat: add SVG hue-wheel geometry diagrams for standard schemes"
```

---

## Task 6: 首頁新增卡片

**Files:**
- Modify: `src/index.html:24-27`（在 haishoku 卡片之後新增）

- [ ] **Step 1: 在 `src/index.html` 的配色基礎卡片之後新增第 4 張卡片**

在 `<a href="./haishoku.html" ...>...</a>`（第 24-27 行）之後、`</nav>` 之前插入：

```html
      <a href="./harmony.html" class="topic-card">
        <h2>色彩調和論（進階）</h2>
        <p>標準配色幾何・類似／對比分類・自然與 Complex（M2 進階範圍）</p>
      </a>
```

- [ ] **Step 2: 瀏覽器人工驗證**

Run: `node server/index.js`，瀏覽 `http://localhost:8080/index.html`
確認首頁出現第 4 張卡片，點擊連到 harmony.html。

- [ ] **Step 3: Commit**

```bash
git add src/index.html
git commit -m "feat: add color harmony page entry card to home page"
```

---

## Task 7: 全套驗證收尾

- [ ] **Step 1: 跑全部資料層測試**

Run:
```bash
node tests/pccs-data.test.js && node tests/haishoku-data.test.js && node tests/harmony-data.test.js
```
Expected: 全部 PASS（pccs 含 `Task 4 tests passed`；haishoku 兩段；harmony 兩段）

- [ ] **Step 2: 瀏覽器整體人工驗收**

逐項確認（對照 spec「測試與驗收」）：分類表跨格語意、SVG 幾何正確、自然/Complex 明度方向、375px 響應式、首頁第 4 張卡片連結、各配色法說明含印象與服裝應用。

- [ ] **Step 3: 更新記憶**

更新 `memory/pccs-page-status.md`：記錄新增 M2-U6 harmony 教材頁（檔案、測試、spec/plan 路徑），並補一條「Tonal 用 sf/d/ltg/g 排除 s、Bk/Wh 記號已支援」的領域知識（或更新 [[seidaku-not-chroma]] 關聯）。

---

## Self-Review 紀錄

- **Spec 覆蓋**：分類表（Task 4）、標準幾何＋SVG（Task 2/3/5）、類似/對比/Complex 各配色法（Task 2）、印象與服裝應用說明（Task 2 description）、Bk/Wh 與 Tonal 修正（Task 1/2/3）、共用工具下放（Task 1）、首頁卡片（Task 6）、雙測試不互相破壞（Task 1 Step 7、Task 7）。皆有對應任務。
- **Placeholder**：無 TBD；所有程式碼步驟均附完整碼。
- **型別一致**：資料鍵名 `HARMONY_OVERVIEW/HARMONY_MATRIX/HARMONY_SECTIONS`、scheme 欄位 `id/title/titleEn/description/rule/examples`、matrix `cols/rows/cells/straddle` 於 Task 2 定義並於 Task 3、4 一致引用；`renderHueWheelMini` 在 Task 4 呼叫、Task 5 定義（以 `typeof ... === "function"` 守門避免順序問題）。
- **門檻可調**：camaieu/faux/tone-on-tone 的 toneDist 門檻（100/120/150）標明可依實際 spotPos 微調，硬規則（幾何、明度方向）不可放寬。
