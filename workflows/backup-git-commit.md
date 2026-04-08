---
description: 將指定 Git Commit 異動的檔案完整備份（保留目錄結構）
---
# 備份指定 Git Commit 檔案

這個 Workflow 會利用專案 `.agents/scripts/` 中提供的腳本，將指定的 git commit 中「有異動但未刪除」的檔案全部複製到一個備份資料夾內，同時會完整保留原始專案中的目錄結構。
這對於跨環境部署或手動整理備份檔案非常有用。

## 準備備份目錄與參數

1. 設定你的備份目標路徑 `$TargetDir`
2. 決定你要備份哪一次 commit 的異動 `$CommitId`

// turbo
## 執行備份
3. 呼叫腳本進行檔案備份：

```powershell
$CommitId = "請替換為你的 commit hash"
$TargetDir = "d:\Users\Wei_Pan\Desktop\暫存\dlp-develop"

# 執行腳本
& "d:\dlp-develop\.agents\scripts\Backup-GitCommit.ps1" -CommitId $CommitId -TargetDir $TargetDir
```

執行後指令將顯示複製了哪些檔案，以及備份檔案的總數量。備份結束後您可以到該暫存目錄檢查。
