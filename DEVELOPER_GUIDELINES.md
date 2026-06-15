# tinytools Developer Guidelines

Please adhere to the following rules for all development, refactoring, and feature additions in this project:

## 1. Version Control & Deployment Boundaries
- **No Automatic Pushing**: Never push commits to the remote repository (`origin/main`) or trigger production deployments.
- **Local main Commits**: Implement features and commit changes **locally on `main`**. The user will pull/run them locally, test them, and handle deployment/push operations themselves.
- **Git Status Hygiene**: Keep the local working tree clean. Untracked build configuration lockfiles (e.g. `deno.lock`) should not be added to commits unless specifically requested.

## 2. Route & Slug Conventions
- **Exact Title Matching**: Every tool's hash route/slug (the key registered in `TOOLS_REGISTRY` in `js/app.js` and referenced in `href` links in `index.html`) **must** exactly match its lowercase title separated by hyphens.
  - *Example*: **UTM Build & Verify** ➔ `#utm-build-verify`
  - *Example*: **CSP Build, Combine & Verify** ➔ `#csp-build-combine-verify`
  - *Example*: **JSON to CSV Converter** ➔ `#json-to-csv`
- **Module ID**: The default export object's `id` inside the tool's JS module must match this slug exactly.

## 3. UI, Theming & Styling Guidelines
- **Button Classes**: Use standard CSS classes defined in `css/main.css` for all action buttons:
  - `btn-primary` for primary call-to-actions (e.g. "Copy", "Analyze", "Combine").
  - `btn-secondary` for reset or secondary options (e.g. "Reset Fields", "Clear").
  - Do not invent custom ad-hoc button classes (like `btn-premium` or `btn-custom`) unless they are explicitly defined in the tool's CSS module.
- **Typography & Theme Integration**: Maintain dark-mode compatibility. Inputs should use `.input-premium` and layouts should follow the glassmorphic card standards (`.card-premium`).

## 4. Quality Assurance Stack
- **Linting**: Before finalizing a task, run `npm run lint`. Ensure **zero** errors and **zero** warnings.
- **Testing**: Add pure business logic functions to the tool files, export them, and cover them in a companion test file under `js/tools/__tests__/`. Run `npm run test` and verify that all tests pass.
