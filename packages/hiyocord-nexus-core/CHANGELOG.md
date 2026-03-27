# @hiyocord/hiyocord-nexus-core

## 0.8.4

### Patch Changes

- [`8208cd7`](https://github.com/hiyocord/hiyocord-nexus/commit/8208cd7399cef6f159b6c29cea638c973c20140a) Thanks [@kurages](https://github.com/kurages)! - スラコマのオプション実装

- Updated dependencies [[`8208cd7`](https://github.com/hiyocord/hiyocord-nexus/commit/8208cd7399cef6f159b6c29cea638c973c20140a)]:
  - @hiyocord/hiyocord-nexus-types@0.5.3

## 0.8.3

### Patch Changes

- [`aa03fd4`](https://github.com/hiyocord/hiyocord-nexus/commit/aa03fd40acd3ceecd1c83fe9b1b8c11c06b4f4ab) Thanks [@kurages](https://github.com/kurages)! - discord api proxy 用の middleware を実装

- Updated dependencies [[`aa03fd4`](https://github.com/hiyocord/hiyocord-nexus/commit/aa03fd40acd3ceecd1c83fe9b1b8c11c06b4f4ab)]:
  - @hiyocord/hiyocord-nexus-types@0.5.2

## 0.8.2

### Patch Changes

- [`34db9ab`](https://github.com/hiyocord/hiyocord-nexus/commit/34db9ab412f4e849290b1299168fa283f9e723d9) Thanks [@kurages](https://github.com/kurages)! - Refactor code structure for improved readability and maintainability

- Updated dependencies [[`34db9ab`](https://github.com/hiyocord/hiyocord-nexus/commit/34db9ab412f4e849290b1299168fa283f9e723d9)]:
  - @hiyocord/hiyocord-nexus-types@0.5.1

## 0.8.1

### Patch Changes

- [`8eb62c7`](https://github.com/hiyocord/hiyocord-nexus/commit/8eb62c7459c9ef0a502c040052a817f218aaf041) Thanks [@kurages](https://github.com/kurages)! - fix: return client from createNexusFetch function

## 0.8.0

### Minor Changes

- [`3a52218`](https://github.com/hiyocord/hiyocord-nexus/commit/3a522184195388983a2bc39d891cbcd62f4ee5ef) Thanks [@kurages](https://github.com/kurages)! - 含めるヘッダーを固定する

## 0.7.2

### Patch Changes

- [#109](https://github.com/hiyocord/hiyocord-nexus/pull/109) [`01f3b98`](https://github.com/hiyocord/hiyocord-nexus/commit/01f3b9857ae378bb24a2c87c10eeedff8f845c62) Thanks [@kurages](https://github.com/kurages)! - cli 実装

## 0.7.1

### Patch Changes

- [`ceb8102`](https://github.com/hiyocord/hiyocord-nexus/commit/ceb8102978089ed4bb6560e432c7f2e0d6cff19c) Thanks [@kurages](https://github.com/kurages)! - fix: add exports field to package.json

## 0.7.0

### Minor Changes

- [`e5f3497`](https://github.com/hiyocord/hiyocord-nexus/commit/e5f3497461b252ed053586aac223bd52daae37bf) Thanks [@kurages](https://github.com/kurages)! - fix

## 0.6.0

### Minor Changes

- [`8cf0320`](https://github.com/hiyocord/hiyocord-nexus/commit/8cf0320989b8902c546135c2818f18b78003244d) Thanks [@kurages](https://github.com/kurages)! - nexus にリクエストする用の fetch client 実装

## 0.5.0

### Minor Changes

- [`bef3493`](https://github.com/hiyocord/hiyocord-nexus/commit/bef3493e200f3ba9e474513ff4b6c34c40e55768) Thanks [@kurages](https://github.com/kurages)! - discord-auth と manifests のエンドポイント変更 etc

### Patch Changes

- Updated dependencies [[`bef3493`](https://github.com/hiyocord/hiyocord-nexus/commit/bef3493e200f3ba9e474513ff4b6c34c40e55768)]:
  - @hiyocord/hiyocord-nexus-types@0.5.0

## 0.4.0

### Minor Changes

- [#37](https://github.com/hiyocord/hiyocord-nexus/pull/37) [`5b27ff5`](https://github.com/hiyocord/hiyocord-nexus/commit/5b27ff53f563509e8a785fefc48611db006c3e80) Thanks [@kurages](https://github.com/kurages)! - # Replace HMAC with Ed25519 Public Key Authentication

  ## Breaking Changes

  This is a **minor breaking change** that replaces the symmetric HMAC-based authentication with asymmetric Ed25519 public key cryptography for Nexus-ServiceWorker communication.

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
    NEXUS_PUBLIC_KEY: string; // Required for verification
    SERVICE_WORKER_PRIVATE_KEY: string; // Required for signing API calls
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

### Patch Changes

- Updated dependencies [[`5b27ff5`](https://github.com/hiyocord/hiyocord-nexus/commit/5b27ff53f563509e8a785fefc48611db006c3e80)]:
  - @hiyocord/hiyocord-nexus-types@0.4.0

## 0.3.0

### Minor Changes

- [#35](https://github.com/hiyocord/hiyocord-nexus/pull/35) [`3b35fea`](https://github.com/hiyocord/hiyocord-nexus/commit/3b35fea5ea460ee9ffa91df2ecd2231f7668e6ed) Thanks [@kurages](https://github.com/kurages)! - いろいろ

### Patch Changes

- Updated dependencies [[`3b35fea`](https://github.com/hiyocord/hiyocord-nexus/commit/3b35fea5ea460ee9ffa91df2ecd2231f7668e6ed)]:
  - @hiyocord/hiyocord-nexus-types@0.3.0

## 0.2.0

### Minor Changes

- [#34](https://github.com/hiyocord/hiyocord-nexus/pull/34) [`10c8918`](https://github.com/hiyocord/hiyocord-nexus/commit/10c89182cbad2cc8f474396c432ff4cae7ff3e88) Thanks [@kurages](https://github.com/kurages)! - manifest builder を追加

### Patch Changes

- Updated dependencies [[`10c8918`](https://github.com/hiyocord/hiyocord-nexus/commit/10c89182cbad2cc8f474396c432ff4cae7ff3e88)]:
  - @hiyocord/hiyocord-nexus-types@0.2.0

## 0.1.0

### Minor Changes

- [#30](https://github.com/hiyocord/hiyocord-nexus/pull/30) [`dfb6395`](https://github.com/hiyocord/hiyocord-nexus/commit/dfb63955dc0e07b5db1b8852311869d79c66b9a6) Thanks [@kurages](https://github.com/kurages)! - discord rest api proxy

### Patch Changes

- Updated dependencies [[`dfb6395`](https://github.com/hiyocord/hiyocord-nexus/commit/dfb63955dc0e07b5db1b8852311869d79c66b9a6)]:
  - @hiyocord/hiyocord-nexus-types@0.1.0

## 0.0.2

### Patch Changes

- [`d61d14c`](https://github.com/hiyocord/hiyocord-nexus/commit/d61d14c8918cbe4ffb41615beee7d5f020e2326b) Thanks [@kurages](https://github.com/kurages)! - tsconfig 共通化

- Updated dependencies [[`d61d14c`](https://github.com/hiyocord/hiyocord-nexus/commit/d61d14c8918cbe4ffb41615beee7d5f020e2326b)]:
  - @hiyocord/hiyocord-nexus-types@0.0.2

## 0.0.1

### Patch Changes

- [#22](https://github.com/hiyocord/hiyocord-nexus/pull/22) [`df7f3d4`](https://github.com/hiyocord/hiyocord-nexus/commit/df7f3d49056c06a0afe413899248decea74ea1a0) Thanks [@kurages](https://github.com/kurages)! - init releases

- Updated dependencies [[`df7f3d4`](https://github.com/hiyocord/hiyocord-nexus/commit/df7f3d49056c06a0afe413899248decea74ea1a0)]:
  - @hiyocord/hiyocord-nexus-types@0.0.1
