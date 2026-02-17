# 🚀 Déploiement Frontend sur UNRAID

Ce guide a été mis à jour pour utiliser **Docker Compose**, ce qui simplifie grandement la gestion des variables d'environnement.

## Prérequis
- Docker Desktop (Windows)
- Un compte Docker Hub

## 1. Configuration (Environnement)

Le fichier `docker-compose.yml` est configuré pour lire automatiquement le fichier `.env` situé dans le dossier `frontend`.

Assurez-vous que `frontend/.env` contient bien vos clés :

```env
DOCKER_USERNAME=votre-pseudo-dockerhub
VITE_SUPABASE_URL=https://votre-url.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-api
```

## 2. Construction et Envoi (Build & Push)

Grâce à Docker Compose, une seule commande suffit pour construire l'image en injectant les variables et l'envoyer sur Docker Hub :

```bash
# 1. Se connecter à Docker Hub (requis pour un repo privé)
docker login

# 2. Build l'image (en spécifiant le fichier .env du frontend)
docker compose --env-file ./frontend/.env build

# 3. Envoyer vers Docker Hub
docker compose --env-file ./frontend/.env push
```

### 🔒 Configuration d'un Repo Privé

1.  Allez sur [hub.docker.com](https://hub.docker.com).
2.  Cliquez sur **Create Repository**.
3.  Nommez-le `octagon-frontend`.
4.  Sélectionnez **Private** (votre compte gratuit vous donne droit à 1 repo privé).
5.  Cliquez sur **Create**.

## 3. Déploiement sur Unraid

1.  Allez dans **Docker** > **Add Container**.
2.  **Name**: `Octagon-Frontend`
3.  **Repository**: `votre-pseudo-dockerhub/octagon-frontend:latest`
4.  **Network**: `Bridge`
5.  **Add Port**: Host: `8080`, Container: `80`.
6.  **Advanced View** (en haut à droite) :
    *   **Extra Parameters** : Si le repo est privé, Unraid vous demandera vos identifiants Docker Hub lors du pull, ou vous devez être connecté via le terminal Unraid (`docker login`).
    *   Alternativement, installez le plugin "Docker Hub Login" sur Unraid ou connectez-vous en SSH à votre serveur Unraid et faites `docker login`.
7.  Cliquez sur **APPLY**.

---

## 🛠️ Ancienne méthode (Manuelle)

Si vous préférez ne pas utiliser Compose, vous devez passer les arguments manuellement lors du build :

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -t votre-user/octagon-frontend .
```
  -t votre-user/octagon-frontend .
```

---

## 🌍 Configuration Production (Domaine Personnalisé)

Si vous déployez sur un domaine public (ex: `https://octagon.xgotgot.zapto.org`), voici les étapes spécifiques pour que l'authentification Supabase fonctionne.

### 1. Configuration Supabase (Obligatoire)
Allez dans votre dashboard Supabase > **Authentication** > **URL Configuration**.

*   **Site URL** : Mettez votre domaine final : `https://octagon.xgotgot.zapto.org`
*   **Redirect URLs** : Ajoutez les URLs suivantes :
    *   `https://octagon.xgotgot.zapto.org/**`

### 3. Google Cloud Console (Si "Sign in with Google" échoue)
Si vous obtenez une erreur `redirect_uri_mismatch` ou si Google Auth ne fonctionne pas :

1.  Allez sur [console.cloud.google.com](https://console.cloud.google.com) > APIs & Services > Credentials.
2.  Éditez votre **OAuth 2.0 Client ID**.
3.  Ajoutez dans **Authorized redirect URIs** :
    *   `https://<votre-projet-supabase>.supabase.co/auth/v1/callback`
    *   *(Note : Ce n'est PAS votre domaine perso, mais l'URL de callback de Supabase)*

### 4. Mise à jour
Si vous modifiez le fichier `.env`, vous devez reconstruire et renvoyer l'image :
⚠️ **Important** : Contrairement à Next.js, avec Vite (React), les variables `VITE_` sont "imprimées" dans le code lors du **build**. Changer une variable dans Unraid ne suffit pas toujours si l'image a été buildée avec d'autres valeurs.

Assurez-vous que votre fichier `frontend/.env` contient bien les URLs de production **avant** de lancer `docker compose build`.

```env
# URL de votre projet Supabase (ne change pas souvent)
VITE_SUPABASE_URL=https://votre-projet.supabase.co

# Clé anonyme (publique)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Note : L'application n'utilise pas `NEXT_PUBLIC_SITE_URL` car c'est une application Vite, pas Next.js. La redirection est gérée automatiquement par Supabase basée sur la configuration du dashboard.*

### 3. Mise à jour
Si vous modifiez le fichier `.env`, vous devez reconstruire et renvoyer l'image :

```bash
docker compose --env-file ./frontend/.env build
docker compose --env-file ./frontend/.env push
```

⚠️ **Important** : J'ai mis à jour le code (`AuthContext.tsx`) pour forcer la redirection vers votre domaine. **Vous devez reconstruire l'image** pour que ce correctif soit pris en compte.

Puis sur Unraid, forcez une mise à jour du conteneur (Docker > Check for Updates).
