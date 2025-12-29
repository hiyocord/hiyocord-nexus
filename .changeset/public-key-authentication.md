---
"@hiyocord/hiyocord-nexus-types": major
"@hiyocord/hiyocord-nexus-core": major
"@hiyocord/hiyocord-nexus": major
---

# Replace HMAC with Ed25519 Public Key Authentication

## Breaking Changes

This is a **major breaking change** that replaces the symmetric HMAC-based authentication with asymmetric Ed25519 public key cryptography for Nexus-ServiceWorker communication.

### What Changed

- **Authentication Method**: HMAC-SHA256 (shared secret) → Ed25519 (public/private key pairs)
- **Manifest Schema**: Added required `signature_algorithm` and `public_key` fields
- **Environment Variables**:
  - New: `NEXUS_PRIVATE_KEY`, `NEXUS_PUBLIC_KEY`, `NEXUS_SIGNATURE_ALGORITHM`
  - Deprecated: `HIYOCORD_SECRET` (still in types for compatibility)
- **Service Worker Verification**: Updated `nexusVerifyMiddleware` to use public key verification

### Security Improvements

1. **Isolated Security**: Compromise of one service worker no longer affects others
2. **No Impersonation**: Service workers cannot impersonate each other or Nexus
3. **Independent Key Rotation**: Each service can rotate keys without coordinating with others
4. **Algorithm Flexibility**: Abstracted signature algorithm allows future algorithm changes

### Migration Guide

#### 1. Generate Key Pairs

```bash
# Generate Nexus key pair
npx tsx scripts/generate-keypair.ts

# Generate key pair for each service worker
npx tsx scripts/generate-keypair.ts
```

#### 2. Configure Nexus

```bash
wrangler secret put NEXUS_PRIVATE_KEY    # Paste private key
wrangler secret put NEXUS_PUBLIC_KEY     # Paste public key
wrangler secret put NEXUS_SIGNATURE_ALGORITHM  # Enter: ed25519
```

#### 3. Configure Service Workers

Update your service worker secrets:

```bash
wrangler secret put NEXUS_PUBLIC_KEY              # Paste Nexus's public key
wrangler secret put SERVICE_WORKER_PRIVATE_KEY    # Paste worker's private key
```

Update your manifest to include public key:

```json
{
  "version": "1.0.0",
  "id": "your-service-id",
  "signature_algorithm": "ed25519",
  "public_key": "YOUR_BASE64_PUBLIC_KEY",
  ...
}
```

#### 4. Update Service Worker Code

The `nexusVerifyMiddleware` now requires `NEXUS_PUBLIC_KEY` environment variable:

```typescript
import { nexusVerifyMiddleware } from "@hiyocord/hiyocord-nexus-core";

// Environment bindings
type Bindings = {
  NEXUS_PUBLIC_KEY: string;  // Required for verification
  SERVICE_WORKER_PRIVATE_KEY: string;  // Required for signing API calls
};

app.post("/interactions", nexusVerifyMiddleware, handler);
```

### New Features

- **GET /.well-known/nexus-public-key**: Endpoint to retrieve Nexus's public key
- **Key Generation Utility**: `scripts/generate-keypair.ts` for creating Ed25519 key pairs
- **Signature Algorithm Abstraction**: Easy to add support for other algorithms (ECDSA-P256, RSA-PSS)

### Technical Details

**Authentication Flow:**

1. **Nexus → Service Worker** (Interaction transfer)
   - Nexus signs with `NEXUS_PRIVATE_KEY`
   - Service Worker verifies with `NEXUS_PUBLIC_KEY`

2. **Service Worker → Nexus** (Discord API Proxy)
   - Service Worker signs with `SERVICE_WORKER_PRIVATE_KEY`
   - Nexus retrieves worker's public key from manifest and verifies

**Headers:**
- `X-Hiyocord-Signature`: Base64-encoded Ed25519 signature
- `X-Hiyocord-Algorithm`: Signature algorithm (e.g., "ed25519")
- `X-Hiyocord-Timestamp`: Unix timestamp in milliseconds (60-second replay window)

### Files Changed

**Core:**
- `packages/hiyocord-nexus-core/src/authentication/signature-algorithm.ts` (new)
- `packages/hiyocord-nexus-core/src/authentication/public-key-sign.ts` (new)
- `packages/hiyocord-nexus-core/src/authentication/service-worker-sign.ts` (new)
- `packages/hiyocord-nexus-core/src/middlewares/nexus-verify.ts` (updated)

**Types:**
- `openapi.yaml` (updated - manifest schema)
- `packages/hiyocord-nexus-types/src/types.ts` (regenerated)

**Nexus:**
- `packages/hiyocord-nexus/src/entry/service-workers/nexus-public-key.ts` (new)
- `packages/hiyocord-nexus/src/entry/service-workers/discord-api-proxy.ts` (updated)
- `packages/hiyocord-nexus/src/infrastructure/service-workers/interaction-transfer.ts` (updated)
- `packages/hiyocord-nexus/src/application-context.ts` (updated)
- `packages/hiyocord-nexus/src/types.ts` (updated)

**Utilities:**
- `scripts/generate-keypair.ts` (new)
