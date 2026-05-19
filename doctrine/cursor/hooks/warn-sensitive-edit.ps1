# preToolUse hook — advisory when editing high-precedence files (Directive 040, 042).
$inputJson = $Input | Out-String | ConvertFrom-Json
$toolName = $inputJson.tool_name
$filePath = $inputJson.path

if ($toolName -ne "Write" -and $toolName -ne "StrReplace") {
    Write-Output '{"decision": "allow"}'
    exit 0
}
if (-not $filePath) {
    Write-Output '{"decision": "allow"}'
    exit 0
}

$bn = Split-Path -Leaf $filePath
$isSensitive = $false
switch ($bn) {
    "general_guidelines.md" { $isSensitive = $true }
    "operational_guidelines.md" { $isSensitive = $true }
    "bootstrap.md" { $isSensitive = $true }
    "AGENTS.md" { $isSensitive = $true }
    "CLAUDE.md" { $isSensitive = $true }
}

if ($isSensitive) {
    if ($bn -match "AGENTS.md|CLAUDE.md") {
        $reason = "⚠️ Editing root specification file: $bn. This file governs agent initialization."
    } else {
        $reason = "⚠️ Editing high-precedence governance file: $bn. Changes affect ALL agents and ALL tasks."
    }
    Write-Output (@{ decision = "allow"; reason = $reason } | ConvertTo-Json -Compress)
} else {
    Write-Output '{"decision": "allow"}'
}
exit 0
