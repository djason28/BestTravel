# Security & Secrets Checklist

This document lists the key security hygiene steps for BestTravel (backend + frontend) and deployment.

## 1. Secrets & Environment Variables

- Use ONLY the root `/.env` for local development; do not keep duplicate `.env` files in `core/` or `views/`.
- Never commit real secrets: `.env` is ignored; only `.env.example` should be versioned.
- Mandatory secrets to set in production (do NOT reuse dev values):
  - `JWT_SECRET` (>=32 chars, high entropy)
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (non-default)
  - Database creds (`DB_USER`, `DB_PASSWORD`)
  - Optional third-party API keys (e.g. Supabase) — prefer deployment secret manager.
- For CI/CD (GitHub Actions), store secrets in `Settings > Secrets and variables > Actions`.

## 2. Database

- Prefer MySQL with utf8mb4 collation: `charset=utf8mb4&loc=Local`.
- Enforce least privilege: dedicated DB user with only required permissions.
- If using SQLite (dev only): keep the `.db` file outside version control; rotate periodically if storing sensitive data.

## 3. Authentication & Authorization

- Strong JWT secret; rotate if leaked.
- Keep token TTL reasonable (`JWT_TTL_MINUTES`, default 30). Shorter for high-risk envs.
- Restrict admin endpoints (`/api/packages` mutating routes, `/api/inquiries` admin paths, `/api/dashboard`).
- Log only necessary metadata; avoid logging sensitive tokens or credentials.

## 4. CORS & Headers

- Set `CORS_ORIGINS` to the exact frontend domains (no wildcards in production).
- Reverse proxy (Caddy) should enforce HTTPS and HSTS.
- Backend middleware sets secure headers (X-Frame-Options, X-Content-Type-Options, etc.). Verify regularly.

## 5. Rate Limiting & Timeouts

- Per-IP rate limit in middleware: tune values based on traffic profile.
- Global and per-route request timeouts prevent resource exhaustion.
- Slow request logging (`SLOW_REQUEST_MS`) helps spot performance regressions.

## 6. File Uploads

- Only allow expected image types (jpg/jpeg/png/webp) as implemented.
- Store uploads outside the repository; path ignored via `.gitignore`.
- Serve uploads without directory listing (custom FS wrapper already applied).

## 7. Logging & Monitoring

- Avoid writing secrets to logs.
- Consider log aggregation (e.g., Loki, ELK) for production.
- Monitor auth failures, 5xx spikes, and slow request logs.

## 8. Deployment Hygiene

- Use a single immutable Docker image build per deployment.
- Rebuild frontend with `npm ci && npm run build` inside a container (no host Node.js trust issues).
- Keep OS patched; restrict SSH access (public key auth only). Remove password SSH logins.
- Use firewall rules (allow only 80/443) and close MySQL port publicly (bind to localhost or internal network).
- Rotate SSH keys and secrets when staff changes.

## 9. Git Hygiene

- `.gitignore` excludes: `.env`, uploads, dist builds, node_modules, db files, private keys.
- Do not commit: PEM/KEY files, id_rsa, id_ed25519, raw database snapshots, logs with sensitive content.
- Review PRs for accidental secret introduction (search for `JWT_SECRET`, `PASSWORD`, `KEY=`).

## 10. Incident Response Basics

- If a secret is leaked: revoke immediately, rotate, and redeploy.
- Audit access logs for unusual activity (multiple failed logins, large data exfiltration).
- Force token invalidation by changing `JWT_SECRET` (old tokens become invalid).

## 11. Optional Hardening Roadmap

- Add CSP header via reverse proxy.
- Introduce structured logging (JSON) for easier parsing.
- Implement audit trail for admin changes (package CRUD, inquiry status changes).
- Add IP-based anomaly detection (excessive requests outside normal patterns).
- Integrate with security scanner (SAST/Dependency) in CI.

---
Maintain this checklist as you evolve infrastructure. Treat `.env.example` as a minimal template; never store production secrets inside the repository.