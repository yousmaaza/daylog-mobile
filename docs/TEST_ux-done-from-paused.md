# Plan de test — Terminer une tâche en pause sans la relancer

## Issues couvertes
- [#39 [UX] Terminer une tâche en pause sans la relancer](https://github.com/yousmaaza/daylog-mobile/issues/39)

## Prérequis
- [ ] Branche `feat/ux-done-from-paused` checkout localement
- [ ] `npm install --legacy-peer-deps`
- [ ] Simulateur iOS ou émulateur Android démarré
- [ ] `npm start` (Metro bundler)

## Vérification bundle
```bash
npx expo export --platform ios --no-minify
```
Résultat attendu : 0 erreurs.

---

## Scénarios de test manuels

### Scénario 1 — Terminer une tâche en pause (cas nominal)
**Objectif :** Vérifier qu'une tâche en pause affiche un bouton "Done" et se termine sans session parasite.

**Étapes :**
1. Depuis TodayScreen, créer une tâche "Test pause-done"
2. Appuyer sur "Start" → la tâche passe en "In Progress"
3. Attendre 5 secondes
4. Appuyer sur "Pause" → la tâche passe en "Paused", le bouton "Resume" apparaît
5. Vérifier que le bouton **"Done"** (vert) est maintenant visible à côté de "Resume"
6. Appuyer sur "Done"

**Résultat attendu :**
- La tâche passe en statut "Done" (pill verte, texte barré)
- Aucune session parasite créée (pas de session de quelques millisecondes)
- Sur la Timeline, le dernier bloc de la tâche est fermé (endTime = l'heure de pause, pas l'heure du Done)

---

### Scénario 2 — Tâche jamais démarrée (régression)
**Objectif :** Vérifier qu'une tâche créée mais jamais démarrée ne montre pas de bouton "Done".

**Étapes :**
1. Créer une nouvelle tâche "Tâche vierge" sans l'activer
2. Observer les boutons affichés

**Résultat attendu :**
- Seul le bouton "Start" et le bouton "✕" (supprimer) sont visibles
- Pas de bouton "Done" sur une tâche sans sessions

---

### Scénario 3 — Comportement Active → Pause → Done (régression)
**Objectif :** Vérifier que le flux classique Start → Pause → Done fonctionne toujours.

**Étapes :**
1. Créer une tâche "Flux classique"
2. Appuyer sur "Start"
3. Appuyer sur "Pause"
4. Appuyer sur "Done" (depuis l'état Paused)
5. Vérifier la Timeline

**Résultat attendu :**
- La tâche est marquée Done
- La Timeline affiche un seul bloc continu (de Start à Pause)
- Pas de session supplémentaire créée entre Pause et Done

---

### Scénario 4 — Tâche en pause sur un jour passé
**Objectif :** Vérifier que le bouton Done n'apparaît pas pour les jours passés (isToday = false).

**Étapes :**
1. Naviguer sur un jour passé via le WeekPicker
2. Observer une tâche en statut "Paused" de ce jour

**Résultat attendu :**
- Ni le bouton "Resume" ni le bouton "Done" n'apparaissent (isToday = false désactive les deux)

---

### Scénario 5 — Séquence multiple Start/Pause/Done
**Objectif :** Vérifier le cas Start → Pause → Resume → Pause → Done.

**Étapes :**
1. Créer une tâche "Multi-sessions"
2. Start → attendre 3s → Pause
3. Resume → attendre 3s → Pause
4. Vérifier que le bouton "Done" est présent
5. Appuyer sur "Done"

**Résultat attendu :**
- La tâche affiche 2 blocs sur la Timeline (les 2 sessions)
- Pas de 3ème session créée au moment du Done
- `done: true` sur la tâche

---

## Critères d'acceptation (issue #39)

- [ ] Un bouton "Done" (vert) est visible sur une tâche en statut Paused dans TodayScreen
- [ ] Appuyer sur "Done" depuis l'état Paused marque `done: true` sans ouvrir de nouvelle session
- [ ] Aucune session parasite n'est créée
- [ ] La tâche terminée depuis l'état Paused apparaît correctement sur la Timeline (dernier bloc fermé)
- [ ] Le comportement des tâches `active` (Start → Pause → Done) reste inchangé
- [ ] Le bouton "Done" n'apparaît pas sur une tâche jamais démarrée (sessions vides)
- [ ] Le bouton "Done" n'apparaît pas pour les jours passés

---

## Régressions à vérifier
- [ ] La navigation par swipe fonctionne normalement
- [ ] Le timer en temps réel s'incrémente correctement sur les tâches actives
- [ ] Le chaînage des tâches (startTask) n'a pas de gap — démarrer une tâche enchaîne depuis la dernière endTime
- [ ] Les données persistent après redémarrage de l'app
- [ ] Le dark mode s'applique correctement sur TaskCard
- [ ] Pas de crash sur iOS 26 (enableScreens(false) intact dans App.js)
