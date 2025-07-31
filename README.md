# TSRI 工程師小幫手

台灣半導體研究中心 (TSRI) 工程師專用工具平台，提供各種實用工具來提升工作效率。

## 功能特色

### 🔧 核心工具
- **密碼產生器** - 安全密碼生成工具
- **IP 查詢工具** - 網路IP位址查詢服務
- **IP 管理系統** - 網路IP位址管理平台
- **會議紀錄管理** - 智能會議管理系統

### 📚 知識管理
- **知識庫** - 智能文件管理系統，支援圖片插入
- **NetApp 指令速查** - NetApp系統指令參考手冊
- **CentOS 指令速查** - CentOS Linux指令快速參考

### 👥 用戶管理
- **登入註冊系統** - 用戶權限管理
- **管理後台** - 系統管理和用戶權限控制
- **個人化設定** - 工具排序和主題設定

## 技術架構

- **前端框架**: Next.js 14 (App Router)
- **UI 組件**: Tailwind CSS + shadcn/ui
- **資料庫**: Supabase (PostgreSQL)
- **部署平台**: Vercel
- **開發語言**: TypeScript

## 快速開始

### 1. 環境設置

\`\`\`bash
# 克隆專案
git clone https://github.com/seanzheng168/tsri-enghelp.git
cd tsri-enghelp

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env.local
\`\`\`

### 2. 配置環境變數

編輯 `.env.local` 檔案，填入您的 Supabase 配置：

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### 3. 資料庫設置

在 Supabase SQL Editor 中執行以下腳本：

\`\`\`sql
-- 執行順序
scripts/001-create-all-tables.sql
scripts/002-insert-sample-data.sql
scripts/003-create-ip-records-table.sql
\`\`\`

### 4. 啟動開發伺服器

\`\`\`bash
npm run dev
\`\`\`

開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 部署到 Vercel

### 自動部署

1. 推送代碼到 GitHub
2. 在 [Vercel](https://vercel.com) 中導入專案
3. 設置環境變數
4. 自動部署完成

### 手動部署

\`\`\`bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
\`\`\`

## 專案結構

\`\`\`
tsri-enghelp/
├── app/                    # Next.js App Router 頁面
│   ├── admin/             # 管理後台
│   ├── centos-commands/   # CentOS 指令頁面
│   ├── eda-cloud/         # 知識庫頁面
│   ├── ip-lookup/         # IP 查詢頁面
│   ├── ip-management/     # IP 管理頁面
│   ├── login/             # 登入頁面
│   ├── meeting-records/   # 會議紀錄頁面
│   ├── netapp-commands/   # NetApp 指令頁面
│   ├── password-generator/ # 密碼產生器頁面
│   └── page.tsx           # 首頁
├── components/            # React 組件
│   └── ui/               # shadcn/ui 組件
├── lib/                  # 工具函數和配置
│   └── supabase.ts       # Supabase 客戶端
├── scripts/              # 資料庫腳本
└── hooks/                # React Hooks
\`\`\`

## 功能說明

### 密碼產生器
- 自定義密碼長度和數量
- 支援大小寫、數字、符號
- 排除混淆字元選項
- 一鍵複製功能

### IP 管理系統
- IP 位址管理和分類
- 支援 IPv4 和 IPv6
- CSV 匯入匯出功能
- 狀態追蹤和搜尋

### 知識庫
- 富文本編輯器
- 圖片拖拽上傳
- 分類管理
- 全文搜尋

### 會議紀錄管理
- 會議資訊管理
- 參與者追蹤
- 郵件通知功能
- 匯入匯出支援

## 用戶權限

### 管理員 (admin)
- 所有功能存取權限
- 用戶管理
- 系統設定

### 編輯者 (editor)
- 知識庫編輯
- 指令管理
- 會議紀錄

### 一般用戶 (user)
- 基本工具使用
- 查看權限

## 開發指南

### 新增功能

1. 在 `app/` 目錄下創建新頁面
2. 在 `components/` 中添加相關組件
3. 更新導航和權限設定
4. 添加相應的資料庫表和 API

### 樣式指南

- 使用 Tailwind CSS 進行樣式設計
- 遵循 shadcn/ui 設計系統
- 保持響應式設計
- 支援深色模式

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 聯絡資訊

- 專案維護者: TSRI 開發團隊
- 電子郵件: dev@tsri.org.tw
- 專案連結: [https://github.com/seanzheng168/tsri-enghelp](https://github.com/seanzheng168/tsri-enghelp)

## 更新日誌

### v1.0.0 (2025-01-31)
- 初始版本發布
- 完整的工具集合
- 用戶權限管理
- 響應式設計

## 測試帳號

系統預設提供以下測試帳號：

- **管理員**: admin / admin123
- **編輯者**: editor1 / editor123  
- **一般用戶**: user1 / user123

*注意：正式環境請務必修改預設密碼*
