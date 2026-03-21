---
name: speckit_command_usage
description: How to properly invoke speckit workflow commands
type: feedback
---

Lire le fichier workflow `.agent/workflows/speckit.<command>.md` puis suivre les instructions précisément, étape par étape. Ne pas utiliser le Skill tool pour les commandes speckit (elles ne sont pas enregistrées comme skills).

**Why:** L'utilisateur a corrigé une tentative d'invocation via Skill tool qui a échoué, puis une exécution manuelle approximative des étapes du workflow.

**How to apply:** Quand l'utilisateur invoque `/speckit.<command>`, lire le fichier workflow correspondant et suivre chaque étape dans l'ordre, sans sauter d'étapes ni les exécuter de façon approximative.
