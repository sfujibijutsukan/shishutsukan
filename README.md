# 支出管理アプリ（shishutsukan）

このリポジトリは「支出管理アプリ」です。  
React（フロントエンド） + FastAPI（バックエンド） + SQLite（データベース）構成で、日々の支出をジャンルごとに入力・集計・分析できます。

---

## 操作画面
一覧性・操作性を重視したシンプルなUIで、PC・スマホ両対応のレスポンシブデザインを採用。

<p><b>横長表示</b></p>
<img src="./docs/pc.png" alt="PC版" width="500" style="border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

<p><b>縦長表示</b></p>
<div style="display: flex; gap: 10px;">
<img src="./docs/phone1.png" alt="スマホ版" width="160" style="border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<img src="./docs/phone2.png" alt="スマホ版" width="160" style="border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
</div>

## 主な機能

- **ユーザ認証**（アカウント作成・ログイン機能で個人データを保護）
- 支出の登録（ジャンル・日付・金額）
- 登録済み支出の一覧表示・削除
- 月ごとのジャンル別集計グラフ表示
- 今月の日別ジャンル別グラフ表示
- 支出ジャンルの編集・追加・削除
- **端末間ジャンル同期**（異なる端末でも同じジャンル設定を共有）
- **定期自動同期**（5分ごと、ウィンドウフォーカス時、リロード時）
- レスポンシブ対応（PC/スマホ両対応）

---

## 使い方

### 初回セットアップ
1. .env ファイルを作成し、APIのURLを設定（例: `REACT_APP_API_URL=http://○○.○○.○○.○○:8000/expenses`）
   - IPアドレスは自分の環境に合わせて変更してください。
   - **注意：.envファイルはfrontendディレクトリに配置してください。**
2. Docker Composeで起動
   ```bash
   docker compose up -d
   ```
3. [http://localhost:3000](http://localhost:3000) にアクセス
4. 初回利用時は「アカウント作成」タブからユーザーIDとパスワードを設定してアカウントを作成
5. ログイン後、shishutsukanをご利用いただけます

### アクセス先
- **フロントエンド**: [http://localhost:3000](http://localhost:3000)
- **バックエンドAPI**: [http://localhost:8000/expenses](http://localhost:8000/expenses)

### 認証機能について
- 各ユーザーのデータは完全に分離され、他のユーザーからアクセスできません
- パスワードはbcryptを使用して安全にハッシュ化されて保存されます
- ログイン状態はJWTトークンで管理され、30分間有効です
- ログアウト後は再度ログインが必要です

---

## 画面構成・操作方法

1. **ログイン・アカウント作成画面**
   - 初回利用時：アカウント作成タブからユーザーID・パスワードを設定
   - 次回以降：ログインタブからユーザーID・パスワードを入力してログイン
   - パスワード表示切替ボタンで入力内容を確認可能

2. **支出入力フォーム**
   - 日付・ジャンル・金額を入力して「登録」ボタンで支出を追加
   - ログイン中のユーザーにのみデータが紐付けられます

3. **支出一覧**
   - 登録済み支出を一覧表示。各行の「削除」ボタンでデータ削除
   - 年・月選択でデータをフィルタリング可能

4. **グラフ表示**
   - 月別（ジャンルごと）・日別（ジャンルごと）の支出を棒グラフで可視化
   - ユーザー個人のデータのみ表示されます

5. **ジャンル編集**
   - ジャンルの追加・削除が可能
   - ジャンル情報はユーザーごとにデータベースで管理され、端末間で自動同期
   - 使用中のジャンルは削除から保護される

6. **ユーザー管理**
   - 画面右上にログイン中のユーザーID表示
   - 「ログアウト」ボタンでセッション終了

---

## API仕様（FastAPI）

**認証管理**
- `POST /register`：ユーザーアカウント作成
- `POST /login`：ログイン（JWTトークン発行）

**支出管理**（要認証）
- `POST /expenses`：支出データ追加
- `GET /expenses`：支出データ一覧取得
- `DELETE /expenses/{id}`：支出データ削除

**ジャンル管理**（要認証）
- `GET /genres`：ジャンル一覧取得
- `POST /genres`：ジャンル追加
- `DELETE /genres/{id}`：ジャンル削除（使用中は削除不可）

**データベース構造**
- `users` テーブル：`id`, `user_id`, `password_hash`, `created_at`
- `expenses` テーブル：`id`, `user_id`, `date`, `genre`, `amount`
- `genres` テーブル：`id`, `user_id`, `name`, `created_at`（ユーザーごとにデフォルトジャンル自動初期化）

**セキュリティ機能**
- パスワード：bcryptによるハッシュ化
- 認証：JWTトークンベース（30分有効）
- データ隔離：ユーザーIDによる厳密なアクセス制御

---

## 技術スタック

- **フロントエンド**：React + recharts + react-datepicker
- **バックエンド**：FastAPI + SQLite
- **データベース**：SQLite（ユーザー管理・支出データ・ジャンル管理）
- **認証**：JWT（JSON Web Token）+ bcrypt
- **同期機能**：REST API による端末間データ同期
- **インフラ**：Docker Compose対応

---

## その他

バグ報告・要望は [Issues](https://github.com/sfujibijutsukan/sfujishishutsukan/issues) からどうぞ。
