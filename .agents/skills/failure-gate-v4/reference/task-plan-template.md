# Task plan semantic scaffold

Read before planning or activation. The fields are normative semantic requirements,
not a mandatory Markdown format, installed host scaffold or source of authority.

Use the host scaffold once verified. The following Markdown illustrates required
semantic fields; other project-local task formats may map equivalent fields
without adopting these exact headings:

```markdown
## Task identity
**Task ID:** `TASK-001042`

## Pre-existing failures to ignore
None known at plan time. Treat new failures as potential regressions.
**Flaky-test rule:** A passing retry proves intermittency, not provenance.

## Task-local environment observations
None observed.

## Validation
**Command:** `<registered-tier>`
**Why:** Covers the changed behavior and its relevant integration boundary.
**Do not escalate:** Run only the authorized tier; request approval for changes.
```

Replace examples with real registered values. Record an exact matching baseline
as either `**Ignored baseline:** <ID>` or `**Owned baseline repair:** <ID>`,
never both. Include suite, test, applicable variant/environment, and signature.
Keep task-local observations separate from reusable catalog authority.

Preserve other host-required sections and regression protections.
Use the main skill and applicable references for approval, execution and completion.
