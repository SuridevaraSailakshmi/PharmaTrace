# PHASE A: INSPECTION & ARCHITECTURE PLAN

## 1. Current Form Architecture
The system uses a relational versioning model:
- `forms` stores the top-level form identity (with a `current_version_id`).
- `form_versions` stores the discrete immutable versions (`version_number`, `is_published`).
- `form_fields` connects to `form_versions(id)`, so every version has its own duplicated set of fields.

## 2. Where Form Versions are Used
- **Database**: `forms.current_version_id`, `form_fields.form_version_id`, `form_submissions.form_version_id`, `qr_records.form_version_id`.
- **APIs**: `/api/protected/forms/[id]/versions`, `/api/protected/forms/[id]/versions/[versionId]`, `/api/protected/forms/[id]/versions/[versionId]/publish`. Traceability generation API receives `formVersionId` in its payload.
- **UI**: 
  - Admin: Form Builder (`/admin/forms/builder/[id]`), Forms List (`/admin/forms`). "Publish", "Create New Version" buttons.
  - Worker: `Generate QR` fetches the "current published version". 

## 3. Tables & Foreign Keys Dependent on Form Versions
- `forms.current_version_id` (FK to `form_versions(id)`)
- `form_fields.form_version_id` (FK to `form_versions(id)`)
- `form_submissions.form_version_id` (FK to `form_versions(id)`)
- `qr_records.form_version_id` (FK to `form_versions(id)`)
- `submission_values.field_id` (FK to `form_fields(id)`, which inherently binds the submission to a specific version's fields).

## 4. APIs Dependent on Form Versions
- `GET /api/protected/forms/[id]` (Returns version list)
- `POST /api/protected/forms/[id]/versions` (Creates draft version)
- `PATCH /api/protected/forms/[id]/versions/[versionId]` (Updates fields)
- `POST /api/protected/forms/[id]/versions/[versionId]/publish` (Publishes version)
- `POST /api/protected/qr/generate` (Accepts `formVersionId`)

## 5. UI Dependent on Form Versions
- `src/app/(dashboard)/admin/forms/builder/[id]/page.tsx` (Heavily version-centric: draft vs published state, version labels).
- `src/app/(dashboard)/worker/qr/page.tsx` (Fetches the published version dynamically).
- `src/app/(dashboard)/history/[id]/page.tsx` (Relies on backend RPC that joins against form versions).

## 6. Historical Data Dependencies (CRITICAL)
Currently, `submission_values` stores `field_id` (which links to the immutable `form_fields` tied to a specific `form_version`). 
The `get_qr_detail` PostgreSQL RPC joins `form_fields` via `qr_records.form_version_id` to retrieve historical labels and field types. 
**If we simply delete `form_versions` and allow admins to delete/rename `form_fields` on the single form, the historical RPC will fail or return missing/altered labels for past QR records.**

## 7. Safest Migration Plan (Architecture Change)
To satisfy the rule: *"Historical QR records must NOT depend on the CURRENT form structure."*

**A. Database Migration (SQL)**
1. **Decouple Submissions from Live Fields**: 
   - Alter `submission_values`. Drop the foreign key to `form_fields`.
   - Add snapshot columns directly to `submission_values`: `field_key`, `label`, `field_type`, `sort_order`.
   - **Data Migration**: Run an `UPDATE` to backfill these new snapshot columns from the existing `form_fields`.
2. **Flatten Form Architecture**:
   - Alter `form_fields`. Add `form_id` referencing `forms(id)`.
   - Backfill `form_fields.form_id` using the current `form_versions.form_id`.
   - Drop `form_fields.form_version_id`.
   - Drop `form_submissions.form_version_id`.
   - Drop `qr_records.form_version_id`.
   - Drop `forms.current_version_id`.
3. **Delete Form Versions**:
   - Drop the `form_versions` table safely, as all historical metadata is now firmly snapshotted in `submission_values`.
4. **Update RPCs**:
   - Rewrite `get_qr_history` and `get_qr_detail` to read labels/types directly from `submission_values` instead of joining `form_fields`.

**B. API & Service Updates**
- Refactor `FormsService` to query/update a single `forms` record and its `form_fields`.
- Remove all `/versions` specific API endpoints.
- Update `TraceabilityService` to generate submissions by snapshotting the *current* form's field labels/types into `submission_values` during QR generation.

**C. UI Cleanup**
- **Admin**: Strip "Versions", "Publish", "Draft" from Form Builder. Save directly mutates the live form.
- **Worker**: Generate QR loads the single form blindly. 

This approach completely eradicates form versions while rendering historical QR records 100% immutable and independent.
