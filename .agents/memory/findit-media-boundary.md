---
name: FindIt media boundary
description: Why Step 1 uses resized image data URLs and what to replace for later private media storage.
---

FindIt’s first step deliberately persists resized photo data URLs with object and observation records because App Storage provisioning was unavailable and the app has no authentication yet. Keep the UI and API fields as image references so a later authenticated storage integration can replace the value without changing the scan or object flows.

**Why:** Private file storage needs an ownership/authentication boundary that the initial single-user foundation does not have.

**How to apply:** Before Step 2 or production use, add authenticated object storage, store only object paths in PostgreSQL, and enforce per-user access on serving and upload routes.