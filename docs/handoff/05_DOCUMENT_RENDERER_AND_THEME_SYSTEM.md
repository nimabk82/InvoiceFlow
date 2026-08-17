# 05 — Document Renderer and Theme System

## 1. Core architecture

```text
Document Domain Data
        +
Business / Client snapshots
        +
Selected Theme Version
        +
Document Type
        ↓
normalizeDocumentForRendering()
        ↓
paginateDocument()
        ↓
SharedDocumentRenderer
        ↓
Preview / Review / Print / PDF / Client View / Email Attachment
```

Do not build separate HTML templates for each surface.

---

# 2. Theme management

Business Settings:
→ Document Themes

A business can have:
- multiple active themes
- one default Invoice theme
- one default Quote theme

Built-in presets:
- Clean
- Modern
- Minimal
- Blank Structured

Presets are copied into business-owned themes.

---

# 3. Theme lifecycle

Theme identity:
```text
Clean Blue
├ v1
├ v2
└ v3 ← current
```

Rules:
- theme rename does not create a new render version
- theme save creates a new immutable version
- old versions are retained
- existing drafts do not auto-update
- Review may show “A newer version is available”
- user explicitly adopts new version
- sent document freezes themeVersionId
- later theme edits do not change sent document appearance

Archive:
- preferred over delete
- referenced themes cannot be deleted
- default theme must be replaced before archive

---

# 4. Theme Builder UX

Desktop:
```text
Structure | Live Preview | Properties
```

Global nodes:
- Page
- Brand
- Typography

Sections:
- Header
- Business Information
- Document Information
- Bill To
- Items
- Totals
- Deposit
- Payment Instructions
- Notes
- Terms
- Footer

Preview:
- Standard Invoice
- Long Client Name
- Deposit Invoice
- Long Item Descriptions
- Multi-page Invoice
- Quote

---

# 5. Theme-safe controls

Page:
- Letter / A4
- Compact / Standard / Spacious margins
- white / safe background color
- none / thin / accent page border

Brand:
- logo source
- logo size
- primary color
- secondary color

Typography:
- curated fonts
- heading scale
- compact / comfortable density

Header:
- Classic
- Split
- Centered
- Minimal

Bill To:
- Plain
- Soft
- Bordered
- Accent Edge

Items:
- header: Filled / Soft / Line / Minimal
- rows: Plain / Separators / Striped
- density
- show Qty
- show Rate
- show Tax
- Amount always visible

Totals:
- Right
- Full Width
- Boxed
- emphasis: Bold / Accent Line / Soft Accent

Deposit:
- Plain
- Highlight
- Boxed
- Accent Edge

Footer:
- alignment
- business name
- website
- page number
- custom footer text
- divider

---

# 6. Out of scope for V1

Do not implement:
- arbitrary CSS
- arbitrary HTML
- JavaScript
- free absolute positioning
- overlap/layers
- arbitrary resizing
- font uploads
- rotated text
- background photography
- Canva-like designer

---

# 7. Protected semantic order

Enforce:

```text
Items < Totals < Deposit
Footer = last
```

Header remains in header region.

Totals cannot be before Items.

Deposit cannot be before Totals.

---

# 8. Protected financial content

Theme controls appearance only.

Cannot hide:
- Invoice/Quote number
- Total
- Amount column
- Client identity
- deposit block when document has deposit terms
- relevant due/valid-until semantics

---

# 9. Renderer input

```ts
type RenderDocumentInput = {
  document: RenderableDocument
  theme: DocumentThemeVersion
  business: BusinessSnapshot
  renderContext: {
    output: 'preview' | 'client_view' | 'print' | 'pdf'
    locale: string
    timezone: string
  }
}
```

Recommended result:

```ts
type RenderedDocument = {
  pages: RenderedPage[]
  diagnostics: RenderDiagnostic[]
}
```

---

# 10. Pagination

Pagination works on semantic blocks, not arbitrary DOM splitting.

Block metadata:
```ts
type RenderBlock = {
  key: string
  type: RenderBlockType
  estimatedHeight: number
  splittable: boolean
  keepWithNext?: boolean
  keepTogether?: boolean
}
```

Rules:
- normal item row does not split
- item table may split by rows
- table header repeats
- Totals + Deposit stay together
- footer height reserved
- page number rendered per page
- long Notes/Terms may split by paragraph
- section heading stays with first paragraph

Continuation page identity:
- compact business/document number strip

---

# 11. Built-in theme intent

Clean:
- Inter
- restrained blue accent
- high readability
- line table header
- highlighted deposit

Modern:
- Montserrat headings
- stronger brand presence
- filled table header
- boxed totals/deposit

Minimal:
- mostly black/gray
- small logo
- minimal decoration
- compact density
- print-focused

---

# 12. Renderer test fixtures

Minimum:
1. Standard Invoice
2. Deposit Invoice
3. Long Client
4. Long Items
5. 45-item Multi-page Invoice
6. Quote

Baseline:
3 themes × 6 fixtures = 18 render cases

---

# 13. Render diagnostics

Examples:
- LOW_CONTRAST
- OVERFLOW
- UNSUPPORTED_FONT
- INVALID_SECTION_ORDER
- FINANCIAL_BLOCK_SPLIT

Theme Builder may allow warning-only save.

Blocking render errors prevent save.
