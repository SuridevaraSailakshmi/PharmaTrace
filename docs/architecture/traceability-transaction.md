# Traceability Transaction Architecture

## 1. Overview
The Final Traceability Transaction is the pinnacle of the PharmaTrace V1 business logic. It securely unifies form validation, PRC sequence generation, SSCC generation, deterministic QR Payload generation, and atomic database persistence.

## 2. API Contract
**Endpoint:** `POST /api/protected/qr/generate`
**Access:** Authenticated Supabase user with the `qr.create` permission (Worker role).
**Input Body:**
```json
{
  "formId": "uuid",
  "formVersionId": "uuid",
  "formData": {
    "fieldKey": "value"
  }
}
```

## 3. End-to-end Workflow
1. **Authentication & Authorization**: Handled via server-side session tokens against `roles` and `permissions`.
2. **Form Validation**: The requested `formVersionId` must correspond to a `published` schema. The `formData` must structurally fulfill all `isRequired` bounds mapped dynamically in `form_fields`. Client-provided system identifiers (`prc`, `sscc`) are ignored natively.
3. **PRC Allocation**: The server calls the atomic `generate_next_prc` Postgres RPC.
4. **SSCC Allocation**: The server calls the atomic `increment_sscc_sequence` Postgres RPC (dependent on the singular active production/dev configuration).
5. **QR Payload Generation**: Values merge inside `QRPayloadService.buildPayload()`. Fields marked `includeInQr: true` bind deterministically alongside root PRC and SSCC.
6. **QR Image Generation**: The `QRGeneratorService` encodes the exact payload into a robust SVG layout and Base64 PNG buffer.
7. **Atomic Database Persistence**: A final RPC `persist_traceability_record` binds the identifiers into physical rows.
8. **Success Resolution**: The client receives a composite object enabling direct viewing, downloading, and printing.

## 4. Transaction Boundaries & Atomicity
Supabase client libraries process promises sequentially. To strictly prevent orphan records (e.g., an SSCC generated but a QR Payload crashing mid-flight), the final insertion logic is abstracted into a single strict `plpgsql` Remote Procedure Call (RPC): `persist_traceability_record`. 

If `submission_values` fails to map correctly or an audit lock blocks completion, the entire relational block rolls back completely. 

## 5. Sequence Gap Semantics
PostgreSQL sequences consumed by `generate_next_prc` and `increment_sscc_sequence` exist outside the final `persist_traceability_record` transaction boundary to prevent hard locking contention on high-throughput sequences. 

**Resulting Behavior:** If the final persistence transaction throws an error, the Sequence Numbers obtained dynamically are intentionally lost (Gapped). 
**Why:** Uniqueness, correctness, and concurrent thread isolation drastically outweigh the aesthetic desire for sequential gapless identifiers. **Gapless numbering is not guaranteed.**

## 6. Security Model
- **Trust No Client**: `created_at`, `created_by`, `status`, `prc`, `sscc`, and `audit` context are strictly forged server-side.
- **Payload Integrity**: Malicious workers cannot stuff arbitrary JSON objects into the QR payload. Only valid fields extracted from the authenticated DB `form_versions` table execute. 
- **Row Level Security (RLS)**: The transaction utilizes Postgres `SECURITY DEFINER` semantics to bypass strict RLS client insert bottlenecks safely from the server boundary, drastically minimizing public mutation scope on the `qr_records` or `sscc_records` tables.

## 7. No GS1 Compliance Claims
The Phase 9 result binds `Phase 7` algorithms securely, but explicitly **does not claim full GS1 QR or GS1 Digital Link encoding compliance**. The QR image is a derived representation; the JSON string is the authoritative machine-readable representation internally designed for PharmaTrace V1.

## 8. Idempotency Decision
Given the application's current UI mechanics, simple state disables (`isSubmitting`) defend against casual accidental double-clicks. Because `formData` is explicitly dynamically mutable, calculating a true reliable idempotency hash from dynamic arbitrary values introduces excessive failure risks at this stage. It remains reliant on standard sequence constraints.
