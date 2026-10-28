# 會員功能整合說明（2026-10-27）

## 開發位置

- 本目錄是獨立 Git repository，分支為 `codex/member-integration`。
- 整組基礎：`8b21ad7`（D:\develop 已提交版本）。
- 個人來源：`271033f`（D:\PhoneCase.project 的 feature/member）。
- 依使用者指示，不納入 D:\develop 的未提交修改。
- 兩個原目錄均未修改，沒有推送遠端，也沒有操作資料庫。
- 兩邊沒有共同 Git 祖先，採會員模組逐檔移植，不使用整分支覆蓋。原分支歷史另保留在父目錄 develop.bundle、personal.bundle；個人 tip 可用 personal/feature-member 比對。

## 納入內容

- backend/member 下的註冊、登入、JWT、/me、資料驗證與例外處理。
- frontend/src/pages/member 的個人版本。沿用整組 App.jsx、main.jsx 及既有 /register、/login、/profile 路由。
- 個人 member 靜態頁面與 backend/database 文件、SQL。整組既有靜態檔不刪除。
- backend/pom.xml 只新增 aspectj、jjwt-api、jjwt-impl、jjwt-jackson 四項依賴，保留整組的 Lombok annotation processor 等設定。
- 會員例外處理限定 MemberController 並提高順序，避免整組全域 handler 先接走會員驗證錯誤；全域 handler 原檔不改。
- 登入頁的首頁與註冊連結改成整組既有路由 / 與 /register。

## 保留與待討論

- 商品、購物車、訂單、金流、後台、共用前端入口、前端套件及鎖定檔、application.properties 均沿用整組已提交版本。
- 個人 App.tsx、main.tsx、vite 設定與個人 application.properties 未覆蓋整組設定。
- D:\develop 未提交內容只另存父目錄 develop-uncommitted-reference，未放入此專案或提交。
- 尚未協調會員 JWT 與組員 DevLoginController、購物車/訂單會員識別及權限流程。
- ProfilePage 仍是來源既有空白頁；忘記密碼的靜態連結尚未接成 React 路由；登入保留個人版本的 /me 測試按鈕。
- JWT 仍使用來源的開發金鑰，供繼續本機開發；正式部署前另處理。
- backend/database/members.sql 與 member/db 的 SQL 只是來源檔，含建表/測試資料，沒有執行。請先與組員確認既有 members schema，勿直接匯入共用資料庫。

## 驗證結果

- 前端 npm.cmd run build：通過（圖片 /images/caselab-hero-phonecases.png 在執行時由後端提供，保留原建置警告）。
- 前端 node_modules/.bin/tsc.cmd --noEmit -p tsconfig.app.json：通過。
- 後端離線 Maven clean compile：通過，完整編譯 47 個 Java 檔。首次受沙箱快取讀取權限影響，獲准後完整重建通過。
- 前端依賴從 D:\develop\frontend\node_modules 複製，未修改來源依賴。
- 未啟動後端、未做 HTTP/API 或瀏覽器操作驗證，也未執行需要資料庫的測試。建置成功不代表跨模組會員流程已完成。

## 繼續開發

在此目錄開啟 IDE。前後端使用不同終端：

```powershell
cd C:\Users\User\Documents\ChatGPT\123\phonecase-integration\frontend
npm.cmd run dev
```

```powershell
cd C:\Users\User\Documents\ChatGPT\123\phonecase-integration\backend
.\mvnw.cmd spring-boot:run
```

後端啟動前先確認整組 application.properties 所指的資料庫、環境變數及相關服務。本次不自動啟動，避免對共用資料庫產生 schema 或資料異動。

變更比較：`git diff 8b21ad7 HEAD`。繼續編輯及提交目前分支即可。未確認跨模組整合前，不直接推送 develop。