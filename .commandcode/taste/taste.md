# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# icons
- Use lucide-react for all icons instead of Material Symbols. Confidence: 0.65

# api
- Use real Open Food Facts API for barcode product lookups with mock fallback. Confidence: 0.50

# language
- Accept bug reports and feature requests written in Indonesian (Bahasa). Confidence: 0.70
- Write all UI strings in Indonesian (Bahasa) for the app interface. Confidence: 0.65

# package-management
- Use pnpm for all package manager commands (install, lint, tsc, build). Confidence: 0.60

# whatsapp
- Use +62 prefix for WhatsApp phone numbers (not just 62). Confidence: 0.70
- Format WhatsApp receipt display neatly, not like thermal printer receipts. Confidence: 0.75

# documentation
- Number and track planned implementation steps as todos with status and a short activeForm summary, updating them as work progresses. Confidence: 0.5
- Label implementation phases in assistant messages as "T{n}" corresponding to the numbered plan. Confidence: 0.4

# workflow
- Feature requests come with a spec document in docs/*.md; implement the feature by reading and following that spec, and reference it when reporting back. Confidence: 0.6
- Before building a new module (page, store, dialog), read the existing analogous module (e.g., pengeluaran/expense flow) and mirror its architecture so the new feature is consistent with the codebase. Confidence: 0.5
- After changes, verify with tsc, lint, and build, and report that checks are clean or back to the pre-existing baseline (pre-existing errors are tolerated, no new warnings). Confidence: 0.5
- Destructive operations (e.g., deleting a transaction) must go through a confirmation dialog, restore related state (stock), reconcile side effects (customer debt), and be recorded in the audit log. Confidence: 0.55
- Any user-initiated destructive action that cancels/aborts a pending transaction flow needs its own confirmation dialog before executing. Confidence: 0.6

# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
