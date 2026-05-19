<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# License Templates

**Purpose:** Canonical Regnology PS Internal Tooling license files for use in derivative repositories.

---

## Contents

| File | Description |
|------|-------------|
| `LICENSE` | Full proprietary license text with branded header |
| `licenses.properties` | Short license identifier mapping |
| `regnology-internal.properties` | License metadata (name, URL, distribution, comments) |

## Usage

When scaffolding a new Regnology PS internal repository:

1. Copy `LICENSE` to the repository root.
2. Copy `regnology-internal.properties` to `META/license/` (or equivalent metadata location).
3. Reference the license identifier from `licenses.properties` in build tooling as needed.

## License Scope

The license covers all Regnology Professional Services internal tooling. It is **not** suitable for open-source or externally distributed software. See Section 4 (Restrictions) in the LICENSE file for details.

## Contact

Regnology Group GmbH, Professional Services — Professional_Services@regnology.net