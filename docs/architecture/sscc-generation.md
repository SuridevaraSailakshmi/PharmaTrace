# SSCC Generation Architecture

## 1. Purpose
The SSCC (Serial Shipping Container Code) Generation Service provides authoritative, safe, and GS1-compliant generation of the 18-digit SSCC. This code acts as the universally unique identifier for logistics units (such as pallets or cartons) moving through the supply chain.

## 2. SSCC Definition
SSCC stands for Serial Shipping Container Code. It is a globally recognized standard used to uniquely identify logistics units.

## 3. 18-digit Structure
An SSCC strictly consists of exactly 18 digits. 
The components in order:
1. **Extension Digit** (1 digit)
2. **GS1 Company Prefix** (5-12 digits)
3. **Serial Reference** (Length = 16 - Company Prefix Length)
4. **Check Digit** (1 digit)

## 4. Extension Digit
A single digit (0-9) used to increase the capacity of the Serial Reference. It is configured server-side and must never be inputted or altered by standard workers.

## 5. GS1 Company Prefix
An assigned numerical prefix unique to the company, issued by GS1. 
- Validation: Must be numeric and between 5 and 12 digits.
- **Production GS1 Company Prefix must come from the organization's actual GS1 allocation.**
- If no company prefix is configured in production, generation fails closed.

## 6. Serial Reference
A sequentially generated identifier whose length dynamically stretches to pad the body out to exactly 17 digits.
Workers never interact with this directly.

## 7. Serial Length Calculation
`Serial Reference Length = 16 - (GS1 Company Prefix Length)`
Dynamic zero-padding ensures that the serial explicitly fulfills the dimensional constraints regardless of prefix size.

## 8. Check Digit Algorithm
Calculated on the 17-digit body:
- Alternating weights of 3 and 1 from right-to-left.
- `Check Digit = (10 - (Sum % 10)) % 10`

## 9. Configuration States
Configurations in `sscc_configurations` designate `environment` as `production` or `development`.
The application maintains a strict single `is_active = true` configuration.

## 10. Development vs Production
In `production` environments, the lack of a configured Company Prefix yields a hard exception `GS1 Company Prefix is not configured for production`. A development prefix cannot silently serve production transactions.

## 11. Sequence Allocation
The sequence is allocated through the database via the `increment_sscc_sequence(conf_id UUID)` RPC, incrementing the `sscc_sequences.current_value`.

## 12. Concurrency Strategy
The RPC executes a locking atomic `UPDATE ... RETURNING` natively in Postgres, granting absolute protection against parallel race conditions without relying on brittle JavaScript mutexes.

## 13. Database Uniqueness
The schema natively enforces `UNIQUE` constraints on the `sscc` column inside the `sscc_records` table, serving as the final defense layer.

## 14. Overflow Behavior
If the dynamic maximum limit of the serial is breached (e.g., reaching 99,999 on a 5-digit allowed length), the RPC aborts raising `SSCC_SEQUENCE_EXHAUSTED`. It will never truncate, recycle, or issue an invalid SSCC.

## 15. Failure/Gap Behavior
If the allocation transaction fails post-sequence generation, that specific sequence integer is lost, generating a gap. This is acceptable behavior, as uniqueness and strict monotonic allocation take absolute precedence over gapless numbering.

## 16. Security
- SSCC values are wholly server-generated; they cannot be overridden or seeded by clients.
- Admin configurations require specific RLS/Authorization checkpoints. 
- API endpoints strictly drop client-provided system-generated fields (handled explicitly in Phase 5 forms API).

## 17. Future QR Transaction Integration
The SSCCService provides an independent `generateSscc()` method designed to act smoothly in conjunction with `ProductReferenceService` inside the finalized atomic Phase 8 QR-generation workflow.
