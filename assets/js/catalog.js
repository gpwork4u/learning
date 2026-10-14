/* 全站目錄：分類與章節。新增章節只要在這裡加一筆，導覽／上下頁會自動更新。 */
window.FL_CATALOG = {
  categories: [
    {
      id: "llm",
      no: "01",
      title: "LLM 理論",
      en: "Large Language Models",
      status: "live",
      summary: "從文字切成 token 開始，一路走到注意力、Transformer、生成與訓練，用可操作的圖版看懂大型語言模型。",
      chapters: [
        { no: "01", slug: "01-tokenization", title: "分詞", en: "Tokenization", summary: "文字如何被切成模型看得懂的整數序列。" },
        { no: "02", slug: "02-embedding", title: "嵌入向量", en: "Embedding", summary: "把 token 放進高維空間，讓「意義」變成座標與距離。" },
        { no: "03", slug: "03-attention", title: "自注意力", en: "Self-Attention", summary: "每個 token 決定要看誰、看多少——Q、K、V 的分工。" },
        { no: "04", slug: "04-transformer", title: "Transformer 區塊", en: "The Transformer Block", summary: "注意力、前饋網路與殘差流如何層層堆疊。" },
        { no: "05", slug: "05-sampling", title: "生成與取樣", en: "Decoding & Sampling", summary: "一次吐一個 token：溫度、Top-k 與 Top-p 如何改變輸出。" },
        { no: "06", slug: "06-training", title: "訓練與對齊", en: "Training & Alignment", summary: "梯度下降、預訓練、指令微調與人類回饋強化學習。" }
      ]
    },
    { id: "ml", no: "02", title: "機器學習基礎", en: "Machine Learning Foundations", status: "planned", summary: "損失函數、梯度下降、過擬合與正則化。", chapters: [] },
    { id: "net", no: "03", title: "電腦網路", en: "Computer Networking", status: "planned", summary: "封包如何穿越網路：TCP/IP、DNS、TLS 握手。", chapters: [] },
    { id: "os", no: "04", title: "作業系統", en: "Operating Systems", status: "planned", summary: "行程、排程、虛擬記憶體與檔案系統。", chapters: [] },
    { id: "dsa", no: "05", title: "資料結構與演算法", en: "Data Structures & Algorithms", status: "planned", summary: "排序、樹、圖與動態規劃的逐步動畫。", chapters: [] }
  ]
};
