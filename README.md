# Yomu (読む)

A Japanese vocabulary learning app for iOS, combining a powerful JMdict-powered dictionary with a WaniKani-style spaced repetition system.

> **読む** (yomu) means "to read" in Japanese

[![iOS 18+](https://img.shields.io/badge/iOS-18%2B-000000?logo=apple)](https://developer.apple.com/ios/)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


## Highlights

- **JMdict dictionary** with 200,000+ entries and smart verb deinflection
- **10-stage SRS** inspired by WaniKani for long-term retention
- **Native iOS experience** using SwiftUI components and Liquid Glass effects
- **Reading session timer** with Live Activities support in Dynamic Island
- **Fully offline** - all data stored locally with backup/restore


## Overview

Yomu is a personal Japanese vocabulary learning tool built for iOS. It lets you search a comprehensive Japanese-English dictionary, add words to your flashcard deck, and review them using a proven spaced repetition algorithm.

The app prioritizes a native iOS experience, using SwiftUI components via Expo's `@expo/ui` and the new Liquid Glass visual effects from `expo-glass-effect`. It requires iOS 18+ and a development build (not compatible with Expo Go).

### Why Yomu?

- **Smart search**: Type in Japanese (kanji, hiragana, katakana), romaji, or English
- **Verb deinflection**: Recognizes conjugated forms (食べている → 食べる) with 400+ rules
- **WaniKani SRS**: Battle-tested algorithm with Apprentice → Guru → Master → Enlightened → Burned stages
- **Context-rich cards**: Add example sentences, translations (via DeepL), and photos to your flashcards


## Features

### Dictionary & Search

Search the complete JMdict database with support for:
- Japanese input (kanji, hiragana, katakana)
- Romaji (automatically converted to hiragana)
- English definitions
- Conjugated verb forms via deinflection (e.g., 食べたくなかった → 食べる)

Results are ranked by relevance and word commonality.

### Flashcard Deck & SRS

A 10-stage spaced repetition system modeled after WaniKani:

| Stage | Name | Interval |
|-------|------|----------|
| 0 | New | Immediate |
| 1-4 | Apprentice | 4h → 8h → 1d → 2d |
| 5-6 | Guru | 1 week → 2 weeks |
| 7 | Master | 1 month |
| 8 | Enlightened | 4 months |
| 9 | Burned | Complete |

Incorrect answers apply a penalty that scales with stage level, ensuring difficult cards get more practice.

### Card Enrichment

- Add custom example sentences
- Automatic translation via DeepL API (optional)
- Attach photos for context using the camera

### Reading Sessions

A stopwatch timer to track your study time while reading external materials:
- **Live Activities** support - see elapsed time in Dynamic Island
- Tracks cards added during each session
- Session history with statistics

### Statistics Dashboard

- Total cards, active cards, burned cards
- Current and best streak tracking
- Success rates (all-time, 7-day, 30-day)
- Stage distribution visualization
- GitHub-style activity heatmap
- 30-day review forecast chart

### Backup & Restore

Export all your data to a ZIP file including:
- Cards with full review history
- Reading sessions and daily stats
- Card images
- Settings (optionally with API key)


## Technical Highlights

### Architecture

- **React Native** with Expo SDK 54
- **SQLite** database via `expo-sqlite` for all data
- **Zustand** for state management (one store per feature domain)
- **NativeWind** (Tailwind CSS) for styling

### Native iOS UI

- SwiftUI components via `@expo/ui/swift-ui` (Button, TextField, Switch, Picker, etc.)
- Liquid Glass effects via `expo-glass-effect`
- Native tab bar with `expo-router/unstable-native-tabs`
- SF Symbols for icons
- iOS system colors with automatic dark/light mode

### SRS Algorithm

The spaced repetition algorithm follows WaniKani's proven formula:
- **Correct answer**: Advance one stage
- **Incorrect answer**: Drop back based on current stage (higher stages = bigger penalty)
- Cards answered incorrectly stay in the current session for immediate re-review


## Getting Started

### Requirements

- **iOS 18+** (uses Liquid Glass and other iOS 18 features)
- **Development build** required (not compatible with Expo Go)
- Node.js and npm
- Xcode with iOS 18+ SDK

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YannickHerrero/yomu.git
   cd yomu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a development build:
   ```bash
   npx expo run:ios
   ```

   Or using EAS Build:
   ```bash
   eas build --profile development --platform ios
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Building the Dictionary

The app requires a pre-built dictionary database. To build it from JMdict:

1. Download `JMdict_english.zip` (without example sentences) from [yomidevs/jmdict-yomitan](https://github.com/yomidevs/jmdict-yomitan/releases)

2. Extract the contents to `assets/JMdict_english/`:
   ```bash
   unzip JMdict_english.zip -d assets/JMdict_english
   ```

3. Run the build script:
   ```bash
   npm run build:dictionary
   ```

This converts JMdict data to SQLite format with full-text search indexing.


## Project Structure

```
app/                    # Expo Router screens
├── (tabs)/
│   ├── dictionary/     # Search & add cards
│   ├── review/         # Deck, sessions, burned cards
│   ├── session/        # Reading timer
│   ├── settings/       # Preferences, backup
│   └── stats/          # Statistics dashboard
components/             # Reusable UI components
database/               # SQLite queries by domain
stores/                 # Zustand state management
utils/                  # SRS calculations, deinflection, etc.
constants/              # SRS stages, theme values
```


## Contributing

Contributions are welcome! Feel free to open issues for bugs or feature requests.

If you'd like to contribute code:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request


## License

MIT License - see [LICENSE](LICENSE) for details.
