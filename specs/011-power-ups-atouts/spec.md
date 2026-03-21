# Feature Specification: Système d'Atouts

**Feature Branch**: `011-power-ups-atouts`
**Created**: 2026-03-15
**Status**: Draft

## Context

Dans Octagon, les joueurs parient sur les combats UFC lors d'une soirée event. Pour ajouter du piquant et de l'interaction entre joueurs, chaque participant dispose d'un **atout unique** par soirée qu'il peut jouer soit pour booster ses propres points, soit pour pénaliser un adversaire sur un combat donné.

### Les 4 atouts disponibles

| Atout | Type | Effet |
|---|---|---|
| **Dernière Chance** | Sur soi-même | x2 sur tous les points du main event uniquement |
| **Exacto** | Sur soi-même | Si winner + méthode + round tous corrects, +15 pts bonus |
| **Inversion** | Sur un adversaire | Inverse le pick d'un adversaire sur un combat (il se retrouve avec le fighter opposé) |
| **Dette** | Sur un adversaire | Si l'adversaire a bon sur ce combat, il te donne tous ses points gagnés sur ce combat |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Jouer un atout sur soi-même (Priority: P1)

Un joueur veut maximiser ses points sur un combat. Il dispose d'un atout "Dernière Chance" ou "Exacto" qu'il pose sur un combat avant son début. Si les conditions sont remplies, ses points sont calculés en conséquence.

**Why this priority**: C'est le cas d'usage principal et le plus simple — aucune interaction avec d'autres joueurs n'est requise. Constitue l'MVP minimum.

**Independent Test**: Un joueur pose "Dernière Chance" sur le main event, gagne son pari, et ses points sont doublés sur ce combat.

**Acceptance Scenarios**:

1. **Given** un joueur n'a pas encore utilisé son atout ce soir, **When** il sélectionne "Dernière Chance" et le pose sur le main event, **Then** l'atout est enregistré, visible par tous les joueurs de la league, et ses points sur ce combat sont x2 après les résultats.
2. **Given** un joueur a posé "Exacto" sur un combat, **When** il trouve winner + méthode + round corrects, **Then** il reçoit +15 pts bonus en plus de ses points habituels.
3. **Given** un joueur a posé "Exacto" sur un combat, **When** il trouve le winner mais pas la méthode ou le round, **Then** aucun bonus n'est attribué (les points habituels s'appliquent normalement).
4. **Given** un joueur a déjà joué son atout ce soir, **When** il tente d'en jouer un second, **Then** l'action est refusée et un message lui indique qu'il a déjà utilisé son atout.
5. **Given** un joueur a posé un atout sur un combat, **When** le combat commence (event locké), **Then** il ne peut plus retirer ni changer l'atout.

---

### User Story 2 — Jouer un atout sur un adversaire (Priority: P2)

Un joueur veut cibler un adversaire pour lui compliquer la vie sur un combat. Il pose "Inversion" ou "Dette" en désignant un adversaire et un combat. L'atout est visible immédiatement par tous.

**Why this priority**: Ajoute la dimension sociale et stratégique. Dépend de la mécanique de base (US1).

**Independent Test**: Un joueur pose "Inversion" sur un adversaire et un combat ; le pick de cet adversaire est automatiquement inversé et tous les joueurs le voient.

**Acceptance Scenarios**:

1. **Given** un joueur n'a pas utilisé son atout, **When** il pose "Inversion" sur l'adversaire A pour le combat X, **Then** le pick de A sur le combat X passe automatiquement au fighter opposé, et tous les joueurs voient l'atout posé.
2. **Given** un joueur pose "Dette" sur l'adversaire A pour le combat X, **When** A a bon sur ce combat, **Then** tous les points gagnés par A sur ce combat lui sont retirés et ajoutés au joueur qui a posé la Dette.
3. **Given** un joueur pose "Dette" sur l'adversaire A pour le combat X, **When** A a tort sur ce combat, **Then** aucun transfert de points n'a lieu.
4. **Given** l'adversaire A a déjà été ciblé par un atout ce soir, **When** un autre joueur tente de poser un atout sur A, **Then** l'action est refusée avec un message expliquant qu'un joueur ne peut être ciblé qu'une seule fois par soirée.
5. **Given** un joueur a posé "Inversion" sur un adversaire, **When** le combat n'a pas encore commencé, **Then** l'adversaire ciblé ne peut plus modifier son pick sur ce combat.

---

### User Story 3 — Visibilité et transparence des atouts (Priority: P3)

Tous les joueurs de la league peuvent voir en temps réel quels atouts ont été posés, sur quel combat et par/contre qui.

**Why this priority**: La visibilité est clé pour la dimension sociale du jeu et permet aux joueurs d'adapter leur stratégie.

**Independent Test**: Dès qu'un atout est posé, un indicateur visuel apparaît sur le combat concerné dans la fight card.

**Acceptance Scenarios**:

1. **Given** un atout est posé, **When** n'importe quel joueur de la league consulte la fight card, **Then** il voit l'atout affiché sur le combat concerné (nom de l'atout, qui l'a joué, et sur qui si adversaire).
2. **Given** un joueur n'a pas encore joué son atout, **When** il consulte l'interface, **Then** il voit clairement qu'il lui reste 1 atout disponible et peut choisir parmi les 4.
3. **Given** un joueur a déjà joué son atout, **When** il consulte l'interface, **Then** l'indicateur montre "Atout utilisé" avec un rappel de ce qu'il a joué.

---

### Edge Cases

- Que se passe-t-il si un joueur pose "Inversion" sur un adversaire qui n'a pas encore fait de pick ? → L'inversion est mise en attente : le premier pick de l'adversaire sur ce combat est automatiquement inversé.
- Que se passe-t-il si le combat est annulé après qu'un atout a été posé ? → L'atout est remboursé (le joueur récupère son atout pour la soirée).
- Un joueur peut-il se cibler lui-même avec un atout "adversaire" ? → Non, les atouts adversaires ne peuvent cibler que d'autres joueurs.
- "Dernière Chance" sur un combat qui n'est pas le main event ? → Refusé, "Dernière Chance" est exclusivement pour le main event.
- "Dette" posé et l'adversaire gagne 0 pt (tort sur tout) ? → Aucun transfert, l'atout n'a aucun effet.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Chaque joueur dispose d'exactement **1 atout** par event par league.
- **FR-002**: Un joueur peut choisir parmi les 4 atouts disponibles : Dernière Chance, Exacto, Inversion, Dette.
- **FR-003**: Un atout doit être posé **avant le début du combat ciblé** (avant le lock de l'event).
- **FR-004**: Une fois posé, un atout **ne peut pas être retiré ni modifié**.
- **FR-005**: Un atout posé est **immédiatement visible** par tous les membres de la league.
- **FR-006**: Un adversaire ne peut être ciblé **qu'une seule fois** par soirée dans une league.
- **FR-007**: "Dernière Chance" ne peut être posé **que sur le main event**.
- **FR-008**: Le calcul des points prend en compte les effets d'atouts actifs au moment de l'attribution des résultats.
- **FR-009**: En cas d'annulation d'un combat sur lequel un atout a été posé, l'atout est **remboursé** au joueur.
- **FR-010**: "Inversion" bloque la modification du pick de l'adversaire ciblé sur le combat concerné.

### Key Entities

- **Atout (PowerUp)**: Instance de jeu d'un atout — lié à un event, une league, un joueur source, un type d'atout, un combat cible, et optionnellement un joueur cible.
- **Type d'atout**: Enum parmi `DERNIERE_CHANCE`, `EXACTO`, `INVERSION`, `DETTE`.
- **Contrainte de ciblage**: Règle par soirée/league — un joueur ne peut jouer qu'un atout, et un adversaire ne peut être ciblé qu'une fois.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un joueur peut poser son atout en moins de 30 secondes depuis la fight card.
- **SC-002**: L'atout posé est visible par tous les joueurs de la league dans les 5 secondes suivant le jeu.
- **SC-003**: Le calcul des points tenant compte des atouts est exact à 100% (Dernière Chance x2, Exacto +15, Inversion pick inversé, Dette transfert complet).
- **SC-004**: Les règles de contrainte (1 atout par joueur, 1 ciblage max par adversaire) sont appliquées sans exception côté serveur.
- **SC-005**: L'interface indique clairement à chaque joueur s'il lui reste un atout disponible ou s'il l'a déjà joué.

---

## Assumptions

- La notion de "main event" est déjà modélisée (combat principal de l'event, identifiable par sa position ou un flag).
- Les joueurs sont authentifiés et membres d'une league active pour la soirée.
- Le lock d'un combat est déjà géré — un atout suit les mêmes règles de timing que les picks.
- Le mode Survivor est hors scope pour cette feature.
- Les atouts sont scoped par league : un joueur dans deux leagues différentes dispose d'un atout par league.
