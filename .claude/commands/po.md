---
description: Lance le workflow Product Owner — lit le project board GitHub (#2), analyse le codebase, brainstorme de nouvelles User Stories pour améliorer Daylog Mobile, les crée comme issues GitHub et les ajoute au board.
argument-hint: Optionnel — thème ou axe à prioriser (ex. "stats", "notifications", "ux", "export")
---

# Workflow PO — Daylog Mobile

Lance l'agent Product Owner pour enrichir le backlog du projet.

## Contexte

- **Repo** : `yousmaaza/daylog-mobile`
- **Project Board** : https://github.com/users/yousmaaza/projects/2
- **Filtre thématique** : $ARGUMENTS

## Instructions

Invoque l'agent `po-agent` (défini dans `.claude/agents/po-agent.md`) pour orchestrer le workflow complet en 7 phases :

1. Lire l'état actuel du project board #2 (Echo Board)
2. Lister toutes les issues existantes (éviter les doublons)
3. Analyser le codebase (`CLAUDE.md`, `src/hooks/useTasks.js`, `src/screens/`, `src/hooks/useTaskNotification.js`)
4. Brainstormer 5–10 nouvelles User Stories — présenter un tableau et attendre confirmation
5. Créer les issues GitHub approuvées (format `[AXE] Titre court`)
6. Ajouter chaque issue au project board #2
7. Afficher un rapport final avec les liens

Si `$ARGUMENTS` est fourni, oriente le brainstorming en priorité vers ce thème ou axe.

À la fin, rappelle à l'utilisateur qu'il peut lancer `/backlog-feature` pour implémenter les US créées.
