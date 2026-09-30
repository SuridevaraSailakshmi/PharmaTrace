# Product Reference Code (PRC) Architecture

## 1. Purpose
The Product Reference Code (PRC) Service generates the authoritative, universally unique identifier for a physical pharmaceutical product batch or instance. This code serves as the core internal reference prior to generating external GS1/SSCC codes.

## 2. Format
The enforced format is `PRC-YYYY-NNNNNN`:
- `YYYY`: The generation year (e.g., 2026).
- `NNNNNN`: A zero-padded, sequential six-digit number (e.g., 000001, 123456).

## 3. Ownership
- The **server** is the absolute owner of the PRC.
- Workers/clients can never manually enter or arbitrarily request a PRC. 
- Generating a PRC is intrinsically tied to the backend tracing mechanisms, and its value is exclusively assigned during the server-side transaction.

## 4. Generation Strategy
To ensure the code is strictly sequential, atomic, and safe under highly concurrent environments, PRC generation is pushed entirely down to a custom PostgreSQL RPC function (`generate_next_prc`). This eliminates race conditions associated with application-level `SELECT MAX() + 1` logic.

## 5. Year Behavior
The PRC sequence is bounded per calendar year. The underlying database sequence dynamically segments allocations by year (e.g., year `2026` tracks its own sequence independent of year `2027`).

## 6. Concurrency Strategy
The `generate_next_prc` RPC function utilizes an atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` pattern within a dedicated `prc_sequences` table. This acts as a robust concurrency control mechanism, locking the specific year row momentarily to issue the exact subsequent integer safely across simultaneous requests.

## 7. Uniqueness
Uniqueness is fundamentally guaranteed by the atomic database assignment. 

## 8. Sequence Exhaustion
The format specifies a six-digit boundary (`999999`). If a specific year exceeds 999,999 transactions, the sequence generation intentionally aborts (`PRC_SEQUENCE_EXHAUSTED` exception) rather than silently returning a seven-digit output, preserving strict formatting constraints.

## 9. Transaction Behavior
The `generatePrc` method acts as a utility to be integrated into the upcoming, encompassing Phase 8 QR-generation database transaction. It currently outputs the code safely but intentionally refrains from prematurely inserting into downstream business tables (`product_references`), circumventing orphaned data records prior to full QR workflow completion.

## 10. Error Handling
Database errors, exhaustion events, or internal discrepancies correctly throw unified application layer errors, hiding sensitive SQL implementation details from users.

## 11. Security
- System-generated fields (like `prc`) are rejected dynamically during client submission validation if spoofing is attempted.
- `prc_sequences` database table enforces RLS.

## 12. Future QR Transaction Integration
In Phase 8, the authoritative form submission will wrap `ProductReferenceService.generatePrc()`, `SSCCService.generate()`, and QR image compilation inside a single robust PostgreSQL transaction, permanently locking the emitted PRC to the finalized submission record.

## 13. Gap Behavior
Gaplessness is NOT strictly guaranteed (e.g. if the overarching QR transaction rolls back, the PRC sequence integer remains consumed). However, uniqueness is absolutely guaranteed, which is the primary operational requirement.
