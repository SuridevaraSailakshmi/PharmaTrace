# QR Payload Architecture

## 1. Overview
The QR Payload Builder serves as the foundational structure for traceability serialization in PharmaTrace. It takes structured business inputs (PRC, SSCC, Form Data) and generates a deterministic, versioned JSON payload.

## 2. Payload Format (PharmaTrace Internal)
**IMPORTANT: The current QR payload format is an internal PharmaTrace contract (v1). It must NOT be represented as GS1 QR, GS1 Digital Link, or any other GS1-compliant encoding.**

Future phases may implement true GS1 mappings via Digital Link structures, but this module deliberately encapsulates the payload such that substituting a GS1 encoder later does not mandate rewriting business verification rules.

### Structure
```json
{
  "v": 1,
  "prc": "PRC-2026-000001",
  "sscc": "123456789012345678",
  "data": {
    "product_name": "Ibuprofen",
    "batch_no": "B123",
    "mfg_date": "2026-09-01"
  }
}
```

- **`v`**: Format Version (`1`). Ensures future breaking changes can be parsed conditionally.
- **`prc`**: Product Reference Code explicitly mapped at the root.
- **`sscc`**: SSCC identifier explicitly mapped at the root.
- **`data`**: Key-value pairs matching the exact Dynamic Form Engine fields configured for QR inclusion (`includeInQr: true`).

## 3. Form Data Inclusion Rules
The Dynamic Form Engine dictating the submission holds authority over what enters the QR code.
1. The field must have `includeInQr: true`.
2. Omitted/empty fields configured for inclusion map to `null`.
3. Valid boolean `false` or numeric `0` values are strictly preserved.
4. PRC and SSCC are stripped from `data` to avoid duplication since they are natively preserved at the payload root.
5. Clients cannot arbitrarily decide which fields are excluded or included.

## 4. Determinism
Generating the QR image mandates absolute payload consistency. Identical inputs must deterministically emit identically serialized JSON.
- We utilize sorted form definitions (`sortOrder`) to canonicalize dictionary object keys inside `data`.
- Root properties (`v`, `prc`, `sscc`, `data`) are natively serialized in fixed insertion order.

## 5. Security Restrictions
- **No Secrets**: Internal UUIDs, user hashes, or authentication scopes are NEVER mapped to QR outputs.
- **Server-Side Exclusivity**: The QRPayloadService is an internal backend utility. Clients cannot inject rogue identifiers to counterfeit traceability origins.

## 6. Integration Target
The resulting `QRPayload` string will be explicitly passed into `QRGeneratorService` to render the SVG/PNG without further business logic processing.
