# Deploying to Azure App Service

Every push to `main` runs [.github/workflows/azure-webapp.yml](.github/workflows/azure-webapp.yml). The workflow:

1. Builds the app on GitHub using Next.js standalone output.
2. Zips the result and deploys it to the **ganesh-fm** Web App.
3. Smoke-tests `/login`.

You can also start it by hand from **Actions → Deploy to Azure App Service → Run workflow**.

Site: https://ganesh-fm-a4b6a2hpc4gwg3g8.southindia-01.azurewebsites.net

## One-time setup

### 1. Azure portal → App Service `ganesh-fm`

**Settings → Configuration → General settings**

- **Stack:** Node, **Major version:** 20 LTS.
- **Startup Command:** `node server.js`
- **SCM Basic Auth Publishing Credentials:** On. The publish profile needs this. Click **Save**.

**Settings → Environment variables → App settings.** Add these, then click **Apply**:

| Name | Value |
|---|---|
| `DATABASE_URL` | Atlas connection string: `mongodb+srv://…/LAMP?retryWrites=true&w=majority` |
| `NEXTAUTH_URL` | `https://ganesh-fm-a4b6a2hpc4gwg3g8.southindia-01.azurewebsites.net` |
| `NEXT_PUBLIC_APP_URL` | same as `NEXTAUTH_URL` |
| `NEXTAUTH_SECRET` | a new long random string, different from local (`openssl rand -base64 32`) |
| `AZURE_STORAGE_CONNECTION_STRING` | storage account **ganeshfm**: Security + networking → Access keys → key1 → Connection string |
| `AZURE_STORAGE_CONTAINER` | `uploads` (private container, created automatically) |
| `HOSTNAME` | `0.0.0.0` (so the Next server listens on all interfaces in the container) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (the package is already built) |

Optional: `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` and `EMAIL_SERVER` / `EMAIL_FROM` (see `.env.example`).

**Overview → Download publish profile.** Keep the file private: it is a deploy credential.

### 2. MongoDB Atlas

Go to **Network Access → Add IP Address** and choose one:

- **Restricted:** add the App Service outbound IPs. Find them in the portal under **Properties → Outbound IP addresses**.
- **Quick test only:** allow `0.0.0.0/0`.

### 3. GitHub repo `rjmusic0045/fm` → Settings → Secrets and variables → Actions

- **Secrets** tab → New repository secret.
  - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`.
  - Value: the full contents of the publish profile file.
- **Variables** tab → New repository variable.
  - Name: `NEXT_PUBLIC_APP_URL`.
  - Value: the site URL above.

### 4. Deploy

Push to `main`, or run the workflow by hand. The first cold start can take a minute.

The database is already seeded. To reseed, run `npm run db:seed` locally. It uses the same Atlas database as production.

## Notes

- **Uploads:** songs and covers go to Azure Blob Storage (account `ganeshfm`, private container `uploads`). The app streams them at `/api/media/...` with seeking support, so the container never needs public access.
  - Without a storage connection string, the app falls back to local disk (`UPLOAD_DIR`, or `./storage/uploads`).
  - Instead of the connection string, you can set `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY`.
- **Troubleshooting:** use **Log stream** in the portal, or **Diagnose and solve problems**.
  - "Application Error" right after deploy usually means the startup command or `HOSTNAME` setting is missing.
  - Login failures usually mean `NEXTAUTH_URL` or `NEXTAUTH_SECRET` is wrong, or Atlas is blocking the app's IP.
