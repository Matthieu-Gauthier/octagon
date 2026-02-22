# 🚀 Frontend Deployment on UNRAID

## 1. Build & Push (Local Machine)

Since you are not using a local `.env` file, you need to pass your production variables (Supabase URL and Anon Key) directly as build arguments. Vite bundles these variables at build time.

From the project root, run the build command with your actual production values:

```bash
docker compose build \
  --build-arg VITE_SUPABASE_URL="https://votre-projet.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="votre_cle_anon" \
  frontend
```

Then, push the image to Docker Hub:

```bash
docker compose push frontend
```

## 2. Deployment (Unraid)

1. Go to **Docker** > **Add Container**.
2. **Name**: `Octagon-Frontend`
3. **Repository**: `your-dockerhub-username/octagon-frontend:latest`
4. **Network**: `Bridge`
5. **Port**: Host `8080` -> Container `80`
6. Click **APPLY**.

*(Note: The variables are already baked into the image during the build step. You don't need to add `VITE_` variables into the Unraid Docker template. If your Docker Hub repository is private, Unraid must be logged in to your account).*

## 3. Updating

If you change the code or need to update the Supabase URLs:
1. Re-run the `docker compose build --build-arg...` and `push` commands (Step 1).
2. On Unraid, go to Docker, click your container > **Force Update** (or *Check for Updates* then *Apply*).
