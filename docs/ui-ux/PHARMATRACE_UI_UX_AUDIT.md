# PharmaTrace UI/UX Audit & Redesign Strategy

## 1. Current Problems
1. **Incoherent Design Language:** The current application lacks a cohesive enterprise-level design system, relying on ad-hoc Tailwind styling across disparate pages.
2. **Missing UI Primitives:** Only a few basic components exist (`badge`, `button`, `card`, `input`, `label`, `status-badge`, `table`). Essential elements like modals, drawers, standard layout shells, navigation items, and toast notifications are missing or not standardized.
3. **Typography & Hierarchy:** Type scales are inconsistent. Monospaced fonts for critical identifiers (PRC, SSCC) are not systematically applied.
4. **AppShell Deficiencies:** The layout lacks a distinct separation between administrative and operational worker scopes. A robust sidebar + topbar responsive structure is needed.
5. **Color System:** Colors lack semantic meaning (e.g., proper state mapping for Success, Warning, Error) and do not reflect a precise pharmaceutical aesthetic.

## 2. Proposed Design Principles
- **Enterprise Precision:** Clean, restrained, and highly functional. Maximize data density without sacrificing readability.
- **Strict Role Boundaries:** Visually separate the WORKER operational context from the ADMIN configuration context.
- **Data Veracity:** Zero fake UI elements. All charts, tables, and statuses must directly reflect database records.
- **Semantic Coloring:** Colors are strictly for indicating state (status badges, validation errors, success states). Primary UI Chrome should rely on Navy/Slate/Grays.
- **Accessibility & Contrast:** Fully keyboard navigable and WCAG AA compliant.

## 3. Component Strategy
To support the redesign without rewriting the backend logic, the following primitives must be upgraded or created in `src/components/ui`:
- **Typography Components:** Standardized headers, body text, and a `<Monospace>` wrapper for technical IDs.
- **Layout Shell:** `<AdminShell>`, `<WorkerShell>`, `<Sidebar>`, `<Topbar>`.
- **Forms & Inputs:** `<FormGroup>`, `<Select>`, `<Checkbox>`, standardized error messages.
- **Data Display:** Enhanced `<Table>` with sticky headers, `<DataCard>` for responsive mobile views, `<StatusBadge>` mapping.
- **Feedback:** `<Toast>`/Notification system, `<Skeleton>` for loading states, `<EmptyState>`.

## 4. Page Hierarchy & Redesign Plan
Execution will proceed strictly in the following priority:
1. **Global Design System:** Update `globals.css` and Tailwind config for colors/typography (Inter + Mono).
2. **Application Shell:** Implement responsive Layouts for `(dashboard)`.
3. **Auth Flows:** Redesign `/login` as a split-screen enterprise layout.
4. **Worker Workflows:** Redesign Worker Dashboard, Generate QR, and QR Result screens. Prioritize clarity and immutability of system-generated fields.
5. **History & Details:** Redesign `/history` and `/history/[id]` with dense, filterable tables and structured detail layouts.
6. **Admin Workflows:** Redesign Admin Dashboard, Form List, Users, SSCC Configuration, and Audit Logs.
7. **Form Builder:** Overhaul the visual Form Builder to clearly separate Canvas, Field Library, and Properties.

## 5. Responsive Strategy
- **Desktop (1024px+):** Fixed Sidebar, full data density tables, multi-column detail views.
- **Tablet (768px - 1023px):** Collapsible sidebar, adjusted table columns.
- **Mobile (<768px):** Navigation drawer (hamburger menu), tables transform into stacked cards, single-column form layouts.

## 6. Accessibility Strategy
- Use radix-ui primitives or similar semantic HTML patterns where applicable.
- Ensure all forms have `aria-labels` and `aria-describedby` for error states.
- Maintain a minimum 4.5:1 contrast ratio across the slate/navy palette.
