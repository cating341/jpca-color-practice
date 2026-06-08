# 色彩調和論與進階配色（M2-U6）教材頁 — 設計文件

- 日期：2026-06-09
- 單元：M2-U6 色彩調和論與進階配色
- 來源：`ref/u6-color-harmony.json`（骨架）＋ `ref/IMG_1324.JPEG`（官方分類表）
- 角色：以 JPCA 個人色彩專家把關內容正確性

## 目標

把 M2-U6「色彩調和論與進階配色」做成一個**獨立的閱讀式教材頁**，內容完整、準確、附有色卡與說明，作為 M1「配色基礎」（haishoku）的進階姊妹單元。本次**只做教材展示頁，不含測驗**。

## 範圍決策（已與使用者確認）

1. **資料完整度**：完整補全＋專家驗證。以 u6 JSON 為骨架，補足範例、逐例以程式規則驗證、修正錯誤、補上印象與服裝應用說明。
2. **頁面結構**：獨立新頁面（不併入 haishoku）。
3. **交付範圍**：先做教材展示頁。
4. **共用工具（取捨一 A）**：把 PCCS 記號工具下放到 `pccs-data.js`。
5. **標準配色幾何（取捨二 A）**：標準配色技法附 SVG 小色相環示意。
6. **分類表**：加入 `IMG_1324` 的官方分類表（以 HTML/CSS 重建，不嵌圖）。
7. **詳細區組織**：依分類表「類似／對比 × 色相／色調」重組。

## 架構（鏡像 haishoku 既有模式）

純 vanilla HTML/CSS/JS，無 build step，分資料層／渲染層／測試。

| 檔案 | 動作 | 說明 |
|---|---|---|
| `src/js/pccs-data.js` | 修改 | 新增 `parseColorNotation`／`getNeutralColor`／`getSchemeColor`（自 haishoku-data 下放）。擴充解析器接受 `Bk`(=N1.5)、`Wh`(=N9.5)。 |
| `src/js/haishoku-data.js` | 修改 | 改為從 pccs-data re-export 上述三函式，對外行為不變（現有頁面與測試零改動）。 |
| `src/harmony.html` | 新增 | 載入順序：pccs-data → harmony-data → harmony.js；樣式 style.css + harmony.css。 |
| `src/js/harmony-data.js` | 新增 | 資料層：`HARMONY_OVERVIEW`、`HARMONY_MATRIX`、`HARMONY_SECTIONS`（含 schemes/examples/rule）。 |
| `src/js/harmony.js` | 新增 | 渲染層：分類表 grid、equal 色卡列、標準配色的 SVG 色相環。 |
| `src/css/harmony.css` | 新增 | 沿用 haishoku 視覺語彙，加上分類表 grid、色相環、明度標記樣式。 |
| `tests/harmony-data.test.js` | 新增 | 逐例驗證領域規則。 |
| `src/index.html` | 修改 | 新增第 4 張卡片「色彩調和論（進階）」連到 harmony.html。 |

### 共用工具下放（取捨一）

`parseColorNotation`／`getNeutralColor`／`getSchemeColor` 是純 PCCS 記號工具，與 haishoku 無關。下放到 `pccs-data.js`：

- `pccs-data.js` 新增並 `module.exports` 這三個函式（瀏覽器中以全域變數提供）。
- 解析器擴充：除既有 `W`=N9.5 外，新增 `Bk`→`{type:"neutral",value:1.5}`、`Wh`→`{type:"neutral",value:9.5}`。
- `haishoku-data.js` 改為從 `_pccs` 取得並 re-export，保留既有 `module.exports` 鍵名 → 現有 `tests/haishoku-data.test.js` 不需修改即通過。

### 載入相依

`harmony-data.js` 與 `haishoku-data.js` 取得 PCCS 工具的方式一致（Node：require `./pccs-data.js`；瀏覽器：全域變數）。`harmony-data.js` **不依賴** `haishoku-data.js`。

## 頁面結構（由上而下）

1. **概說** `HARMONY_OVERVIEW` — M2 調和論導言。
2. **配色技法分類表** `HARMONY_MATRIX` — 重建 IMG_1324。
3. **標準配色（幾何）** — Dyad／Triad／Tetrad／Split，每例附 SVG 色相環。
4. **類似配色（Analogy）** — 色相型／色調型／跨色相·色調。
5. **對比配色（Contrast）** — 色相型／色調型。
6. **Complex（反自然特例）**。

### 配色技法分類表（重建 IMG_1324）

以 CSS grid 重建，**不嵌入 JPEG**（`ref/` 為 gitignored、不部署）。兩軸：

|  | 類似配色（Analogy） | 對比配色（Contrast） |
|---|---|---|
| **色相** | 主調色相配色、自然配色 | 雙色配色、三色配色 |
| **色調** | 主調色調配色、Tonal、tone in tone | tone on tone |

跨界特例（圖中以方框跨格擺放，重建時亦跨格呈現）：
- **Camaieu／Faux Camaieu**：橫跨「色相↔色調」之間（類似側）。
- **Complex**：置於「類似↔對比」正中間。

每個格內的配色法名稱為錨點連結，點擊捲動到下方對應詳解（`href="#scheme-id"`）。

## 內容資料（HARMONY_SECTIONS）

`HARMONY_SECTIONS` 為陣列，元素為「大區段」，每段含 `subgroups`（軸別小標）→ `schemes`（配色法）→ `examples`。標準配色另帶 `geometry` 旗標觸發 SVG 色相環。

每個 scheme 欄位：`id`、`title`、`titleEn`、`description`（含**印象**與**服裝應用**）、`rule`、`examples`（`{colors, label}`，每小節 ≥2 例）。

### 1. 標準配色（幾何）`geometry: true`

| scheme | rule | 範例 |
|---|---|---|
| 二色配色 Dyad（補色） | `dyad` | `v2+v14`、`b8+b20` |
| 三色配色 Triad（正三角，差8） | `triad` | `v2+v10+v18`、`dp4+dp12+dp20` |
| 四色配色 Tetrad（正方，差6） | `tetrad` | `v2+v8+v14+v20`、`b5+b11+b17+b23`（補全） |
| 分裂補色 Split Complementary（Y字） | `split-complement` | `v2+v13+v15`、`b8+b19+b21` |

### 2. 類似配色（Analogy）

**色相型**
| scheme | rule | 範例 |
|---|---|---|
| 主調色相配色 Dominant Color（M1 p80 複習） | `dominant-color` | `sf16+b16+lt16`、`p4+lt4+sf4`（補全） |
| 自然配色 Natural | `natural` | `lt8+dp16`、`p6+dk18` |

**色調型**
| scheme | rule | 範例 |
|---|---|---|
| 主調色調配色 Dominant Tone（M1 p80 複習） | `dominant-tone` | `lt4+lt12+lt20`（補全）、`d2+d10+d18`（補全） |
| Tonal 中間色調 | `tonal` | `sf2+d8+ltg14`、`g4+d16` |
| tone in tone 同色調 | `tone-in-tone` | `d2+d8+d14`、`p4+p12+p20` |

**跨色相/色調**
| scheme | rule | 範例 |
|---|---|---|
| Camaieu 卡邁厄 | `camaieu` | `lt2+p2`、`sf8+ltg8` |
| Faux Camaieu 仿卡邁厄 | `faux-camaieu` | `lt2+p4`、`dp16+dk18` |

### 3. 對比配色（Contrast）

**色相型**
| scheme | rule | 範例 |
|---|---|---|
| 雙色配色 Bicolor | `bicolor` | `v2+v16`、`v8+Bk` |
| 三色配色 Tricolor | `tricolor` | `v2+N9.5+v16`（法國國旗）、`v8+v12+v2` |

**色調型**
| scheme | rule | 範例 |
|---|---|---|
| tone on tone 同色系 | `tone-on-tone` | `p2+dp2`、`ltg16+dk16` |

### 4. Complex（反自然）

| scheme | rule | 範例 |
|---|---|---|
| Complex 反自然 | `complex` | `dp8+lt16`、`dp6+lt18` |

## 領域規則（測試驗證）

沿用 haishoku 測試的輔助函式：`hueDiff(a,b)`（環狀色相差）、`lumaOf(notation)`（渲染色亮度）、`saturationLevel(toneId)`。新增「黃藍向度」判定（色相 8 最黃、16~18 最藍；以與 hue 8 的環狀距離衡量「偏藍程度」）。

| rule | 驗證 |
|---|---|
| `dyad` | 2 色；`hueDiff == 12` |
| `triad` | 3 色；兩兩 `hueDiff == 8` |
| `tetrad` | 4 色；排序後相鄰色相間隔皆 == 6 |
| `split-complement` | 3 色；存在一基底，另兩色分居其補色（基底+12）兩側、且兩側對該補色距離相等且 ≤2 |
| `dominant-color` | 色相全相同 |
| `dominant-tone` | 色調全相同 |
| `natural` | 同例中「較黃」色 `luma` > 「較藍」色 `luma` |
| `complex` | 同例中「較黃」色 `luma` < 「較藍」色 `luma`（反自然） |
| `tonal` | 全部色調 ∈ {sf, d, ltg, g}（排除 s） |
| `tone-in-tone` | 色調全相同；且不含 v |
| `camaieu` | 色相全相同；色調相同或色調圖距離在門檻內（極類似）。實作時以 spotPos 距離門檻判定，確保 `sf8+ltg8` 類範例通過。 |
| `faux-camaieu` | `hueDiff` ∈ [1,2]；色調相同或色調圖距離在門檻內 |
| `bicolor` | 2 色；至少一個為 v 色調或無彩色（高對比） |
| `tricolor` | 3 色 |
| `tone-on-tone` | 色相全相同；色調在色調圖上明度差顯著（spotPos 垂直距離 ≥ 門檻） |

測試另檢查：每段/小節數量、每例 ≥2 色、每例顏色可取得合法 HEX、分類表與詳解 id 對應一致。

## 專家修正（以 ref 佐證）

1. **`Bk` 記號**：u6 JSON `v8+Bk` 的 `Bk` 現有解析器無法處理 → 擴充解析器支援 `Bk`=N1.5（黑）、`Wh`=N9.5（白）。
2. **Tonal 色調集合**：u6 JSON 1-5 將 `lt` 列入濁色係屬錯誤。`lt`（淺色調）是明清色而非濁色（見既有原則「清濁≠彩度」）。IMG_1324 圖下方原文明確記載 Tonal 使用「中・低彩度の4つのトーン（sf、d、ltg、g）…濁色ですが高彩度のs トーンは使用しません」。據此教學文字與 `tonal` 規則一律採 {sf, d, ltg, g}。

## 視覺與版面

- 色卡沿用 haishoku 的 `equal` 風格：等寬色塊 + 下方 PCCS 記號註記。
- 標準配色額外渲染一個小型 SVG 色相環（24 等分、8:Y 正上方、順時針，與 pccs 頁一致），標出該例取色點並以線段連出幾何（補色線／三角／方形／Y 字）。
- 分類表為 CSS grid；Camaieu/Faux 與 Complex 以跨格定位呈現原圖的跨界語意。
- 響應式：375px 下分類表可改為堆疊；色卡列維持可讀。

## 測試與驗收

- `node tests/harmony-data.test.js` 全綠（資料層、領域規則、結構一致性）。
- `node tests/haishoku-data.test.js` 維持全綠（驗證下放重構未破壞 M1）。
- 人工視覺驗證（瀏覽器）：分類表跨格呈現、SVG 色相環幾何正確、自然/Complex 明度方向、375px 響應式、首頁第 4 張卡片連結。

## 非目標（YAGNI）

- 不做測驗單元（本次僅教材）。
- 不嵌入 `ref/` 圖片（重建為 HTML）。
- 不重構 haishoku 的渲染層（僅下放共用記號工具）。
- 不新增 accent／separation 版面（M2 內容不需要）。
