# 🚀 Déploiement Frontend sur UNRAID

Ce guide explique comment builder l'image Docker de votre frontend et la déployer sur votre serveur Unraid.

## Prérequis

- **Docker Desktop** installé sur votre machine Windows.
- Un compte **Docker Hub** (recommandé pour la simplicité) OU un accès terminal à votre serveur Unraid.

---

## Méthode 1 : Via Docker Hub (Recommandé)

C'est la méthode la plus simple. Votre image est hébergée en ligne et Unraid la télécharge comme n'importe quelle autre application.

### 1. Builder l'image (sur votre PC)

Ouvrez un terminal (PowerShell ou CMD) dans le dossier `frontend` du projet :

```bash
# Remplacez "votre-username" par votre pseudo Docker Hub
docker build -t votre-username/octagon-frontend:latest .
```

### 2. Pousser l'image

Connectez-vous à Docker Hub si ce n'est pas déjà fait :
```bash
docker login
```

Puis envoyez l'image :
```bash
docker push votre-username/octagon-frontend:latest
```

### 3. Installer sur Unraid

1. Allez sur votre interface Unraid > **Docker**.
2. Cliquez sur **"Add Container"** en bas.
3. Remplissez les champs :
   - **Name**: `Octagon-Frontend`
   - **Repository**: `votre-username/octagon-frontend:latest`
   - **Network Type**: `Bridge`
4. Ajoutez un port :
   - Cliquez sur "Add another Path, Port, Variable..."
   - Config Type: **Port**
   - Host Port: `8080` (ou un autre port libre de votre choix)
   - Container Port: `80` (Important : ne changez pas celui-ci)
5. Cliquez sur **APPLY**.

Votre site sera accessible via `http://IP-DE-VOTRE-UNRAID:8080`.

---

## Méthode 2 : Transfert Manuel (Sans Cloud / Docker Hub)

Si vous ne voulez pas utiliser Docker Hub, vous pouvez transférer l'image manuellement.

### 1. Builder et Sauvegarder

```bash
# Build
docker build -t octagon-frontend:local .

# Sauvegarder en fichier .tar
docker save -o octagon-frontend.tar octagon-frontend:local
```

### 2. Transférer sur Unraid

Copiez le fichier `octagon-frontend.tar` sur votre serveur Unraid (par exemple dans le partage `/mnt/user/isos/` ou via SCP).

### 3. Charger et Lancer

Ouvrez le terminal de votre Unraid :

```bash
# Charger l'image
docker load -i /mnt/user/isos/octagon-frontend.tar

# Lancer le conteneur
docker run -d \
  --name octagon-frontend \
  -p 8080:80 \
  --restart unless-stopped \
  octagon-frontend:local
```

---

## 🛠️ Mise à jour du site

Si vous faites des modifications dans le code :

1. Refaites le `docker build ...`
2. Refaites le `docker push ...`
3. Sur Unraid, allez dans l'onglet Docker, cliquez sur l'icône de mise à jour (si Unraid détecte la nouvelle version) ou forcez la mise à jour via "Force Update" sur le conteneur.
