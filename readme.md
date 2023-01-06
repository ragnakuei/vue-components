# 輕前端 Vue Component 範例

## [Date Picker](https://ragnakuei.github.io/vue-components/date%20picker.html)

- Date Picker
  - 相依套件
    - dayjs
  - 鍵盤操作
    - ↑：上一個月
    - ↓：下一個月
    - PageUp：上一年
    - PageDown：下一年
- Date Range Picker
  - 相依套件
    - dayjs
  - 參照 [jQuery date range picker](https://www.daterangepicker.com)
  - 鍵盤操作
    - ↑：上一個月
    - ↓：下一個月
  - 區域
    - 左上
      - Date Pickers
    - 右上
      - 按鈕區
    - 下方
      - 手動輸入起迄
        - 如果輸入的日期不合法，會在 onblur 時清空
      - Clear
        - 清空選取的日期
      - Apply
        - 套用選取的日期
