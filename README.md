# 社内ポータルシステム

社員が各種申請（休暇・経費・残業など）を提出し、管理者が多段階承認ワークフローで審査するフルスタックの社内ポータルです。お知らせ機能や AI によるチケット下書き生成も備えています。

**デモサイト:** https://shanai-portal.online

---

## 技術スタック

| レイヤー       | 技術                                                      |
| -------------- | --------------------------------------------------------- |
| フロントエンド | Next.js 14 (App Router) · TypeScript · Tailwind CSS       |
| バックエンド   | Spring Boot · Java 21 · REST API                          |
| データベース   | PostgreSQL 17                                             |
| キャッシュ     | Redis 7                                                   |
| ストレージ     | MinIO (S3 互換)                                           |
| AI             | Google Gemini / OpenAI（チケット下書き生成）              |
| 認証           | JWT（アクセストークン 15 分 + リフレッシュトークン 7 日） |

---

## 主な機能

### 社員向け

- **チケット申請** — 休暇・経費精算・残業・その他を申請。承認者を順番に指定する多段階承認フロー
- **AI 下書き生成** — 簡単な申請内容を入力するだけで AI がチケット内容を自動生成（1日1人10回まで）
- **ファイル添付** — 申請書類や領収書を添付（最大 10MB）
- **申請管理** — 自分の申請一覧を確認。承認待ちの申請は取り下げ可能、差し戻された申請は編集して再提出可能
- **お知らせ閲覧** — 会社・部署宛てのお知らせを確認。確認必須のお知らせは確認しましたボタンで確認

### 管理者向け

- **チケット審査** — 自分が承認者になっているチケットを一覧表示。承認・差し戻しにコメントを添えて対応
- **お知らせ作成** — 部署または全社宛てにお知らせを公開。下書き保存・ファイル添付対応
- **確認状況パネル** — 確認必須のお知らせについて、確認済・未確認の社員一覧と進捗率を確認
- **CSV エクスポート** — 申請一覧を Excel 対応（BOM 付き UTF-8）CSV でダウンロード

---

## リポジトリのクローン

```bash
git clone https://github.com/ahrisali123/employee-portal-system.git
cd employee-portal-system
```

---

## Docker を使ったローカル開発（推奨）

Docker と Docker Compose が入っていれば、コマンド一発で全サービスを起動できます。PostgreSQL のユーザー・データベース作成やスキーマ構築・初期データ投入もすべて自動で行われます。

### 手順

```bash
# 1. シークレットファイルを作成
cp .env.example .env

# 2. .env を編集してパスワード等を設定（下記参照）

# 3. 全サービスをビルド＆起動
docker compose up --build
```

### `.env` の設定項目

```dotenv
# PostgreSQL — ユーザー・DB 名はそのままでも動きます
POSTGRES_DB=eps
POSTGRES_USER=eps
POSTGRES_PASSWORD=任意のパスワード

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=任意のシークレット
MINIO_BUCKET=eps-file-storage

# JWT — openssl rand -base64 32 で生成
JWT_SECRET=生成したシークレット

# AI（チケット生成機能に必要。不要なら空欄でも可）
AI_PROVIDER=gemini
AI_GEMINI_API_KEY=
AI_OPENAI_API_KEY=

# フロントエンドから見える API URL（ローカルの場合はこのまま）
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 初回起動時に自動で行われること

1. `.env` の `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` をもとに PostgreSQL のロールとデータベースが作成される
2. `schema.sql` が実行され、全テーブル・インデックス・トリガーが作成される（`eps` スキーマ）
3. `data.sql` が実行され、初期部署とデモアカウントが投入される
4. `minio-init` がバケットを自動作成する

### 起動後のアクセス先

| サービス         | URL                   |
| ---------------- | --------------------- |
| フロントエンド   | http://localhost:3000 |
| バックエンド API | http://localhost:8080 |
| MinIO コンソール | http://localhost:9001 |

### サービス起動順序

`postgres` · `redis` · `minio` が起動（ヘルスチェック通過）→ `minio-init` がバケットを作成 → `backend` が起動 → `frontend` が起動。`depends_on` による制御のため sleep ハックは不要です。

### よく使うコマンド

```bash
# バックグラウンドで起動
docker compose up -d --build

# ログを確認
docker compose logs -f backend
docker compose logs -f frontend

# 停止
docker compose down

# ボリュームごと削除（DB データも消えます）
docker compose down -v
```

---

## ローカル開発（手動セットアップ）

### 前提条件

- Java 21
- Node.js 20+
- PostgreSQL 17
- Redis 7
- MinIO（またはほかの S3 互換ストレージ）

### 1. データベースのセットアップ

PostgreSQL に接続し、ロール・データベースを作成してからスキーマと初期データを投入します。

```sql
-- psql で実行
CREATE ROLE eps WITH LOGIN PASSWORD 'your_password';
CREATE DATABASE eps OWNER eps;
```

```bash
# schema.sql でテーブル・インデックス・トリガーを作成
psql -U eps -d eps -f schema.sql

# data.sql で初期部署・デモアカウントを投入
psql -U eps -d eps -f data.sql
```

### 2. バックエンド

```bash
cd backend

# 設定ファイルを作成
cp src/main/resources/application-example.properties src/main/resources/application.properties
# application.properties を編集して DB・JWT・MinIO の接続情報を入力

./mvnw spring-boot:run
```

サーバーは `http://localhost:8080` で起動します。

`application.properties` の主な設定項目:

| 項目                                      | 説明                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `spring.datasource.url`                   | 例: `jdbc:postgresql://localhost:5432/eps`                                |
| `spring.datasource.username` / `password` | 上で作成した PostgreSQL 認証情報                                          |
| `app.jwt.secret`                          | 256 ビット Base64 の JWT シークレット（`openssl rand -base64 32` で生成） |
| `storage.endpoint`                        | MinIO エンドポイント（例: `http://localhost:9000`）                       |
| `storage.access-key` / `secret-key`       | MinIO 認証情報                                                            |
| `ai.provider`                             | `gemini` または `openai`                                                  |
| `ai.gemini.api.key` / `ai.openai.api.key` | AI API キー                                                               |

### 3. フロントエンド

```bash
cd frontend

# 環境変数ファイルを作成
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080

npm install
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

---

## プロジェクト構成

```
employee-portal-system/
├── backend/                  # Spring Boot API
│   ├── src/main/java/        # ソースコード
│   └── src/main/resources/   # application.properties など
├── frontend/                 # Next.js フロントエンド
│   ├── src/app/              # App Router ページ
│   ├── src/lib/              # API クライアント・静的データ
│   ├── src/components/       # 共通コンポーネント
│   └── src/contexts/         # 認証コンテキスト
├── schema.sql                # DB スキーマ定義（全テーブル・インデックス・トリガー）
├── data.sql                  # 初期データ（部署・デモアカウント）
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ライセンス

個人ポートフォリオ用のデモプロジェクトです。
