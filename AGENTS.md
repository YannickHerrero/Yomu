# AGENTS.md — Development Guidelines for Yomu

## Platform Support

- **iOS only**: This app is iOS-only. Do not add support for Android or Web.
- **Manual testing**: Do not run the app yourself. The developer will handle all manual testing.

## Build, Lint, and Test Commands

- **Start dev server**: `npm start` (Expo)
- **Lint**: `expo lint`
- **iOS simulator**: `npm run ios`
- No test suite currently configured; add Jest/testing-library when needed

## Code Style Guidelines

### Imports & Module Aliases
- Use `@/*` alias for all local imports (e.g., `@/components/themed-text`, `@/hooks/use-color-scheme`)
- Group imports: React/external first, then local imports
- Order: React Native → expo → gluestack → local modules

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

### Styling Approach
- Use **NativeWind (Tailwind CSS)** for styling; combine with `StyleSheet.create()` for complex layouts
- Follow Gluestack UI component patterns for consistency (Box, VStack, HStack, Button, Text, etc.)
- Color tokens via Gluestack (`$backgroundDark900`, `$textLight0`)
- Dark mode: Use theme provider wrapping (defined in `app/_layout.tsx`)

### Error Handling & Async
- Try-catch blocks for async operations; log errors but avoid silent failures
- No unhandled promise rejections; always handle `.catch()` or use try-catch
- For database queries: Wrap in try-catch and validate results exist

### File Structure
- Screens in `/app` with Expo Router folder-based routing
- Reusable components in `/components` (UI in `/components/ui`, domain-specific in subdirectories)
- Stores/state in `/stores` using Zustand
- Database queries in `/database` (organized by domain: `dictionary.ts`, `deck.ts`, etc.)
- Utilities in `/utils` (e.g., `srs.ts` for SRS calculations)
- Hooks in `/hooks` (always prefix with `use-`)

### Architecture Notes
- **State management**: Zustand stores (one per feature domain)
- **Database**: SQLite with `expo-sqlite`; all queries in `/database` module
- **Async storage**: For preferences only (use SQLite for data)
- **Component composition**: Keep page components thin; extract business logic to custom hooks and stores

## Additional Notes
- See `PRD.md` for complete feature specifications and technical architecture
- Gluestack UI config in `/components/ui/gluestack-ui-provider` (mode: dark)
- Japanese text rendering: Noto Sans JP or system font (in Gluestack tokens)
- Path aliases configured in `tsconfig.json` and `babel.config.js`
