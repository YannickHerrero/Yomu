# AGENTS.md — Development Guidelines for Yomu

## Platform Support

- **iOS only**: This app is iOS-only (iPhone 16 Pro with latest iOS). Do not add support for Android or Web.
- **iOS 18+ required**: The app uses iOS 18+ features (Liquid Glass, native tabs). No backward compatibility needed.
- **Development build required**: The app uses native modules (`@expo/ui`, `expo-glass-effect`) that are NOT available in Expo Go. Always use a development build.
- **Manual testing**: Do not run the app yourself. The developer will handle all manual testing.

## Build, Lint, and Test Commands

- **Start dev server**: `npm start` (Expo)
- **Lint**: `expo lint`
- **iOS simulator**: `npm run ios` (requires development build)
- **Create development build**: `npx expo run:ios` or `eas build --profile development --platform ios`
- No test suite currently configured; add Jest/testing-library when needed

## Code Style Guidelines

### Imports & Module Aliases
- Use `@/*` alias for all local imports (e.g., `@/components/themed-text`, `@/hooks/use-color-scheme`)
- Group imports: React/external first, then local imports
- Order: React Native → expo → @expo/ui → expo-glass-effect → local modules

### Formatting & TypeScript
- **Strict TypeScript**: All code must pass `strict: true` compiler mode
- **Line length**: 100 characters (Prettier default)
- **Tabs**: 2 spaces
- **Component functions**: Use `export default function ComponentName() {}` for page components, `export function ComponentName()` for shared components
- Type Props explicitly: `type ComponentProps = { ... }` above component definition

### Naming Conventions
- **Components**: PascalCase (`ThemedText.tsx`, `HelloWave.tsx`)
- **Utilities/hooks**: kebab-case filenames, camelCase exports (`use-color-scheme.ts` exports `useColorScheme`)
- **Screens**: kebab-case filenames matching route structure (`explore.tsx`, `_layout.tsx`)
- **Constants**: UPPER_SNAKE_CASE for final values (`SRS_STAGES`, `SRS_INTERVALS`)
- **Private functions**: Prefix with underscore or keep in function scope

## UI Architecture: Expo UI (SwiftUI) + Glass Effects

### Core Principle
**Use native SwiftUI components for all interactive elements.** This app prioritizes native iOS experience over cross-platform compatibility.

### SwiftUI Components (`@expo/ui/swift-ui`)

**Always wrap SwiftUI components in a `Host`:**

```typescript
import { Host, Button, TextField, Switch } from '@expo/ui/swift-ui';

// Correct: SwiftUI component wrapped in Host
function MyButton() {
  return (
    <Host matchContents>
      <Button onPress={handlePress}>Click me</Button>
    </Host>
  );
}

// Correct: Multiple SwiftUI components in one Host
function MyForm() {
  return (
    <Host style={{ flex: 1 }}>
      <TextField placeholder="Search..." onChangeText={setQuery} />
      <Switch checked={enabled} onValueChange={setEnabled} />
    </Host>
  );
}
```

**Available SwiftUI Components:**
- `Button` - Native iOS buttons
- `TextField` - Native text input
- `Switch` - Toggle (checkbox variant available)
- `Picker` - Segmented or wheel picker
- `Slider` - Value slider
- `List` - Native list with swipe actions
- `BottomSheet` - Modal bottom sheet
- `CircularProgress` / `LinearProgress` - Progress indicators
- `Gauge` - Circular gauge visualization
- `ContextMenu` - Long-press context menu
- `DateTimePicker` - Date/time selection
- `Text` - Native text rendering

### Glass Effect Components (`expo-glass-effect`)

**Use `GlassView` for cards and surfaces:**

```typescript
import { GlassView, GlassContainer } from 'expo-glass-effect';

// Basic glass card
<GlassView style={styles.card} glassEffectStyle="regular">
  <Text>Content here</Text>
</GlassView>

// Interactive glass (for buttons)
<GlassView style={styles.button} isInteractive>
  <Pressable onPress={handlePress}>
    <Text>Tap me</Text>
  </Pressable>
</GlassView>

// Multiple glass views that merge together
<GlassContainer spacing={10}>
  <GlassView style={styles.item} isInteractive />
  <GlassView style={styles.item} isInteractive />
</GlassContainer>
```

**Glass Effect Styles:**
- `"regular"` - Standard blur effect
- `"clear"` - Lighter blur effect

**Note:** `isInteractive` prop can only be set on mount, not changed dynamically. Use `key` prop to remount if needed.

### Component Selection Guide

| Need                     | Use This                          |
| ------------------------ | --------------------------------- |
| Button                   | `Button` from `@expo/ui/swift-ui` |
| Text input               | `TextField` from `@expo/ui/swift-ui` |
| Toggle/Switch            | `Switch` from `@expo/ui/swift-ui` |
| Segmented control        | `Picker` with `variant="segmented"` |
| Progress bar             | `LinearProgress` or `CircularProgress` |
| Cards/surfaces           | `GlassView` from `expo-glass-effect` |
| Interactive buttons      | `GlassView` with `isInteractive` |
| Basic layout             | React Native `View` with NativeWind |
| Lists (simple)           | React Native `FlatList` |
| Lists (swipe actions)    | `List` from `@expo/ui/swift-ui` |
| Modal/sheet              | `BottomSheet` from `@expo/ui/swift-ui` |

### Styling Approach
- **Layout**: Use NativeWind (Tailwind CSS) or `StyleSheet.create()` for layout containers
- **Colors**: Use iOS system colors via `PlatformColor()` for automatic dark/light mode
  - **IMPORTANT**: Only use black and white colors (label-based colors). Do not use colored system colors like `systemBlue`, `systemRed`, etc.
  - Allowed colors: `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`, `systemBackground`, `secondarySystemBackground`, `tertiarySystemBackground`, `quaternarySystemFill`, `separator`
  - All UI elements should be black/white/gray only
- **Interactive elements**: Use SwiftUI components (they handle their own styling)
- **Glass surfaces**: Use `expo-glass-effect` components
- **Icons**: Use SF Symbols for icons. Never use emoji in UI components.

```typescript
import { PlatformColor, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: PlatformColor('label'),
  },
  secondaryLabel: {
    color: PlatformColor('secondaryLabel'),
  },
});
```

### Native Tab Bar Configuration

The app uses `expo-router/unstable-native-tabs` for native iOS tab bar:

```typescript
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      blurEffect="systemMaterial"  // Glass effect
      minimizeBehavior="onScrollDown"  // Minimize on scroll
    >
      <NativeTabs.Trigger name="stats">
        <Icon sf="chart.bar.fill" />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
      
      {/* Search tab with system role */}
      <NativeTabs.Trigger name="dictionary" role="search" />
    </NativeTabs>
  );
}
```

## Error Handling & Async
- Try-catch blocks for async operations; log errors but avoid silent failures
- No unhandled promise rejections; always handle `.catch()` or use try-catch
- For database queries: Wrap in try-catch and validate results exist

## File Structure
- Screens in `/app` with Expo Router folder-based routing
- Reusable components in `/components` (domain-specific in subdirectories)
- Stores/state in `/stores` using Zustand
- Database queries in `/database` (organized by domain: `dictionary.ts`, `deck.ts`, etc.)
- Utilities in `/utils` (e.g., `srs.ts` for SRS calculations)
- Hooks in `/hooks` (always prefix with `use-`)

## Architecture Notes
- **State management**: Zustand stores (one per feature domain)
- **Database**: SQLite with `expo-sqlite`; all queries in `/database` module
- **Async storage**: For preferences only (use SQLite for data)
- **Component composition**: Keep page components thin; extract business logic to custom hooks and stores
- **UI Components**: Native SwiftUI via `@expo/ui`, glass effects via `expo-glass-effect`

## Additional Notes
- See `PRD.md` for complete feature specifications and technical architecture
- Japanese text rendering: System font with proper Japanese locale support
- Path aliases configured in `tsconfig.json` and `babel.config.js`
- Theme follows iOS system appearance automatically (no manual toggle needed)
