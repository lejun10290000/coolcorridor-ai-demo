# Production deployment and security scope

## Deployment

Use Node.js 24 LTS, `npm ci`, `npm run build`, and `npm test`. Vercel uses the checked-in `vercel.json` to build and publish **only `dist/`**. Never expose `npm run dev`, `vite preview`, the repository root, or a development-server tunnel as the public deployment.

From an authenticated Vercel CLI, use `vercel link` to select the intended account/project, then `vercel deploy --prod`. Keep the Vercel configuration/credentials private. `.vercelignore` excludes local environment files, dependencies, review harnesses, historical outputs and documentation from the source upload. Vercel builds with the committed lockfile. Source maps are disabled, and local development/preview default to loopback only.

The owner confirmed on 22 October 2026 that the campus illustration and bundled reference photos are cleared for public use for this deployment. Historical provenance notes remain preserved; this statement is not a new third-party licence or attribution grant.

## Security controls

- Static browser application: no public database, API, server-side uploads, privileged service key or shared administrator mutation endpoint is introduced.
- CSP restricts scripts to same-origin files and rejects inline/evaluated script execution, framing, object embeds, external connections, form navigation and base-tag overrides. Images allow same-origin assets and locally generated data/blob previews. Inline styles remain allowed because the interface and progress/map controls use them; inline scripts are not allowed.
- `nosniff`, frame denial, no-referrer, restricted device permissions, HTTPS/HSTS and same-origin opener/resource policies are configured on all routes.
- Existing image validation accepts bounded JPEG/PNG/WebP input, decodes/re-encodes to JPEG, removes metadata, and rejects active SVG uploads. Photos stay in the visitor's browser.
- React renders report descriptions and reviewer notes as text. There is no HTML rendering of submitted descriptions.
- Dependency updates remove the audit findings recorded on 22 October 2026. Run `npm audit` regularly; a clean result reflects known registry advisories at the time, not a proof of security.

## Browser regression checks

`review/check-public-deployment.cjs` runs against `ALIGNMENT_APP_URL` (default `http://127.0.0.1:4183`). It needs an independently available Playwright installation, configured with `PLAYWRIGHT_MODULE` if it is outside normal module resolution. `CHROME_PATH` may select installed Chrome/Edge. `SECURITY_OUTPUT_DIR` controls evidence output.

It checks delivered headers; 404 responses for environment/Git/source/dev-server paths; rendered maps/routes; walkthrough completion; escaped report text; rejected SVG input; report rejection without map mutation; mobile overflow; normal-flow CSP violations; and deliberate inline-script blocking. The deliberate CSP-block probe is expected to log a blocked-script console entry. All browser data and synthetic reports are isolated in a fresh context.

The report-photo, Developer-sidebar and walk acceptance scripts are updated for the current three-step reporting and dedicated journey-completion interface. Old selector failures must not be reported as application vulnerabilities. Other historical review scripts may target superseded layouts.

## Boundaries and remaining risk

Developer mode is still a **demo**, accessible to any visitor. It changes only that visitor's browser state (and same-profile tabs). It is not an authenticated multi-user administration service. Reports, local publications and uploaded replacements do not synchronize between people. Do not store sensitive data in this public demo.

Build/test tooling is not shipped as a server. It still runs during local/CI builds and therefore needs supported, patched versions. As of this update Vite is 8.3.5, its React plugin 6.1.2, and Vitest 5.0.5.

Targeted source/dependency/browser checks are not a complete penetration test. The Strix scan could not run in the current environment: Docker is not running and no Strix API or model credentials are configured. No attack-proof claim is made. Browser/GPU coverage and the 3D bundle-size performance advisory also remain limited to the environments actually tested.

Vercel provides hosting-layer security features; custom paid WAF/bot subscriptions or account-wide settings are not assumed enabled. Review project firewall events after launch, keep the hosting account protected, apply future dependency patches, and repeat checks after changes. A shared backend or Supabase integration would require separate authorization, access-control/RLS, upload, concurrency, secret-management and abuse testing before launch.

## References

- [Vercel project configuration](https://vercel.com/docs/project-configuration)
- [Vercel security overview](https://vercel.com/docs/security)
- [Vite supported releases](https://vite.dev/releases)
