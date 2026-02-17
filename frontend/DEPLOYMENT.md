# 🚀 Déploiement Frontend sur UNRAID

Ce guide a été mis à jour pour utiliser **Docker Compose**, ce qui simplifie grandement la gestion des variables d'environnement.

## Prérequis
- Docker Desktop (Windows)
- Un compte Docker Hub

## 1. Configuration (Environnement)

Créez un fichier `.env` à la racine du projet (là où se trouve `docker-compose.yml`) avec vos clés :

```env
DOCKER_USERNAME=votre-pseudo-dockerhub
VITE_SUPABASE_URL=https://votre-url.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-api
```

## 2. Construction et Envoi (Build & Push)

Grâce à Docker Compose, une seule commande suffit pour construire l'image en injectant les variables et l'envoyer sur Docker Hub :

```bash
# Build l'image
docker compose build

# Envoyer vers Docker Hub
docker compose push
```

## 3. Déploiement sur Unraid

1.  Allez dans **Docker** > **Add Container**.
2.  **Name**: `Octagon-Frontend`
3.  **Repository**: `votre-pseudo-dockerhub/octagon-frontend:latest`
4.  **Network**: `Bridge`
5.  **Add Port**: Host: `8080`, Container: `80`.
6.  Cliquez sur **APPLY**.

---

## 🛠️ Ancienne méthode (Manuelle)

Si vous préférez ne pas utiliser Compose, vous devez passer les arguments manuellement lors du build :

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -t votre-user/octagon-frontend .
```
