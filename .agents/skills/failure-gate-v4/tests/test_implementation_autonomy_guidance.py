"""Document-contract checks only; not runtime authority or host acceptance."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def text(path):
    return " ".join((ROOT / path).read_text().split())


class ImplementationAutonomyDocumentTests(unittest.TestCase):
    def setUp(self):
        self.contract = text("reference/implementation-autonomy.md")

    def contains(self, *clauses):
        for clause in clauses:
            with self.subTest(clause=clause):
                self.assertIn(clause, self.contract)

    def test_default_has_no_routine_approval_or_diary(self):
        self.contains("without separate approval, decision records, step-by-step narration or method-change ledgers",
                      "Selecting among unspecified equivalent methods is not itself a protected-plan amendment",
                      "An expressly fixed requirement remains binding")

    def test_examples_are_not_acceptance_requirements(self):
        self.contains("examples", "they add no obligations and need not be enumerated",
                      "not a mandatory per-work-family checklist")
        self.assertIn("Illustrations only", text("reference/implementation-autonomy-examples.md"))
        self.assertNotIn("| Work family |", self.contract)

    def test_only_real_exceptions_need_change_records(self):
        self.contains("Acceptance criteria, required behavior/coverage",
                      "Approved task/repair/execution scope, tier, policy",
                      "Safety, privacy, compatibility, persistence",
                      "Do not require these change records for routine choices",
                      "Changing an explicitly constrained method or a protected executable plan")

    def test_required_evidence_is_not_removed(self):
        self.contains("Required run, approval, incident, provenance and acceptance records remain mandatory",
                      "invalidate affected prior run evidence",
                      "independent post-repair acceptance")

    def test_execution_and_governing_versions_stay_bound(self):
        self.contains("Code/test authorship does not imply execution authority",
                      "Preserve explicit inert staging exclusions and task-wide gates",
                      "finite budgets and independent supervision",
                      "versions still require their applicable review and binding before use")

    def test_verified_policy_reuse_still_gets_fresh_decisions(self):
        self.contains("after verified integration and authorized cutover",
                      "with a fresh bound decision for each",
                      "No repeated human policy approval is needed",
                      "this reference activates nothing")

    def test_entry_points_and_acceptance_cover_new_rule(self):
        for path in ("SKILL.md", "reference/implementation.md",
                     "reference/authorized-continuation.md", "README.md"):
            self.assertIn("implementation-autonomy.md", text(path))
        acceptance = text("reference/acceptance.md")
        self.assertIn("Exception/change records", acceptance)
        self.assertIn("Unspecified equivalent method selection alone creates no change-record requirement", acceptance)
        self.assertIn("loadTestsFromModule(d)", text("scripts/run-authoring-tests.py"))

    def test_plan_scaffold_and_length_remain_intact(self):
        self.assertIn("task-plan-template.md", text("SKILL.md"))
        scaffold = text("reference/task-plan-template.md")
        for clause in ("Task identity", "Task ID", "Pre-existing failures to ignore",
                       "Flaky-test rule", "Task-local environment observations",
                       "Do not escalate", "Ignored baseline", "Owned baseline repair", "never both"):
            self.assertIn(clause, scaffold)
        self.assertLess(len((ROOT / "SKILL.md").read_text().splitlines()), 500)

    def test_historical_tests_are_not_current_proof(self):
        self.assertIn("authoring suites were NOT_RUN", text("README.md"))


if __name__ == "__main__":
    unittest.main()
