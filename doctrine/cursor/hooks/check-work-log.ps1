# afterFileEdit hook — Directive 014 (Work Log): ensure progress logs have Session Context.
$inputJson = $Input | Out-String | ConvertFrom-Json
$filePath = $inputJson.file_path
if (-not $filePath) { Write-Output '{}'; exit 0 }

$repoRoot = $inputJson.workspace_roots[0]
if (-not $repoRoot) {
    $repoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $repoRoot) { $repoRoot = "." }
}

$relPath = $filePath.Replace($repoRoot, "").TrimStart("\").TrimStart("/")
if ($relPath -notlike "work/*") { Write-Output '{}'; exit 0 }
if ($relPath -notmatch 'progress-log.*\.md$') { Write-Output '{}'; exit 0 }

$content = Get-Content -Path $filePath -Raw -ErrorAction SilentlyContinue
if ($content -and $content -notmatch '## Session Context') {
    Write-Output '{"agent_message": "⚠️ Progress log missing a \"## Session Context\" section (Directive 014)."}'
} else {
    Write-Output '{}'
}
exit 0
