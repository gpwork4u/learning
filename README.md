# 圖解手記 · Visual Field Notes

用可操作的 HTML 動畫圖版理解知識體系的教學網站。純靜態（HTML / CSS / JS），不需要 build，直接部署在 GitHub Pages。

## 分類

| No. | 分類 | 狀態 |
|-----|------|------|
| 01 | LLM 理論 | 上線（6 章） |
| 02 | 機器學習基礎 | 籌備中 |
| 03 | 電腦網路 | 籌備中 |
| 04 | 作業系統 | 籌備中 |
| 05 | 資料結構與演算法 | 籌備中 |

## 結構

```
index.html              首頁：活標本 + 分類索引
preview.html            設計系統與元件預覽（StyleGenome 契約）
assets/css/site.css     design tokens 與共用元件
assets/js/catalog.js    分類與章節目錄（新增章節改這裡）
assets/js/site.js       主題、目錄 scrollspy、上下頁、FL.stepper 等圖版工具
llm/                    LLM 理論分類
  index.html            分類目錄與管線圖
  0X-*.html             各章節
```

## 新增章節

1. 在 `assets/js/catalog.js` 對應分類的 `chapters` 加一筆。
2. 複製任一章節 HTML 當骨架，改 `body` 的 `data-track` / `data-chapter`。
3. 圖版使用 `figure.plate` 結構；逐步動畫用 `FL.stepper(plate, { steps, render })`。

## 本機預覽

```bash
python3 -m http.server 8000
```
