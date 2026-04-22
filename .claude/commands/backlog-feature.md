---
description: Lit le backlog GitHub (#2), groupe les US par problématique, développe la feature avec feature-dev, crée une branche, un document de test et une PR taguée.
argument-hint: Optionnel — filtre sur un label ou mot-clé (ex. "UX", "PERF", "FEATURE", "#27")
---

# Backlog → Feature Development Pipeline — Daylog Mobile

Tu orchestres un pipeline complet : lecture du backlog GitHub → groupement des User Stories → développement via `/feature-dev` → branche → document de test → Pull Request.

## Phase 0 — Initialisation

**Actions :**
1. Crée un todo avec toutes les phases.
2. Confirme le repo :
   ```bash
   gh repo view --json nameWithOwner -q .nameWithOwner
   ```
   Résultat attendu : `yousmaaza/daylog-mobile`
3. Note le owner/repo pour toutes les commandes `gh` suivantes.

---

## Phase 1 — Lecture du backlog GitHub

**Objectif :** Récupérer toutes les issues ouvertes du backlog.

**Actions :**
1. Liste toutes les issues ouvertes (limite 100) :
   ```bash
   gh issue list --repo yousmaaza/daylog-mobile --state open --limit 100 --json number,title,labels,body,milestone,createdAt
   ```
   Si un filtre `$ARGUMENTS` est fourni, filtre sur le label ou mot-clé correspondant.

2. Affiche la liste complète à l'utilisateur sous forme de tableau :
   | # | Titre | Labels | Date |
   |---|-------|--------|------|

3. Si aucune issue n'est trouvée, informe l'utilisateur et arrête le pipeline.

---

## Phase 2 — Groupement des User Stories par problématique

**Objectif :** Identifier les groupes d'issues qui partagent la même problématique fonctionnelle.

**Actions :**
1. Analyse toutes les issues récupérées et identifie des **groupes thématiques** cohérents. Critères de regroupement :
   - Même préfixe d'axe (ex. `[PERF]`, `[UX]`, `[SECURITY]`, `[FEATURE]`)
   - Même label partagé
   - Même domaine fonctionnel (timeline, notifications, stats, auth, etc.)
   - Dépendances fonctionnelles entre issues

2. Pour chaque groupe identifié, présente :
   ```
   Groupe A — <Titre de la problématique>
   ├── #19 [PERF] Tous les écrans re-rendent chaque seconde
   ├── #20 [PERF] buildColumns O(n²) recalculé chaque seconde
   └── ...
   Résumé : <2 phrases expliquant la problématique commune>
   Complexité estimée : Faible / Moyenne / Élevée
   ```

3. **Demande à l'utilisateur de choisir le groupe à développer** en indiquant la lettre ou le numéro du groupe.
4. **Attends la réponse avant de continuer.**

---

## Phase 3 — Chargement du contexte des issues sélectionnées

**Objectif :** Récupérer le détail complet de chaque issue du groupe choisi.

**Actions :**
1. Pour chaque issue du groupe sélectionné :
   ```bash
   gh issue view <number> --repo yousmaaza/daylog-mobile --json number,title,body,labels,comments,assignees,milestone
   ```

2. Extrait de chaque issue :
   - La description / critères d'acceptance
   - Les contraintes techniques mentionnées
   - Les dépendances avec d'autres issues

3. Construis un **résumé de la feature** en une phrase claire utilisable comme argument pour `feature-dev`.

4. Identifie le **nom de branche** selon le pattern :
   - `feat/<slug-de-la-problematique>` (ex. `feat/perf-render`, `feat/ux-timeline`)
   - Vérifie qu'il n'existe pas déjà :
     ```bash
     git branch --list "feat/*"
     ```

---

## Phase 4 — Création de la branche feature

**Objectif :** Créer une branche dédiée à la feature.

**Actions :**
1. Identifie la branche de base :
   ```bash
   git remote show origin | grep "HEAD branch"
   ```

2. Crée et checkout la branche feature à partir de `master` :
   ```bash
   git checkout master
   git pull origin master
   git checkout -b <nom-de-branche>
   ```

3. Confirme à l'utilisateur : "Branche `<nom-de-branche>` créée à partir de `master`."

---

## Phase 5 — Développement de la feature avec feature-dev

**Objectif :** Implémenter la feature en utilisant le workflow `/feature-dev`.

**Actions :**
1. Invoque le skill `feature-dev:feature-dev` avec comme arguments le résumé construit en Phase 3, enrichi des critères d'acceptance de toutes les issues du groupe.

   Format d'argument :
   ```
   <Résumé de la problématique>
   
   User Stories concernées :
   - #<N> : <titre> — <critères d'acceptance clés>
   - #<N> : <titre> — <critères d'acceptance clés>
   
   Contraintes techniques Daylog Mobile :
   - React Native + Expo SDK 52, pas de backend
   - Node 18 uniquement (pas Node 20+)
   - npm install avec --legacy-peer-deps
   - enableScreens(false) doit rester en premier dans App.js
   - Vérifier le bundle après : npx expo export --platform ios --no-minify (711 modules attendus)
   - Tout l'état via AsyncStorage (offline-first)
   ```

2. Suis intégralement les phases du workflow feature-dev.

3. À la fin de chaque phase feature-dev, mets à jour ton todo principal.

---

## Phase 6 — Création du document de test

**Objectif :** Produire un guide de test pour la feature.

**Actions :**
1. Crée le fichier `docs/TEST_<slug-feature>.md` :

```markdown
# Plan de test — <Titre de la problématique>

## Issues couvertes
- #<N> [<titre>](lien GitHub)

## Prérequis
- [ ] Branche `<nom-branche>` checkout localement
- [ ] `npm install --legacy-peer-deps`
- [ ] Simulateur iOS ou émulateur Android démarré
- [ ] `npm start` (Metro bundler)

## Vérification bundle
```bash
npx expo export --platform ios --no-minify
```
Résultat attendu : `711 modules`, 0 erreurs.

## Scénarios de test manuels

### Scénario 1 — <Cas nominal>
**Objectif :** ...  
**Étapes :**
1. ...
**Résultat attendu :** ...

### Scénario 2 — <Cas limite>
...

### Scénario 3 — <Cas d'erreur>
...

## Critères d'acceptance (par issue)

### #<N> — <titre>
- [ ] Critère 1
- [ ] Critère 2

## Régressions à vérifier
- [ ] La navigation par swipe fonctionne normalement
- [ ] Le timer en temps réel s'incrémente correctement
- [ ] Le chaînage des tâches (startTask) n'a pas de gap
- [ ] Les données persistent après redémarrage de l'app
- [ ] Le dark mode s'applique correctement
- [ ] Pas de crash sur iOS 26 (enableScreens(false) intact)
```

---

## Phase 7 — Commit des changements

**Objectif :** Versionner proprement les changements.

**Actions :**
1. Stage les fichiers modifiés/créés (jamais `git add -A` — préférer les fichiers explicites) :
   ```bash
   git add src/ App.js docs/
   git status
   ```
2. Vérifie le bundle :
   ```bash
   npx expo export --platform ios --no-minify 2>&1 | tail -5
   ```
3. Crée un commit descriptif :
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: <résumé feature>

   Closes #<N>, #<N>
   
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
4. Pousse la branche :
   ```bash
   git push -u origin <nom-de-branche>
   ```

---

## Phase 8 — Création de la Pull Request

**Objectif :** Ouvrir une PR qui relie toutes les issues du groupe.

**Actions :**
1. Crée la PR :
   ```bash
   gh pr create \
     --repo yousmaaza/daylog-mobile \
     --title "feat: <titre de la problématique>" \
     --base master \
     --body "$(cat <<'EOF'
   ## Problématique

   <Description de la problématique adressée>

   ## User Stories implémentées

   - Closes #<N> — <titre>
   - Closes #<N> — <titre>

   ## Changements apportés

   <Liste des fichiers modifiés et nature des changements>

   ## Vérification bundle

   ```bash
   npx expo export --platform ios --no-minify
   # → 711 modules, 0 erreurs
   ```

   ## Plan de test

   Voir [`docs/TEST_<slug>.md`](docs/TEST_<slug>.md) pour le plan de test complet.

   ## Checklist

   - [ ] Bundle vérifié (711 modules, 0 erreurs)
   - [ ] Tests manuels exécutés selon `docs/TEST_<slug>.md`
   - [ ] Pas de régression sur la navigation swipe
   - [ ] Pas de régression sur le timer et le chaînage des tâches
   - [ ] `enableScreens(false)` toujours en premier dans App.js

   🤖 Generated with [Claude Code](https://claude.ai/claude-code)
   EOF
   )"
   ```

2. Affiche l'URL de la PR créée.

3. Ajoute les labels appropriés :
   ```bash
   gh pr edit <number> --repo yousmaaza/daylog-mobile --add-label "enhancement"
   ```

---

## Phase 9 — Mise à jour du Project Board

**Objectif :** Passer les issues du groupe en "In Review" sur le board #2.

**Prérequis :** Le token gh doit avoir le scope `project`. Si ce n'est pas le cas :
```bash
gh auth refresh -s project
```

**Actions :**
1. Récupère les IDs nécessaires :
   ```bash
   gh project list --owner yousmaaza --format json --jq '.projects[] | [.number, .title] | @tsv'
   ```

2. Pour chaque issue du groupe, trouve son item ID et passe son statut en "In Review" :
   ```bash
   PROJECT_ID=$(gh project list --owner yousmaaza --format json --jq '.projects[] | select(.number == 2) | .id')

   gh project item-list 2 --owner yousmaaza --format json \
     --jq '.items[] | select(.content.number == <issue-number>) | .id'

   gh project field-list 2 --owner yousmaaza --format json \
     --jq '.fields[] | select(.name == "Status") | {id: .id, options: .options}'

   gh project item-edit \
     --project-id $PROJECT_ID \
     --id <item-id> \
     --field-id <status-field-id> \
     --single-select-option-id <in-review-option-id>
   ```

3. Confirme : "Issues #N, #N passées en **In Review** sur le board."

---

## Phase 10 — Résumé final

**Actions :**
1. Marque tous les todos comme terminés.
2. Affiche un récapitulatif :
   ```
   ✅ Pipeline backlog → feature terminé
   
   Branche     : <nom-de-branche>
   Issues      : #N, #N (statut → In Review)
   PR          : <URL>
   Bundle      : 711 modules ✓
   Test doc    : docs/TEST_<slug>.md
   ```
