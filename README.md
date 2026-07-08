# prelegal

Prelegal is an early-stage project for preparing legal materials and workflows before
handoff to a lawyer or legal team.

> This project is in active development. The planned completion date for the first
> milestone is July 15, 2026.

## Current Status

The repository contains a set of markdown legal document templates collected from
public Common Paper repositories. These templates are intended to be customized by
the system with user-provided data.

- [x] Legal document template set
- [x] Basic documentation
- [x] Mutual NDA Next.js prototype
- [x] Tests
- [ ] CI/CD

## Template Dataset

Templates are stored in `templates/`. The root `catalog.json` file contains the
title, description, and filename for each downloaded markdown document.

```text
templates/
├── AI-Addendum.md
├── BAA.md
├── CSA.md
├── DPA.md
├── LICENSE.txt
├── Mutual-NDA-coverpage.md
├── Mutual-NDA.md
├── Partnership-Agreement.md
├── Pilot-Agreement.md
├── Software-License-Agreement.md
├── design-partner-agreement.md
├── psa.md
└── sla.md
```

The dataset includes:

- Mutual Non-Disclosure Agreement;
- Cloud Service Agreement;
- Service Level Agreement;
- Data Processing Agreement;
- Design Partner Agreement;
- Professional Services Agreement;
- Partnership Agreement;
- Business Associate Agreement;
- Software License Agreement;
- Pilot Agreement;
- AI Addendum.

`templates/LICENSE.txt` contains the Common Paper attribution and the CC BY 4.0
license notice for templates in this directory.

## Quick Start

The dataset can be used directly as markdown files.

Example catalog read:

```bash
node -e "console.log(require('./catalog.json').length)"
```

The Mutual NDA creator prototype is located in `frontend/`.

```bash
cd frontend
npm install
npx playwright install chromium
npm run dev
```

To verify the frontend:

```bash
npm run test:unit
npm run test:e2e
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
```

The manual regression checklist is available at
[`docs/manual-tests.md`](docs/manual-tests.md).

If `npm run test:e2e` runs in a clean environment without Playwright browsers,
run `npx playwright install chromium` first.

## Repository Structure

```text
.
├── catalog.json
├── docs/
├── frontend/
├── LICENSE
├── README.md
└── templates/
```

## Contributing

1. Create a separate branch from `main`.
2. Make changes in small logical commits.
3. Verify formatting, tests, and documentation when applicable.
4. Open a pull request with a brief change summary.

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.
