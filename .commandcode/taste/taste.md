# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# icons
- Use lucide-react for all icons instead of Material Symbols. Confidence: 0.8

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
- Number and track planned implementation steps as todos with status and a short activeForm summary, updating them as work progresses. Confidence: 0.6
- Label implementation phases in assistant messages as "T{n}" corresponding to the numbered plan. Confidence: 0.4

# workflow
See [workflow/taste.md](workflow/taste.md)
# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
- After a transaction is saved/completed, the cart must be automatically cleared (items plus recovery data) so the next transaction starts fresh — purchase-item data from a completed transaction must not linger. Confidence: 0.6
- Saved transaction drafts must be deleted once consumed — delete immediately upon resume into the cart (best-effort, without blocking the restore) so a draft can never be resumed twice or linger as stale data after the transaction completes. Confidence: 0.65
 than only restyling. Confidence: 0.7
- Confirmed design direction for this app: full-app visual overhaul, light theme only (no dark mode), keep hamburger-drawer navigation (no bottom nav bar). Confidence: 0.7

# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
0.75
