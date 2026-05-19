# afterFileEdit hook — markdown lint (advisory). Directives 014, 015, 022.
$inputJson = $Input | Out-String | ConvertFrom-Json
$filePath = $inputJson.file_path
if (-not $filePath -or $filePath -notmatch '\.md$') { Write-Output '{}'; exit 0 }

$repoRoot = $inputJson.workspace_roots[0]
if (-not $repoRoot) {
    $repoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $repoRoot) { $repoRoot = "." }
}

$relPath = $filePath.Replace($repoRoot, "").TrimStart("\").TrimStart("/")
if ($relPath -like "work/*") { Write-Output '{}'; exit 0 }

$mdlint = ""
$localLint = Join-Path $repoRoot "node_modules/.bin/markdownlint-cli2.ps1"
if (Test-Path $localLint) { $mdlint = $localLint }
elseif (Get-Command "markdownlint-cli2" -ErrorAction SilentlyContinue) { $mdlint = "markdownlint-cli2" }
elseif (Get-Command "markdownlint" -ErrorAction SilentlyContinue) { $mdlint = "markdownlint" }

if (-not $mdlint) { Write-Output '{}'; exit 0 }

$configFlag = ""
$configPath = Join-Path $repoRoot ".markdownlint.yaml"
if (Test-Path $configPath) { $configFlag = "--config `"$configPath`"" }

$lintOutput = & $mdlint $configFlag "$filePath" 2>&1
if ($LastExitCode -ne 0 -and $lintOutput) {
    $shortOutput = ($lintOutput | Select-Object -First 5) -join " "
    $count = ($lintOutput | Measure-Object).Count
    Write-Output (@{ agent_message = "⚠️ Markdownlint found $count issue(s) in $relPath: $shortOutput" } | ConvertTo-Json -Compress)
} else {
    Write-Output '{}'
}
exit 0
