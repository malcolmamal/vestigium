# afterFileEdit hook — validate doctrine edits (naming, cross-refs). Directives 014, 040.
$inputJson = $Input | Out-String | ConvertFrom-Json
$filePath = $inputJson.file_path
if (-not $filePath) { Write-Output '{}'; exit 0 }

$repoRoot = $inputJson.workspace_roots[0]
if (-not $repoRoot) {
    $repoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $repoRoot) { $repoRoot = "." }
}

$relPath = $filePath.Replace($repoRoot, "").TrimStart("\").TrimStart("/")
if ($relPath -notlike "doctrine/*") { Write-Output '{}'; exit 0 }

$errors = @()
$content = Get-Content -Path $filePath -ErrorAction SilentlyContinue

# 1. Check broken relative cross-references
$matches = $content | Select-String -Pattern '(\.\./[a-z][a-z]*/[0-9_a-zA-Z-]*\.md)' -AllMatches
foreach ($m in $matches.Matches) {
    $ref = $m.Value
    $refResolved = Join-Path (Split-Path $filePath) $ref
    if (-not (Test-Path $refResolved)) {
        $errors += "Broken cross-reference: $ref"
    }
}

$bn = Split-Path -Leaf $filePath

# 2. Agent profile naming: kebab-case.agent.md
if ($relPath -like "doctrine/agents/*" -and $bn -ne "README.md") {
    if ($bn -notmatch '^[a-z][a-z0-9-]*\.agent\.md$') {
        $errors += "Agent naming violation: $bn (expected kebab-case.agent.md)"
    }
}

# 3. Directive naming: NNN_snake_case.md
if ($relPath -like "doctrine/directives/*" -and $bn -ne "README.md") {
    if ($bn -notmatch '^[0-9]{3}_[a-z_]+\.md$') {
        $errors += "Directive naming violation: $bn (expected NNN_snake_case.md)"
    }
}

# 4. Tactic naming: kebab-case.tactic.md
if ($relPath -like "doctrine/tactics/*" -and $bn -ne "README.md") {
    if ($bn -notmatch '^[a-zA-Z][a-zA-Z0-9_-]*\.tactic\.md$') {
        $errors += "Tactic naming violation: $bn (expected kebab-case.tactic.md)"
    }
}

if ($errors.Count -gt 0) {
    $msg = ($errors | ForEach-Object { "⚠️ $_" }) -join " "
    Write-Output (@{ agent_message = $msg.Trim() } | ConvertTo-Json -Compress)
} else {
    Write-Output '{}'
}
exit 0
