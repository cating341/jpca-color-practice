# PCCS 視覺化頁面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 jpca-practice 新增 PCCS 色彩體系視覺化頁面：色相環＋互動色調圖、トーン別色相環 Tone Map、色調印象卡片（中日文）。

**Architecture:** 純 vanilla HTML/CSS/JS、無建置步驟。資料層（`pccs-data.js`，純函式，UMD 模式可供 Node 測試）與渲染層（`pccs.js`，DOM 操作）嚴格分離。所有顏色由 12 個已確認的純色基底＋清濁混色公式即時計算。

**Tech Stack:** HTML5 / CSS3 / ES5-compatible JavaScript / SVG（色相環）/ Node 內建 assert（資料層測試，無框架）

**Spec:** `docs/superpowers/specs/2026-06-02-pccs-visualization-design.md`

**驗證環境:** 背景伺服器執行中 → http://localhost:8080 （`node server/index.js`）

---

## File Structure

| 檔案 | 動作 | 職責 |
|------|------|------|
| `src/js/pccs-data.js` | Create | 色彩資料與純函式：色相、色調、灰階、混色、取色。不碰 DOM。Node 可 require |
| `tests/pccs-data.test.js` | Create | 資料層測試（node:assert，無框架）。`tests/` 不會被部署 |
| `src/pccs.html` | Create | 頁面骨架：4 個區塊的容器與 script 載入 |
| `src/css/pccs.css` | Create | 頁面樣式（不動既有 `style.css`） |
| `src/js/pccs.js` | Create | 渲染與互動：SVG 色相環、色調圖、Tone Map、卡片、彈窗 |
| `src/index.html` | Modify | 加入 PCCS 頁面入口連結 |

---

### Task 1: Git 初始化

**Files:** （無程式碼變更）

- [ ] **Step 1.1: 初始化 git repository 並提交既有檔案**

```bash
cd "C:\Users\User\Documents\ClaudeProject\jpca-practice"
git init
git add .
git status   # 確認 ref/、.superpowers/ 被 .gitignore 排除
git commit -m "chore: initial commit (scaffold + PCCS design docs)"
```

Expected: `git status` 不列出 `ref/` 與 `.superpowers/`；commit 成功。

---

### Task 2: 色彩工具函式（混色核心）

**Files:**
- Create: `src/js/pccs-data.js`
- Test: `tests/pccs-data.test.js`

- [ ] **Step 2.1: 寫失敗測試**

建立 `tests/pccs-data.test.js`：

```js
// 資料層測試 — 以 node tests/pccs-data.test.js 執行，無框架
const assert = require("node:assert");
const path = require("path");
const data = require(path.join(__dirname, "..", "src", "js", "pccs-data.js"));

// ---- 色彩工具函式 ----
assert.deepStrictEqual(data.hexToRgb("#ff0000"), { r: 255, g: 0, b: 0 }, "hexToRgb 紅色");
assert.deepStrictEqual(data.hexToRgb("#e60033"), { r: 230, g: 0, b: 51 }, "hexToRgb v2");
assert.strictEqual(data.rgbToHex(255, 0, 0), "#ff0000", "rgbToHex 紅色");
assert.strictEqual(data.rgbToHex(230, 0, 51), "#e60033", "rgbToHex v2");

// 內插：黑白中點為灰
assert.strictEqual(data.interpolateHex("#000000", "#ffffff"), "#808080", "內插中點");

// ---- 混色（清濁嚴格定義） ----
// 純色：mix 為 null 時原色返回
assert.strictEqual(data.mixColor("#e60033", null), "#e60033", "純色不混色");
// 明清色：純色 + 白
assert.strictEqual(data.mixColor("#000000", { type: "white", amount: 0.5 }), "#808080", "加白 50%");
// 暗清色：純色 + 黑
assert.strictEqual(data.mixColor("#ffffff", { type: "black", amount: 0.5 }), "#808080", "加黑 50%");
// 濁色：純色 + 灰
assert.strictEqual(
  data.mixColor("#ff0000", { type: "gray", amount: 1, gray: "#808080" }),
  "#808080",
  "加灰 100% 等於灰本身"
);
// 加白後每個通道都不會變暗（清色無濁感的數學保證）
(function () {
  const base = data.hexToRgb("#e60033");
  const mixed = data.hexToRgb(data.mixColor("#e60033", { type: "white", amount: 0.25 }));
  assert.ok(mixed.r >= base.r && mixed.g >= base.g && mixed.b >= base.b, "加白不變暗");
})();

console.log("Task 2 tests passed");
```

- [ ] **Step 2.2: 執行測試，確認失敗**

Run: `node tests/pccs-data.test.js`
Expected: FAIL — `Cannot find module '...pccs-data.js'`

- [ ] **Step 2.3: 實作 `src/js/pccs-data.js`（工具函式部分）**

```js
// PCCS 色彩資料與純函式 — 不碰 DOM
// 瀏覽器：以 <script> 載入（定義全域變數）；Node：可 require（測試用）

// ---- 色彩工具函式 ----

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function rgbToHex(r, g, b) {
  function c(v) { return ("0" + Math.round(v).toString(16)).slice(-2); }
  return "#" + c(r) + c(g) + c(b);
}

// 兩色 sRGB 中點內插（用於由偶數色相生成奇數色相）
function interpolateHex(hexA, hexB) {
  var a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex((a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2);
}

// 混色 — 清濁色嚴格定義：
//   明清色 = 純色 + 白（type: "white"）
//   暗清色 = 純色 + 黑（type: "black"）
//   濁色   = 純色 + 灰（type: "gray"，灰階值由 mix.gray 指定）
//   純色   = mix 為 null
function mixColor(vividHex, mix) {
  if (!mix) return vividHex;
  var base = hexToRgb(vividHex);
  var target;
  if (mix.type === "white") target = { r: 255, g: 255, b: 255 };
  else if (mix.type === "black") target = { r: 0, g: 0, b: 0 };
  else target = hexToRgb(mix.gray);
  var a = mix.amount;
  return rgbToHex(
    base.r * (1 - a) + target.r * a,
    base.g * (1 - a) + target.g * a,
    base.b * (1 - a) + target.b * a
  );
}

// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    interpolateHex: interpolateHex,
    mixColor: mixColor
  };
}
```

- [ ] **Step 2.4: 執行測試，確認通過**

Run: `node tests/pccs-data.test.js`
Expected: `Task 2 tests passed`

- [ ] **Step 2.5: Commit**

```bash
git add src/js/pccs-data.js tests/pccs-data.test.js
git commit -m "feat: add PCCS color utility functions with strict clear/muddy mixing model"
```

---

### Task 3: 色相・色調・灰階資料

**Files:**
- Modify: `src/js/pccs-data.js`（接續 Task 2 的檔案，在工具函式之後、Node 匯出之前插入資料定義）
- Test: `tests/pccs-data.test.js`（追加測試）

- [ ] **Step 3.1: 追加失敗測試**

在 `tests/pccs-data.test.js` 的 `console.log("Task 2 tests passed");` 之後追加：

```js
// ---- 色相資料 ----
assert.strictEqual(data.PCCS_HUES.length, 24, "24 色相");
// 編號 1–24 依序排列
data.PCCS_HUES.forEach(function (h, i) {
  assert.strictEqual(h.num, i + 1, "色相編號 " + (i + 1));
});
// 已確認的純色基底值（與設計文件一致）
assert.strictEqual(data.findHue(2).vivid, "#e60033", "v2 赤");
assert.strictEqual(data.findHue(8).vivid, "#ffd400", "v8 黄");
assert.strictEqual(data.findHue(12).vivid, "#009154", "v12 緑（加深版）");
assert.strictEqual(data.findHue(18).vivid, "#19438c", "v18 青（加深版）");
assert.strictEqual(data.findHue(24).vivid, "#b73165", "v24 赤紫（加深版）");
// 奇數色相 = 相鄰偶數內插
assert.strictEqual(
  data.findHue(3).vivid,
  data.interpolateHex(data.findHue(2).vivid, data.findHue(4).vivid),
  "v3 = v2/v4 內插"
);
assert.strictEqual(
  data.findHue(1).vivid,
  data.interpolateHex(data.findHue(24).vivid, data.findHue(2).vivid),
  "v1 = v24/v2 內插（環狀）"
);
// 色相記號
assert.strictEqual(data.findHue(8).symbol, "8:Y", "8:Y 記號");
assert.strictEqual(data.findHue(2).symbol, "2:R", "2:R 記號");

// ---- 色調資料 ----
assert.strictEqual(data.PCCS_TONES.length, 12, "12 色調");
// 清濁分類（JPCA 考點）
var expectedCategories = {
  v: "純色",
  b: "明清色", lt: "明清色", p: "明清色",
  dp: "暗清色", dk: "暗清色",
  s: "濁色", sf: "濁色", d: "濁色", ltg: "濁色", g: "濁色", dkg: "濁色"
};
Object.keys(expectedCategories).forEach(function (id) {
  assert.strictEqual(data.findTone(id).category, expectedCategories[id], id + " 清濁分類");
});
// 混色類型必須與清濁分類一致
data.PCCS_TONES.forEach(function (t) {
  if (t.category === "純色") assert.strictEqual(t.mix, null, t.id + " 純色無混色");
  if (t.category === "明清色") assert.strictEqual(t.mix.type, "white", t.id + " 明清色加白");
  if (t.category === "暗清色") assert.strictEqual(t.mix.type, "black", t.id + " 暗清色加黑");
  if (t.category === "濁色") assert.strictEqual(t.mix.type, "gray", t.id + " 濁色加灰");
});
// 加白量遞增：b < lt < p；加黑量遞增：dp < dk
assert.ok(data.findTone("b").mix.amount < data.findTone("lt").mix.amount, "b < lt 加白量");
assert.ok(data.findTone("lt").mix.amount < data.findTone("p").mix.amount, "lt < p 加白量");
assert.ok(data.findTone("dp").mix.amount < data.findTone("dk").mix.amount, "dp < dk 加黑量");
// 每個色調都有中日文印象詞
data.PCCS_TONES.forEach(function (t) {
  assert.ok(t.impressions.zh.length > 0, t.id + " 中文印象詞");
  assert.ok(t.impressions.jp.length > 0, t.id + " 日文印象詞");
});

// ---- getColor ----
assert.strictEqual(data.getColor("v", 8), "#ffd400", "v8 = 純色");
// 明清色比純色亮（每通道 >=）
(function () {
  var vivid = data.hexToRgb(data.getColor("v", 2));
  var pale = data.hexToRgb(data.getColor("p", 2));
  assert.ok(pale.r >= vivid.r && pale.g >= vivid.g && pale.b >= vivid.b, "p2 比 v2 亮");
})();
// 暗清色比純色暗（每通道 <=）
(function () {
  var vivid = data.hexToRgb(data.getColor("v", 2));
  var dark = data.hexToRgb(data.getColor("dk", 2));
  assert.ok(dark.r <= vivid.r && dark.g <= vivid.g && dark.b <= vivid.b, "dk2 比 v2 暗");
})();

// ---- 無彩色 ----
assert.strictEqual(data.PCCS_GRAYS.length, 9, "9 個無彩色");
assert.strictEqual(data.PCCS_GRAYS[0].symbol, "W", "第一個是白");
assert.strictEqual(data.PCCS_GRAYS[8].symbol, "Bk", "最後一個是黑");
// 明度值遞減
for (var gi = 1; gi < data.PCCS_GRAYS.length; gi++) {
  assert.ok(data.PCCS_GRAYS[gi].value < data.PCCS_GRAYS[gi - 1].value, "灰階明度遞減 " + gi);
}

console.log("Task 3 tests passed");
```

- [ ] **Step 3.2: 執行測試，確認失敗**

Run: `node tests/pccs-data.test.js`
Expected: FAIL — `data.PCCS_HUES is undefined`（Task 2 測試仍通過）

- [ ] **Step 3.3: 在 `src/js/pccs-data.js` 加入資料定義**

在 `mixColor` 函式之後、`// ---- Node 匯出` 之前插入：

```js
// ---- 色相資料 ----
// 偶數 12 色相為基底（純色 HEX 已與 ref 參考圖比對確認；v12–v24 為加深版）
var PCCS_HUE_BASE = [
  { num: 2,  symbol: "2:R",   jpName: "赤",             vivid: "#e60033" },
  { num: 4,  symbol: "4:rO",  jpName: "赤みのだいだい", vivid: "#eb6101" },
  { num: 6,  symbol: "6:yO",  jpName: "黄みのだいだい", vivid: "#f8a900" },
  { num: 8,  symbol: "8:Y",   jpName: "黄",             vivid: "#ffd400" },
  { num: 10, symbol: "10:YG", jpName: "黄緑",           vivid: "#aacf53" },
  { num: 12, symbol: "12:G",  jpName: "緑",             vivid: "#009154" },
  { num: 14, symbol: "14:BG", jpName: "青緑",           vivid: "#007d79" },
  { num: 16, symbol: "16:gB", jpName: "緑みの青",       vivid: "#006491" },
  { num: 18, symbol: "18:B",  jpName: "青",             vivid: "#19438c" },
  { num: 20, symbol: "20:V",  jpName: "青紫",           vivid: "#4c3982" },
  { num: 22, symbol: "22:P",  jpName: "紫",             vivid: "#863f86" },
  { num: 24, symbol: "24:RP", jpName: "赤紫",           vivid: "#b73165" }
];

// 奇數色相的記號與名稱（顏色由相鄰偶數色相內插）
var PCCS_HUE_ODD_INFO = [
  { num: 1,  symbol: "1:pR",  jpName: "紫みの赤" },
  { num: 3,  symbol: "3:yR",  jpName: "黄みの赤" },
  { num: 5,  symbol: "5:O",   jpName: "だいだい" },
  { num: 7,  symbol: "7:rY",  jpName: "赤みの黄" },
  { num: 9,  symbol: "9:gY",  jpName: "緑みの黄" },
  { num: 11, symbol: "11:yG", jpName: "黄みの緑" },
  { num: 13, symbol: "13:bG", jpName: "青みの緑" },
  { num: 15, symbol: "15:BG", jpName: "青緑" },
  { num: 17, symbol: "17:B",  jpName: "青" },
  { num: 19, symbol: "19:pB", jpName: "紫みの青" },
  { num: 21, symbol: "21:bP", jpName: "青みの紫" },
  { num: 23, symbol: "23:rP", jpName: "赤みの紫" }
];

// 組合成 1–24 完整色相清單
var PCCS_HUES = (function () {
  var hues = [];
  for (var i = 0; i < 12; i++) {
    var even = PCCS_HUE_BASE[i];
    var prevEven = PCCS_HUE_BASE[(i + 11) % 12]; // 環狀：1 在 24 與 2 之間
    var odd = PCCS_HUE_ODD_INFO[i];
    hues.push({
      num: odd.num, symbol: odd.symbol, jpName: odd.jpName,
      vivid: interpolateHex(prevEven.vivid, even.vivid)
    });
    hues.push({ num: even.num, symbol: even.symbol, jpName: even.jpName, vivid: even.vivid });
  }
  return hues;
})();

// ---- 色調資料 ----
// category：純色｜明清色（純色+白）｜暗清色（純色+黑）｜濁色（純色+灰）
// spotPos：區塊 2 色調圖座標（px，容器 380×360）
// wheelPos：區塊 3 Tone Map 花環左上角座標（px，容器 900×640）
var PCCS_TONES = [
  { id: "v", jpName: "ビビッド", jpKana: "さえた", zhName: "鮮豔", category: "純色",
    mix: null,
    spotPos: { x: 290, y: 135 }, wheelPos: { x: 560, y: 160 },
    impressions: { zh: ["鮮豔", "活潑", "強烈", "醒目"], jp: ["派手な", "いきいきした", "強い", "鮮やかな"] } },
  { id: "b", jpName: "ブライト", jpKana: "あかるい", zhName: "明亮", category: "明清色",
    mix: { type: "white", amount: 0.25 },
    spotPos: { x: 200, y: 45 }, wheelPos: { x: 400, y: 70 },
    impressions: { zh: ["明亮", "健康", "開朗"], jp: ["明るい", "健康的な", "陽気な"] } },
  { id: "s", jpName: "ストロング", jpKana: "つよい", zhName: "強烈", category: "濁色",
    mix: { type: "gray", amount: 0.20, gray: "#808080" },
    spotPos: { x: 200, y: 135 }, wheelPos: { x: 400, y: 230 },
    impressions: { zh: ["強烈", "熱情", "有活力"], jp: ["強い", "情熱的な", "動的な"] } },
  { id: "dp", jpName: "ディープ", jpKana: "こい", zhName: "深", category: "暗清色",
    mix: { type: "black", amount: 0.35 },
    spotPos: { x: 200, y: 225 }, wheelPos: { x: 400, y: 390 },
    impressions: { zh: ["深沉", "充實", "傳統", "和風"], jp: ["深い", "充実した", "伝統的な", "和風の"] } },
  { id: "lt", jpName: "ライト", jpKana: "あさい", zhName: "淺", category: "明清色",
    mix: { type: "white", amount: 0.50 },
    spotPos: { x: 110, y: 10 }, wheelPos: { x: 250, y: 20 },
    impressions: { zh: ["淺淡", "輕盈", "清爽", "童趣"], jp: ["浅い", "軽い", "さわやかな", "子供っぽい"] } },
  { id: "sf", jpName: "ソフト", jpKana: "やわらかい", zhName: "柔和", category: "濁色",
    mix: { type: "gray", amount: 0.50, gray: "#b0b0b0" },
    spotPos: { x: 110, y: 100 }, wheelPos: { x: 250, y: 170 },
    impressions: { zh: ["柔和", "溫和", "朦朧"], jp: ["やわらかい", "おだやかな", "ぼんやりした"] } },
  { id: "d", jpName: "ダル", jpKana: "にぶい", zhName: "鈍", category: "濁色",
    mix: { type: "gray", amount: 0.50, gray: "#787878" },
    spotPos: { x: 110, y: 190 }, wheelPos: { x: 250, y: 320 },
    impressions: { zh: ["鈍重", "黯淡", "中性"], jp: ["にぶい", "くすんだ", "中間的な"] } },
  { id: "dk", jpName: "ダーク", jpKana: "くらい", zhName: "暗", category: "暗清色",
    mix: { type: "black", amount: 0.60 },
    spotPos: { x: 110, y: 280 }, wheelPos: { x: 250, y: 470 },
    impressions: { zh: ["暗沉", "成熟", "堅實", "圓融"], jp: ["暗い", "大人っぽい", "丈夫な", "円熟した"] } },
  { id: "p", jpName: "ペール", jpKana: "うすい", zhName: "淡", category: "明清色",
    mix: { type: "white", amount: 0.75 },
    spotPos: { x: 20, y: 10 }, wheelPos: { x: 110, y: 20 },
    impressions: { zh: ["輕薄", "輕柔", "溫柔", "可愛", "清淡"], jp: ["薄い", "軽い", "やさしい", "かわいい", "あっさりした"] } },
  { id: "ltg", jpName: "ライトグレイッシュ", jpKana: "あかるいはいみの", zhName: "淺灰", category: "濁色",
    mix: { type: "gray", amount: 0.70, gray: "#c0c0c0" },
    spotPos: { x: 20, y: 100 }, wheelPos: { x: 110, y: 170 },
    impressions: { zh: ["帶亮灰的", "沉穩", "文靜", "雅緻"], jp: ["明るい灰みの", "落ち着いた", "おとなしい", "しぶい"] } },
  { id: "g", jpName: "グレイッシュ", jpKana: "はいみの", zhName: "灰", category: "濁色",
    mix: { type: "gray", amount: 0.75, gray: "#707070" },
    spotPos: { x: 20, y: 190 }, wheelPos: { x: 110, y: 320 },
    impressions: { zh: ["帶灰的", "混濁", "樸素"], jp: ["灰みの", "濁った", "地味な"] } },
  { id: "dkg", jpName: "ダークグレイッシュ", jpKana: "くらいはいみの", zhName: "暗灰", category: "濁色",
    mix: { type: "gray", amount: 0.80, gray: "#383838" },
    spotPos: { x: 20, y: 280 }, wheelPos: { x: 110, y: 470 },
    impressions: { zh: ["帶暗灰的", "陰鬱", "厚重", "堅硬", "陽剛"], jp: ["暗い灰みの", "陰気な", "重い", "固い", "男性的な"] } }
];

// ---- 無彩色（灰階軸） ----
var PCCS_GRAYS = [
  { symbol: "W",    jpName: "ホワイト",         value: 9.5, hex: "#f5f5f5" },
  { symbol: "ltGy", jpName: "ライトグレイ",     value: 8.5, hex: "#d9d9d9" },
  { symbol: "ltGy", jpName: "ライトグレイ",     value: 7.5, hex: "#bfbfbf" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 6.5, hex: "#a6a6a6" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 5.5, hex: "#8c8c8c" },
  { symbol: "mGy",  jpName: "メディアムグレイ", value: 4.5, hex: "#737373" },
  { symbol: "dkGy", jpName: "ダークグレイ",     value: 3.5, hex: "#595959" },
  { symbol: "dkGy", jpName: "ダークグレイ",     value: 2.5, hex: "#404040" },
  { symbol: "Bk",   jpName: "ブラック",         value: 1.5, hex: "#262626" }
];

// ---- 查詢函式 ----
function findHue(num) {
  for (var i = 0; i < PCCS_HUES.length; i++) {
    if (PCCS_HUES[i].num === num) return PCCS_HUES[i];
  }
  return null;
}

function findTone(id) {
  for (var i = 0; i < PCCS_TONES.length; i++) {
    if (PCCS_TONES[i].id === id) return PCCS_TONES[i];
  }
  return null;
}

// 取得「色調 × 色相」的顏色（例：getColor("lt", 8) = 淺色調的黃）
function getColor(toneId, hueNum) {
  return mixColor(findHue(hueNum).vivid, findTone(toneId).mix);
}
```

同時更新檔案底部的 Node 匯出：

```js
// ---- Node 匯出（測試用；瀏覽器中此區塊不執行） ----
if (typeof module !== "undefined" && module.exports) {
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
    getColor: getColor
  };
}
```

- [ ] **Step 3.4: 執行測試，確認通過**

Run: `node tests/pccs-data.test.js`
Expected: `Task 2 tests passed` 與 `Task 3 tests passed`

- [ ] **Step 3.5: Commit**

```bash
git add src/js/pccs-data.js tests/pccs-data.test.js
git commit -m "feat: add PCCS hue/tone/gray data with confirmed vivid base colors"
```

---

### Task 4: 頁面骨架（pccs.html + pccs.css + 首頁連結）

**Files:**
- Create: `src/pccs.html`
- Create: `src/css/pccs.css`
- Modify: `src/index.html`

- [ ] **Step 4.1: 建立 `src/pccs.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PCCS 色彩體系 | JPCA Practice</title>
  <link rel="stylesheet" href="./css/style.css" />
  <link rel="stylesheet" href="./css/pccs.css" />
</head>
<body>
  <header class="pccs-header">
    <h1>PCCS 色彩體系</h1>
    <a href="./index.html" class="back-link">← 回到首頁</a>
  </header>

  <main class="pccs-main">
    <!-- 區塊 2：色彩互動區 -->
    <section id="interactive-section" class="pccs-section">
      <h2>色相 × 色調</h2>
      <p class="section-desc">點擊右側色相環的任一色相，左側色調圖會即時顯示「該色相 × 12 色調」的顏色。點擊色調色塊可查看詳情。</p>
      <div class="interactive-wrap">
        <div class="tone-spot-area">
          <div id="tone-spot-map" class="tone-spot-map">
            <div class="axis-label axis-y">明度　高 → 低</div>
            <div class="axis-label axis-x">彩度　低（2s）─────→ 高（9s）</div>
          </div>
        </div>
        <div class="hue-wheel-area">
          <p class="selected-hue-label">目前色相：<b id="selected-hue-name"></b></p>
          <svg id="hue-wheel" viewBox="-170 -170 340 340"></svg>
        </div>
      </div>
    </section>

    <!-- 區塊 3：Tone Map -->
    <section id="tone-map-section" class="pccs-section">
      <h2>トーン別色相環（Tone Map）</h2>
      <p class="section-desc">12 個色調的色相環，依「明度（縱）× 彩度（橫）」配置，左側為無彩色灰階軸。點擊 v 大色環的色相，所有色調中的同色相會高亮。</p>
      <div class="tone-map-scroll">
        <div id="tone-map" class="tone-map-wrap"></div>
      </div>
    </section>

    <!-- 區塊 4：印象卡片 -->
    <section id="impression-section" class="pccs-section">
      <h2>色調的印象（トーンのイメージ）</h2>
      <p class="section-desc">各色調代表的印象（考試重點）。點擊色票可查看詳情。</p>
      <div id="impression-cards" class="impression-cards"></div>
    </section>
  </main>

  <!-- 詳情彈窗 -->
  <div id="popup-backdrop" class="popup-backdrop hidden"></div>
  <div id="detail-popup" class="detail-popup hidden">
    <button id="popup-close" class="popup-close" aria-label="關閉">×</button>
    <div id="popup-body"></div>
  </div>

  <script src="./js/pccs-data.js"></script>
  <script src="./js/pccs.js"></script>
</body>
</html>
```

- [ ] **Step 4.2: 建立 `src/css/pccs.css`**

```css
/* PCCS 視覺化頁面樣式 */

/* ---- 版面 ---- */
.pccs-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
}

.back-link { color: var(--accent); text-decoration: none; font-size: 0.9rem; }
.back-link:hover { text-decoration: underline; }

.pccs-main { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 3rem; }

.pccs-section { margin-bottom: 3rem; }
.pccs-section h2 { border-bottom: 2px solid var(--accent); padding-bottom: 0.4rem; }
.section-desc { color: #555; font-size: 0.9rem; }

/* ---- 區塊 2：色彩互動區 ---- */
.interactive-wrap { display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; }

.tone-spot-area { flex: 1; min-width: 400px; }
.tone-spot-map { position: relative; width: 400px; height: 400px; }

.axis-label { position: absolute; font-size: 0.7rem; color: #999; }
.axis-y {
  left: -10px; top: 0; bottom: 40px;
  writing-mode: vertical-rl; text-align: center;
  border-right: 1px dashed #ddd; padding-right: 4px;
}
.axis-x {
  bottom: 10px; left: 10px; right: 0;
  text-align: center; border-top: 1px dashed #ddd; padding-top: 4px;
}

.tone-spot {
  position: absolute;
  width: 68px; height: 68px;
  border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: background-color 0.3s, transform 0.15s;
}
.tone-spot:hover { transform: scale(1.07); }
.tone-spot b { font-size: 0.85rem; }
.tone-spot span { font-size: 0.55rem; opacity: 0.85; }

.hue-wheel-area { flex: 1; min-width: 340px; display: flex; flex-direction: column; align-items: center; }
.selected-hue-label { font-size: 0.9rem; }
#hue-wheel { width: 100%; max-width: 360px; height: auto; }

#hue-wheel .hue-seg { cursor: pointer; stroke: var(--bg); stroke-width: 1; }
#hue-wheel .hue-seg:hover { opacity: 0.85; }
#hue-wheel .hue-seg.active { stroke: var(--fg); stroke-width: 2.5; }
#hue-wheel text { font-size: 9px; fill: #555; pointer-events: none; }
#hue-wheel text.active { font-weight: bold; fill: var(--fg); }

/* ---- 區塊 3：Tone Map ---- */
.tone-map-scroll { overflow-x: auto; }
.tone-map-wrap { position: relative; width: 900px; height: 660px; }

/* 花環 */
.flower-wheel { position: absolute; }
.flower-wheel .petal {
  position: absolute;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s;
}
.flower-wheel .petal:hover { filter: brightness(1.1); }
.flower-wheel .petal.highlight {
  outline: 3px solid var(--fg);
  outline-offset: 1px;
  z-index: 2;
}
.flower-wheel .petal-num {
  position: absolute;
  font-size: 9px; color: #888;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.wheel-center {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--bg);
  border-radius: 50%;
  text-align: center;
  z-index: 1;
}
.wheel-center b { font-size: 1rem; }
.wheel-center .center-jp { font-size: 0.65rem; color: #555; }
.wheel-center .center-kana { font-size: 0.55rem; color: #999; }
.wheel-center .center-note { font-size: 0.5rem; color: #bbb; }

/* 灰階軸 */
.gray-axis { position: absolute; left: 10px; top: 20px; width: 80px; }
.gray-axis .gray-block {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer;
  margin-bottom: 2px;
}
.gray-axis .gray-chip { width: 40px; height: 56px; border: 1px solid #ddd; }
.gray-axis .gray-label { font-size: 0.6rem; color: #777; }

/* ---- 區塊 4：印象卡片 ---- */
.impression-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.impression-card {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1rem;
}
.impression-card h3 { margin: 0 0 0.2rem; font-size: 1rem; }
.impression-card .card-zh-name { color: #777; font-size: 0.85rem; }
.impression-card .category-badge {
  display: inline-block;
  font-size: 0.65rem;
  padding: 0.1rem 0.5rem;
  border-radius: 99px;
  background: #f0f0f0;
  color: #555;
  margin-left: 0.5rem;
  vertical-align: middle;
}
.impression-card .card-swatches { display: flex; gap: 3px; margin: 0.6rem 0; }
.impression-card .card-swatch {
  width: 24px; height: 24px; border-radius: 3px; cursor: pointer;
}
.impression-card .card-swatch:hover { filter: brightness(1.1); }
.impression-card .card-impressions { font-size: 0.8rem; color: #444; line-height: 1.7; }
.impression-card .card-impressions .imp-label { color: #999; font-size: 0.7rem; }

/* ---- 詳情彈窗 ---- */
.popup-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 10;
}
.detail-popup {
  position: fixed;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 280px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  z-index: 11;
}
.popup-close {
  position: absolute; right: 0.6rem; top: 0.6rem;
  border: none; background: none;
  font-size: 1.3rem; cursor: pointer; color: #999;
}
.popup-color-chip { width: 100%; height: 80px; border-radius: 8px; margin-bottom: 0.8rem; }
.popup-notation { font-size: 1.4rem; font-weight: bold; margin: 0; }
.popup-detail-row { font-size: 0.85rem; color: #555; margin: 0.3rem 0; }
.popup-detail-row b { color: var(--fg); }

.hidden { display: none; }

/* ---- 響應式 ---- */
@media (max-width: 900px) {
  .interactive-wrap { flex-direction: column-reverse; align-items: center; }
  .tone-spot-area { min-width: 0; }
  .impression-cards { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4.3: 修改 `src/index.html` 加入入口連結**

把：

```html
  <main>
    <p>JPCA 測驗題目練習。Edit <code>src/index.html</code> to get started.</p>
  </main>
```

改為：

```html
  <main>
    <p>JPCA 測驗題目練習。</p>
    <nav class="topic-nav">
      <a href="./pccs.html" class="topic-card">
        <h2>PCCS 色彩體系</h2>
        <p>色相環・トーン別色相環・色調印象（中日對照）</p>
      </a>
    </nav>
  </main>
```

並在 `src/css/style.css` 末尾追加：

```css
.topic-nav { margin-top: 1.5rem; }

.topic-card {
  display: block;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: var(--fg);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.topic-card:hover { border-color: var(--accent); box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12); }
.topic-card h2 { margin: 0 0 0.3rem; color: var(--accent); font-size: 1.1rem; }
.topic-card p { margin: 0; font-size: 0.85rem; color: #777; }
```

（註：此為新增區塊，不修改 `style.css` 既有規則 — 與設計文件「不修改」的意圖一致：既有樣式不變，僅追加。）

- [ ] **Step 4.4: 驗證頁面載入**

Run: `curl -s http://localhost:8080/pccs.html | grep -c "pccs-section"`
Expected: `3`（三個區塊容器存在）

Run: `curl -s http://localhost:8080/ | grep -c "pccs.html"`
Expected: `1`（首頁有入口連結）

瀏覽器檢查 http://localhost:8080/ → 首頁有「PCCS 色彩體系」卡片，點擊進入 pccs.html，顯示三個區塊標題與返回連結（內容尚為空白，正常）。

- [ ] **Step 4.5: Commit**

```bash
git add src/pccs.html src/css/pccs.css src/css/style.css src/index.html
git commit -m "feat: add PCCS page skeleton, styles, and home page navigation"
```

---

### Task 5: 色相環 SVG ＋ 色調圖 spots ＋ 連動互動（區塊 2）

**Files:**
- Create: `src/js/pccs.js`

- [ ] **Step 5.1: 建立 `src/js/pccs.js`（區塊 2 渲染與互動）**

```js
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

  // ---- 詳情彈窗（Task 6 實作，此處先放佔位避免 ReferenceError） ----

  function showDetail(toneId, hueNum) {
    // Task 6 實作
  }

  // ---- 初始化 ----

  renderHueWheel();
  renderToneSpots();
  selectHue(8); // 預設 8:Y
})();
```

- [ ] **Step 5.2: 驗證**

瀏覽器開啟 http://localhost:8080/pccs.html，檢查：

1. 右側出現 24 等分色相環，8:Y 在正上方，標籤順時針 8:Y → 9:gY → ⋯
2. 左側出現 12 個色調圓點，預設顯示黃色系（8:Y），p 最淡、v 最鮮豔、dkg 最暗濁
3. 點擊色相環不同色相（如 2:R、18:B），色調圖即時變色
4. 「目前色相」標籤隨點擊更新
5. Console 無錯誤

- [ ] **Step 5.3: Commit**

```bash
git add src/js/pccs.js
git commit -m "feat: render interactive hue wheel and tone map with hue-tone sync"
```

---

### Task 6: 詳情彈窗

**Files:**
- Modify: `src/js/pccs.js`（替換 `showDetail` 佔位函式）

- [ ] **Step 6.1: 實作 `showDetail` 與彈窗開關**

把 Task 5 中的佔位函式：

```js
  function showDetail(toneId, hueNum) {
    // Task 6 實作
  }
```

替換為：

```js
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
```

並在初始化區塊（`renderHueWheel();` 之前）加入彈窗關閉事件：

```js
  document.getElementById("popup-close").addEventListener("click", hideDetail);
  document.getElementById("popup-backdrop").addEventListener("click", hideDetail);
```

- [ ] **Step 6.2: 驗證**

瀏覽器 http://localhost:8080/pccs.html：

1. 點擊色調圖任一色塊（如 v）→ 彈窗顯示：大色塊、記號（如 `v8`）、色調中日文名、色相名、HEX、清濁分類「純色（未混合）」
2. 點擊 lt 色塊 → 清濁分類顯示「明清色（純色＋白 50%）」
3. 點擊 g 色塊 → 顯示「濁色（純色＋灰 75%）」
4. 點 × 或背景 → 彈窗關閉
5. Console 無錯誤

- [ ] **Step 6.3: Commit**

```bash
git add src/js/pccs.js
git commit -m "feat: add color detail popup with PCCS notation and clear/muddy category"
```

---

### Task 7: Tone Map トーン別色相環（區塊 3）

**Files:**
- Modify: `src/js/pccs.js`

- [ ] **Step 7.1: 加入花環渲染函式與 Tone Map 組裝**

在 `// ---- 初始化 ----` 之前插入：

```js
  // ---- 區塊 3：Tone Map（トーン別色相環） ----

  var EVEN_HUES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  var ALL_HUES = PCCS_HUES.map(function (h) { return h.num; });

  // 花環：petals 繞中心排列，8 在正上方、順時針
  // opts: { toneId, hueNums, diameter, x, y, large }
  function renderFlowerWheel(parent, opts) {
    var tone = findTone(opts.toneId);
    var wheel = document.createElement("div");
    wheel.className = "flower-wheel";
    wheel.style.left = opts.x + "px";
    wheel.style.top = opts.y + "px";
    wheel.style.width = opts.diameter + "px";
    wheel.style.height = opts.diameter + "px";

    var n = opts.hueNums.length;
    var petalW = opts.large ? 30 : 20;
    var petalH = opts.large ? 52 : 32;
    var center = opts.diameter / 2;
    var idx8 = opts.hueNums.indexOf(8);

    opts.hueNums.forEach(function (hueNum, i) {
      var angle = (i - idx8) * (360 / n);

      var petal = document.createElement("div");
      petal.className = "petal";
      petal.dataset.tone = opts.toneId;
      petal.dataset.hue = hueNum;
      petal.style.width = petalW + "px";
      petal.style.height = petalH + "px";
      petal.style.left = (center - petalW / 2) + "px";
      petal.style.top = "0px";
      petal.style.transformOrigin = (petalW / 2) + "px " + center + "px";
      petal.style.transform = "rotate(" + angle + "deg)";
      petal.style.background = getColor(opts.toneId, hueNum);
      petal.addEventListener("click", function () {
        showDetail(opts.toneId, hueNum);
        if (opts.toneId === "v") highlightHueAcrossTones(hueNum);
      });
      wheel.appendChild(petal);

      // 色相編號（花瓣外側）
      var lp = polar(center + 10, angle);
      var num = document.createElement("div");
      num.className = "petal-num";
      num.style.left = (center + lp.x) + "px";
      num.style.top = (center + lp.y) + "px";
      num.textContent = hueNum;
      wheel.appendChild(num);
    });

    // 中心標籤
    var centerEl = document.createElement("div");
    centerEl.className = "wheel-center";
    var centerSize = opts.diameter - petalH * 2 - 16;
    centerEl.style.width = centerSize + "px";
    centerEl.style.height = centerSize + "px";
    centerEl.innerHTML =
      "<b>" + tone.id + "</b>" +
      '<span class="center-jp">' + tone.jpName + "</span>" +
      '<span class="center-kana">（' + tone.jpKana + "）</span>" +
      (opts.note ? '<span class="center-note">' + opts.note + "</span>" : "");
    wheel.appendChild(centerEl);

    parent.appendChild(wheel);
  }

  // 灰階軸（W → Bk）
  function renderGrayAxis(parent) {
    var axis = document.createElement("div");
    axis.className = "gray-axis";
    PCCS_GRAYS.forEach(function (gray) {
      var block = document.createElement("div");
      block.className = "gray-block";
      block.innerHTML =
        '<div class="gray-chip" style="background:' + gray.hex + '"></div>' +
        '<div class="gray-label">' + gray.symbol + "<br>" + gray.value + "</div>";
      block.addEventListener("click", function () { showGrayDetail(gray); });
      axis.appendChild(block);
    });
    parent.appendChild(axis);
  }

  // 點擊 v 大色環 → 高亮所有色調中的同色相花瓣
  function highlightHueAcrossTones(hueNum) {
    var petals = document.querySelectorAll("#tone-map .petal");
    for (var i = 0; i < petals.length; i++) {
      if (parseInt(petals[i].dataset.hue, 10) === hueNum) {
        petals[i].classList.add("highlight");
      } else {
        petals[i].classList.remove("highlight");
      }
    }
  }

  function renderToneMap() {
    var container = document.getElementById("tone-map");

    // 灰階軸（最左側）
    renderGrayAxis(container);

    // 11 個小花環＋ v 大色環（位置定義於 pccs-data.js 的 wheelPos）
    PCCS_TONES.forEach(function (tone) {
      var isV = tone.id === "v";
      renderFlowerWheel(container, {
        toneId: tone.id,
        hueNums: isV ? ALL_HUES : EVEN_HUES,
        diameter: isV ? 300 : 130,
        x: tone.wheelPos.x,
        y: tone.wheelPos.y,
        large: isV,
        note: tone.id === "s" ? "※配色カード199a未収録" : null
      });
    });
  }
```

並在初始化區塊中，`selectHue(8);` 之前加入：

```js
  renderToneMap();
```

- [ ] **Step 7.2: 驗證**

瀏覽器 http://localhost:8080/pccs.html，捲動到「トーン別色相環」區塊：

1. 最左側：9 個灰階色塊直向排列（W 9.5 最上 → Bk 1.5 最下）
2. v 大色環在右側：24 片花瓣、編號 1–24、8 在正上方
3. 11 個小花環（12 片花瓣、偶數編號），位置關係與 `ref/tone-map.jpeg` 一致：
   - 上排：p、lt、b　／　中排：ltg、sf、s、(v)　／　下排：g、d、dp　／　底排：dkg、dk
4. s 花環中心有「※配色カード199a未収録」註記
5. 明清色花環（p/lt/b）無灰濁感；濁色花環（ltg/sf/d/g/dkg）明顯帶灰
6. 點擊 v 大色環任一花瓣 → 彈窗顯示詳情 ＋ 所有小花環的同色相花瓣出現黑色外框
7. 點擊灰階色塊 → 顯示無彩色詳情（如 `mGy-5.5`）
8. Console 無錯誤

並與 `ref/tone-map.jpeg` 並列目視比對整體排版。

- [ ] **Step 7.3: Commit**

```bash
git add src/js/pccs.js
git commit -m "feat: add tone map with flower wheels, gray axis, and cross-tone hue highlight"
```

---

### Task 8: 色調印象卡片（區塊 4）

**Files:**
- Modify: `src/js/pccs.js`

- [ ] **Step 8.1: 加入印象卡片渲染**

在 `renderToneMap` 函式之後插入：

```js
  // ---- 區塊 4：色調印象卡片 ----

  function renderImpressionCards() {
    var container = document.getElementById("impression-cards");

    PCCS_TONES.forEach(function (tone) {
      var card = document.createElement("div");
      card.className = "impression-card";

      var swatchesHtml = EVEN_HUES.map(function (hueNum) {
        return '<div class="card-swatch" data-tone="' + tone.id + '" data-hue="' + hueNum + '" ' +
               'style="background:' + getColor(tone.id, hueNum) + '"></div>';
      }).join("");

      card.innerHTML =
        "<h3>" + tone.id + "　" + tone.jpName + "（" + tone.jpKana + "）" +
        '<span class="category-badge">' + tone.category + "</span></h3>" +
        '<p class="card-zh-name">' + tone.zhName + "色調</p>" +
        '<div class="card-swatches">' + swatchesHtml + "</div>" +
        '<div class="card-impressions">' +
        '<span class="imp-label">イメージ（日）：</span>' + tone.impressions.jp.join("、") + "<br>" +
        '<span class="imp-label">印象（中）：</span>' + tone.impressions.zh.join("、") +
        "</div>";

      container.appendChild(card);
    });

    // 色票點擊 → 詳情（事件委派）
    container.addEventListener("click", function (e) {
      var target = e.target;
      if (target.classList.contains("card-swatch")) {
        showDetail(target.dataset.tone, parseInt(target.dataset.hue, 10));
      }
    });
  }
```

並在初始化區塊中，`selectHue(8);` 之前加入：

```js
  renderImpressionCards();
```

- [ ] **Step 8.2: 驗證**

瀏覽器 http://localhost:8080/pccs.html，捲動到「色調的印象」區塊：

1. 12 張卡片依序：v、b、s、dp、lt、sf、d、dk、p、ltg、g、dkg
2. 每張卡片：記號＋日文名（假名）＋清濁分類徽章＋中文名＋12 色色票＋中日文印象詞
3. v 卡片印象：派手な、いきいきした⋯／鮮豔、活潑⋯
4. 點擊任一色票 → 詳情彈窗
5. Console 無錯誤

- [ ] **Step 8.3: Commit**

```bash
git add src/js/pccs.js
git commit -m "feat: add tone impression cards with bilingual descriptions"
```

---

### Task 9: 資料層回歸測試＋響應式＋最終驗證

**Files:**
- Modify: `src/css/pccs.css`（必要時微調）
- Test: `tests/pccs-data.test.js`

- [ ] **Step 9.1: 執行資料層測試（回歸）**

Run: `node tests/pccs-data.test.js`
Expected: `Task 2 tests passed` 與 `Task 3 tests passed`

- [ ] **Step 9.2: 響應式驗證**

瀏覽器 DevTools 切換裝置模擬（375px 寬，iPhone SE）：

1. 區塊 2：色相環在上、色調圖在下，皆水平置中、無溢出
2. 區塊 3：Tone Map 可水平捲動，版面不打散
3. 區塊 4：卡片變為單欄
4. 彈窗在窄螢幕上不超出視窗

若有問題，調整 `pccs.css` 的 `@media (max-width: 900px)` 區塊後重新驗證。

- [ ] **Step 9.3: 完整檢查清單（對照設計文件）**

逐項確認 spec「測試方式」章節的檢查清單：

- [ ] 色相環為 24 等分離散色塊，8:Y 在正上方，順時針遞增
- [ ] 預設載入時色調圖顯示 8:Y 的 12 色調
- [ ] 點擊每個色相，色調圖即時更新
- [ ] Tone Map：v 大色環（24 色）＋ 11 個小花環（12 色）＋ 灰階軸，位置依 ref 圖
- [ ] 點 v 大色環花瓣 → 小花環對應色相高亮
- [ ] 明清色（b/lt/p）與暗清色（dp/dk）無灰濁感；濁色有明顯灰味
- [ ] 點擊任一色塊／花瓣顯示正確的 PCCS 記號、HEX、清濁分類
- [ ] 12 張印象卡片中日文內容正確
- [ ] 手機寬度（375px）下版面正常
- [ ] 首頁 ↔ PCCS 頁雙向連結正常
- [ ] 與 `ref/tone-map.jpeg`、`ref/IMG_PCCS_color.JPEG` 並列目視比對

- [ ] **Step 9.4: 最終 Commit**

```bash
git add -A
git status   # 確認只有預期的檔案變更
git commit -m "feat: complete PCCS visualization page (hue wheel, tone map, impressions)"
```

---

## Self-Review 紀錄

**Spec coverage：**
- 區塊 1 頁首 → Task 4 ✓
- 區塊 2 色相環＋色調圖＋互動 → Task 5 ✓
- 詳情彈窗（含清濁分類）→ Task 6 ✓
- 區塊 3 Tone Map（花環＋灰階軸＋高亮）→ Task 7 ✓
- 區塊 4 印象卡片 → Task 8 ✓
- 清濁混色模型 → Task 2 ✓／色彩資料 → Task 3 ✓
- 響應式＋整體驗證 → Task 9 ✓

**Type consistency：**
- `getColor(toneId, hueNum)`、`findHue(num)`、`findTone(id)` 在 Task 3 定義，Task 5–8 使用 ✓
- `tone.spotPos`／`tone.wheelPos`／`tone.category`／`tone.impressions` 在 Task 3 定義，Task 5/7/8 使用 ✓
- `hexToRgb` 在 Task 2 定義（瀏覽器全域），Task 5 的 `textColorFor` 使用 ✓
- `showDetail`／`showGrayDetail` 在 Task 6 定義，Task 7/8 使用（Task 5 有佔位避免 ReferenceError）✓
