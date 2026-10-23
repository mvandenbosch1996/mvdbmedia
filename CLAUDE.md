\# CLAUDE.md — High-End Frontend Website Rules \& Master Skills



\## Always Do First (Core Protocol)

\- \*\*Invoke the `frontend-design` skill\*\* before writing any frontend code, every session, no exceptions\[cite: 1].

\- \*\*Actively integrate your global master skills\*\* in every task to guarantee a world-class outcome:

&#x20; - `creative-design-systems`: Never build generic templates. Always use bold, unique design directions, custom typography pairings, and immersive visual depth.

&#x20; - `accessibility-a11y`: Ensure WCAG compliance, keyboard navigation, and proper contrast ratios.

&#x20; - `ai-geo-optimization` \& `advanced-seo`: Structure content, headings, and Schema markup for maximum visibility in traditional search engines and AI overviews.

&#x20; - `web-security-hardening` \& `security-forms`: Implement bulletproof input validation, secure headers, and clean data handling.



\## Reference Images

\- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.

\- If no reference image: design from scratch with maximum high-end craft (see guardrails below).

\- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.



\## Local Server

\- \*\*Always serve on localhost\*\* — never screenshot a `file:///` URL.

\- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)

\- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.

\- If the server is already running, do not start a second instance.



\## Screenshot Workflow

\- Puppeteer is installed at `C:/Users/micha/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/micha/.cache/puppeteer/`.

\- \*\*Always screenshot from localhost:\*\* `node screenshot.mjs http://localhost:3000`

\- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).

\- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`

\- `screenshot.mjs` lives in the project root. Use it as-is.

\- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.

\- When comparing, be specific: "heading is 32px but reference shows \~24px", "card gap is 16px but should be 24px"

\- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing



\## Output Defaults

\- Single `index.html` file, all styles inline, unless user says otherwise

\- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`

\- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`

\- Mobile-first responsive



\## Brand Assets

\- Always check the `brand\_assets/` folder before designing. It may contain logos, color guides, style guides, or images.

\- If assets exist there, use them. Do not use placeholders where real assets are available.

\- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.



\## Anti-Generic Guardrails (High-End Design Focus)

\- \*\*Colors:\*\* Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color palette with deep richness and sharp accents.

\- \*\*Shadows:\*\* Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity for authentic depth.

\- \*\*Typography:\*\* Never use the same font for headings and body. Pair a striking display/serif typeface with a clean, readable sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body text.

\- \*\*Gradients \& Textures:\*\* Layer multiple radial gradients. Add subtle lighting effects to make surfaces pop.

\- \*\*Animations:\*\* Only animate `transform` and `opacity`. Never `transition-all`. Use smooth, professional easing curves.

\- \*\*Interactive states:\*\* Every clickable element needs explicit hover, focus-visible, and active states. No exceptions.

\- \*\*Images:\*\* Add rich gradient overlays (`bg-gradient-to-t from-black/60`) and moody depth treatments.

\- \*\*Spacing:\*\* Use intentional, consistent scaling tokens rather than random layout steps.

\- \*\*Depth Hierarchy:\*\* Surfaces must follow a clear layering system (base → elevated → floating), avoiding a flat single-plane layout.



\## Hard Rules

\- Do not add sections, features, or content not in the reference

\- Do not "improve" a reference design — match it

\- Do not stop after one screenshot pass

\- Do not use `transition-all`

\- Do not use default Tailwind blue/indigo as primary color

