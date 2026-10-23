# Layout Refactoring: New Partials

## Overview
Extracted 3 frequently used code segments from layout files into reusable partials. This improves maintainability and reduces code duplication.

## New Partials Created

### 1. **post-header.html**
**Location:** `layouts/_partials/post-header.html`

Renders post metadata including title, date, and word count. Supports two display modes:
- **Large mode** (`large: true`): For full post pages (h1 title)
- **Preview mode** (default): For preview cards (h2 title with link)

**Parameters:**
- `page` (required): The page context
- `large` (optional): Boolean to switch between h1 and h2 layout

**Usage:**
```go
{{ partial "post-header.html" (dict "page" . "large" true) }}
```

**Before:** 15+ lines of repetitive date formatting and header markup
**After:** Single partial call

---

### 2. **post-preview.html**
**Location:** `layouts/_partials/post-preview.html`

Renders a complete post preview card with image, summary, and metadata. Used in listing pages.

**Parameters:**
- `page` (required): The page context
- `summaryLength` (optional): Truncation length for summary (default: 200)

**Usage:**
```go
{{ partial "post-preview.html" (dict "page" . "summaryLength" 150) }}
```

**Before:** 25+ lines per card in `section.html`, `term.html`
**After:** Single line in loop

---

### 3. **pagination.html**
**Location:** `layouts/_partials/pagination.html`

Renders pagination controls (prev/next links and page counter).

**Usage:**
```go
{{ partial "pagination.html" . }}
```

**Before:** Missing/referenced but not implemented
**After:** Standardized pagination component

---

## Files Refactored

| File | Changes |
|------|---------|
| `page.html` | Replaced 15 lines of header markup with `post-header.html` call |
| `section.html` | Replaced ~25 lines of post-preview markup with `post-preview.html` partial in loop |
| `term.html` | Same as section.html - identical post-preview pattern |

## Code Reduction Summary

- **Total lines removed:** ~65 lines
- **Duplicate code eliminated:** 100% in preview cards
- **Templates before refactor:** More complex, harder to maintain
- **Templates after refactor:** Clear, readable, DRY

## Benefits

✅ **Consistency:** Post cards render identically across all listing pages  
✅ **Maintainability:** Update styling once, applies everywhere  
✅ **Readability:** Layout files focus on structure, not presentation details  
✅ **Reusability:** Partials can be used in new templates without rewriting  
✅ **Flexibility:** Parameters allow customization (summary length, header size, etc.)

## Migration Notes

All existing functionality is preserved. These are pure refactors with no behavioral changes.
