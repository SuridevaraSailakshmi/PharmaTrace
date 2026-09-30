# PharmaTrace Design System

## 1. Design Principles
- **Clarity & Readability**: Content takes precedence over visual flair.
- **Operational Efficiency**: The design facilitates rapid, error-free pharmaceutical workflows.
- **Controlled Professionalism**: A clean, light-first enterprise interface free of distracting animations, gradients, and oversized graphics.

## 2. Visual Direction
- **Backgrounds**: Pure white for primary surfaces, soft neutrals (`#f8f9fa`) for the application shell.
- **Typography**: A rigorous hierarchy relying on `Inter` for standard UI text and `JetBrains Mono` for alphanumeric IDs (PRCs, SSCCs).
- **Accents**: Deep Slate (`#0f172a`) acts as the primary actionable and structural color, avoiding generic bright blues.

## 3. Color System
Defined natively in Tailwind 4 `globals.css`:
- **Surface**: `--color-surface` (`#ffffff`), `--color-surface-muted` (`#f3f4f6`)
- **Primary**: `--color-primary` (`#0f172a`)
- **Semantic**: Success (Green), Warning (Amber), Error (Red), Info (Blue)
Tokens are extracted via `@theme inline` mapping into Tailwind utilities automatically (e.g. `bg-[var(--color-primary)]`).

## 4. Typography
- `--font-sans`: Inter, System UI.
- `--font-mono`: JetBrains Mono, Monospace.
- Tabular numerals (`font-variant-numeric: tabular-nums`) are enforced on codes using `.text-code`.

## 5. Component Conventions
- Primitive, reusable UI components built on standard React/Tailwind.
- Implemented in `src/components/ui/`.
- Heavy reliance on `tailwind-merge` and `clsx` via `cn()` to safely override base styles on a per-instance level.

## 6. Status System
Handled centrally by `StatusBadge`. 
Standard mappings:
- `GENERATED`, `PUBLISHED`, `ACTIVE` → Success (Green + Check)
- `VOID`, `CANCELLED`, `INACTIVE` → Destructive (Red + X)
- `DRAFT` → Warning (Amber + Clock)
- `ARCHIVED` → Secondary (Gray + Archive box)

## 7. Navigation & Shell
- `AppShell` defines the global layout (Sidebar + Topbar + ContentArea).
- Responsive: the sidebar is fixed on desktop and acts as a slide-over off-canvas menu on mobile/tablet.
- Role-based: Navigation items specify `adminOnly`. The sidebar gracefully omits restricted items for `WORKER` roles.

## 8. Accessibility
- Focus outlines are globally overridden for high contrast (`*:focus-visible`).
- Labels support a `required` indicator with a semantically marked asterisk (`aria-hidden="true"`).
- Keyboard accessible semantic HTML defaults (native buttons, inputs).
