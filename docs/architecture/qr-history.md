# QR History Architecture

## 1. Overview
The QR History and Traceability Module provides an operational view over generated records. It intentionally separates historical generated artifacts from standard audit event logs, focusing purely on traceability identifiers, encoded form values, and regeneration of physical labels.

## 2. Server-Side Data Strategy
Due to the relational complexity of dynamic forms (EAV style relationships between `submission_values` and `form_fields`), the database query is fully abstracted into Postgres RPCs:
- `get_qr_history`
- `get_qr_detail`

These RPCs enforce row-level access explicitly through parameters (`p_user_id` and `p_is_admin`) and execute search heuristics efficiently without transmitting massive N+1 query structures over the wire.

## 3. Dynamic Search
Search functionality deliberately escapes hard-coded field IDs. Text searches seamlessly evaluate:
- Physical Product Reference Code (`PRC`)
- Serial Shipping Container Code (`SSCC`)
- ANY dynamic form field value explicitly matched within the `submission_values` text schema.

## 4. Immutable Historical Resolution
The system relies exclusively on the frozen snapshot of `form_version_id` locked into the `qr_records` row at the moment of generation.
- If an admin modifies or deprecates a field from a template, older QR Records remain completely untouched.
- The `get_qr_detail` RPC joins against `form_versions` (not the mutable active draft), resolving exact labels, datatypes, and `sort_orders` identically to the exact second it was originally forged.

## 5. Payload Sovereignty and QR Regeneration
**Crucial Rule:** The historical UI **never** rebuilds the QR payload from raw form data.
- The authoritative `payload` JSONB object sits immutably inside `qr_records`.
- When a user views or prints a record, the server extracts the raw JSONB payload, feeds it directly to the Phase 8 `QRGeneratorService`, and yields an identical `SVG`/`PNG`. 
- This guarantees physical labels printed 5 years later are bit-for-bit identical to the matrix printed on day 1.

## 6. Access Control & Security
- **Endpoints:** `GET /api/protected/history` and `GET /api/protected/history/[id]`.
- Workers can only view their own generated records natively by matching `created_by`. Admins can inspect the global pool.
- Physical `DELETE` operations are completely barred. Artifacts cannot be maliciously removed from the operational ledger through this module.

## 7. Performance Considerations
- Database-level pagination (`LIMIT / OFFSET`) prevents catastrophic memory exhaustion.
- Cross-joining `submission_values` uses `ILIKE` efficiently up to tens of thousands of rows. 
- SVG Matrix calculation executes asynchronously in the `QRGeneratorService` via `[id]/render` independently to prevent blocking the initial HTML Paint of the history table interface.
