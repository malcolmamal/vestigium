# PowerShell Conventions & Style Guide

**Version:** 1.0.0
**Last Updated:** 2026-03-17
**Status:** Active

---

## Purpose

PowerShell coding conventions and quality standards for agent-augmented development. These guidelines ensure consistency, cross-platform compatibility, and maintainability across PowerShell codebases, with emphasis on PSScriptAnalyzer compliance, Pester testing, and fail-fast validation.

---

## Formatting & Style

### Use PSScriptAnalyzer for Linting

**Tool:** PSScriptAnalyzer

**Command:**

```powershell
Invoke-ScriptAnalyzer -Path ./MyModule -Recurse
```

Follow the [PoshCode PowerShell Practice and Style Guide](https://poshcode.github.io/PowerShellPracticeAndStyle/) for formatting and structure.

### Enable Strict Mode

Require strict mode at the top of every script and module:

```powershell
Set-StrictMode -Version Latest
```

### Version Requirement

Use `#Requires` to declare minimum PowerShell version. Target PowerShell 7+ for cross-platform consistency:

```powershell
#Requires -Version 7.0
#Requires -Modules Pester, PSScriptAnalyzer
```

---

## Naming Conventions

| Element    | Convention | Example                         |
|-----------|------------|----------------------------------|
| Cmdlets   | `Verb-Noun`| `Get-ChildItem`, `Set-Location`  |
| Functions | `Verb-Noun`| `Convert-JsonToObject`, `Test-Connection` |
| Variables | `$PascalCase` | `$TaskList`, `$MaxRetries`   |
| Parameters| `-PascalCase` | `-Path`, `-Recurse`, `-Force` |
| Modules   | `PascalCase`  | `Pester`, `PSScriptAnalyzer`   |
| Script files | `.ps1` extension | `Deploy-Application.ps1` |

Use approved verbs. List: `Get-Verb`.

---

## Module Structure

Preferred layout:

```
MyModule/
├── MyModule.psd1              # Module manifest
├── MyModule.psm1              # Root module file
├── Public/
│   ├── Get-Something.ps1
│   └── Set-Something.ps1
├── Private/
│   └── HelperFunction.ps1
├── Tests/
│   ├── MyModule.Tests.ps1
│   └── Integration.Tests.ps1
├── build.ps1                  # Build automation
└── README.md
```

- **Public/** — Exported functions.
- **Private/** — Internal helpers (not exported).
- **Tests/** — Pester test files.

---

## Guard Clauses

Validate inputs early and fail fast with clear messages. Prefer guard clauses over nested conditionals.

❌ **Don't nest conditionals:**

```powershell
function Process-Task {
    param([hashtable]$Task)
    if ($Task.Agent) {
        if ($Task.Status -eq 'new') {
            # Do work
        } else {
            throw "Invalid status"
        }
    } else {
        throw "Missing agent"
    }
}
```

✅ **Do use guard clauses:**

```powershell
function Process-Task {
    param([hashtable]$Task)
    if (-not $Task.Agent) {
        throw "Task missing required 'Agent' field"
    }
    if ($Task.Status -ne 'new') {
        throw "Invalid task status: $($Task.Status)"
    }
    # Main logic with clean, flat flow
    return Invoke-InternalProcessing -Task $Task
}
```

---

## Error Handling

Use `try/catch/finally` for terminating errors. Use `-ErrorAction Stop` to promote non-terminating errors so they are catchable.

❌ **Don't ignore or swallow errors:**

```powershell
Get-Content -Path $path  # Non-terminating; errors not catchable
```

✅ **Do use ErrorAction Stop in try/catch:**

```powershell
try {
    $content = Get-Content -Path $path -ErrorAction Stop
} catch {
    Write-Error "Failed to read $path : $_"
    throw
}
```

---

## Pipeline Best Practices

Keep objects flowing through pipelines. Avoid formatting or string conversion mid-pipeline; defer output formatting to the end.

❌ **Don't format mid-pipeline:**

```powershell
Get-ChildItem | ForEach-Object { $_.Name | Out-String } | Where-Object { $_ -match '\.ps1' }
```

✅ **Do keep objects flowing:**

```powershell
Get-ChildItem |
    Where-Object { $_.Name -match '\.ps1$' } |
    ForEach-Object { $_.FullName } |
    Select-Object -First 10
```

Use `Where-Object`, `ForEach-Object`, and `Select-Object` for functional composition. Prefer `$_` explicitly where clarity helps.

---

## Testing

### Use Pester

**Tool:** Pester (canonical testing framework)

**Command:**

```powershell
Invoke-Pester -Path ./Tests -Output Detailed
```

### BDD-Style Syntax

Use `Describe`/`It`/`Should` blocks:

```powershell
Describe 'Get-TaskList' {
    It 'Returns tasks when path exists' {
        # Arrange
        $testPath = New-TemporaryFile
        Set-Content -Path $testPath -Value '{"id":"test"}'

        # Act
        $result = Get-TaskList -Path $testPath.FullName

        # Assert
        $result | Should -Not -BeNullOrEmpty
        $result.id | Should -Be 'test'
    }
}
```

---

## Common Pitfalls

### Version Confusion

Windows ships with PowerShell 5.1. Target PowerShell 7+ for cross-platform consistency and avoid 5.1-only features.

```powershell
#Requires -Version 7.0
```

### Execution Policy

For local development:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Object vs Text

Avoid formatting output in the middle of a pipeline; maintain object flow until final output.

### Error Handling

Non-terminating cmdlets (e.g. `Get-Content`, `Test-Path`) do not throw by default. Use `-ErrorAction Stop` when you need them to be catchable in `try/catch`.

---

## Tooling

| Tool             | Purpose                    |
|------------------|----------------------------|
| PSScriptAnalyzer | Linting, style, best practices |
| Pester           | Unit and integration tests |
| InvokeBuild/psake| Build automation           |
| VS Code PowerShell extension | IDE support       |

---

## Dependencies

Declare version and module requirements at the top of scripts:

```powershell
#Requires -Version 7.0
#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
#Requires -Modules PSScriptAnalyzer
```

---

## Cross-Platform Setup

| Platform | Install Command                          |
|----------|------------------------------------------|
| Windows  | `winget install Microsoft.PowerShell`    |
| Linux    | `sudo apt install powershell` (Ubuntu/Debian) |
| macOS    | `brew install powershell`                |

---

## Version History

| Version | Date       | Changes                                                                 |
|---------|------------|-------------------------------------------------------------------------|
| 1.0.0   | 2026-03-17 | Extracted from penguin-pragmatic-patterns PowerShell primer             |

---

**Maintained by:** Regnology Professional Services  
**Review Cycle:** Quarterly or when PowerShell tooling evolves  
**Related:** `doctrine/guidelines/python-conventions.md`, `doctrine/guidelines/java-conventions.md`
