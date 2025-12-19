import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PlatformColor,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Host, Picker, Button } from '@expo/ui/swift-ui';
import { useDatabase } from '@/contexts/DatabaseContext';
import { getDeckStats, addMockCards } from '@/database/deck';
import { getTotalReviews, getStudyDays } from '@/database/stats';
import { addMockReviewHistory } from '@/database/reviewHistory';
import { useThemeStore } from '@/stores/useThemeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { validateApiKey } from '@/utils/deepl';
import Constants from 'expo-constants';

const NEW_CARDS_BATCH_OPTIONS = [5, 10, 15, 20, 25, 30];

type ThemeOption = { value: 'system' | 'light' | 'dark'; label: string };

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type DataStats = {
  totalCards: number;
  activeCards: number;
  burnedCards: number;
  totalReviews: number;
  studyDays: number;
};

export default function SettingsScreen() {
  const { db } = useDatabase();
  const { mode, setMode } = useThemeStore();
  const { deeplApiKey, newCardsPerBatch, loadSettings, saveApiKey, clearApiKey, setNewCardsPerBatch } = useSettingsStore();
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isAddingMock, setIsAddingMock] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Mask API key for display (e.g., "26ca******6:fx")
  const getMaskedApiKey = useCallback((key: string) => {
    if (key.length <= 8) return '****';
    const start = key.slice(0, 4);
    const end = key.slice(-4);
    return `${start}******${end}`;
  }, []);

  // Handle set/change API key via prompt
  const handleSetApiKey = useCallback(() => {
    Alert.prompt(
      'DeepL API Key',
      'Enter your DeepL API key. Get a free key at deepl.com',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const trimmedKey = value?.trim();
            if (!trimmedKey) return;

            try {
              const isValid = await validateApiKey(trimmedKey);
              if (isValid) {
                await saveApiKey(trimmedKey);
                Alert.alert('Success', 'API key saved successfully.');
              } else {
                Alert.alert('Invalid API Key', 'The DeepL API key could not be validated. Please check and try again.');
              }
            } catch {
              Alert.alert('Error', 'Failed to validate API key. Please check your connection.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  }, [saveApiKey]);

  // Handle remove API key
  const handleRemoveApiKey = useCallback(() => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your DeepL API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearApiKey();
          },
        },
      ]
    );
  }, [clearApiKey]);

  // Load data statistics
  const loadStats = useCallback(async () => {
    if (!db) return;

    try {
      const [deckStats, totalReviews, studyDays] = await Promise.all([
        getDeckStats(db),
        getTotalReviews(db),
        getStudyDays(db),
      ]);

      setDataStats({
        totalCards: deckStats.totalCards,
        activeCards: deckStats.activeCards,
        burnedCards: deckStats.burnedCards,
        totalReviews,
        studyDays,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [db]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle theme change
  const handleThemeChange = useCallback(
    (event: { nativeEvent: { index: number; label: string } }) => {
      const selectedOption = THEME_OPTIONS[event.nativeEvent.index];
      if (selectedOption) {
        setMode(selectedOption.value);
      }
    },
    [setMode]
  );

  // Handle new cards per batch change
  const handleNewCardsPerBatchChange = useCallback(
    (event: { nativeEvent: { index: number; label: string } }) => {
      const selectedValue = NEW_CARDS_BATCH_OPTIONS[event.nativeEvent.index];
      if (selectedValue !== undefined) {
        setNewCardsPerBatch(selectedValue);
      }
    },
    [setNewCardsPerBatch]
  );

  // Handle reset learning progress
  const handleResetProgress = useCallback(() => {
    Alert.alert(
      'Reset Learning Progress',
      'This will delete all your cards, review history, and reading sessions. The dictionary will not be affected. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (!db) return;

            setIsResetting(true);
            try {
              await db.execAsync(`
                DELETE FROM review_history;
                DELETE FROM deck_cards;
                DELETE FROM reading_sessions;
                DELETE FROM daily_stats;
              `);
              await loadStats();
              Alert.alert('Success', 'Learning progress has been reset.');
            } catch (err) {
              console.error('Failed to reset progress:', err);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  }, [db, loadStats]);

  // Handle GitHub link
  const handleOpenGitHub = useCallback(() => {
    Linking.openURL('https://github.com/YannickHerrero/Yomu');
  }, []);

  // Handle add mock data
  const handleAddMockData = useCallback(() => {
    Alert.alert(
      'Add Mock Data',
      'This will clear your current deck and add 18 test cards with 90 days of review history (streaks, heatmap data, etc.).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Data',
          style: 'destructive',
          onPress: async () => {
            if (!db) return;

            setIsAddingMock(true);
            try {
              // First add mock cards
              const cardCount = await addMockCards(db);
              
              // Then generate review history
              const reviewCount = await addMockReviewHistory(db);
              
              await loadStats();
              Alert.alert(
                'Success',
                `Added ${cardCount} test cards and ${reviewCount} review records across 90 days.`,
                [{ text: 'OK' }]
              );
            } catch (err) {
              console.error('Failed to add mock data:', err);
              Alert.alert('Error', 'Failed to add mock data. Please try again.');
            } finally {
              setIsAddingMock(false);
            }
          },
        },
      ]
    );
  }, [db, loadStats]);

  const selectedThemeIndex = THEME_OPTIONS.findIndex((opt) => opt.value === mode);
  const selectedBatchIndex = NEW_CARDS_BATCH_OPTIONS.indexOf(newCardsPerBatch);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingDescription}>
              Choose your preferred color scheme
            </Text>
            <View style={styles.pickerWrapper}>
              <Host style={styles.pickerHost}>
                <Picker
                  options={THEME_OPTIONS.map(opt => opt.label)}
                  selectedIndex={selectedThemeIndex >= 0 ? selectedThemeIndex : 0}
                  onOptionSelected={handleThemeChange}
                  variant="segmented"
                />
              </Host>
            </View>
          </View>
        </GlassView>
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>New Cards Per Batch</Text>
            <Text style={styles.settingDescription}>
              Number of new cards to learn in each session
            </Text>
            <View style={styles.pickerWrapper}>
              <Host style={styles.pickerHost}>
                <Picker
                  options={NEW_CARDS_BATCH_OPTIONS.map(n => n.toString())}
                  selectedIndex={selectedBatchIndex >= 0 ? selectedBatchIndex : 1}
                  onOptionSelected={handleNewCardsPerBatchChange}
                  variant="segmented"
                />
              </Host>
            </View>
          </View>
        </GlassView>
      </View>

      {/* API Keys Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Keys</Text>
        <Pressable onPress={handleSetApiKey} onLongPress={deeplApiKey ? handleRemoveApiKey : undefined}>
          <GlassView style={styles.card} glassEffectStyle="regular">
            <View style={styles.apiKeyRow}>
              <View style={styles.apiKeyInfo}>
                <Text style={styles.settingLabel}>DeepL API Key</Text>
                {deeplApiKey ? (
                  <Text style={styles.apiKeyMasked}>{getMaskedApiKey(deeplApiKey)}</Text>
                ) : (
                  <Text style={styles.settingDescription}>
                    Used for translating example sentences
                  </Text>
                )}
              </View>
            </View>
          </GlassView>
        </Pressable>
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {dataStats?.totalCards ?? '-'}
              </Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {dataStats?.activeCards ?? '-'}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {dataStats?.burnedCards ?? '-'}
              </Text>
              <Text style={styles.statLabel}>Burned</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {dataStats?.totalReviews ?? '-'}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {dataStats?.studyDays ?? '-'}
              </Text>
              <Text style={styles.statLabel}>Study Days</Text>
            </View>
          </View>
        </GlassView>

      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{appVersion}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Dictionary</Text>
            <Text style={styles.aboutValue}>JMdict</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>SRS Algorithm</Text>
            <Text style={styles.aboutValue}>WaniKani-style</Text>
          </View>
        </GlassView>

        {/* GitHub Link */}
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Source Code</Text>
              <Text style={styles.linkDescription}>
                View on GitHub
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Host matchContents>
                <Button onPress={handleOpenGitHub} variant="bordered">
                  Open
                </Button>
              </Host>
            </View>
          </View>
        </GlassView>
      </View>

      {/* Credits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credits</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <Text style={styles.creditsText}>
            Yomu is a Japanese reading assistant app built with Expo and React
            Native. Dictionary data provided by JMdict/EDICT project.
          </Text>
          <Text style={styles.creditsAuthor}>Made with ❤️ by Yannick</Text>
        </GlassView>
      </View>

      {/* Development Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Add Mock Data</Text>
              <Text style={styles.linkDescription}>
                Add test cards + 90 days of review history
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Host matchContents>
                <Button
                  onPress={handleAddMockData}
                  variant="bordered"
                  disabled={isAddingMock}
                >
                  {isAddingMock ? 'Adding...' : 'Add Cards'}
                </Button>
              </Host>
            </View>
          </View>
        </GlassView>
      </View>

      {/* Danger Zone Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <GlassView style={styles.dangerCard} glassEffectStyle="regular">
          <View style={styles.dangerSection}>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerTitle}>Reset Learning Progress</Text>
              <Text style={styles.dangerDescription}>
                Remove all cards, reviews, and sessions
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Host matchContents>
                <Button
                  onPress={handleResetProgress}
                  role="destructive"
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Reset'}
                </Button>
              </Host>
            </View>
          </View>
        </GlassView>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dangerCard: {
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'column',
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  pickerContainer: {
    alignSelf: 'stretch',
  },
  pickerWrapper: {
    width: '100%',
    marginTop: 4,
  },
  pickerHost: {
    minHeight: 32,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 80,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 13,
    color: PlatformColor('secondaryLabel'),
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 12,
  },
  dangerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flex: 1,
    marginRight: 16,
  },
  dangerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('systemRed'),
    marginBottom: 2,
  },
  dangerDescription: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  buttonContainer: {
    minWidth: 80,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: 17,
    color: PlatformColor('label'),
  },
  aboutValue: {
    fontSize: 17,
    color: PlatformColor('secondaryLabel'),
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkInfo: {
    flex: 1,
    marginRight: 16,
  },
  linkTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  creditsText: {
    fontSize: 15,
    color: PlatformColor('secondaryLabel'),
    lineHeight: 22,
    marginBottom: 12,
  },
  creditsAuthor: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 32,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apiKeyInfo: {
    flex: 1,
    marginRight: 16,
  },
  apiKeyMasked: {
    fontSize: 14,
    fontFamily: 'Menlo',
    color: PlatformColor('secondaryLabel'),
    marginTop: 2,
  },
  
});
