# Plan de test — Continuation de tâche à minuit

## Issues couvertes
- [#35 [FEATURE] Si une task est ouverte et qu'il est minuit la task continue au lendemain](https://github.com/yousmaaza/daylog-mobile/issues/35)

## Prérequis
- [ ] Branche `feat/midnight-task-continuation` checkout localement
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

### Scénario 1 — App ouverte au passage de minuit (cas nominal)

**Objectif :** Vérifier que la session active se ferme à minuit et qu'une nouvelle session démarre automatiquement le lendemain.

**Prérequis :** Modifier temporairement `msUntilMidnight()` dans `useTasks.js` pour déclencher le timeout dans 5 secondes :
```js
// Test uniquement
const msUntilMidnight = () => 5000
```

**Étapes :**
1. Démarrer l'app et créer une tâche "Test midnight"
2. Démarrer le timer de la tâche (bouton ▶)
3. Naviguer sur l'écran Today et observer le timer actif
4. Attendre 5 secondes (déclenchement du passage de minuit simulé)

**Résultat attendu :**
- La tâche de la veille a une session avec `endTime` rempli (fermée à minuit)
- Une nouvelle tâche avec le même nom apparaît dans Today (nouveau jour) avec une session active démarrant à minuit
- Le timer continue de s'incrémenter depuis 00:00:00
- Naviguer sur le jour précédent : la session de la veille se termine bien à minuit (pas de timer infini)

---

### Scénario 2 — App fermée pendant une tâche active (orphan session)

**Objectif :** Vérifier que les sessions ouvertes d'un jour précédent sont scellées au redémarrage.

**Étapes :**
1. Démarrer une tâche le jour J
2. Fermer l'app brutalement (kill process) sans arrêter la tâche
3. Relancer l'app le jour J+1 (ou modifier la date système)

**Résultat attendu :**
- La tâche du jour J a sa session fermée à minuit du jour J (endTime = 00:00:00 de J+1)
- Aucune session infinie n'est affichée
- Le timer de la tâche du jour J indique le temps travaillé jusqu'à minuit
- Aucune tâche n'est automatiquement créée pour J+1 (comportement volontaire : l'utilisateur décide de reprendre)

---

### Scénario 3 — Plusieurs tâches actives simultanément à minuit

**Objectif :** Valider le comportement si plusieurs sessions sont ouvertes (données corrompues).

**Étapes :**
1. Injecter manuellement via AsyncStorage deux tâches avec `endTime: null` pour la veille
2. Redémarrer l'app

**Résultat attendu :**
- Les deux sessions sont scellées à minuit du lendemain
- Aucun plantage ni boucle infinie

---

### Scénario 4 — Passage de minuit sans tâche active

**Objectif :** S'assurer qu'il n'y a aucun effet de bord si aucune tâche n'est active à minuit.

**Étapes :**
1. Démarrer une tâche et la mettre en pause (endTime rempli)
2. Simuler le passage de minuit (timeout 5s)

**Résultat attendu :**
- Aucune tâche n'est dupliquée dans le nouveau jour
- `todayKey` est mis à jour normalement
- L'app reste stable

---

## Critères d'acceptance

### #35 — [FEATURE] Si une task est ouverte et qu'il est minuit la task continue au lendemain

- [ ] La session active se ferme à `midnightTs` (timestamp exact de minuit) côté jour précédent
- [ ] Une nouvelle entrée de la même tâche apparaît dans le jour suivant avec une session démarrant à `midnightTs`
- [ ] `done: false` sur la tâche portée au lendemain (elle repart comme active)
- [ ] Le timer du lendemain s'incrémente depuis 00:00:00
- [ ] Les données persistent dans AsyncStorage après rechargement
- [ ] Les sessions orphelines (app fermée) sont scellées au démarrage sans créer de continuation automatique

---

## Régressions à vérifier

- [ ] La navigation par swipe fonctionne normalement
- [ ] Le timer en temps réel s'incrémente correctement sur les tâches actives normales
- [ ] Le chaînage des tâches (`startTask`) n'a pas de gap — `latestEnd` toujours cohérent
- [ ] Les données persistent après redémarrage de l'app
- [ ] Le dark mode s'applique correctement
- [ ] Pas de crash sur iOS 26 (`enableScreens(false)` intact en premier dans `App.js`)
- [ ] `toggleFavorite` parcourt bien TOUTES les dates y compris les continuations
- [ ] La vue Timeline du lendemain affiche correctement la tâche continuée depuis minuit
