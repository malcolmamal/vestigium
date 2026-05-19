# sessionStart hook — logs session metadata and Directive 042 (Model Discipline) advisory.
# Directive 014 (Work Log), 015 (Store Prompts), 040 (HiC), 042 (Model Discipline).
$inputJson = $Input | Out-String | ConvertFrom-Json
$repoRoot = $inputJson.workspace_roots[0]
if (-not $repoRoot) {
    $repoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $repoRoot) { $repoRoot = "." }
}

$logDir = Join-Path $repoRoot "work/reports/logs"
$logFile = Join-Path $logDir "cursor-session-audit.log"

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$convId = if ($inputJson.conversation_id) { $inputJson.conversation_id } else { "unknown" }
$model = if ($inputJson.model) { $inputJson.model } else { "unknown" }
$cursorVer = if ($inputJson.cursor_version) { $inputJson.cursor_version } else { "unknown" }
$userEmail = if ($inputJson.user_email) { $inputJson.user_email } else { "unknown" }

$doctrineVer = "unknown"
$changelogPath = Join-Path $repoRoot "doctrine/CHANGELOG.md"
if (Test-Path $changelogPath) {
    $firstMatch = Get-Content $changelogPath | Select-String -Pattern '^## (\d+\.\d+\.\d+)' | Select-Object -First 1
    if ($firstMatch) { $doctrineVer = $firstMatch.Matches.Groups[1].Value }
}

$gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $gitBranch) { $gitBranch = "unknown" }
$gitSha = git rev-parse --short HEAD 2>$null
if (-not $gitSha) { $gitSha = "unknown" }

$logEntry = "[$timestamp] session=$convId model=$model cursor=$cursorVer user=$userEmail doctrine=$doctrineVer branch=$gitBranch sha=$gitSha"
Add-Content -Path $logFile -Value $logEntry

# Directive 042 (Model Discipline) advisory
$modelMsg = ""
if ($model -match "opus|thinking|o1|o3|pro") {
    $modelMsg = "⚠️ Directive 042 (Model Discipline): You are running on a premium model ($model). Delegate routine tasks (file creation, search, git ops, template generation) to fast subagents. Reserve this thread for complex reasoning and active iteration."
}

if ($modelMsg) {
    Write-Output (@{ agent_message = $modelMsg } | ConvertTo-Json -Compress)
} else {
    Write-Output '{}'
}
exit 0
