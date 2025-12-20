import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PlatformColor,
  Linking,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Host, Picker, Button } from '@expo/ui/swift-ui';
import { useRouter, useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { useDatabase } from '@/contexts/DatabaseContext';
import { getDeckStats } from '@/database/deck';
import { useThemeStore } from '@/stores/useThemeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getCardImagesSize, getCardImagesCount } from '@/utils/imageStorage';
import Constants from 'expo-constants';

const NEW_CARDS_BATCH_OPTIONS = [5, 10, 15, 20, 25, 30];

type ThemeOption = { value: 'system' | 'light' | 'dark'; label: string };

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type StorageStats = {
  totalCards: number;
  imagesCount: number;
  imagesSize: number;
  userDataSize: number;
  dictionarySize: number;
};

export default function SettingsScreen() {
  const { db } = useDatabase();
  const router = useRouter();
  const { mode, setMode } = useThemeStore();
  const { newCardsPerBatch, loadSettings, setNewCardsPerBatch } = useSettingsStore();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Format bytes to human readable string
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  // Load storage statistics
  const loadStats = useCallback(async () => {
    if (!db) return;

    try {
      // Get card count
      const deckStats = await getDeckStats(db);
      
      // Get images info
      const [imagesSize, imagesCount] = await Promise.all([
        getCardImagesSize(),
        getCardImagesCount(),
      ]);

      // Get user database size (yomu.db)
      const userDbPath = `${FileSystem.documentDirectory}SQLite/yomu.db`;
      const userDbInfo = await FileSystem.getInfoAsync(userDbPath);
      const userDataSize = userDbInfo.exists && 'size' in userDbInfo 
        ? (userDbInfo as { size: number }).size 
        : 0;

      // Get dictionary database size (from assets)
      // The dictionary is bundled with the app, we can estimate its size
      // or check the actual file if it's been copied to documents
      const dictPath = `${FileSystem.documentDirectory}SQLite/jmdict.db`;
      const dictInfo = await FileSystem.getInfoAsync(dictPath);
      const dictionarySize = dictInfo.exists && 'size' in dictInfo 
        ? (dictInfo as { size: number }).size 
        : 0;

      setStorageStats({
        totalCards: deckStats.totalCards,
        imagesCount,
        imagesSize,
        userDataSize: userDataSize + imagesSize,
        dictionarySize,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [db]);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

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

  // Handle GitHub link
  const handleOpenGitHub = useCallback(() => {
    Linking.openURL('https://github.com/YannickHerrero/Yomu');
  }, []);

  // Handle navigate to advanced settings
  const handleOpenAdvanced = useCallback(() => {
    router.push('/settings/advanced');
  }, [router]);

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

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Your Data</Text>
            <Text style={styles.storageValue}>
              {storageStats ? formatBytes(storageStats.userDataSize) : '-'}
            </Text>
          </View>
          <Text style={styles.storageDetail}>
            {storageStats?.totalCards ?? 0} cards, {storageStats?.imagesCount ?? 0} images
          </Text>

          <View style={styles.divider} />

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Dictionary</Text>
            <Text style={styles.storageValue}>
              {storageStats ? formatBytes(storageStats.dictionarySize) : '-'}
            </Text>
          </View>
          <Text style={styles.storageDetail}>JMdict database (read-only)</Text>

          <View style={styles.divider} />

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Total</Text>
            <Text style={styles.storageValue}>
              {storageStats 
                ? formatBytes(storageStats.userDataSize + storageStats.dictionarySize) 
                : '-'}
            </Text>
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

      {/* Advanced Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <Pressable onPress={handleOpenAdvanced}>
          <GlassView style={styles.card} glassEffectStyle="regular">
            <View style={styles.linkRow}>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>Advanced Settings</Text>
                <Text style={styles.linkDescription}>
                  API keys, backup, reset data
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </GlassView>
        </Pressable>
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
  settingRow: {
    flexDirection: 'column',
    gap: 12,
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
  pickerWrapper: {
    width: '100%',
    marginTop: 4,
  },
  pickerHost: {
    minHeight: 32,
    width: '100%',
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 17,
    color: PlatformColor('label'),
  },
  storageValue: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
  storageDetail: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 12,
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
  chevron: {
    fontSize: 24,
    color: PlatformColor('tertiaryLabel'),
    fontWeight: '300',
  },
});
