// 進階配色（M2-U6 色彩調和論）— 純邏輯資料層，不碰 DOM
// 僅存配色記號字串；顏色解析由渲染層用 pccs-data.js 的 getSchemeColor 處理。
// 瀏覽器：以 <script> 載入（需先載入 pccs-data.js）；Node：可 require（測試用）

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

// 各區段 → 配色法 → 範例。
// geometry:true → 渲染層加畫 SVG 色相環；省略該鍵（或 false）→ 不畫。
// 註：standard 區段的幾何配色法（dyad/triad/tetrad/split-complement）不屬於分類表，
//     故分類表只做單向檢查（matrix→sections）。
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
