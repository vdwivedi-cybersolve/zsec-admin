# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/54aaecf8-5207-40df-9056-072627494f5e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/54aaecf8-5207-40df-9056-072627494f5e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Local-first storage

User data now lives in the browser via IndexedDB (powered by Dexie). Nothing else is required—`npm run dev` is enough for a fully functional experience, and the data persists between refreshes for the current browser profile.

- Seed users are written the first time the UI loads; you can inspect them in `src/lib/db.ts`.
- Each browser/device gets its own isolated datastore, so data will not sync across machines.
- Clearing browser storage (IndexedDB) will wipe the saved users.

### Optional API server

If you prefer the earlier Express JSON API (for example, to share data across browsers), you can still run it:

```sh
npm run server
```

The backend listens on http://localhost:4000 and stores data in `data/users.json`. Updating the frontend to call it again would simply require swapping the data utilities in `src/lib/api.ts`.

## Deployment topology

This single repository is deployed to **two** platforms from the same `main` branch:

| Platform | Build / start command | Serves |
| --- | --- | --- |
| **Render** (`zsec-admin-server`) | `npm install` + `npm run server` | the Node/Express API at `https://zsec-admin-server.onrender.com/api/...` |
| **Netlify** | `npm run build` (publish `dist/`) | the static React UI |

In production the frontend calls the Render API (see `API_BASE` in `src/lib/api.ts`). When the API is unreachable it transparently falls back to the local IndexedDB (Dexie) store, so the UI keeps working offline.

## RACF features

### Authentication (app login gate)

The app is gated by a sign-in screen (`/login`) that takes a **Login ID** and **Password**.

- Backend validates credentials at `POST /api/auth/login` and issues a session token (`GET /api/auth/me`, `POST /api/auth/logout`).
- Default credentials are **`ADMIN` / `admin`**. Override them in production via the Render environment variables `ADMIN_LOGIN_ID` and `ADMIN_PASSWORD`.
- The session token is persisted in `localStorage`; all RACF routes are protected and redirect to `/login` when signed out. Sign out from the user menu in the header.
- When the API server is unreachable, login falls back to the built-in `ADMIN` / `admin` credential locally.

### Groups

Full CRUD for RACF groups lives on the **Group** page and the `/api/groups` endpoints (`GET`/`POST`/`PUT`/`DELETE`). A group has a name, owner, superior group, optional installation data, and status.

### Linking groups to users

Users can be connected to multiple groups (the RACF `CONNECT` relationship), stored as `connectGroups` on the user record:

- **From a user** — the *Groups* tab in the Add/Edit User dialog lets you multi-select groups to connect.
- **From the user list** — select one or more users and use *Assign to Group* to connect them to a chosen group in bulk.
- **From a group** — use *Manage Members* on the Group page to connect/disconnect users for that group.

Renaming a group propagates to every connected user; deleting a group detaches it from all users automatically. A user's default group is always an implicit membership and cannot be removed via these tools.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/54aaecf8-5207-40df-9056-072627494f5e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
