# workflow
- Feature requests come with a spec document in docs/*.md; implement the feature by reading and following that spec, and reference it when reporting back. Confidence: 0.6
- Before building a new module (page, store, dialog), read the existing analogous module (e.g., pengeluaran/expense flow) and mirror its architecture so the new feature is consistent with the codebase. Confidence: 0.5
- After changes, verify with tsc, lint, and build, and report that checks are clean or back to the pre-existing baseline (pre-existing errors are tolerated, no new warnings). Confidence: 0.5
- Destructive operations (e.g., deleting a transaction) must go through a confirmation dialog, restore related state (stock), reconcile side effects (customer debt), and be recorded in the audit log. Confidence: 0.55
- Any user-initiated destructive action that cancels/aborts a pending transaction flow needs its own confirmation dialog before executing. Confidence: 0.6
- Resolve ambiguous product-scope decisions (default theme, dark-mode scope, feature count) via clarifying questions and lock them before implementing a large feature. Confidence: 0.55
