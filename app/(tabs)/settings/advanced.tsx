import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PlatformColor,
  Alert,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Host, Button, Switch } from '@expo/ui/swift-ui';
import { useDatabase } from '@/contexts/DatabaseContext';
import { addMockCards } from '@/database/deck';
import { addMockReviewHistory } from '@/database/reviewHistory';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { validateApiKey } from '@/utils/deepl';
import {
  exportBackup,
  shareBackup,
  pickBackupFile,
  validateBackup,
  importBackup,
  cleanupOldBackups,
} from '@/utils/backup';
import { deleteAllCardImages } from '@/utils/imageStorage';
import Constants from 'expo-constants';

export default function AdvancedSettingsScreen() {
  const { db } = useDatabase();
  const { deeplApiKey, loadSettings, saveApiKey, clearApiKey } = useSettingsStore();
  const [isResetting, setIsResetting] = useState(false);
  const [isAddingMock, setIsAddingMock] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [includeApiKeyInExport, setIncludeApiKeyInExport] = useState(false);

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
              // Delete all card images first
              await deleteAllCardImages();
              
              // Then clear database tables
              await db.execAsync(`
                DELETE FROM review_history;
                DELETE FROM deck_cards;
                DELETE FROM reading_sessions;
                DELETE FROM daily_stats;
              `);
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
  }, [db]);

  // Handle export backup
  const handleExportBackup = useCallback(async () => {
    if (!db) return;

    setIsExporting(true);
    try {
      const zipPath = await exportBackup(db, appVersion, includeApiKeyInExport);
      await shareBackup(zipPath);
      await cleanupOldBackups();
    } catch (err) {
      console.error('Failed to export backup:', err);
      Alert.alert('Export Failed', 'Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [db, appVersion, includeApiKeyInExport]);

  // Handle import backup
  const handleImportBackup = useCallback(() => {
    Alert.alert(
      'Import Backup',
      'This will replace all your current data with the backup data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File',
          onPress: async () => {
            if (!db) return;

            try {
              const zipPath = await pickBackupFile();
              if (!zipPath) return;

              setIsImporting(true);

              // Validate backup first
              const validation = await validateBackup(zipPath);
              if (!validation.isValid) {
                Alert.alert('Invalid Backup', validation.error || 'The backup file is invalid.');
                setIsImporting(false);
                return;
              }

              // Show confirmation with backup info
              const data = validation.data!;
              const hasApiKey = !!data.settings.deepl_api_key;

              Alert.alert(
                'Confirm Import',
                `This backup contains:\n` +
                  `- ${data.data.deck_cards.length} cards\n` +
                  `- ${data.data.review_history.length} reviews\n` +
                  `- ${data.data.reading_sessions.length} sessions\n` +
                  `- ${data.image_files.length} images\n` +
                  (hasApiKey ? `- DeepL API key\n` : '') +
                  `\nCreated: ${new Date(data.exported_at).toLocaleDateString()}`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setIsImporting(false),
                  },
                  {
                    text: 'Import',
                    style: 'destructive',
                    onPress: async () => {
                      const result = await importBackup(db, zipPath, hasApiKey);
                      setIsImporting(false);

                      if (result.success) {
                        await loadSettings();
                        Alert.alert(
                          'Import Successful',
                          `Imported ${result.stats?.cards} cards, ${result.stats?.reviews} reviews, and ${result.stats?.sessions} sessions.`
                        );
                      } else {
                        Alert.alert('Import Failed', result.error || 'Failed to import backup.');
                      }
                    },
                  },
                ]
              );
            } catch (err) {
              console.error('Failed to import backup:', err);
              Alert.alert('Import Failed', 'Failed to import backup. Please try again.');
              setIsImporting(false);
            }
          },
        },
      ]
    );
  }, [db, loadSettings]);

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
  }, [db]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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

        {/* Export Backup */}
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Export Backup</Text>
              <Text style={styles.linkDescription}>
                Save all data to a file
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Host matchContents>
                <Button
                  onPress={handleExportBackup}
                  variant="bordered"
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </Host>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include API Key</Text>
            <Host matchContents>
              <Switch
                value={includeApiKeyInExport}
                onValueChange={setIncludeApiKeyInExport}
              />
            </Host>
          </View>
        </GlassView>

        {/* Import Backup */}
        <GlassView style={styles.card} glassEffectStyle="regular">
          <View style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Import Backup</Text>
              <Text style={styles.linkDescription}>
                Restore from a backup file
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Host matchContents>
                <Button
                  onPress={handleImportBackup}
                  variant="bordered"
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </Host>
            </View>
          </View>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    color: PlatformColor('secondaryLabel'),
  },
});
