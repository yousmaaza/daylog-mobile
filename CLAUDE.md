# Daylog Mobile — Instructions Claude

## Projet

Application React Native + Expo SDK 52 de suivi de temps par tâche. Entièrement hors ligne — tout l'état est persisté via AsyncStorage. Pas de backend.

## Commandes

```bash
npm start                                          # Metro bundler
npm run ios                                        # Simulateur iOS
npm run android                                    # Émulateur Android
npx expo export --platform ios --no-minify        # Vérifier le bundle sans erreurs
eas build --platform android --profile preview    # Build APK partageable
```

## Architecture

### Entrée

- `App.js` — point d'entrée unique : `enableScreens(false)`, auth gate (`loaded && !user` → `LoginScreen`), swipe pager (ScrollView pagingEnabled), tab bar fixe en bas, `AddTaskModal` global

### State

- `src/hooks/useTasks.js` — toute la logique : tâches, auth (`user`, `login`, `logout`), dark mode, semaine sélectionnée, tick timer (1s), `toggleFavorite`, `addTask`
- `src/context/TaskContext.js` — wrap de `useTasks()` en Context Provider
- `src/storage.js` — wrappers AsyncStorage : `loadTasks/saveTasks`, `loadTheme/saveTheme`, `loadTemplates/saveTemplates`, `loadAuth/saveAuth`

### Constantes

`src/constants.js` :
- `COLORS.light` / `COLORS.dark` — tokens couleur (bgApp `#F0EDFF` lavande, amber `#7C5CFC` violet)
- `DEFAULT_TAGS` — 8 tags prédéfinis : `{ id, label, color, bg }`
- `AUTH_KEY` — clé AsyncStorage pour l'auth
- `HOUR_H = 64` — px par heure sur la timeline
- `TIMELINE_START = 6`, `TIMELINE_END = 23`

### Screens (navigation par swipe)

| Index | Screen | Fichier |
|---|---|---|
| 0 | Today | `src/screens/TodayScreen.js` |
| 1 | Timeline | `src/screens/TimelineScreen.js` |
| 2 | Stats | `src/screens/StatsScreen.js` |
| 3 | Profile | `src/screens/ProfileScreen.js` |

### Composants

- `TaskCard` — carte tâche avec timer live, bouton cœur (favoris), chips de tags, actions (start/pause/done/delete)
- `AddTaskModal` — bottom sheet : saisie nom + sélecteur de tags + quick-pick templates
- `WeekPicker` — strip 7 jours avec navigation semaine précédente/suivante
- `DonutChart` — graphique SVG pour l'écran Stats

## Comportements clés

### Chaînage des tâches

`startTask()` démarre une nouvelle session à `latestEnd` (dernière `endTime` de toutes les sessions du jour), ou à `now` si c'est la première tâche. Les tâches se chaînent automatiquement — aucun écart.

### Favoris

`toggleFavorite(taskId)` parcourt TOUTES les dates (pas seulement `selDate`). `ProfileScreen` agrège tous les `task.favorite === true` via `useMemo` sur l'objet `tasks`.

### Tags

Stockés comme tableau d'IDs sur chaque tâche (`task.tags: string[]`). Résolution via `DEFAULT_TAGS.find(t => t.id === id)` au moment du rendu. `addTask(name, options)` accepte `options.tags`.

### Auth

- `user` : `{ name, email, photo }` ou `null`
- Persisté dans AsyncStorage via `saveAuth`
- Google OAuth : mock UI actuellement — voir `LoginScreen.js` pour activer `expo-auth-session`

## Points de vigilance

### iOS 26

`enableScreens(false)` **doit rester** en tout premier dans `App.js` (avant tous les imports). Sans ça, l'app crash au lancement sur iOS 26 à cause de `sheetAllowedDetents` dans react-native-screens 3.37.0.

### Node.js

Node 18 uniquement (pas Node 20+). Expo 52 + Metro 0.81.5. Node 20 casse la résolution des modules Metro avec `toReversed()`.

### Peer deps

Toujours utiliser `--legacy-peer-deps` pour les `npm install` — les dépendances ont des conflits de peer deps entre elles.

### Vérification bundle

Après chaque modification majeure, vérifier avec :
```bash
npx expo export --platform ios --no-minify
```
Résultat attendu : `711 modules`, 0 erreurs.

## Structure des données

```js
// Tâche
{
  id: string,           // uid()
  name: string,
  sessions: [{ id, startTime: Date, endTime: Date | null }],
  done: boolean,
  colorIdx: number,     // index dans TASK_PALETTE
  createdAt: number,    // timestamp ms
  tags: string[],       // IDs de DEFAULT_TAGS
  favorite: boolean,
}

// tasks (stocké en AsyncStorage)
{
  "2025-03-18": Task[],
  "2025-03-19": Task[],
  ...
}

// user (stocké en AsyncStorage)
{ name: string, email: string, photo: string | null }
```
