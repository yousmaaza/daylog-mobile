# Daylog Mobile

Track your time, one task at a time.

A fully offline time-tracking app for iOS and Android, built with React Native + Expo.

## Features

- **Task tracking** — start, pause, and complete tasks with automatic time chaining (no gaps between sessions)
- **Timeline view** — visual hourly timeline of your day
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
| Framework | React Native 0.76.9 + Expo SDK 52 |
| Navigation | Horizontal ScrollView (pagingEnabled) — no extra nav library |
| Storage | @react-native-async-storage/async-storage |
| Icons | react-native-svg (custom SVG components) |
| Safe area | react-native-safe-area-context |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + Simulator **or** Expo Go on a physical device
- Android: Android Studio + Emulator **or** Expo Go on a physical device

### Install

```bash
git clone <repo-url>
cd daylog-mobile
npm install
```

### Run

```bash
# Start Metro bundler
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

Scan the QR code with **Expo Go** to run on a physical device.

## Project Structure

```
daylog-mobile/
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
│       ├── TimelineScreen.js   # Hourly timeline (6am–11pm)
│       ├── StatsScreen.js      # Daily stats and charts
│       └── ProfileScreen.js    # User card, favorites, templates, settings
```

## Key Behaviours

### Task chaining

When you start a new task, its session begins at the `endTime` of the last session across all tasks that day — ensuring zero gaps in the timeline.

### Favorites

Favoriting a task (heart icon) works across all dates. The Profile screen aggregates all favorited tasks regardless of which day they were created.

### Tags

8 predefined tags (Work, Sport, Personal, Health, Study, Home, Shopping, Other). Multiple tags can be assigned per task. Tags are stored as an array of IDs on each task object.

## Distribution

### Android (APK — shareable directly)

```bash
eas build --platform android --profile preview
```

### iOS (TestFlight — requires Apple Developer account)

```bash
eas build --platform ios --profile preview
```

## Notes

### Google Sign-In

The Google OAuth button currently shows a mock UI (name + email form). To enable real Google OAuth:

1. `expo install expo-auth-session expo-web-browser`
2. Create credentials at [console.cloud.google.com](https://console.cloud.google.com)
3. Replace `handleGooglePress` in `src/screens/LoginScreen.js` with `Google.useAuthRequest`

### iOS 26 Crash Fix

`enableScreens(false)` is called at the top of `App.js` to prevent a crash in react-native-screens 3.37.0 on iOS 26 where `sheetAllowedDetents` receives a string instead of a float.
