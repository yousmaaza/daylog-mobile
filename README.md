# Echo Mobile

Track your time, one task at a time.

A fully offline time-tracking app for iOS and Android, built with React Native + Expo.

## Features

- **Task tracking** — start, pause, and complete tasks with automatic time chaining (no gaps between sessions)
- **Timeline view** — live hourly timeline with real-time session blocks and current-time indicator
- **Stats** — donut chart and daily breakdown of time spent per task
- **Tags** — label tasks with Work, Sport, Personal, Health, Study, Home, Shopping, or Other
- **Favorites** — heart any task to pin it to your Profile
- **Dark mode** — toggle from any screen
- **Week picker** — navigate past and future days
- **Templates** — save quick-pick task names from your Profile
- **Authentication** — Google sign-in (mock UI, see note below) or Guest mode
- **Fully offline** — all data stored locally via AsyncStorage, no backend required

## Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Navigation | Horizontal ScrollView (pagingEnabled) — no extra nav library |
| Storage | @react-native-async-storage/async-storage 2.2.0 |
| Icons | react-native-svg 15.12.1 (custom SVG components) |
| Safe area | react-native-safe-area-context 5.6.x |

## Getting Started

### Prerequisites

- **Node.js 18** — obligatoire. Node 20+ casse la résolution des modules Metro (`toReversed is not a function`)
- **nvm** — recommandé pour gérer la version de Node
- Expo Go sur ton téléphone (scanner le QR code pour tester directement)
- iOS simulator : Xcode
- Android emulator : Android Studio

### 1. Basculer sur Node 18

```bash
nvm use 18
```

> Si Node 18 n'est pas encore installé :
> ```bash
> nvm install 18
> nvm use 18
> ```

Le fichier `.nvmrc` à la racine contient `18`, donc `nvm use` seul suffit quand tu es dans le dossier du projet.

### 2. Installer les dépendances

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est **obligatoire** — les dépendances Expo ont des conflits de peer deps entre elles.

### 3. Lancer l'application

```bash
# Metro bundler (QR code pour Expo Go)
npm start

# Simulateur iOS
npm run ios

# Émulateur Android
npm run android
```

Scanne le QR code avec **Expo Go** pour tester sur un appareil physique.

## Project Structure

```
Echo Mobile
├── App.js                      # Entry point, tab bar, swipe pager, auth gate
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
├── src/
│   ├── constants.js            # Colors (light/dark), tags, storage keys
│   ├── storage.js              # AsyncStorage wrappers
│   ├── utils.js                # Date key helper (toKey)
│   ├── context/
│   │   └── TaskContext.js      # Global React context
│   ├── hooks/
│   │   └── useTasks.js         # All state logic (tasks, auth, favorites, dark mode)
│   ├── components/
│   │   ├── TaskCard.js         # Task row with timer, heart, tags, actions
│   │   ├── AddTaskModal.js     # Bottom sheet: name input + tag picker + templates
│   │   ├── WeekPicker.js       # 7-day scrollable week strip
│   │   └── DonutChart.js       # SVG donut chart for stats
│   └── screens/
│       ├── LoginScreen.js      # Google sign-in UI + guest mode
│       ├── TodayScreen.js      # Main task list for selected day
│       ├── TimelineScreen.js   # Hourly timeline (6am–11pm) with live updates
│       ├── StatsScreen.js      # Daily stats and charts
│       └── ProfileScreen.js    # User card, favorites, templates, settings
└── todo.md                     # Project roadmap / progress tracker

## Key Behaviours

### Task chaining

When you start a new task, its session begins at the `endTime` of the last session across all tasks that day — ensuring zero gaps in the timeline.

### Live timeline

The timeline updates every second. Active sessions grow in real time, with a live name + duration pointer anchored to the current-time line.

### Favorites

Favoriting a task (heart icon) works across all dates. The Profile screen aggregates all favorited tasks regardless of which day they were created.

### Tags

8 predefined tags (Work, Sport, Personal, Health, Study, Home, Shopping, Other). Multiple tags can be assigned per task. Tags are stored as an array of IDs on each task object.

## Distribution

### Android (APK — partageable directement)

```bash
eas build --platform android --profile preview
```

EAS génère un fichier `.apk` téléchargeable directement depuis [expo.dev](https://expo.dev).

---

### iOS — Build + TestFlight (guide complet)

#### Prérequis

- Un compte **Apple Developer** actif (99 $/an) — [developer.apple.com](https://developer.apple.com)
- Une app créée dans **App Store Connect** — [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
  - Mes apps → **+** → Nouvelle app → renseigne nom, bundle ID (`com.daylog.mobile`), langue
  - Note l'**Apple ID** de l'app (un nombre à 10 chiffres visible dans Informations de l'app)
- **EAS CLI** à jour :
  ```bash
  npm install -g eas-cli
  eas login
  ```

#### 1. Configurer `eas.json`

Renseigne tes identifiants dans le profil `submit.preview` :

```json
"submit": {
  "preview": {
    "ios": {
      "appleId": "ton-email@example.com",
      "ascAppId": "1234567890"
    }
  }
}
```

> `ascAppId` = l'Apple ID numérique de ton app sur App Store Connect (pas le bundle ID).

#### 2. Builder l'IPA

```bash
eas build --platform ios --profile preview
```

Le build tourne sur les serveurs EAS (≈ 10-20 min). Résultat : un fichier `.ipa` signé pour le store.

#### 3. Soumettre à TestFlight

```bash
eas submit --platform ios --profile preview
```

EAS te demande ton **App-Specific Password** (nécessaire si tu as la double authentification activée) :
1. Va sur [appleid.apple.com](https://appleid.apple.com) → **Sécurité** → **Mots de passe spécifiques aux apps**
2. Génère un mot de passe → copie-le dans le terminal quand EAS le demande

#### 4. Inviter les testeurs sur TestFlight

1. Ouvre [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → ton app → **TestFlight**
2. Attends que le build passe l'analyse Apple (5-15 min, statut "Prêt à soumettre")
3. **Testeurs internes** (jusqu'à 25 personnes, accès immédiat) :
   - Onglet **Testeurs internes** → ajoute les Apple ID des testeurs
4. **Testeurs externes** (jusqu'à 10 000 personnes, review Apple requise) :
   - Onglet **Groupes** → crée un groupe → ajoute par email
   - Les testeurs reçoivent une invitation par email et installent via l'app **TestFlight**

#### Résumé des commandes

```bash
# Build
eas build --platform ios --profile preview

# Soumettre à TestFlight
eas submit --platform ios --profile preview

# Build + Submit en une seule commande
eas build --platform ios --profile preview --auto-submit
```

## Vérification du bundle

Après une modification majeure, vérifier qu'il n'y a pas d'erreurs :

```bash
npx expo export --platform ios --no-minify
```

Résultat attendu : `711 modules`, 0 erreurs.

## Erreurs fréquentes

### `toReversed is not a function` ou erreur Metro au démarrage
**Cause** : Node 20+ au lieu de Node 18.
```bash
nvm use 18
```

### `npm install` échoue avec des conflits de peer deps
```bash
npm install --legacy-peer-deps
```

### Crash au lancement sur iOS 26 (`sheetAllowedDetents`)
**Cause** : `enableScreens` non désactivé.
Vérifier que les deux premières lignes de `App.js` sont bien :
```js
import { enableScreens } from 'react-native-screens'
enableScreens(false)
// ← tous les autres imports après
```

### `expo: command not found`
Utiliser `npx` à la place :
```bash
npx expo start
npx expo export --platform ios --no-minify
```

### Impossible de charger l'application sur Expo Go (Problème réseau / "Something went wrong")
**Cause** : Votre ordinateur et votre téléphone ne peuvent pas communiquer sur le réseau Wi-Fi local, ou un pare-feu bloque la connexion.
Ajoutez le flag `--tunnel` pour passer par un pont Internet (Ngrok) contournant les restrictions réseau :
```bash
npx expo start --tunnel
```

## Notes

### Google Sign-In

The Google OAuth button currently shows a mock UI (name + email form). To enable real Google OAuth:

1. `expo install expo-auth-session expo-web-browser`
2. Create credentials at [console.cloud.google.com](https://console.cloud.google.com)
3. Replace `handleGooglePress` in `src/screens/LoginScreen.js` with `Google.useAuthRequest`

### Peer deps

Toujours utiliser `--legacy-peer-deps` avec `npm install` — les dépendances ont des conflits de peer deps entre elles.
