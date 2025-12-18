# PRD — Japanese Reading Assistant App

**Version:** 1.0  
**Date:** December 17, 2024  
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

### 1.4 Guiding Principles

- **Offline-first**: Full functionality without internet connection
- **Maximum responsiveness**: Response time < 100ms for searches
- **Minimalism**: No superfluous features, clean UX
- **Local data**: No cloud dependency, 100% on-device data

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

| Component          | Technology                                |
| ------------------ | ----------------------------------------- |
| Framework          | React Native + Expo (SDK 52+)             |
| Language           | TypeScript                                |
| UI Library         | Gluestack UI v2 + NativeWind              |
| State management   | Zustand                                   |
| Local database     | SQLite (expo-sqlite)                      |
| Navigation         | Expo Router                               |
| Persistent storage | AsyncStorage (preferences), SQLite (data) |

#### 3.1.1 Gluestack UI

**Why Gluestack:**

- Styling via NativeWind (Tailwind CSS for React Native)
- Pre-built and accessible components
- Native Dark/Light mode
- Optimized performance (~76ms render time)
- Copy-paste philosophy inspired by shadcn/ui

**Installation:**

```bash
npx expo install @gluestack-ui/themed @gluestack-style/react react-native-svg
```

**Components Used:**

| Component                 | Usage                                 |
| ------------------------- | ------------------------------------- |
| `Input`                   | Dictionary search bar                 |
| `Button`                  | Actions (Start, Stop, Correct, Wrong) |
| `Card`                    | Dictionary entries, flashcards        |
| `Text`, `Heading`         | Typography                            |
| `Box`, `VStack`, `HStack` | Layout                                |
| `Pressable`               | Clickable areas                       |
| `Badge`                   | SRS stage indicators                  |
| `Progress`                | Stats progress bars                   |
| `Switch`                  | Dark/light mode toggle                |
| `Divider`                 | Separators                            |
| `Spinner`                 | Loading states                        |
| `Toast`                   | Feedback ("Added to deck")            |

**Provider Structure:**

```typescript
// app/_layout.tsx
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@/config/gluestack.config';

export default function RootLayout() {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      <Stack />
    </GluestackUIProvider>
  );
}
```

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
      index.tsx          # Dictionary search screen
    /session
      index.tsx          # Stopwatch screen
      history.tsx        # Session history
    /review
      index.tsx          # Main SRS screen
      deck.tsx           # Deck card list
      burned.tsx         # Burned cards list
    /stats
      index.tsx          # Main statistics screen
  _layout.tsx            # Tab navigation
  settings.tsx           # Settings (theme, etc.)

/components
  /dictionary
    SearchBar.tsx
    DictionaryEntry.tsx
    AddToDeckButton.tsx
  /session
    Stopwatch.tsx
    SessionHistoryItem.tsx
  /review
    Flashcard.tsx
    ReviewButtons.tsx      # Wrong / Correct
    DeckStats.tsx
    StageIndicator.tsx     # Current stage display
    CardListItem.tsx       # Item in deck list
    UnburnButton.tsx       # Unburn button
  /stats
    Heatmap.tsx            # Annual review calendar
    ForecastChart.tsx      # Forecast histogram
    StageDistribution.tsx  # Distribution by group
    PerformanceCard.tsx    # Success rate
    StreakDisplay.tsx      # Streak display

/stores
  useDictionaryStore.ts
  useDeckStore.ts
  useSessionStore.ts
  useThemeStore.ts         # Dark/Light mode
  useStatsStore.ts         # Statistics and history

/config
  gluestack.config.ts      # Gluestack UI configuration + theme

/database
  schema.ts              # Table definitions
  dictionary.ts          # Dictionary queries
  deck.ts                # SRS deck queries
  sessions.ts            # Reading session queries
  reviewHistory.ts       # Review history queries
  stats.ts               # Statistics queries

/utils
  srs.ts                 # WaniKani intervals + due_date calculation
  wanakana.ts            # Romaji ↔ kana conversion

/assets
  jmdict.db              # Pre-compiled SQLite database
```

---

## 4. User Flows

### 4.1 Search and Add Word

```
[Dictionary Tab]
      ↓
[Type in search bar]
      ↓
[Real-time results display]
      ↓
[Tap on entry → expand details]
      ↓
[Tap "Add to deck"]
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
[Stats Tab]
      ↓
[Overview]
  - Total cards / Active / Burned
  - All-time total reviews
  - Current streak / Best streak
      ↓
[Scroll down]
      ↓
[Annual Heatmap]
  - Study days visualization
  - Tap on a day → detail (X reviews that day)
      ↓
[Distribution by Group]
  - Horizontal bars: Apprentice / Guru / Master / Enlightened / Burned
      ↓
[Performance]
  - Success rate: global / 7d / 30d
      ↓
[Forecasts]
  - 30-day histogram
  - Expected reviews per day
```

---

## 5. UI/UX Guidelines

### 5.1 Principles

- Minimalist design, inspired by Japanese apps
- **Dark mode and Light mode** support (manual switch + system preference)
- Typography optimized for Japanese (Noto Sans JP or system)
- Subtle animations via Gluestack/NativeWind
- Gluestack UI components for consistency and accessibility

### 5.2 Navigation

Tab bar with 4 tabs:

1. 📖 **Dictionary**
2. ⏱️ **Session**
3. 🔄 **Review**
4. 📊 **Stats**

### 5.3 UI Components by Screen

**Dictionary:**

```tsx
<Box flex={1} bg="$background">
  <Input placeholder="Search..." />
  <FlatList
    data={results}
    renderItem={({ item }) => (
      <Card>
        <Heading>{item.kanji}</Heading>
        <Text>{item.reading}</Text>
        <Text size="sm">{item.definition}</Text>
        <Button onPress={addToDeck}>
          <ButtonText>Add to deck</ButtonText>
        </Button>
      </Card>
    )}
  />
</Box>
```

**Review (Flashcard):**

```tsx
<Box flex={1} justifyContent="center" alignItems="center">
  <Card w="$80" h="$64">
    <VStack space="md" alignItems="center">
      <Heading size="3xl">{card.kanji}</Heading>
      {revealed && (
        <>
          <Text size="xl">{card.reading}</Text>
          <Text>{card.definition}</Text>
        </>
      )}
    </VStack>
  </Card>

  {revealed && (
    <HStack space="lg" mt="$8">
      <Button action="negative" onPress={markWrong}>
        <ButtonText>Wrong</ButtonText>
      </Button>
      <Button action="positive" onPress={markCorrect}>
        <ButtonText>Correct</ButtonText>
      </Button>
    </HStack>
  )}
</Box>
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

### Phase 1: Foundations (Week 1-2)

- Setup Expo project + TypeScript + Zustand
- JMdict SQLite import and integration
- Functional dictionary screen

### Phase 2: SRS (Week 3-4)

- Exact WaniKani algorithm implementation
- deck_cards and review_history tables
- Review and deck screens
- Add cards from dictionary
- Unburn functionality

### Phase 3: Sessions (Week 5)

- Stopwatch with persistence
- Session history

### Phase 4: Statistics (Week 6)

- daily_stats table and cache
- Annual heatmap
- Distribution by group
- Success rate
- Review forecasts

### Phase 5: Polish (Week 7-8)

- Dark/Light mode
- UI/UX refinement
- Performance optimization
- Testing and bug fixes

---

## 10. Name of the App

| Name            | Meaning               | Notes                     |
| --------------- | --------------------- | ------------------------- |
| **Yomu** (読む) | "To read" in Japanese | Simple, direct, memorable |
