---
name: Precision Enterprise Operations
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0d1c2e'
  on-tertiary-container: '#77859a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: -0.02em
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-mobile: 0.5rem
  margin: 1.25rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for intensive 8+ hour operational throughput across Admin, Warehouse, Sales, and Accounts roles. The design prioritizes cognitive endurance, data legibility, and high-density functional efficiency over decorative elements.

### Style Movements & Attributes
- **Architectural Minimalism:** Layouts favor clear spatial organization, rigid 1px structural dividing lines, and zero non-functional ornament.
- **Utilitarian Restraint:** Eliminates decorative gradients, glassmorphic blurs, and saturated brand displays. Color is treated strictly as an information carrier.
- **Ergonomic Visual Balance:** The low-contrast canvas background minimizes eye fatigue during extended shift use, while high-contrast typography guarantees unambiguous reading of complex SKUs, financial ledgers, and logistics status indicators.

## Colors

The color palette is calibrated for high information density, rapid scanning, and low ocular fatigue.

### Color Roles & Semantics
- **Canvas Base (`#F8F9FA`):** Low-glare foundational background providing gentle separation from high-focus workspaces.
- **Surface Layer (`#FFFFFF`):** High-clarity white reserved for interactive tables, data cards, form groups, and dialog containers.
- **Structural Lines (`#E2E8F0`):** Hairline borders establishing visual boundaries without visual weight.
- **Primary Brand / Action (`#0F172A`):** Deep slate-navy anchoring primary interface controls, focused navigation nodes, and primary actions.
- **Interactive Secondary (`#1E3A8A`):** Technical ink blue for secondary links, inline actions, and active navigation filters.
- **Primary Text (`#0F172A`):** High-contrast neutral ensuring crisp legibility of alphanumeric data.
- **Muted Text (`#64748B`):** Supporting metadata, column headers, and inactive states.

### Status Semantic System
All status indicators pair a muted light background with an accessible dark foreground and structural hairline border:
- **Success / Confirmed / In-Stock:** Background `#ECFDF5`, Text `#065F46`, Border `#A7F3D0`
- **Warning / Low-Stock / Pending:** Background `#FFFBEB`, Text `#92400E`, Border `#FDE68A`
- **Error / Critical / Cancelled:** Background `#FEF2F2`, Text `#991B1B`, Border `#FECACA`
- **Neutral / Draft / Inactive:** Background `#F1F5F9`, Text `#475569`, Border `#CBD5E1`

## Typography

Typography focuses on immediate recognition of dense tabular values, inventory identifiers, and nested metrics.

- **Primary Typeface:** `Inter` is applied across all interface hierarchy levels due to its tall x-height, neutral glyph geometry, and distinguished numerical figures.
- **Monospace Numerical Support:** `JetBrains Mono` handles SKUs, serial codes, currency values, barcodes, and raw logistics timestamps, ensuring vertical alignment across data columns.
- **Tabular Figures:** Ensure `font-feature-settings: "tnum" 1, "cv05" 1` is active globally so that tabular metrics align cleanly without horizontal layout shifts.
- **Letter Spacing:** Tighter letter spacing is applied to headings for compact cohesion, while uppercase table column labels (`label-md`, `label-sm`) use expanded tracking for legible categorization.

## Layout & Spacing

The layout is built for high density and persistent screen real estate utility, maximizing data visibility per square inch.

### Layout Philosophy
- **Fluid Structural Frame:** Fluid desktop canvas utilizing fixed functional sidebars (220px default, 64px collapsed), sticky table header rows, and fluid main content areas spanning up to 1920px without excess lateral padding.
- **Strict 4px/8px Spatial Scale:** Distances inside form arrays, tables, and metric toolbars increment systematically using strictly defined spatial tokens (`space-xs` through `space-xl`).
- **Data Table Row Compression:** High-density table rows default to a 32px height standard, with a compact option at 28px and a comfortable option at 40px for touch-assisted terminal use.
- **Responsive Adaptations:**
  - **Desktop (>= 1280px):** Multi-column master-detail split views, persistent secondary sidebars, and full-width multi-attribute data tables.
  - **Tablet/Terminal (768px - 1279px):** Collapsible sidebar, horizontal scroll data tables with pinned primary identifier columns, multi-step modal dialogs.
  - **Mobile (< 768px):** Stacked structural forms, full-width single-column action bars, and swipeable tab filters.

## Elevation & Depth

This design system rejects heavy drop shadows, colored ambient glows, and floating layers in favor of crisp, structural edge definitions.

### Depth Strategy
- **Layer 0 (Canvas):** Tone `#F8F9FA`. Background canvas layer.
- **Layer 1 (Panels & Surfaces):** Surface `#FFFFFF` separated from canvas purely via a 1px continuous border (`#E2E8F0`). Flat elevation, no box-shadow.
- **Layer 2 (Dropdowns, Menus & Toolbars):** Floating functional popovers use a hairline border (`#CBD5E1`) paired with a tight, neutral boundary shadow: `0 2px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modal Drawers & Overlays):** Modals utilize pure white containers framed with `#94A3B8` borders, seated over a neutral `#0F172A` backdrop dimmed to 40% opacity.
- **Inset Depth:** Interactive form fields, data grid cells, and search panels leverage an inset hairline state on focus rather than an elevated shadow.

## Shapes

The interface utilizes a restrained, geometric corner radius schema to convey precision and stability.

- **Base Radius (0.25rem / 4px):** Standard across input inputs, buttons, status chips, table rows, and alert banners.
- **Panel Radius (0.375rem / 6px):** Maximum allowable radius for primary data cards, modal containers, and dashboard analytical widgets.
- **Zero Radius Elements:** Table cell interiors, divider lines, and segmented control track junctions remain completely unrounded (`0px`) to preserve structural grid integrity.
- **Pill Shapes:** Strictly prohibited. Badges, tags, and buttons maintain standard 4px box corners to prevent visual noise across dense lists.

## Components

### Buttons
- **Primary:** Solid `#0F172A` background, `#FFFFFF` text, 4px radius. Minimal hover state shift to `#1E293B`. Height: 32px (standard), 28px (compact). Padding: 8px 12px.
- **Secondary / Outline:** Pure `#FFFFFF` background, 1px `#CBD5E1` border, `#0F172A` text. Hover: `#F8F9FA` background with `#94A3B8` border.
- **Destructive:** `#FEF2F2` background, 1px `#FECACA` border, `#991B1B` text. Active hover shifts to `#FEE2E2`.
- **Ghost / Action Icon:** Transparent background, `#475569` icon color, 28x28px box. Hover: `#F1F5F9` background.

### Input Fields & Controls
- **Text Inputs:** Height 32px, `#FFFFFF` background, 1px `#CBD5E1` border, `#0F172A` text, 4px radius. Focus: 1px `#0F172A` outline ring with no displacement. Placeholder: `#94A3B8`.
- **Checkboxes & Radios:** 16x16px footprint, 1px `#CBD5E1` stroke. Checked state: `#0F172A` fill with white indicator icon.
- **Compact Select Menus:** Integrated chevron indicator, fixed 32px height, tabular text alignment matching tabular columns.

### Tables & Data Grids
- **Header Cells:** Height 32px, background `#F8F9FA`, bottom border 1px `#CBD5E1`, text `#475569`, 11px uppercase bold tracking (`label-md`).
- **Data Rows:** Height 32px or 36px, bottom hairline 1px `#E2E8F0`, padding 0 8px. Hover row background: `#F8FAFC`. Selected row background: `#F1F5F9`.
- **Numeric Columns:** Right-aligned, formatted with `JetBrains Mono` for rapid vertical scanning and totalization checking.

### Status Chips & Badges
- **Structure:** Height 20px, horizontal padding 6px, border radius 4px, 11px uppercase weight 600.
- **Color Matrix:** Muted tri-color construct (background, hairline border, accessible contrast text) as established in the Semantic System.

### Cards & Grouping Panels
- **Structure:** `#FFFFFF` background, 1px solid `#E2E8F0` border, 6px radius. No box shadow.
- **Header Area:** Fixed 40px height, bottom border 1px `#F1F5F9`, bold 13px label, flex-aligned action controls on the right.