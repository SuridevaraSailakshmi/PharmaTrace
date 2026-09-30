# QR Generation Architecture

## 1. Overview
The QR Generator Service provides deterministically rendered QR encodings from pre-canonicalized string payloads. It intentionally isolates presentation layer algorithms away from business payload aggregation.

## 2. Responsibilities
- **Accept String Payload**: It receives raw serialized `string` payloads. It does not evaluate business form structures or SSCC logic.
- **Produce Vector/Raster Images**: Emits `SVG` formatting (for scalable native web/print usage) or `Data URL PNG` outputs for legacy exports.
- **Determinism**: Given an identical payload string, the visual QR matrix maps predictably and identically.

## 3. Libraries Used
- **`qrcode`**: An extremely mature and stable pure-JavaScript encoder running seamlessly within Node.js / Next.js server environments without OS-level bindings.

## 4. QR Encoding Settings
- **Error Correction**: Hardcoded to `H` (High). Up to ~30% damage to the physical label can be sustained and successfully scanned, mandatory for industrial pharmaceutical handling.
- **Margin**: `1` block (tight). Conserves space while satisfying reader quiet-zone requirements.

## 5. Security & Isolation
The Generator executes entirely Server-Side to guarantee the client cannot intercept or alter the matrix pre-render. Clients merely consume the finalized `SVG`/`PNG`. 

## 6. Future Constraints
- The generator is deliberately agnostic. If we migrate to **GS1 DataMatrix** in the future, the interface simply swaps out `qrcode` for a `datamatrix` library, taking the exact same string payload without affecting `QRPayloadService` downstream.
