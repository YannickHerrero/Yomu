# PRD — Japanese Reading Assistant App

**Version:** 2.0  
**Date:** December 18, 2024  
**Author:** Yannick  
**Status:** Draft

---

## 1. Overview

### 1.1 Context

Learning Japanese through immersive reading (manga, light novels, articles) is an effective method but requires appropriate tools. Existing solutions like Yomichan (browser extension) or Anki (desktop SRS) are powerful but fragmented and poorly suited for mobile use while reading physical materials.

### 1.2 Objective

Develop a personal mobile application that combines three essential features into a single tool: fast Japanese dictionary, reading session stopwatch, and spaced repetition system (SRS) for review.

### 1.3 Target User

Personal use only. Intermediate Japanese learner (WaniKani level 30+), regular reader of manga and other Japanese content.

### 1.4 Target Device

- **Platform**: iOS only (iPhone 16 Pro with latest iOS version)
- **No backward compatibility required**: Targets iOS 18+ exclusively
- **Development build required**: Uses native modules not available in Expo Go

### 1.5 Guiding Principles

- **Offline-first**: Full functionality without internet connection
- **Maximum responsiveness**: Response time < 100ms for searches
- **Minimalism**: No superfluous features, clean UX
- **Local data**: No cloud dependency, 100% on-device data
- **Native-first UI**: Maximum use of native iOS components via SwiftUI for authentic iOS experience

---

## 2. Features

### 2.1 Dictionary Module

#### 2.1.1 Data Source

- Database: **JMdict** (Japanese-Multilingual Dictionary)
- Format: JMdict XML conversion to local SQLite database
- Definition language: English only
- Updates: Manual (periodic re-download if desired)

#### 2.1.2 Search

| Input Mode | Example             | Behavior                          |
| ---------- | ------------------- | --------------------------------- |
| Romaji     | "taberu"            | Auto conversion → hiragana search |
| Hiragana   | "たべる"            | Direct search                     |
| Katakana   | "コンピュータ"      | Direct search                     |
| Kanji      | "食べる"            | Direct search                     |
| Mixed      | "食べる" or "Kanji" | Automatic detection               |

#### 2.1.3 Results Display

Each dictionary entry displays:

- **Word** (kanji if applicable)
- **Reading** (hiragana/katakana)
- **Definition(s)** in English
- **Part of speech** (verb, noun, adjective, etc.)
- **"Add to deck" button** (visible only if word is not already in deck)

#### 2.1.4 Performance Requirements

- Search time: < 100ms
- Results displayed: maximum 50 entries (with pagination or infinite scroll)
- Incremental search: results updated on each keystroke (debounce 150ms)

---

### 2.2 Reading Sessions Module

#### 2.2.1 Stopwatch Operation

- **Start/Pause/Stop**: Simple controls
- **Display format**: HH:MM:SS
- **Background behavior**: iOS Live Activity displays timer on Dynamic Island and Lock Screen, allowing users to track time even when app is backgrounded
- **Live Activity**: Timer is shown as a live updating widget on Dynamic Island (compact/expanded) and Lock Screen

#### 2.2.2 Session End

When stopwatch stops:

- Total duration recorded
- Session date and time
- Automatic save to history

#### 2.2.3 Session History

- Chronological list of past sessions
- Information per session: date, duration
- Optional statistics: cumulative total (day/week/month)

---

### 2.3 SRS Module (Spaced Repetition)

#### 2.3.1 Algorithm

Exact implementation of the **WaniKani SRS system**.

**9 stages split into 5 groups:**

| Stage | Group        | Interval to Next         |
| ----- | ------------ | ------------------------ |
| 1     | Apprentice 1 | 4 hours                  |
| 2     | Apprentice 2 | 8 hours                  |
| 3     | Apprentice 3 | 1 day                    |
| 4     | Apprentice 4 | 2 days                   |
| 5     | Guru 1       | 1 week                   |
| 6     | Guru 2       | 2 weeks                  |
| 7     | Master       | 1 month                  |
| 8     | Enlightened  | 4 months                 |
| 9     | Burned       | ∞ (removed from reviews) |

**Progression Rules:**

```typescript
// Correct answer: +1 stage
if (correct) {
  newStage = currentStage + 1;
}

// Incorrect answer: WaniKani formula
if (!correct) {
  const incorrectAdjustmentCount = Math.ceil(incorrectCount / 2);
  const srsPenaltyFactor = currentStage >= 5 ? 2 : 1;
  newStage = currentStage - incorrectAdjustmentCount * srsPenaltyFactor;
  newStage = Math.max(1, newStage); // Minimum stage 1
}
```

**Penalty Examples:**

| Current Stage    | # Errors | Calculation     | New Stage    |
| ---------------- | -------- | --------------- | ------------ |
| Apprentice 4 (4) | 1        | 4 - (1 × 1) = 3 | Apprentice 3 |
| Apprentice 4 (4) | 2        | 4 - (1 × 1) = 3 | Apprentice 3 |
| Apprentice 4 (4) | 3        | 4 - (2 × 1) = 2 | Apprentice 2 |
| Guru 1 (5)       | 1        | 5 - (1 × 2) = 3 | Apprentice 3 |
| Guru 2 (6)       | 3        | 6 - (2 × 2) = 2 | Apprentice 2 |
| Master (7)       | 1        | 7 - (1 × 2) = 5 | Guru 1       |
| Enlightened (8)  | 3        | 8 - (2 × 2) = 4 | Apprentice 4 |

**Group Meanings:**

- **Apprentice (1-4)**: Initial learning phase, frequent reviews
- **Guru (5-6)**: Solid knowledge of the item
- **Master (7)**: Recall without mnemonic
- **Enlightened (8)**: Quick and effortless recall
- **Burned (9)**: "Fluent" item, removed from reviews

#### 2.3.2 Review Interface

User sees the card (front), taps or reveals the answer, then self-evaluates:

| Button         | Action                |
| -------------- | --------------------- |
| ❌ **Wrong**   | Apply penalty formula |
| ✅ **Correct** | Stage + 1             |

**Note:** In WaniKani, user types the answer and the system checks. For this app, we simplify with self-evaluation (reveal then judge), but the SRS logic remains identical.

#### 2.3.3 Multiple Error Handling

If user makes multiple errors on the same card in a review session:

- The `incorrectCount` counter increments on each error
- Final penalty is calculated at the end of that card's review
- Counter resets after card is marked correct or session ends

#### 2.3.4 Card Format

**Front (question):**

- Japanese word (kanji if applicable)

**Back (answer):**

- Reading (hiragana)
- Definition(s) in English

#### 2.3.5 Deck

- Single global deck
- No tags, no sub-decks
- Statistics display:
  - Cards due for review (due now)
  - Distribution by group (Apprentice / Guru / Master / Enlightened / Burned)
  - Total active cards (non-burned)

#### 2.3.6 Card Management

- **Add**: From dictionary only
- **Delete**: Possible from deck list view
- **Unburn**: Ability to reset a "burned" card to Apprentice 1 to reintegrate into review cycle
- No manual editing (data comes from JMdict)

#### 2.3.7 Burned Cards View

- Separate list of burned cards (for reference and unburn)
- Filter to view only active cards or all cards

---

### 2.4 Statistics Module

#### 2.4.1 Review History

Each review is logged to enable statistics calculation. Data stored per review:

- Card ID
- Review date/time
- Stage before review
- Stage after review
- Result (correct / incorrect)
- Number of errors on this card in session

#### 2.4.2 Displayed Statistics

**Overview:**

| Statistic    | Description                   |
| ------------ | ----------------------------- |
| Total cards  | Total number of cards in deck |
| Active cards | Non-burned cards              |
| Burned cards | Cards that reached stage 9    |

**Distribution by Group:**

| Group            | Count   |
| ---------------- | ------- |
| Apprentice (1-4) | X cards |
| Guru (5-6)       | X cards |
| Master (7)       | X cards |
| Enlightened (8)  | X cards |
| Burned (9)       | X cards |

**Review Activity:**

| Statistic      | Description                             |
| -------------- | --------------------------------------- |
| Total reviews  | Total number of reviews since start     |
| Reviews today  | Number of reviews done today            |
| Study days     | Number of days with at least one review |
| Current streak | Consecutive days with reviews           |
| Best streak    | Record of consecutive days              |

**Performance:**

| Statistic              | Description                    |
| ---------------------- | ------------------------------ |
| Overall success rate   | % correct answers (all time)   |
| Success rate (7 days)  | % correct answers (last week)  |
| Success rate (30 days) | % correct answers (last month) |

**Forecasts:**

| Statistic         | Description           |
| ----------------- | --------------------- |
| Reviews due now   | Cards awaiting review |
| Reviews tomorrow  | Cards due tomorrow    |
| Reviews this week | 7-day forecast        |

#### 2.4.3 Annual Heatmap

"GitHub contribution graph" style visualization:

- Display current year (or selectable year)
- One cell per day
- Color based on intensity (number of reviews that day)
- Legend: 0 reviews (gray) → many reviews (intense color)

```
Visual example:

Jan  ░░▓░░░░░░░░░▓▓░░░░░░░░░░░░░░░░░
Feb  ░▓▓▓░░░░░░░░░░▓▓░░░░░░░░░░░░░░░
Mar  ░░░▓▓▓░░░░░░░░░░░▓░░░░░░░░░░░░░
...
Dec  ░░░░░░░▓▓▓░░░░░░░░░░░░░░░░░░░░░

░ = 0 reviews   ▒ = 1-10   ▓ = 11-30   █ = 30+
```

#### 2.4.4 Forecast Chart

Histogram showing number of expected reviews for the next X days (e.g., 30 days), based on `due_date` of active cards.

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Component          | Technology                                              |
| ------------------ | ------------------------------------------------------- |
| Framework          | React Native + Expo (SDK 54+)                           |
| Language           | TypeScript                                              |
| UI Library         | **Expo UI (SwiftUI)** + expo-glass-effect + NativeWind  |
| Navigation         | **Expo Router Native Tabs** (native iOS tab bar)        |
| State management   | Zustand                                                 |
| Local database     | SQLite (expo-sqlite)                                    |
| Persistent storage | AsyncStorage (preferences), SQLite (data)               |
| Live Activity      | expo-live-activity (native SwiftUI)                     |

#### 3.1.1 Expo UI (SwiftUI)

**Why Expo UI:**

- **True native components**: React code renders actual SwiftUI views, not styled React Native components
- **iOS Liquid Glass effect**: Access to iOS 18's native glass morphism via `expo-glass-effect`
- **Native performance**: Better performance than React Native components
- **iOS design language**: Automatic support for iOS design patterns and animations
- **Native tab bar**: System tab bar with SF Symbols and liquid glass support

**Important:** Expo UI requires a **development build** (not Expo Go). The app cannot run in Expo Go.

**Installation:**

```bash
npx expo install @expo/ui expo-glass-effect
```

**SwiftUI Components Used:**

| SwiftUI Component      | Usage                                      |
| ---------------------- | ------------------------------------------ |
| `Host`                 | Container for SwiftUI views in React Native |
| `Button`               | Actions (Start, Stop, Correct, Wrong)      |
| `TextField`            | Dictionary search bar                      |
| `Switch`               | Toggle settings                            |
| `Picker` (segmented)   | Filter options (active/burned cards)       |
| `Picker` (wheel)       | Selection wheels                           |
| `Slider`               | Adjustable values                          |
| `List`                 | Native lists with swipe actions            |
| `BottomSheet`          | Modal presentations                        |
| `CircularProgress`     | Loading states, progress indicators        |
| `LinearProgress`       | Progress bars                              |
| `Gauge`                | SRS stage visualization                    |
| `ContextMenu`          | Long-press context actions                 |
| `DateTimePicker`       | Date/time selection                        |

**Glass Effect Components:**

| Component        | Usage                                    |
| ---------------- | ---------------------------------------- |
| `GlassView`      | iOS liquid glass effect on any view      |
| `GlassContainer` | Combines multiple glass views with merge |

#### 3.1.2 Component Architecture

**Host Pattern:**

All SwiftUI components must be wrapped in a `Host` component:

```typescript
import { Host, Button, TextField } from '@expo/ui/swift-ui';

function SearchBar() {
  return (
    <Host matchContents>
      <TextField 
        placeholder="Search..." 
        onChangeText={setQuery}
      />
    </Host>
  );
}
```

**Glass Effect Pattern:**

```typescript
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { View, StyleSheet } from 'react-native';

function FlashcardWithGlass({ children }) {
  return (
    <GlassView style={styles.card} glassEffectStyle="regular">
      {children}
    </GlassView>
  );
}

// Multiple glass views that merge together
function InteractiveGlassButtons() {
  return (
    <GlassContainer spacing={10} style={styles.container}>
      <GlassView style={styles.button} isInteractive />
      <GlassView style={styles.button} isInteractive />
    </GlassContainer>
  );
}
```

#### 3.1.3 Native Tab Bar Configuration

**Native Tabs with Expo Router:**

The app uses `expo-router/unstable-native-tabs` for a fully native iOS tab bar with liquid glass effect.

**Tab Bar Layout:**
- **Left side (grouped)**: Stats, Session, Reviews, Settings
- **Right side (floating)**: Search (dictionary) with system `role="search"`

```typescript
// app/(tabs)/_layout.tsx
import { 
  NativeTabs, 
  Icon, 
  Label 
} from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      blurEffect="systemMaterial"
      minimizeBehavior="onScrollDown"
    >
      {/* Left-grouped tabs */}
      <NativeTabs.Trigger name="stats">
        <Icon sf="chart.bar.fill" />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="session">
        <Icon sf="timer" />
        <Label>Session</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="review">
        <Icon sf="rectangle.stack.fill" />
        <Label>Reviews</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
      
      {/* Right-floating search button */}
      <NativeTabs.Trigger name="dictionary" role="search">
        {/* role="search" provides native search icon and styling */}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

**Native Tab Bar Features:**
- `blurEffect`: Liquid glass blur effect on tab bar background
- `minimizeBehavior`: Tab bar minimizes when scrolling (iOS 26+)
- `role="search"`: System-provided search tab with native icon
- SF Symbols: Native iOS icons via `sf` prop

#### 3.1.4 Component Mapping (Gluestack → SwiftUI)

| Gluestack Component | SwiftUI Equivalent        | Notes                           |
| ------------------- | ------------------------- | ------------------------------- |
| `Button`            | `Button` from @expo/ui    | Native iOS button styles        |
| `Input`             | `TextField`               | Native text field               |
| `Switch`            | `Switch`                  | Native toggle                   |
| `Progress`          | `LinearProgress`          | Native progress bar             |
| `Spinner`           | `CircularProgress`        | Indeterminate progress          |
| `Card`              | `GlassView`               | Glass effect cards              |
| `Badge`             | Custom with `GlassView`   | Badge with glass background     |
| `Toast`             | iOS system alerts         | Via native APIs                 |
| `Box`               | React Native `View`       | Keep for layout                 |
| `VStack`            | `VStack` from @expo/ui    | Or React Native View            |
| `HStack`            | `HStack` from @expo/ui    | Or React Native View            |
| `Text`              | `Text` from @expo/ui      | Native text rendering           |
| `Heading`           | `Text` with styles        | Use font weight/size            |
| `Pressable`         | Native button/gestures    | Use SwiftUI Button              |
| `Divider`           | React Native View         | Simple styled view              |

#### 3.1.5 Layout Strategy

**Keep from React Native/NativeWind:**
- `View` for basic layout containers
- `StyleSheet.create()` for complex layouts
- NativeWind/Tailwind for utility styling on layout components
- `FlatList` / `ScrollView` for lists (unless using SwiftUI `List`)

**Use from SwiftUI (@expo/ui):**
- All interactive components (buttons, inputs, switches, pickers)
- Progress indicators
- Native lists when swipe actions needed
- Bottom sheets and modals

**Use from expo-glass-effect:**
- Cards and surfaces that need glass effect
- Flashcard interface
- Stats cards
- Any surface that should blur content behind it

### 3.2 Data Structure

#### 3.2.1 Table `dictionary` (imported JMdict)

```sql
CREATE TABLE dictionary (
  id INTEGER PRIMARY KEY,
  kanji TEXT,              -- Kanji form (nullable)
  reading TEXT NOT NULL,   -- Hiragana/katakana reading
  reading_romaji TEXT,     -- Romaji reading (for search)
  definitions TEXT NOT NULL, -- JSON array of definitions
  part_of_speech TEXT,     -- JSON array of POS
  common INTEGER DEFAULT 0 -- 1 if common word
);

CREATE INDEX idx_kanji ON dictionary(kanji);
CREATE INDEX idx_reading ON dictionary(reading);
CREATE INDEX idx_romaji ON dictionary(reading_romaji);
```

#### 3.2.2 Table `deck_cards`

```sql
CREATE TABLE deck_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dictionary_id INTEGER NOT NULL UNIQUE,
  added_at TEXT NOT NULL,           -- ISO 8601
  due_date TEXT,                    -- ISO 8601 (null if burned)
  stage INTEGER DEFAULT 1,          -- SRS stage (1-9)
  current_incorrect_count INTEGER DEFAULT 0, -- Errors in current session
  FOREIGN KEY (dictionary_id) REFERENCES dictionary(id)
);

CREATE INDEX idx_due_date ON deck_cards(due_date);
CREATE INDEX idx_stage ON deck_cards(stage);
```

**SRS Constants:**

```typescript
const SRS_STAGES = {
  APPRENTICE_1: 1,
  APPRENTICE_2: 2,
  APPRENTICE_3: 3,
  APPRENTICE_4: 4,
  GURU_1: 5,
  GURU_2: 6,
  MASTER: 7,
  ENLIGHTENED: 8,
  BURNED: 9,
} as const;

// Intervals in seconds
const SRS_INTERVALS: Record<number, number | null> = {
  1: 4 * 60 * 60, // 4 hours
  2: 8 * 60 * 60, // 8 hours
  3: 24 * 60 * 60, // 1 day
  4: 2 * 24 * 60 * 60, // 2 days
  5: 7 * 24 * 60 * 60, // 1 week
  6: 14 * 24 * 60 * 60, // 2 weeks
  7: 30 * 24 * 60 * 60, // 1 month (~30 days)
  8: 120 * 24 * 60 * 60, // 4 months (~120 days)
  9: null, // Burned - no next review
};

// Group names for display
const SRS_GROUP_NAMES: Record<number, string> = {
  1: "Apprentice 1",
  2: "Apprentice 2",
  3: "Apprentice 3",
  4: "Apprentice 4",
  5: "Guru 1",
  6: "Guru 2",
  7: "Master",
  8: "Enlightened",
  9: "Burned",
};
```

**New Stage Calculation Function:**

```typescript
function calculateNewStage(
  currentStage: number,
  isCorrect: boolean,
  incorrectCount: number,
): number {
  if (isCorrect) {
    return Math.min(currentStage + 1, 9);
  }

  const incorrectAdjustmentCount = Math.ceil(incorrectCount / 2);
  const srsPenaltyFactor = currentStage >= 5 ? 2 : 1;
  const newStage = currentStage - incorrectAdjustmentCount * srsPenaltyFactor;

  return Math.max(1, newStage);
}
```

#### 3.2.3 Table `reading_sessions`

```sql
CREATE TABLE reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,  -- ISO 8601
  ended_at TEXT,             -- ISO 8601 (null if in progress)
  duration_seconds INTEGER   -- Total duration
);
```

#### 3.2.4 Table `review_history`

```sql
CREATE TABLE review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL,      -- ISO 8601
  stage_before INTEGER NOT NULL,  -- Stage before review
  stage_after INTEGER NOT NULL,   -- Stage after review
  is_correct INTEGER NOT NULL,    -- 1 = correct, 0 = incorrect
  incorrect_count INTEGER,        -- # errors on this card in session
  FOREIGN KEY (card_id) REFERENCES deck_cards(id)
);

CREATE INDEX idx_reviewed_at ON review_history(reviewed_at);
CREATE INDEX idx_card_id ON review_history(card_id);
```

#### 3.2.5 Table `daily_stats` (performance cache)

```sql
-- Daily stats cache to avoid recalculating each time
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,          -- Format YYYY-MM-DD
  reviews_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0
);
```

**Useful Statistical Queries:**

```typescript
// All-time total reviews
const totalReviews = db
  .prepare(
    `
  SELECT COUNT(*) as total FROM review_history
`,
  )
  .get();

// Overall success rate
const successRate = db
  .prepare(
    `
  SELECT 
    ROUND(100.0 * SUM(is_correct) / COUNT(*), 1) as rate
  FROM review_history
`,
  )
  .get();

// 7-day success rate
const successRate7Days = db
  .prepare(
    `
  SELECT 
    ROUND(100.0 * SUM(is_correct) / COUNT(*), 1) as rate
  FROM review_history
  WHERE reviewed_at >= datetime('now', '-7 days')
`,
  )
  .get();

// Distribution by group
const cardsByGroup = db
  .prepare(
    `
  SELECT 
    CASE 
      WHEN stage BETWEEN 1 AND 4 THEN 'Apprentice'
      WHEN stage BETWEEN 5 AND 6 THEN 'Guru'
      WHEN stage = 7 THEN 'Master'
      WHEN stage = 8 THEN 'Enlightened'
      WHEN stage = 9 THEN 'Burned'
    END as group_name,
    COUNT(*) as count
  FROM deck_cards
  GROUP BY group_name
`,
  )
  .all();

// Heatmap data for the year
const heatmapData = db
  .prepare(
    `
  SELECT 
    DATE(reviewed_at) as date,
    COUNT(*) as count
  FROM review_history
  WHERE reviewed_at >= datetime('now', 'start of year')
  GROUP BY DATE(reviewed_at)
`,
  )
  .all();

// Review forecast (next 30 days)
const forecastData = db
  .prepare(
    `
  SELECT 
    DATE(due_date) as date,
    COUNT(*) as count
  FROM deck_cards
  WHERE stage < 9 
    AND due_date BETWEEN datetime('now') AND datetime('now', '+30 days')
  GROUP BY DATE(due_date)
  ORDER BY date
`,
  )
  .all();

// Current streak
const currentStreak = db
  .prepare(
    `
  WITH RECURSIVE dates AS (
    SELECT DATE('now') as date
    UNION ALL
    SELECT DATE(date, '-1 day')
    FROM dates
    WHERE EXISTS (
      SELECT 1 FROM daily_stats 
      WHERE daily_stats.date = DATE(dates.date, '-1 day')
      AND reviews_count > 0
    )
  )
  SELECT COUNT(*) - 1 as streak FROM dates
`,
  )
  .get();
```

### 3.3 File Structure

```
/app
  /(tabs)
    /dictionary
      index.tsx          # Dictionary search screen (accessible via floating search button)
    /session
      _layout.tsx        # Session stack layout
      index.tsx          # Stopwatch screen
      history.tsx        # Session history
    /review
      _layout.tsx        # Review stack layout
      index.tsx          # Main SRS screen
      deck.tsx           # Deck card list
      session.tsx        # Active review session
      burned.tsx         # Burned cards list
    /stats
      index.tsx          # Main statistics screen
    /settings
      index.tsx          # Settings screen (theme, etc.)
    _layout.tsx          # Native tab bar configuration
  _layout.tsx            # Root layout with providers

/components
  /dictionary
    SearchBar.tsx        # SwiftUI TextField in Host
    DictionaryEntry.tsx  # GlassView card with entry details
    AddToDeckButton.tsx  # SwiftUI Button
  /session
    Stopwatch.tsx        # Timer display with GlassView
    SessionHistoryItem.tsx
  /review
    Flashcard.tsx        # GlassView interactive card
    ReviewButtons.tsx    # SwiftUI Buttons (Wrong / Correct)
    DeckStats.tsx        # Stats with GlassView cards
    StageIndicator.tsx   # SwiftUI Gauge or Progress
    CardListItem.tsx     # SwiftUI List item
    UnburnButton.tsx     # SwiftUI Button
  /stats
    Heatmap.tsx          # Annual review calendar
    ForecastChart.tsx    # Forecast histogram
    StageDistribution.tsx # Distribution with SwiftUI Gauge
    PerformanceCard.tsx  # GlassView success rate card
    StreakDisplay.tsx    # Streak with GlassView
  /ui
    # Keep only components without SwiftUI equivalent
    # Remove: button, input, switch, progress, spinner, badge, card
    # Keep: layout utilities if needed

/stores
  useDictionaryStore.ts
  useDeckStore.ts
  useSessionStore.ts
  useThemeStore.ts       # Dark/Light mode (system preference)
  useStatsStore.ts       # Statistics and history

/constants
  srs.ts                 # SRS stage constants and intervals
  theme.ts               # Color tokens and theme constants

/contexts
  DatabaseContext.tsx    # SQLite database provider

/database
  schema.ts              # Table definitions
  dictionary.ts          # Dictionary queries
  deck.ts                # SRS deck queries
  sessions.ts            # Reading session queries
  reviewHistory.ts       # Review history queries
  stats.ts               # Statistics queries

/hooks
  use-color-scheme.ts    # System color scheme hook
  use-theme-color.ts     # Theme color utilities

/utils
  srs.ts                 # WaniKani intervals + due_date calculation
  wanakana.ts            # Romaji ↔ kana conversion
  deinflect.ts           # Japanese verb deinflection

/assets
  jmdict.db              # Pre-compiled SQLite database
  images/                # App icons and images
```

---

## 4. User Flows

### 4.1 Search and Add Word

```
[Any Tab → Tap Search button (floating right)]
      ↓
[Dictionary screen opens]
      ↓
[Type in native SwiftUI search bar]
      ↓
[Real-time results display in GlassView cards]
      ↓
[Tap on entry → expand details]
      ↓
[Tap "Add to deck" (SwiftUI Button)]
      ↓
[Visual feedback: "Added ✓"]
[Button becomes "In deck"]
```

### 4.2 Reading Session

```
[Session Tab]
      ↓
[Tap "Start"]
      ↓
[Timer active - reading in progress]
[Can switch to Dictionary without stopping]
      ↓
[Return to Session → Tap "Stop"]
      ↓
[Session saved]
[Summary display]
```

### 4.3 SRS Review

```
[Review Tab]
      ↓
[Stats display: X cards due]
[Distribution: Apprentice / Guru / Master / Enlightened / Burned]
      ↓
[Tap "Start Review"]
      ↓
[Card displayed (front): Japanese word]
      ↓
[Tap to reveal]
      ↓
[Card flipped (back): reading + definition]
[Current stage displayed]
      ↓
[Choice: ❌ Wrong / ✅ Correct]
      ↓
[If Wrong: incorrectCount++ on this card]
[If Correct: calculate new stage with WaniKani formula]
      ↓
[Next card...]
      ↓
[End: session summary]
[Cards passed / failed / burned]
```

### 4.4 Unburn a Card

```
[Review Tab → Deck View]
      ↓
[Filter: "Burned"]
      ↓
[Burned cards list]
      ↓
[Tap on a card]
      ↓
["Unburn" button]
      ↓
[Card reset to Apprentice 1]
[due_date = now + 4h]
```

### 4.5 View Statistics

```
[Stats Tab (first tab on left)]
      ↓
[Overview in GlassView cards]
  - Total cards / Active / Burned
  - All-time total reviews
  - Current streak / Best streak
      ↓
[Scroll down (tab bar minimizes)]
      ↓
[Annual Heatmap]
  - Study days visualization
  - Tap on a day → detail (X reviews that day)
      ↓
[Distribution by Group]
  - SwiftUI Gauge components for each group
  - Apprentice / Guru / Master / Enlightened / Burned
      ↓
[Performance with SwiftUI Gauge]
  - Circular gauge showing success rate
  - Segmented picker: global / 7d / 30d
      ↓
[Forecasts]
  - 30-day histogram
  - Expected reviews per day
```

---

## 5. UI/UX Guidelines

### 5.1 Principles

- **Native iOS experience**: Use SwiftUI components for authentic iOS look and feel
- **Liquid Glass design**: Apply iOS 18's glass morphism effect throughout the app
- Minimalist design, clean UX
- **System appearance**: Follow iOS system dark/light mode automatically
- Typography optimized for Japanese (system font with proper Japanese rendering)
- Native iOS animations and transitions via SwiftUI

### 5.2 Navigation

**Native Tab Bar with 5 tabs:**

Left-grouped tabs:
1. 📊 **Stats** (SF Symbol: `chart.bar.fill`)
2. ⏱️ **Session** (SF Symbol: `timer`)
3. 🔄 **Reviews** (SF Symbol: `rectangle.stack.fill`)
4. ⚙️ **Settings** (SF Symbol: `gearshape.fill`)

Right-floating button:
5. 🔍 **Search** (system `role="search"` - native search styling)

**Tab Bar Features:**
- Liquid glass blur effect (`blurEffect="systemMaterial"`)
- Minimizes on scroll (`minimizeBehavior="onScrollDown"`)
- Native SF Symbols for icons
- Search tab styled as floating action button on right

### 5.3 Glass Effect Usage

**Where to apply `GlassView`:**

| Screen          | Component                | Glass Style    |
| --------------- | ------------------------ | -------------- |
| Dictionary      | Search results cards     | `regular`      |
| Dictionary      | Entry detail modal       | `regular`      |
| Review          | Flashcard                | `regular`      |
| Review          | Wrong/Correct buttons    | Interactive    |
| Stats           | Overview cards           | `regular`      |
| Stats           | Performance metrics      | `regular`      |
| Session         | Timer display            | `regular`      |
| Settings        | Settings sections        | `regular`      |

**Interactive Glass:**
Use `isInteractive` prop on buttons and tappable glass elements for touch feedback.

```tsx
<GlassContainer spacing={10}>
  <GlassView style={styles.button} isInteractive>
    <Text>Wrong</Text>
  </GlassView>
  <GlassView style={styles.button} isInteractive>
    <Text>Correct</Text>
  </GlassView>
</GlassContainer>
```

### 5.4 UI Components by Screen

**Dictionary:**

```tsx
import { Host, TextField, Button, Text } from '@expo/ui/swift-ui';
import { GlassView } from 'expo-glass-effect';
import { View, FlatList, StyleSheet } from 'react-native';

function DictionaryScreen() {
  return (
    <View style={styles.container}>
      {/* Native SwiftUI TextField */}
      <Host matchContents>
        <TextField 
          placeholder="Search Japanese..."
          value={query}
          onChangeText={setQuery}
        />
      </Host>
      
      {/* Results with glass effect */}
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <GlassView style={styles.card} glassEffectStyle="regular">
            <Text style={styles.kanji}>{item.kanji}</Text>
            <Text style={styles.reading}>{item.reading}</Text>
            <Text style={styles.definition}>{item.definition}</Text>
            <Host matchContents>
              <Button onPress={() => addToDeck(item)}>
                Add to deck
              </Button>
            </Host>
          </GlassView>
        )}
      />
    </View>
  );
}
```

**Review (Flashcard):**

```tsx
import { Host, Button, Text as SwiftUIText } from '@expo/ui/swift-ui';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function ReviewScreen() {
  return (
    <View style={styles.container}>
      {/* Flashcard with glass effect */}
      <Pressable onPress={revealCard}>
        <GlassView style={styles.flashcard} glassEffectStyle="regular">
          <Text style={styles.kanji}>{card.kanji}</Text>
          {revealed && (
            <>
              <Text style={styles.reading}>{card.reading}</Text>
              <Text style={styles.definition}>{card.definition}</Text>
            </>
          )}
        </GlassView>
      </Pressable>

      {/* Interactive glass buttons */}
      {revealed && (
        <GlassContainer spacing={16} style={styles.buttonContainer}>
          <GlassView style={styles.wrongButton} isInteractive>
            <Pressable onPress={markWrong} style={styles.buttonInner}>
              <Text style={styles.wrongText}>Wrong</Text>
            </Pressable>
          </GlassView>
          <GlassView style={styles.correctButton} isInteractive>
            <Pressable onPress={markCorrect} style={styles.buttonInner}>
              <Text style={styles.correctText}>Correct</Text>
            </Pressable>
          </GlassView>
        </GlassContainer>
      )}
    </View>
  );
}
```

**Stats Overview:**

```tsx
import { Host, Gauge } from '@expo/ui/swift-ui';
import { GlassView } from 'expo-glass-effect';
import { View, Text, StyleSheet, PlatformColor } from 'react-native';

function StatsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Overview cards with glass */}
      <View style={styles.cardRow}>
        <GlassView style={styles.statCard} glassEffectStyle="regular">
          <Text style={styles.statValue}>{totalCards}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </GlassView>
        <GlassView style={styles.statCard} glassEffectStyle="regular">
          <Text style={styles.statValue}>{activeCards}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </GlassView>
      </View>

      {/* Success rate with native Gauge */}
      <GlassView style={styles.performanceCard} glassEffectStyle="regular">
        <Host matchContents>
          <Gauge
            type="circularCapacity"
            current={{ value: successRate / 100 }}
            min={{ value: 0, label: '0%' }}
            max={{ value: 1, label: '100%' }}
            color={[
              PlatformColor('systemRed'),
              PlatformColor('systemOrange'),
              PlatformColor('systemGreen'),
            ]}
          />
        </Host>
        <Text style={styles.gaugeLabel}>Success Rate</Text>
      </GlassView>

      {/* Heatmap, forecast chart, etc. */}
    </ScrollView>
  );
}
```

### 5.5 Live Activity (Dynamic Island)

The reading session stopwatch uses iOS Live Activity with native SwiftUI rendering:

```swift
// Native SwiftUI Live Activity (in iOS target)
struct ReadingSessionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ReadingSessionAttributes.self) { context in
            // Lock screen view with glass effect
            HStack {
                Image(systemName: "book.fill")
                Text(context.state.elapsedTime)
                    .font(.system(.title, design: .monospaced))
            }
            .glassBackgroundEffect()
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.elapsedTime)
                        .font(.system(.largeTitle, design: .monospaced))
                }
            } compactLeading: {
                Image(systemName: "book.fill")
            } compactTrailing: {
                Text(context.state.elapsedTime)
                    .font(.system(.caption, design: .monospaced))
            } minimal: {
                Image(systemName: "book.fill")
            }
        }
    }
}
```

### 5.6 Color Tokens

Use iOS system colors for automatic dark/light mode support:

```typescript
import { PlatformColor } from 'react-native';

const colors = {
  // Backgrounds
  background: PlatformColor('systemBackground'),
  secondaryBackground: PlatformColor('secondarySystemBackground'),
  tertiaryBackground: PlatformColor('tertiarySystemBackground'),
  
  // Text
  label: PlatformColor('label'),
  secondaryLabel: PlatformColor('secondaryLabel'),
  tertiaryLabel: PlatformColor('tertiaryLabel'),
  
  // Semantic colors
  success: PlatformColor('systemGreen'),
  error: PlatformColor('systemRed'),
  warning: PlatformColor('systemOrange'),
  
  // SRS stages
  apprentice: PlatformColor('systemPink'),
  guru: PlatformColor('systemPurple'),
  master: PlatformColor('systemBlue'),
  enlightened: PlatformColor('systemCyan'),
  burned: PlatformColor('systemGray'),
};
```

---

## 6. Data and JMdict Import

### 6.1 Preparation Process

1. Download JMdict XML from official site
2. Parse and convert to SQLite via Node.js script
3. Generate romaji readings with wanakana
4. Optimize with appropriate indexes
5. Include .db file in app assets

### 6.2 Estimated Size

- Complete JMdict: ~200,000 entries
- Estimated SQLite size: 50-80 MB

---

## 7. Out of Scope (v1)

The following features are explicitly excluded from v1:

- Cloud sync / backup
- Multi-deck
- Anki import/export
- Character recognition (OCR)
- Example sentences
- Audio/pronunciation
- Verb conjugation
- Multi-language (definitions)
- iOS Widget
- Apple Watch

---

## 8. Success Metrics

For personal use, success criteria are:

- [ ] Dictionary search < 100ms
- [ ] Statistics loading < 200ms
- [ ] App used daily during reading sessions
- [ ] Zero crashes in normal use
- [ ] Works perfectly offline
- [ ] SRS cards correctly scheduled (WaniKani formula respected)
- [ ] Review history correctly recorded

---

## 9. Roadmap

### Phase 1: Core UI Infrastructure

- Setup native tab bar with `expo-router/unstable-native-tabs`
- Configure tab layout (Stats, Session, Reviews, Settings + floating Search)
- Setup `expo-glass-effect` for liquid glass components
- Configure `@expo/ui` SwiftUI components
- Create development build (required for native modules)

### Phase 2: Session Module (simplest feature)

- Stopwatch screen with GlassView timer display
- SwiftUI Button controls (Start/Pause/Stop)
- Session history with native List
- iOS Live Activity for Dynamic Island timer

### Phase 3: Dictionary Module (most used feature)

- SwiftUI TextField for search
- Dictionary search results with GlassView cards
- Entry detail view
- Add to deck functionality with SwiftUI Button

### Phase 4: Review/SRS Module (most complex)

- Flashcard interface with interactive GlassView
- Review buttons with GlassContainer
- Deck list with SwiftUI List (swipe to delete)
- Burned cards view with SwiftUI Picker filter
- Stage indicator with SwiftUI Gauge

### Phase 5: Statistics Module

- Overview cards with GlassView
- SwiftUI Gauge for success rate visualization
- Annual heatmap
- Forecast chart
- Streak display

### Phase 6: Settings & Polish

- Settings screen with SwiftUI components
- Theme follows system appearance automatically
- Performance optimization
- Testing and bug fixes

---

## 10. Name of the App

| Name            | Meaning               | Notes                     |
| --------------- | --------------------- | ------------------------- |
| **Yomu** (読む) | "To read" in Japanese | Simple, direct, memorable |
