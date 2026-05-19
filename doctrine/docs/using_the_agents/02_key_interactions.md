# Key Interactions with Specialist Agents

Learn how to leverage the 17+ specialist agents for common consulting tasks.

---

## Overview

This guide covers:
1. Understanding specialist agents and their roles
2. Practical examples: reformatting data, aggregating information, writing summaries
3. Switching between agents during a session
4. Using directives and approaches
5. Work directory discipline for traceability

**Estimated time:** 30-45 minutes

---

## Understanding Specialist Agents

The framework provides **17+ pre-configured specialist agents**, each with domain expertise, specific capabilities, and tailored operating procedures.

### Agent Categories

| Category | Agents | Purpose |
|----------|--------|---------|
| **Architecture & Design** | Architect Alphonso | System design, ADRs, technical decisions |
| **Development** | Backend Benny, Frontend Freddy | Implementation, APIs, UIs |
| **Data & Integration** | Abacus Abe | ABACUS360 mapping, data validation |
| **Documentation** | Scribe Sally, Writer/Editor | Technical writing, documentation |
| **Planning & Coordination** | Planning Petra, Manager Mike | Sprint planning, task orchestration |
| **Quality & Testing** | Framework Guardian | Testing, validation, framework audits |
| **Automation** | DevOps Danny (Build Automation) | CI/CD, release automation |
| **Analysis** | Researcher Ralph, Lexical Larry | Investigation, terminology analysis |
| **Visual Design** | Diagram Daisy | Diagrams, architecture illustrations |

---

## Agent Selection Guide

### When to Use General Mode

Use **general-purpose mode** (no specialist) for:
- Exploratory work and brainstorming
- Basic coding tasks without domain complexity
- File operations (copying, moving, organizing)
- General questions about the framework
- Git operations (commits, branches, status)

**Initialize:**
```
Initialize as per the AGENTS.md file in this directory.
```

---

### When to Use Specialist Agents

Switch to a **specialist agent** when:
- Working on domain-specific tasks requiring deep expertise
- Following established workflows (e.g., TDD, ATDD, ADR creation)
- Need consistent output formats (e.g., work logs, reports, diagrams)
- Multi-agent collaboration (agents hand off to each other)

**Initialize:**
```
Initialize as [agent-name] (as per the AGENTS.md specification).
```

---

## Practical Example 1: Reformatting an Excel File

**Scenario:** You have a messy Excel export with inconsistent formatting. You need to clean it up, standardize column names, and convert it to CSV.

### Step 1: Initialize Backend Benny

```
Initialize as Backend Benny (as per the AGENTS.md specification).

I have an Excel file "client_data_export.xlsx" that needs reformatting:
- Column names have spaces and special characters
- Some rows have missing data
- Need to output as CSV with standardized column names
```

### Step 2: Backend Benny Creates Analysis Script

Backend Benny will:
1. Store analysis script in `work/tmp/reformat_excel.py`
2. Show you the script for review
3. Run it if approved
4. Save results to `work/reports/`

**Example script (created by Benny):**

```python
# work/tmp/reformat_excel.py
import pandas as pd
import re

def standardize_column_name(col):
    """Convert column name to snake_case."""
    col = col.lower().strip()
    col = re.sub(r'[^\w\s]', '', col)
    col = re.sub(r'\s+', '_', col)
    return col

# Read Excel
df = pd.read_excel('client_data_export.xlsx')

# Standardize column names
df.columns = [standardize_column_name(col) for col in df.columns]

# Drop rows with all NaN
df = df.dropna(how='all')

# Export to CSV
df.to_csv('client_data_cleaned.csv', index=False)

print(f"✅ Reformatted {len(df)} rows")
print(f"Columns: {list(df.columns)}")
```

### Step 3: Review and Execute

Backend Benny will run the script and report results:

```
✅ Reformatted 1,234 rows
Columns: ['client_id', 'account_name', 'balance', 'last_activity']
Output: client_data_cleaned.csv
```

**Traceability:**
- Script stored: `work/tmp/reformat_excel.py`
- Results: `client_data_cleaned.csv`
- You can re-run or modify the script later

---

## Practical Example 2: Aggregating Information

**Scenario:** You need to aggregate data from multiple sources (CSV files, database queries, API responses) into a single report.

### Step 1: Initialize Backend Benny or Researcher Ralph

For **data aggregation logic:**
```
Initialize as Backend Benny (as per the AGENTS.md specification).

I need to aggregate data from:
1. customer_accounts.csv
2. transaction_history.csv
3. risk_scores.json

Output should be a summary report showing:
- Total accounts by customer segment
- Average transaction volume
- Risk distribution (low/medium/high)
```

For **research and analysis:**
```
Initialize as Researcher Ralph (as per the AGENTS.md specification).

I need to analyze these data sources and create a summary report...
```

### Step 2: Agent Creates Aggregation Script

**Example script:**

```python
# work/tmp/aggregate_data.py
import pandas as pd
import json

# Load data sources
accounts = pd.read_csv('customer_accounts.csv')
transactions = pd.read_csv('transaction_history.csv')
with open('risk_scores.json') as f:
    risk_data = json.load(f)

# Aggregate by customer segment
segment_summary = accounts.groupby('segment').agg({
    'account_id': 'count',
    'balance': 'sum'
}).rename(columns={'account_id': 'total_accounts'})

# Average transaction volume
avg_volume = transactions.groupby('account_id')['amount'].mean()

# Risk distribution
risk_df = pd.DataFrame(risk_data)
risk_distribution = risk_df['risk_level'].value_counts()

# Generate report
report = {
    'accounts_by_segment': segment_summary.to_dict(),
    'avg_transaction_volume': float(avg_volume.mean()),
    'risk_distribution': risk_distribution.to_dict()
}

# Save to work/reports/
with open('work/reports/aggregation_summary.json', 'w') as f:
    json.dump(report, f, indent=2)

print("✅ Aggregation complete. See work/reports/aggregation_summary.json")
```

### Step 3: Results

```
✅ Aggregation complete. See work/reports/aggregation_summary.json

Summary:
- Total accounts: 5,432
- Avg transaction volume: €12,345
- Risk distribution: Low (60%), Medium (30%), High (10%)
```

---

## Practical Example 3: Writing an Executive Summary

**Scenario:** You have technical reports and data. You need an executive summary for stakeholders.

### Step 1: Initialize Writer/Editor

```
Initialize as Writer/Editor (as per the AGENTS.md specification).

I need an executive summary for stakeholders based on:
- work/reports/aggregation_summary.json
- work/reports/validation_results.md
- Technical context: ABACUS360 data integration project

Target audience: Non-technical executives
Length: 1 page (500 words max)
```

### Step 2: Writer/Editor Creates Summary

Writer/Editor will:
1. Read the referenced files
2. Extract key insights
3. Write in non-technical language
4. Save to `work/reports/exec_summary_2026-02-04.md`

**Example output:**

```markdown
# Executive Summary: ABACUS360 Data Integration

**Date:** February 4, 2026  
**Prepared by:** Regnology Professional Services  
**Project:** Client Risk Data Integration

## Overview

Our team has successfully completed the initial phase of the ABACUS360 
integration, establishing automated data exchange between the client's 
OSX risk platform and the regulatory reporting system.

## Key Achievements

✅ **5,432 customer accounts** mapped and validated  
✅ **95% data quality score** achieved (exceeds 90% target)  
✅ **Zero critical errors** in validation testing  

## Business Impact

- **50% reduction** in manual data entry time
- **99.8% accuracy** in regulatory submissions
- **€12,345 average** transaction volume processed daily

## Risk Overview

Current portfolio distribution:
- 60% Low Risk (well within acceptable limits)
- 30% Medium Risk (standard for this sector)
- 10% High Risk (flagged for enhanced monitoring)

## Next Steps

1. **Week 1-2:** Production deployment and monitoring
2. **Week 3-4:** Client training and handover
3. **Ongoing:** Monthly data quality reviews

## Recommendation

Proceed with production deployment. All technical and quality criteria met.

---
**Contact:** [Project Lead] | [Email] | [Phone]
```

### Step 3: Review and Refine

You can ask Writer/Editor to adjust:
- **Length:** "Make it shorter (300 words)"
- **Tone:** "More formal / less technical"
- **Focus:** "Emphasize risk mitigation"
- **Format:** "Add charts or tables"

---

## Switching Between Agents

You can switch agents during a session to leverage different expertise.

### Pattern 1: Sequential Handoff

```
# Start with Researcher Ralph for analysis
Initialize as Researcher Ralph (as per the AGENTS.md specification).
Analyze the customer_accounts.csv and identify trends.

# [Ralph completes analysis]

# Switch to Writer/Editor for report
Switch to Writer/Editor mode.
Create an executive summary based on Ralph's analysis.

# [Writer/Editor creates summary]

# Switch back to general mode
Switch back to general mode for file organization.
```

### Pattern 2: Explicit Agent Assignment

For complex workflows, explicitly assign agents:

```
Initialize as Manager Mike (as per the AGENTS.md specification).

I need to:
1. Aggregate data from multiple sources (Backend Benny)
2. Create visualizations (Diagram Daisy)
3. Write an executive summary (Writer/Editor)

Please coordinate this workflow.
```

Manager Mike will create task files in `work/collaboration/` and orchestrate the work.

---

## Using Directives

**Directives** are externalized instruction sets for specific workflows.

### Common Directives

| Code | Directive | When to Use |
|------|-----------|-------------|
| 016 | ATDD | Writing acceptance tests |
| 017 | TDD | Test-driven development |
| 018 | Traceable Decisions | Creating ADRs |
| 020 | Locality of Change | Refactoring optimization |
| 023 | Clarification Before Execution | Complex/ambiguous tasks |
| 026 | Testing Styleguide | Implementing tests |

### Loading a Directive

```
/require-directive 026

# Agent confirms:
✅ Directive 026 loaded: Testing Styleguide
- Quadruple-A structure enforced
- Formalized constraint testing enabled
```

Now the agent will follow testing standards automatically.

---

## Using Approaches

**Approaches** are strategic patterns for complex workflows.

### Common Approaches

| Approach | Purpose |
|----------|---------|
| **File-based Collaboration** | Multi-agent task orchestration |
| **Locality of Change** | Minimize refactoring scope |
| **Ralph Wiggum Loop** | Self-monitoring during execution |
| **Decision-First Development** | ADR before implementation |

### Example: Decision-First Development

```
Initialize as Architect Alphonso (as per the AGENTS.md specification).

I need to decide on the architecture for a new reporting module.
Use the decision-first development approach.
```

Alphonso will:
1. Create an ADR draft
2. Present options with trade-offs
3. Wait for your decision
4. Document the final decision
5. Generate architecture diagram

---

## Work Directory Discipline

To maintain traceability, agents follow strict work directory conventions.

### Directory Structure

```
work/
├── tmp/           # Scripts before execution (traceability)
├── notes/         # Session notes, brainstorming
├── reports/       # Generated reports, summaries
└── collaboration/ # Multi-agent task files
```

### Best Practices

✅ **DO:**
- Review scripts in `work/tmp/` before execution
- Check results in `work/reports/`
- Keep `work/notes/` for informal documentation
- Use `work/collaboration/` for multi-agent workflows

❌ **DON'T:**
- Put production code in `work/` (belongs in main codebase)
- Treat `work/` as permanent storage (can be cleaned up)
- Store sensitive credentials in `work/`

### Example Workflow

```
User: "Analyze the field mappings in this CSV."

Backend Benny:
1. Creates work/tmp/analyze_mapping.py
2. Shows script to user
3. Runs script from work/tmp/
4. Saves results to work/reports/mapping_analysis.json

User: ✅ "Good job storing the script before running it."
```

---

## Common Patterns and Tips

### Pattern: Iterative Refinement

```
1. Ask agent to create initial version
2. Review output
3. Request specific changes: "Make it more concise"
4. Repeat until satisfied
```

### Pattern: Batch Operations

```
Process all CSV files in /data/ directory and:
1. Validate column names
2. Check for missing data
3. Generate summary report for each

Store scripts in work/tmp/ before running.
```

### Tip: Use Integrity Symbols

Agents use symbols to signal confidence:
- ✅ **Validated** — High confidence, checks passed
- ⚠️ **Warning** — Low confidence (<70%), assumptions made
- ❗️ **Critical** — Error, misalignment, blocking issue

If you see ⚠️ or ❗️, ask for clarification:
```
What's causing the warning? Can you explain your assumptions?
```

---

## Next Steps

Now that you understand key interactions, proceed to:

- **[Building a Feature](03_building_a_feature.md)** — Full feature development workflow with multi-agent collaboration

---

## Quick Reference

### Agent Initialization

```
# General mode
Initialize as per the AGENTS.md file.

# Specialist mode
Initialize as [agent-name] (as per the AGENTS.md specification).

# Switch agents
Switch to [agent-name] mode.

# Return to general mode
Switch back to general mode.
```

### Useful Commands

```
/validate-alignment         # Check context layers
/require-directive 026      # Load testing standards
/analysis-mode              # Structured reasoning (default)
/creative-mode              # Narrative thinking
/meta-mode                  # Process reflection
```

### Common Agents for Tasks

| Task | Recommended Agent |
|------|-------------------|
| Data processing | Backend Benny |
| Excel/CSV operations | Backend Benny |
| Writing summaries | Writer/Editor |
| Architecture design | Architect Alphonso |
| Testing | Backend Benny + Directive 026 |
| Documentation | Scribe Sally |
| Task coordination | Manager Mike |
| Research/analysis | Researcher Ralph |

---

**Last Updated:** 2026-02-04  
**Framework Version:** 1.0.0  
**Maintained By:** Regnology Professional Services
