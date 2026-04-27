# Plan de test — Volet analytics update

## Issues couvertes
- [#37 [FEATURE] volet analytics update](https://github.com/yousmaaza/daylog-mobile/issues/37)

## Prérequis
- [ ] Branche `feat/analytics-update` checkout localement
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

### Scénario 1 — Ordre des sections (Summary en premier)
**Objectif :** Vérifier que l'écran Overview affiche Summary avant Distribution.

**Étapes :**
1. Naviguer vers l'écran Overview (swipe jusqu'à Stats)
2. Observer l'ordre des sections

**Résultat attendu :**
- L'ordre est : Mode toggle → **Summary** → **Week Activity (heatmap)** → Distribution → Time by Tag → Tasks
- Le bloc Summary avec Total / Tracked / Live apparaît immédiatement sous le toggle
- Le donut Distribution n'est **plus** la première section visible

---

### Scénario 2 — Heatmap : affichage des 7 jours
**Objectif :** Vérifier le rendu du heatmap pour la semaine sélectionnée.

**Étapes :**
1. Créer des tâches sur plusieurs jours de la semaine en cours
2. Naviguer vers Overview
3. Observer le bloc "Week Activity"

**Résultat attendu :**
- 7 cellules (Mon → Sun) visibles avec des abréviations
- Les jours avec des tâches ont une cellule colorée (violet plus ou moins intense selon la durée)
- Les jours sans activité ont une cellule gris très clair
- Le jour actuel a une bordure violette et son label est en gras/violet
- Sous chaque cellule, le temps total formaté (ex. "2h 30m") est affiché quand > 0

---

### Scénario 3 — Heatmap : tooltip au tap
**Objectif :** Vérifier l'affichage du tooltip au tap sur une cellule.

**Étapes :**
1. Taper sur une cellule de jour avec activité
2. Observer le tooltip affiché en dessous

**Résultat attendu :**
- Un tooltip apparaît montrant : nb de tâches, temps total tracké, tag dominant (avec sa couleur)
- Taper à nouveau sur la même cellule ferme le tooltip
- Taper sur un jour sans activité affiche "No activity this day"

---

### Scénario 4 — Heatmap : jour sans activité
**Objectif :** Vérifier qu'un jour sans tâches ne plante pas.

**Étapes :**
1. Taper sur une cellule d'un jour où aucune tâche n'existe
2. Observer le tooltip

**Résultat attendu :**
- Pas de crash
- Tooltip affiche "No activity this day"

---

### Scénario 5 — Heatmap : navigation de semaine
**Objectif :** Vérifier que le heatmap se met à jour quand on change de semaine.

**Étapes :**
1. Dans TodayScreen, naviguer vers la semaine précédente via le WeekPicker (flèche gauche)
2. Revenir sur Overview

**Résultat attendu :**
- Le heatmap affiche les 7 jours de la semaine précédente
- Les données correspondent aux tâches de cette semaine

---

### Scénario 6 — Export CSV
**Objectif :** Vérifier l'export des données de la semaine en CSV.

**Étapes :**
1. Créer 2-3 tâches avec des tags différents sur plusieurs jours
2. Dans Overview, taper le bouton ⬆️ en haut à droite
3. Observer la boîte de dialogue de partage

**Résultat attendu :**
- La boîte de dialogue système de partage s'ouvre
- Le fichier proposé est nommé `daylog-week-YYYY-MM-DD.csv`
- En ouvrant le CSV : entête `date,task,tag,duration_min,status` présent
- Chaque tâche a une ligne avec ses données correctes
- Les noms avec guillemets sont correctement échappés

---

### Scénario 7 — Export sur semaine vide
**Objectif :** Vérifier que l'export fonctionne même sans tâches.

**Étapes :**
1. Naviguer sur une semaine sans aucune tâche
2. Taper le bouton ⬆️

**Résultat attendu :**
- Pas de crash
- Le CSV exporté contient uniquement l'entête

---

## Critères d'acceptation (issue #37)

### Summary en premier
- [ ] Le bloc Summary s'affiche avant le donut Distribution
- [ ] L'ordre final : Summary → Heatmap → Distribution → Time by Tag → Tasks

### Heatmap
- [ ] 7 cellules (Lun → Dim) représentant le temps tracké
- [ ] Intensité proportionnelle au temps (0 h = gris clair, ≥ 8 h = violet foncé)
- [ ] Le jour actuel est mis en évidence (bordure violette + label en gras)
- [ ] Tap sur cellule : tooltip avec nb tâches, temps total, tag dominant
- [ ] Jour sans activité : tooltip "No activity this day", pas de crash
- [ ] Le heatmap se met à jour quand la semaine change

### Export
- [ ] Bouton ⬆️ dans le header
- [ ] Génère un CSV : date, task, tag, duration_min, status
- [ ] Utilise expo-sharing (compatible hors ligne)
- [ ] Fonctionne sur semaine vide (seulement l'entête)

---

## Régressions à vérifier
- [ ] La navigation par swipe fonctionne normalement
- [ ] Le timer en temps réel s'incrémente correctement (tick)
- [ ] Le dark mode s'applique correctement sur toutes les sections
- [ ] Les modes Day / Week / Month filtrent correctement les données
- [ ] Le donut Distribution affiche toujours les bonnes valeurs
- [ ] Les données persistent après redémarrage de l'app
- [ ] Pas de crash sur iOS 26 (enableScreens(false) intact dans App.js)
