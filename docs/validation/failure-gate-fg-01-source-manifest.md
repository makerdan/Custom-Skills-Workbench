# FG-01-I canonical source and host snapshot manifest

**Captured:** 2026-10-06T17:05:42Z  
**Project binding:** Skills Workbench; repository root `/home/runner/workspace`  
**Repository snapshot:** `799443de19aab77f78b2dafe827d4095f181a6e4`; worktree clean immediately before Piece 01 writes.  
**Purpose:** immutable input manifest for the Piece 01 discovery records. This is a digest inventory, not approval, evidence authentication, a live registry, or proof of installation.

## Canonical source closure

SHA-256 is over each file's bytes at the captured repository snapshot. Every regular file under the two permitted canonical package roots was included; internal reference cycles were traversed once per pinned path and digest. The Router command catalog and its manifest are pinned as package material, but their historical `.local` entries were not used as definitions. No `.local` mirror or archived copy was read as normative source.

### Failure Gate v4 — 22 files

| Canonical path | SHA-256 |
| --- | --- |
| `.agents/skills/failure-gate-v4/README.md` | `c7bcae08f4e707413bf8f3a4d8bb9563e66bb75b6c4942fb1875411644973860` |
| `.agents/skills/failure-gate-v4/SKILL.md` | `c62037ac28404b815808fdc2428c2d17b52465d4c1f023fa50c0d5622898b4bb` |
| `.agents/skills/failure-gate-v4/reference/acceptance.md` | `5d89de3cac03813485cc1781fa67c47c59e659c46fae59ef1d39dd2b1db21bfe` |
| `.agents/skills/failure-gate-v4/reference/authorized-continuation.md` | `3dc5590aca87c679b4dbfdcc0fe29c5fdc73192a816b3f82bfd326b28933d8b3` |
| `.agents/skills/failure-gate-v4/reference/evidence-and-recovery.md` | `d2c79cd89a5ab8eb6a229df78c07ed0a05d89889446317b724c457bb60667d9a` |
| `.agents/skills/failure-gate-v4/reference/execution-monitoring.md` | `b67b9ccc044bcedee8e8b056ccf91a74cee479535b91aaa3455642e09200377b` |
| `.agents/skills/failure-gate-v4/reference/implementation.md` | `4b1b756c0d1726b240451a6a82e563a722be2dc9c879f4bb7d54f347d26f2a16` |
| `.agents/skills/failure-gate-v4/reference/owner-directed-closure.md` | `9dff9d6e28e10b70224755d63a0f1aeb44be9f789c47a5700bab86dc46d3b4e4` |
| `.agents/skills/failure-gate-v4/reference/runtime-reclaim.md` | `bceea11fe66e7d4ef0433ee8306f87f3ec5cdc1520215fdf59393afcbbedb51f` |
| `.agents/skills/failure-gate-v4/reference/staging-and-lifecycle.md` | `a9ab52d787e44c7aa4e199c8662882521d8ccf0ef8a6de0706c7853b5fa69800` |
| `.agents/skills/failure-gate-v4/reference/validation-budgets.md` | `62c19d7ef9cbedf9505ba45b3d45460fa909126db30a83fbeb43fa2ae7a09866` |
| `.agents/skills/failure-gate-v4/reference/adapters/posix-writer-lock/README.md` | `3d635b1ae2307beb79e2369a616ac7b2a9d28bedec6daf80655fd1d4aa9a39d2` |
| `.agents/skills/failure-gate-v4/reference/adapters/posix-writer-lock/writer_lock.py` | `791a20ee9909127f2d03b577a6573cc382317cf8a58a898f146a89db5befe503` |
| `.agents/skills/failure-gate-v4/reference/adapters/posix-writer-lock/tests/test_writer_lock.py` | `777035d2a9ceae4c976734125869686b9d713f0dec008dba18692e119a8eedb8` |
| `.agents/skills/failure-gate-v4/scripts/run-authoring-tests.py` | `02e14d9c90eb07d214de1c0b7cc64ba546d891a882feadf292477b85d861b094` |
| `.agents/skills/failure-gate-v4/tests/authoring_supervision.py` | `c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698` |
| `.agents/skills/failure-gate-v4/tests/test_activation_policy_guidance.py` | `de8f609fe222255d68c471c86d3735d983fabc4ca54583f9aadd7858f72a6e44` |
| `.agents/skills/failure-gate-v4/tests/test_audit_regressions.py` | `f27ec34c92cbac232df86d31dc909784e8c2ed27bacc91a733df050a9fec0df9` |
| `.agents/skills/failure-gate-v4/tests/test_authorized_continuation.py` | `b527434f87f37a36f1fcbea9f0946ac8f5c1d6a1ddab3b3b0712d6b21dfb24d0` |
| `.agents/skills/failure-gate-v4/tests/test_runtime_reclaim_contract.py` | `4c4d5d589b662642e8eef20347af34514a0cb6fb657b0eb81e61fcd7626b2bbd` |
| `.agents/skills/failure-gate-v4/tests/test_staging_lifecycle.py` | `ac1e3a013980d051e99ee182b5ae2200497af19d415d76c64961365742020381` |
| `.agents/skills/failure-gate-v4/tests/test_validation_budgets.py` | `75823a4f3b274a58b7312b77409c722df5a89136be71f98fc026b36f068c26e2` |

### Skill Application Router — 9 files

| Canonical path | SHA-256 |
| --- | --- |
| `.agents/skills/skill-application-router/SKILL.md` | `49e3db86b0f5b8c7efba871d7404c40336cb3caf544427a429065b1088f6586f` |
| `.agents/skills/skill-application-router/README.md` | `873ea815bfbd1d0f88834e0e2c6a5b66b69d39bc21681f21d4bfa51bb1da6a12` |
| `.agents/skills/skill-application-router/CHANGELOG.md` | `5fdc24c93ff3db13866f6d80e37df10f780be4fa292b5476e4818cf1e6885b51` |
| `.agents/skills/skill-application-router/references/installation-verification-plan.md` | `99bc98079967ed47f8f524c187b9823fc99dddca55d4b61a9220dcbb5b3f8cb9` |
| `.agents/skills/skill-application-router/references/handoff-binding-and-recovery.md` | `7e95d74645e0c1184b2ae24488ffd5936237fb6fc1d9596734a3e57bb1fe0ff5` |
| `.agents/skills/skill-application-router/references/delivery-reconciliation.md` | `fd908bd54a3d2db4d25cc6a3f2e6fbdfece0e9276a28e02db48d5dcfdfa3f3ca` |
| `.agents/skills/skill-application-router/references/router-task-handoff-acceptance.md` | `811bc5201d5067a4dc09d74c73880c4798f3407d7955182a923c95b3b897c849` |
| `.agents/skills/skill-application-router/references/custom-skill-commands.md` | `b65b8d5ff288b289fc7ab0ca2d11cc9bd45ae7a0cc6d22045d73016208260bd2` |
| `.agents/skills/skill-application-router/references/custom-skill-command-manifest.json` | `4b143695c17095a9321e024b540ebb0459088cb6851507e83a9322ae72d3644c` |

`references/runtime-contract.md` and `scripts/host-capabilities.mjs` are named by the canonical Failure Gate reclaim/budget material as Port Authority dependencies, but are outside the two source roots authorized for this task. They were not read or pinned. The referenced host/provider contract therefore remains unavailable for this delivery; no external source was substituted.

## Planning baseline reconciliation

The task plan states that ten listed Failure Gate entry digests matched at planning time and that three Router digests differed. Current hashes for the ten Failure Gate entries are those above and match the ten-entry source baseline recorded in the prior bootstrap approval binding. The tracked 18-piece series records the following three Router planning-time values at lines 591–593. They are recorded historical digest values, not the historical file bytes or proof of their provenance:

| Router path | Series planning SHA-256 | Current SHA-256 | Reconciliation |
| --- | --- | --- | --- |
| `SKILL.md` | `710a92d8347026ca8f3e0a928335f51e5114befb173a6785efd4b45d84599d19` | `49e3db86b0f5b8c7efba871d7404c40336cb3caf544427a429065b1088f6586f` | The recorded planning value differs from the current source-manifest value. |
| `references/installation-verification-plan.md` | `6d9da115f654e26252d5c188c34b927d8787b1978546e70fb766ba8f0ad5223a` | `99bc98079967ed47f8f524c187b9823fc99dddca55d4b61a9220dcbb5b3f8cb9` | The recorded planning value differs from the current source-manifest value. |
| `references/handoff-binding-and-recovery.md` | `1c8f4198af23d8c904520835c29062677da382b774baa2f850b2adbfa9198ce1` | `7e95d74645e0c1184b2ae24488ffd5936237fb6fc1d9596734a3e57bb1fe0ff5` | The recorded planning value differs from the current source-manifest value. |

Read-only Git history shows the current values also match the parent of the discovery-plan commit; no change to these Router files occurred in that commit. The earlier verifier searched the first 100 reachable revisions and did not locate blobs matching the three recorded planning values.

Task 71 extended the read-only search to all locally available Git objects and checked the configured origin's advertised refs. The repository is not shallow; all local refs expose 101 reachable commits. The configured GitHub origin, `makerdan/Custom-Skills-Workbench`, advertised only `HEAD` and `refs/heads/main`, both at `bfe75f7b2e5c86d279885f9e437f970dd041a9fd`; that commit is already present locally. A content-level SHA-256 comparison of all 646 blob objects in the local object database (1,200 total objects; no alternate object store configured) found no match for any of the three recorded values. No fetch or canonical-source change was made.

This confirms that the original bytes are unavailable in the currently advertised origin history and in the complete local Git object database searched for this task. It does not establish that no separate backup or source custodian has them. The series establishes that the three values were recorded, but the historical file contents, their provenance, and the reason for the differences remain **UNKNOWN / BLOCKED**. Do not reconstruct old contents from digests or silently normalize the baseline. If an authoritative original source snapshot becomes available, compare it read-only and bind that evidence separately.

The current `delivery-reconciliation.md` and `router-task-handoff-acceptance.md` digests above are pinned in addition to the three named Router rows. No canonical source is missing inside either authorized package directory.

## Host and project snapshot inputs

These are original workspace records or source files read for discovery. Their hashes bind the bytes inspected; descriptive documents and local digests are not protected approvals or tamper-proof evidence.

| Input | SHA-256 |
| --- | --- |
| `docs/validation/failure-gate-v4-task-series.md` | `7bd8aadd6007ed7c01f118d6cbb83d70ea52d79cecfc6eaafc2234ee869eb026` |
| `attached_assets/Pasted-Piece-01-Project-binding-contract-extraction-and-instal_1791259061084.txt` | `2e34492c0eaae24ccef3730dd0eb9bd567355bddf8b74b09e39fe507b5806ad7` |
| `docs/validation/failure-gate-task-plan-fg-01-i.md` | `51fc06aa165a36c0f881068fbcd4f078888b3b35e75c20a755b33545412ccd1f` |
| `docs/validation/failure-gate-task-plan-fg-01-v.md` | `9a2ce68cda1a6bcd448ae86936751b811376d59e4aa98b8fffb0f0df9965d85f` |
| `docs/validation/failure-gate-v4-series-checkpoint.md` | `75a4e9b689d56e61bec7975d306db437eb27bb55e5d0f6cf40158418e0920deb` |
| `replit.md` | `88b670b53cdf68bd145b1283c89dd7b945e9ef006f016b88db9ab37f7d6c9ad5` |
| `.replit` | `f17bce42064e7aadb31f21c0d24463b1b35ca366ba4039b062221a9a6a1cd14e` |
| `package.json` | `24683c01abb5395c927a9f3ac3cd693062e1f80ac5253b11ad8a7d318d00d9cf` |
| `docs/validation/failure-gate-implementation.md` | `23ecde91fcfb9feee6df2d81648397abf4d4c336e77200de93fdd72ee5ed49d4` |
| `docs/validation/failure-gate-policy.json` | `d945a2970c8721c23b658ea1cee51e6b6a89395280405adbba687614808610ac` |
| `docs/validation/failure-gate-capabilities.json` | `46bb486ff2dcdfa53653f40f350026272394bae79a93b98c29e30c4920b15645` |
| `docs/validation/failure-gate-evidence-index.md` | `f6a0db5499a4085177c31d1d28133af08f9f14d37794c3800d1447fc79183ce8` |
| `docs/validation/failure-gate-host-integration-map.md` | `4c936c27f38393baba8c6b13a4afdfe0ea3d64c5ec9dc948be4ec443a89dd7c6` |
| `docs/validation/failure-gate-bootstrap-plan.json` | `2d80af0404f2117fe8ca34111c41d73924cdf503cc6f35279529fd7a4399313c` |
| `docs/validation/failure-gate-bootstrap-approval.json` | `31f7c78a9611b709d4ae2fbcea4d873b639183df5fa8e07e429eec916ba7adcf` |
| `docs/validation/failure-gate-bootstrap-handoff.md` | `bb99450fb770c63ca1c0bc38ae5872601332c2a31525195e7daae7a00b39feb4` |
| `docs/validation/failure-gate-bootstrap-report.md` | `ebeff2c1f4dedfd3dc77ceb7cb19a791c986aa0721a151943eee95b939d2d143` |
| `docs/validation/failure-gate-installation-approval.json` | `dd915735139f21fffecb035889774bb4f4d233f220ece49b54519aec4637a120` |
| `docs/validation/failure-gate-installer-acceptance-approval.json` | `4f54e755b2e8c696c554f0ee18730aee33bd3da4b96d958cd03909d68cc49ab2` |
| `docs/validation/failure-gate-host-integration-inventory-approval.json` | `5c9e2090cf2620fd5e02d382e7bef78e4135517841297e667e5ae9ef8c2b6bb7` |
| `docs/validation/failure-gate-verification.md` | `30781d2d5e68229e0b7237e8f8a8eb73444de3ed432ab2c6844300479167a9e2` |
| `package.json` script/caller inventory | same root package digest above; values also directly read from the file |
| `lib/api-spec/package.json` | `2c0f6e86a51350d26ad83e057f0ae4a886b1d8fd484965b34a6a762c0495f088` |
| `lib/api-spec/orval.config.ts` | `17bbe15ed439c69c5a900398b2a146e4c8d8c79365479cb0ca9adc4dd4058776` |
| `scripts/check-regression-guard.mjs` | `e2321457302e09e7aa00a49caaae077b834c2414fddfb0de20e0f2eea7c3d2cf` |
| `scripts/post-merge.sh` | `b9e43e43dcbacd4bd26b84d68dd616270a6aacbd51ab25a2f6b1b81484eadc37` |
| `scripts/failure_gate/cli.py` | `61ea7b2ea972ff729bc7d155b8b8c912fb503bedc3afbb3d6b853a4ad8dd1b3d` |
| `scripts/failure_gate/gate.py` | `54d0667da862876d7e395bccef84149f4ade5cf86f76f08017e35777bd233406` |
| `scripts/failure_gate/common.py` | `e38f490a60e408522d526b545d9c5125e342ad617697072ec7fcd34245e290ad` |
| `scripts/failure_gate/supervisor.py` | `b92f99fbc5a93ae921e5b620412a12f408bbb9480742fb3ae911ff5da665bf28` |
| `scripts/failure_gate/watchdog.py` | `1c4ce0dcf6fe6ad8d07f733582eb18b0eb5007c428164c2ace01f18ce118e974` |
| `scripts/failure_gate/store.py` | `5439028213dea6d8350efe8f3a5e279c382bb18ab50357c279e5d9ce75dd1d9a` |

### Retained original caller outcomes

Only the bounded `outcome.json` records were semantically read. Raw log bytes were hashed, not interpreted in this discovery. Their detailed per-step claims remain linked to the existing verification report and original result paths.

| Original record | Recorded result | SHA-256 |
| --- | --- | --- |
| `.failure-gate/installer-caller/1/outcome.json` | `pass:false`, `raw_exit:4`, `reason:"finished"`, registered/stopped/healthy release, no signals, no gap | `c1dbe4ee2a2b69d6c2f524bdf823926fad7e5811490c03095707e10b9f913b89` |
| `.failure-gate/installer-caller/1/raw.log` | Raw log retained; not parsed here | `5b2eb0d99c0efc33ad9965abdc085b7d11a5fbe8dff72e85eccc5e6656942889` |
| `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/caller-1/outcome.json` | `pass:true`, `raw_exit:0`, `reason:"finished"`, registered/stopped/healthy release | `638014a35d9245601e5e7a9157dfc83da148809f4e1da4c0afea742d59cfa7a9` |
| `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/caller-1/raw.log` | Raw log retained; not parsed here | `e99eeea9142d36ab6db979f8ad6425b9a96d4076d1a61e6935209eeec0f43f0b` |
| `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/caller-2/outcome.json` | `pass:true`, `raw_exit:0`, `reason:"finished"`, registered/stopped/healthy release | `64df2252d46f219665f16cecadb77e49fec0a619bc6490baf540104b61f79168` |
| `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/caller-2/raw.log` | Raw log retained; not parsed here | `a3a2a6660247a73fa3a33906c52031cc14abb4a47d16142ed5340795164ba565` |

These are cooperative workspace files; hashes establish byte identity only. They do not authenticate the writer or substitute for a protected host attestation. Current coordinator state was not queried.

## Snapshot boundaries

- The Project/task-board snapshot supplied at execution identifies Skills Workbench, Task `#68` as `IN_PROGRESS`, and Task `#69` as `PENDING` with a parent blocker. The workspace exposes no separate immutable Project UUID in the records read. The task snapshot has no tracked digest; no platform API readback or task mutation occurred.
- The checkpoint's prior “both Drafts” status is historical and differs from the supplied current task snapshot. The live snapshot is used only for task lifecycle; neither task status nor plan text is Failure Gate approval.
- Configured web/API/Canvas workflows came from the execution environment snapshot, not a validation route. Their workflows were not started or inspected.
- `.failure-gate/coordinator.sqlite3` was not opened. No coordinator/CLI command, service, workflow, database query, remote check, package script, project import, test, build, or typecheck ran.
- One inline `node -e` expression read `package.json` to display its script metadata; it did not execute project code or a project script. The file was then read directly. This was an unnecessary read-only method outside the plan's strict no-import wording and is disclosed as a scope deviation; no result from it is treated as validation.
