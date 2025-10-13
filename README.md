# 支出管理アプリ（sfujishishutsukan）

このリポジトリは「支出管理アプリ」です。  
React（フロントエンド） + FastAPI（バックエンド） + SQLite（データベース）構成で、日々の支出をジャンルごとに入力・集計・分析できます。

---

## 主な機能

- 支出の登録（ジャンル・日付・金額）
- 登録済み支出の一覧表示・削除
- 月ごとのジャンル別集計グラフ表示
- 今月の日別ジャンル別グラフ表示
- 支出ジャンルの編集・追加
- レスポンシブ対応（PC/スマホ両対応）

---

## 使い方（Docker Compose）

```bash
docker compose up -d
```

終了したら、以下にアクセスしてください：

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンドAPI: [http://localhost:8000/expenses](http://localhost:8000/expenses)

---

## 画面構成・操作方法

1. **支出入力フォーム**
   - 日付・ジャンル・金額を入力して「登録」ボタンで支出を追加
2. **支出一覧**
   - 登録済み支出を一覧表示。各行の「削除」ボタンでデータ削除。
3. **グラフ表示**
   - 月別（ジャンルごと）・日別（ジャンルごと）の支出を棒グラフで可視化
4. **ジャンル編集**
   - ジャンルの追加・編集も可能

---

## API仕様（FastAPI）

- `POST /expenses`：支出データ追加
- `GET /expenses`：支出データ一覧取得
- `DELETE /expenses/{id}`：支出データ削除

DBは SQLite の `expenses` テーブルを利用  
項目：`id`, `date`, `genre`, `amount`

---

## 技術スタック

- フロントエンド：React + recharts + react-datepicker
- バックエンド：FastAPI + SQLite
- Docker対応

---

## ライセンス

`LICENSE` ファイルを参照してください。

---

## その他

バグ報告・要望は [Issues](https://github.com/sfujibijutsukan/sfujishishutsukan/issues) からどうぞ。
