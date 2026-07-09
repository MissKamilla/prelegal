# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.

The product currently uses a chat-like interface to establish what document the user wants and how to fill in the fields.
Important: this is not connected to a real AI/LLM yet. The current chat is scripted with predefined questions, simple keyword matching, and deterministic field filling. A real AI integration should be added in a future task.

The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

Current product scope: the application supports all document types listed in `catalog.json` through a guided scripted chat flow.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira.
2. Develop the feature - do not skip any step from the feature-dev 7 step process.
3. Thoroughly test the feature with unit tests and integration tests and fix any issues.
4. Submit a PR using your GitHub tools.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up,
allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.

There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

## Implementation notes

PL-4 implemented the V1 technical foundation:

- `backend/` is now a `uv` FastAPI project with health and fake-login APIs.
- The backend creates a temporary SQLite database from scratch on startup.
- The existing Next.js Mutual NDA prototype now starts behind a fake login screen.
- The frontend is configured for static export and is served by FastAPI in Docker.
- Docker packaging and Mac/Linux/Windows start-stop scripts were added.
- The Mutual NDA product behavior was intentionally left unchanged beyond the fake login gate.

PL-5 changed the Mutual NDA product interaction:

- The left-side Mutual NDA form was replaced with a guided AI-style chat.
- The chat starts with a greeting and the first question.
- Each user answer fills the current NDA field and updates the preview immediately.
- The preview starts from a blank draft with placeholders for missing fields.
- The UI shows completion progress and a collected-field summary.
- `Download PDF` is hidden until all required Mutual NDA fields are complete.
- After the final answer, the UI shows a completion confirmation and the PDF download action.
- Frontend e2e tests and the manual regression checklist were updated for the chat flow.
- ESLint now ignores `frontend/out/**` so generated static export output is not linted.
- This was implemented as a scripted chat flow, not a real AI integration.

PL-6 expanded document support:

- The app was renamed in the UI from Mutual NDA Creator to Legal Document Creator.
- The chat now first asks which supported document the user wants to create.
- Supported documents include Mutual NDA, Cloud Service Agreement, SLA, DPA, Design Partner Agreement, PSA, Partnership Agreement, BAA, Software License Agreement, Pilot Agreement, and AI Addendum.
- Unsupported document requests are handled with simple keyword matching and a closest supported template suggestion.
- After a document is selected, the scripted chat asks predefined questions for that document type.
- The preview and PDF filename update based on the selected document type.
- Added `frontend/src/lib/documents.ts` for supported document metadata, matching, draft values, and markdown generation.
- Added unit tests for document matching/fallback behavior and updated e2e tests for supported and unsupported document flows.
- The implementation does not parse the markdown templates directly and does not use a real AI model yet.
- Future work: connect a real AI/LLM so the chat can understand freeform user intent, ask adaptive follow-up questions, extract fields from natural answers, and work more directly from the template contents.
