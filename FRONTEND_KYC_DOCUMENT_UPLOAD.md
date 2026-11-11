# Vendor App Fix — KYC Documents Must Be Uploaded, Not Local Paths

**Audience:** Vendor (provider) app — the document-upload step of onboarding
**Severity:** documents are unusable today (admin can't open them)

## The bug

During onboarding, the app sends the **phone's local file path** as the KYC document, e.g.:

```json
"documents": {
  "adhar_card": "/data/user/0/com.example.service_provider_app/cache/scaled_3b51....jpg",
  "pan_card":   "/data/user/0/com.example.service_provider_app/cache/scaled_9f2....jpg"
}
```

That path only exists on the user's device, so the file is **never uploaded to the server**. The
admin stores the string but nothing can open it (the link is dead / unclickable). No server-side
fix can recover these — the image bytes aren't on our servers.

> The app already does this correctly for the **profile photo** (`profile_image` comes through as a
> real `https://patmypets-uploads.b-cdn.net/...` URL). KYC documents just need the **same** flow.

## The fix (app side)

For each document, **upload the file first**, then send the **returned URL** — don't send the
picked file's local path.

### Step 1 — upload each document image

`POST /api/v1/uploads` — `multipart/form-data`, Bearer token (the provider's).

| Part | Value |
|---|---|
| `file` | the image/PDF binary (the picked file) |
| `category` | `KYC_DOCUMENT` |

Accepts JPG/PNG/WebP/HEIC/PDF, up to 10 MB. Response:

```json
{ "success": true, "message": "File uploaded",
  "data": { "url": "https://patmypets-uploads.b-cdn.net/patmypets/kyc-documents/<uuid>.jpg", "publicId": "...", "bytes": 12345, "format": "jpg" } }
```

### Step 2 — send those URLs in onboarding

`POST /api/v1/upload-documents` — use the `data.url` from step 1:

```json
"documents": {
  "adhar_card": "https://patmypets-uploads.b-cdn.net/patmypets/kyc-documents/<uuid-aadhaar>.jpg",
  "pan_card":   "https://patmypets-uploads.b-cdn.net/patmypets/kyc-documents/<uuid-pan>.jpg"
}
```

That's exactly what the profile photo flow already does — reuse that helper for the documents.

## Backend change (shipped)

The backend now **rejects** a document value that isn't an uploaded `http(s)` URL, with:

```
400  "Document must be an uploaded file URL — upload the file via /uploads first, then send the
      returned URL (not the phone's local file path)"
```

So after this deploys, sending a local path fails loudly at onboarding instead of silently saving a
dead link. **Deploy the app fix together with the backend**, or the documents step will start
returning 400.

## Existing broken records

Providers who already "uploaded" documents the old way have dead local-path links that **cannot be
recovered** (the files were never on the server). They'll need to **re-submit their documents** once
the app is fixed. (A rejected KYC puts them back into the upload flow; or they can re-upload from the
Documents screen.)
