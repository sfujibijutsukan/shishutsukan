## データベース構成（スキーマ）

アプリ起動時、必要なテーブルの作成を行います。SQLite の外部キー制約は接続毎に有効化され、全接続で `PRAGMA foreign_keys = ON` を実施しています。

DDL（概念図）:
```sql
-- 先に genres を作成
CREATE TABLE IF NOT EXISTS genres (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- expenses は genre_id を外部キー参照
CREATE TABLE IF NOT EXISTS expenses (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	date TEXT NOT NULL,          -- 例: 2025-10-22（YYYY-MM-DD）
	genre_id INTEGER NOT NULL,
	amount INTEGER NOT NULL,
	FOREIGN KEY (genre_id) REFERENCES genres(id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
);

-- パフォーマンス向上用のインデックス
CREATE INDEX IF NOT EXISTS idx_expenses_genre_id ON expenses(genre_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
```

初期データ:
- デフォルトジャンルを自動投入（重複は無視）
	- `['食費', '交通費', '消耗品', 'サブスク', '特別費', 'その他']`

## バリデーションとエラーハンドリング

サーバー側での検証:
- 日付: `YYYY-MM-DD` 形式のみ許可（不正なら 400）
- 金額: 正の整数のみ許可（<=0 は 400）
- ジャンル: `genres.name` に存在しない名前での支出登録は禁止（400）
- ジャンル追加: 空白のみは不可（400）、重複は UNIQUE 制約で抑止
- ジャンル削除: 参照中（expenses が紐づいている）の場合は削除不可（409 相当のメッセージ; 実装ではエラーメッセージを返却）

フロントエンド側:
- バックエンドからのエラーをアラートで表示し、ユーザーが不正入力に気づけます。

セキュリティ補足:
- CORS はデモ用途のため全許可（`allow_origins=["*"]`）。本番用途では許可オリジンを限定してください。

## API 仕様

ベースURL（Compose 既定）: `http://localhost:8000`

### 支出

POST `/expenses`
- リクエスト
```json
{ "date": "2025-10-22", "genre": "食費", "amount": 1200 }
```
- 成功レスポンス: `{ "message": "ok" }`
- 失敗例: 400（無効な日付/金額/ジャンル）

GET `/expenses`
- レスポンス（例）
```json
[
	{ "id": 3, "date": "2025-10-22", "genre": "交通費", "amount": 540 },
	{ "id": 2, "date": "2025-10-21", "genre": "食費", "amount": 1200 }
]
```
（内部では `genre_id` を保持していますが、レスポンスは従来通り `genre` 名を返します）

DELETE `/expenses/{id}`
- 成功: `{ "message": "deleted" }`

### ジャンル

GET `/genres`
- レスポンス（例）
```json
[
	{ "id": 1, "name": "食費", "created_at": "2025-10-22 10:00:00" }
]
```

POST `/genres`
- リクエスト
```json
{ "name": "交際費" }
```
- 成功: `{ "message": "ok" }`
- 失敗例: `{ "error": "Genre already exists" }` / 400（空文字など）

DELETE `/genres/{id}`
- 使用中: `{ "error": "Cannot delete genre that is in use" }`
- 成功: `{ "message": "deleted" }`

