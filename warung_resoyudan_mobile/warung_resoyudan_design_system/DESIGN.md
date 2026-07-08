---
name: Warung Resoyudan Design System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  success-paid: '#16A34A'
  warning-debt: '#D97706'
  danger-alert: '#DC2626'
  surface-muted: '#F8FAFC'
  border-standard: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-xl:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  numeric-display:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 48px
  gutter: 1rem
  container-padding: 1.25rem
  stack-gap: 0.75rem
---

## Brand & Style

The brand personality is **dependable, efficient, and community-focused**. It is designed for small kiosk owners who need a digital assistant that is faster and more reliable than a paper ledger. The design system prioritizes utility over decoration, ensuring the interface feels like a professional tool rather than a complicated piece of software.

The chosen design style is **Corporate / Modern** with a strong influence from **Shadcn UI**. It utilizes a clean, systematic approach with high-contrast elements to ensure readability in the varied lighting conditions of a retail environment (e.g., bright sunlight or dim indoor kiosks). 

### Key Principles:
- **Utility First:** Every pixel must serve a functional purpose for bookkeeping or sales.
- **Mobile-Centric Ergonomics:** Focus on bottom-oriented interactions and large touch targets (minimum 48x48px) for one-handed operation.
- **Trust through Clarity:** Use bold weight for currency and stock numbers to prevent errors during high-traffic sales periods.

## Colors

This design system uses a high-contrast palette to ensure "at-a-glance" readability. 

- **Primary (#0F172A):** A deep, professional navy used for primary text and structural elements to provide a sense of stability and authority.
- **Secondary (#2563EB):** A vibrant blue used for primary actions and "Add to Cart" functions, signaling interactivity.
- **Status Colors:** 
    - **Success (#16A34A):** Specifically designated for 'Paid' status and profitable metrics.
    - **Warning (#D97706):** Designated for 'Debt' (Kasbon) and 'Low Stock' alerts.
    - **Danger (#DC2626):** Reserved for destructive actions and 'Out of Stock' errors.
- **Neutrals:** Extensive use of white and soft grays (#F8FAFC) to maintain a clean aesthetic and allow status colors to pop.

## Typography

The design system uses **Hanken Grotesk** for its exceptional legibility and modern, sharp appearance. It balances a professional tone with high readability, even at smaller sizes on mobile screens.

- **Currency & Stock:** All numbers representing money or stock counts should use `numeric-display` or `label-xl` with a bold weight to ensure the shop owner never misreads a price.
- **Hierarchy:** Use `headline-lg` for dashboard summaries and `label-md` (uppercase) for table headers and section descriptors.
- **Readability:** Line heights are slightly generous to prevent "crowding" of text, which is essential for users who may be multi-tasking while serving customers.

## Layout & Spacing

This design system follows a **Mobile-First, Fluid Grid** philosophy. Since the primary device is an Android smartphone, the layout is optimized for vertical scrolling and thumb-reach zones.

- **Touch Safety:** All interactive elements (buttons, list items, checkboxes) must adhere to a minimum **48x48px** hit area.
- **The "Sticky Bottom" Zone:** In the Kasir (POS) view, the "Complete Transaction" button and "Total Amount" display must be pinned to the bottom of the viewport for easy thumb access.
- **Margins:** A consistent 20px (1.25rem) side margin is maintained across the app to prevent content from hitting the screen edges.
- **Breakpoints:**
    - **Mobile (< 640px):** Single column stack. Sidebar is a hidden overlay drawer.
    - **Tablet/Desktop (> 640px):** Content is capped at 768px and centered to maintain the focused mobile experience even on larger screens.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-contrast outlines** to define hierarchy, avoiding heavy shadows that can look "muddy" on lower-end mobile screens.

- **Level 0 (Background):** Solid white or #F8FAFC.
- **Level 1 (Cards/Containers):** Pure white background with a 1px border (#E2E8F0). No shadow.
- **Level 2 (Modals/Drawers):** Pure white with a subtle, very diffused shadow (0px 10px 15px -3px rgba(0,0,0,0.05)) to distinguish the overlay from the base content.
- **Active State:** When a product is selected in the Kasir view, use a 2px solid `secondary` blue border to indicate focus.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness level to maintain a "Professional/Tool" feel. 

- **Standard Elements:** Input fields, buttons, and small chips use a 4px (0.25rem) radius.
- **Large Containers:** Cards and the bottom "Summary" sheet use an 8px (0.5rem) radius.
- **Status Pills:** 'Paid' and 'Debt' status indicators use a fully rounded (pill) shape to distinguish them from functional buttons.

## Components

### Buttons
- **Primary:** Solid `#2563EB` with white text. Minimum height 48px. Bold typography.
- **Secondary/Outline:** 1px `#E2E8F0` border with `#0F172A` text.
- **Ghost:** No border, used for secondary actions like "View Details."

### Input Fields
- Labels must always be visible (never placeholder-only).
- Large 16px text to prevent iOS/Android auto-zoom on focus.
- Thick 1px border that turns `secondary` blue on focus.

### Cards (Product & Transaction)
- Flat style with 1px border. 
- Use a "Split" layout for products: Name/Stock on the left, Price/Add button on the right.
- Quantity toggles (- / +) must be large (48x48px) with clear vertical alignment.

### Status Chips
- **Paid:** Light green background with dark green text.
- **Debt:** Light amber background with dark amber text.
- These should be placed consistently in the top-right corner of list items.

### List Items (Kasbon/History)
- High-density lists with 12px vertical padding.
- Use chevron icons (right-pointing) to indicate drill-down capability.
- Summary data (Total Debt) should be bold and 1.2x larger than the name.