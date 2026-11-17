# pulse_cadastre_fe_new

Frontend for **PLRA Enterprise GIS | Green Parcel**, built from the Figma
prototype (file `PLRA-Enterprise-GIS-|-Green-Parcel`, page 54:58). It talks to
`../pulse_cadastre_be_new` (FastAPI, port 5199, database `pulse_new`).

Stack: React 19, TypeScript, Vite, React Router, OpenLayers. Styling is plain
CSS with light/dark tokens in `src/styles/tokens.css` taken from the Figma frames.

## Run

```bash
npm install
npm run dev          # http://localhost:5177, proxies /api → http://localhost:5199
npm run build        # type-check + production bundle in dist/
```

Copy `.env.example` to `.env` to change the port, backend URL or basemap.
Docker: `docker compose up --build` serves the build on port 8081 via nginx.

## Screens (Figma → route)

| Portal (role) | Figma frame | Route |
| --- | --- | --- |
| — | Choose a Portal | `/` (then `/login?portal=…`) |
| District Manager (`district_manager`) | District Task Queue | `/district` |
| | Create Task | `/district/create` |
| | Field Survey & Upload | `/district/field-survey/:taskId` |
| | Close Task | `/district/close/:taskId` |
| Cadastre Manager (`vendor_manager`, `app_manager`, `admin`) | Cadastre Task Queue | `/cadastre` |
| | Create & Assign Task | `/cadastre/assign` (new) · `/cadastre/assign/:taskId` (referral) |
| | Final Review & Approval | `/cadastre/approval/:taskId` |
| | LIS Sync Monitor | `/cadastre/lis-sync` |
| Editor HQ (`data_editor`) | My Assignments | `/editor` |
| | Task Workspace | `/editor/workspace/:taskId` |
| | Submission Results | `/editor/results/:taskId` |
| Reviewer HQ (`data_reviewer`) | Review Queue | `/reviewer` |
| | Technical Review | `/reviewer/review/:taskId` |

Sidebar links without a task id show a picker of the tasks that page can act on.
The header toggle switches the light / dark theme (both Figma variants).

## How the screens map onto the backend workflow

`dch/task-request` statuses: `sent_to_manager → assigned → in_progress →
completed | completed_with_constraints → approved | rejected → synced_with_lis`.

- **Create Task** posts the selected mouza parcels. Change type and processing
  route have no backend columns, so they are written as a header line in
  `remarks` (`src/lib/remarks.ts`).
- **Field Survey & Upload** uploads evidence as task documents; survey date and
  notes are saved as a small `.txt` document.
- **Task Workspace**: *Download package* exports the task parcels as GeoJSON and
  moves `assigned → in_progress`; *Submit for validation* uploads the dataset and
  calls `save-parcels` (`completed`, or `completed_with_constraints`).
- **Technical Review**: Accept → `approved`; Return → `rejected` with the reason.
- **Final Approval**: Approve → `sync-lis` (`synced_with_lis`); Return → `rejected`.
- Status wording per portal lives in `src/lib/status.ts`.

### Known gaps (backend has no field/endpoint yet)

- **Close Task** is shown but disabled: there is no `closed` status.
- Original vs. submitted parcel versions, attempt numbers and per-task reviewer
  assignment are not stored, so those Figma details are simplified.
- The World Bank badge is a placeholder; drop the official logo into `src/assets`.

## Local demo accounts

`python -m scripts.seed_demo_users` in `../pulse_cadastre_be_new` creates one
user per portal in `pulse_new` and writes the credentials to
`pulse_cadastre_be_new/demo_users.local.json` (git-ignored).
