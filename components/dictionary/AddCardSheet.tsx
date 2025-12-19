import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PlatformColor,
  TextInput,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDeckStore } from '@/stores/useDeckStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { translateToEnglish } from '@/utils/deepl';
import { saveCardImage } from '@/utils/imageStorage';
import type { DictionaryEntry } from '@/database/dictionary';

type AddCardSheetProps = {
  entry: DictionaryEntry;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddCardSheet({ entry, isOpen, onClose, onSuccess }: AddCardSheetProps) {
  const { db } = useDatabase();
  const { addCard } = useDeckStore();
  const { deeplApiKey } = useSettingsStore();

  const [exampleSentence, setExampleSentence] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Display word
  const displayWord = entry.kanji || entry.reading;
  const showReading = entry.kanji !== null;

  // Handle open camera
  const handleOpenCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  // Handle photo captured
  const handlePhotoCaptured = useCallback((uri: string) => {
    setPhotoUri(uri);
    setIsCameraOpen(false);
  }, []);

  // Handle camera close
  const handleCameraClose = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  // Handle remove photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoUri(null);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!db) return;

    setIsSubmitting(true);
    try {
      let translatedSentence: string | null = null;
      let imagePath: string | null = null;

      // Translate sentence if we have one and an API key
      if (exampleSentence.trim() && deeplApiKey) {
        translatedSentence = await translateToEnglish(exampleSentence.trim(), deeplApiKey);
      }

      // Save photo if we have one
      if (photoUri) {
        imagePath = await saveCardImage(photoUri);
      }

      // Add the card
      await addCard(db, {
        dictionaryId: entry.id,
        exampleSentence: exampleSentence.trim() || null,
        translatedSentence,
        imagePath,
      });

      // Reset form
      setExampleSentence('');
      setPhotoUri(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add card:', error);
      Alert.alert('Error', 'Failed to add card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [db, entry.id, exampleSentence, photoUri, deeplApiKey, addCard, onSuccess, onClose]);

  // Handle close (reset form)
  const handleClose = useCallback(() => {
    setExampleSentence('');
    setPhotoUri(null);
    onClose();
  }, [onClose]);

  // If camera is open, show only the camera
  if (isCameraOpen) {
    return (
      <CameraCapture
        isVisible={true}
        onCapture={handlePhotoCaptured}
        onClose={handleCameraClose}
      />
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add to Deck</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={PlatformColor('secondaryLabel')} />
            </Pressable>
          </View>

          {/* Word Preview */}
          <GlassView style={styles.wordCard} glassEffectStyle="regular">
            <Text style={styles.word}>{displayWord}</Text>
            {showReading && <Text style={styles.reading}>{entry.reading}</Text>}
            <View style={styles.definitionsContainer}>
              {entry.definitions.slice(0, 2).map((def, index) => (
                <Text key={index} style={styles.definition} numberOfLines={1}>
                  {index + 1}. {def}
                </Text>
              ))}
              {entry.definitions.length > 2 && (
                <Text style={styles.moreDefinitions}>
                  +{entry.definitions.length - 2} more
                </Text>
              )}
            </View>
          </GlassView>

          {/* Example Sentence Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Example Sentence (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={exampleSentence}
              onChangeText={setExampleSentence}
              placeholder="Enter a Japanese sentence..."
              placeholderTextColor={PlatformColor('tertiaryLabel')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {deeplApiKey && exampleSentence.trim() && (
              <Text style={styles.translationHint}>
                Will be translated to English automatically
              </Text>
            )}
            {!deeplApiKey && exampleSentence.trim() && (
              <Text style={styles.noApiKeyHint}>
                Add DeepL API key in Settings for translation
              </Text>
            )}
          </View>

          {/* Photo Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Context Photo (optional)</Text>
            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <Pressable onPress={handleRemovePhoto} style={styles.removePhotoButton}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={PlatformColor('label')} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleOpenCamera} style={styles.takePhotoButton}>
                <IconSymbol name="camera.fill" size={24} color={PlatformColor('secondaryLabel')} />
                <Text style={styles.takePhotoText}>Take Photo</Text>
              </Pressable>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add Card</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  closeButton: {
    padding: 8,
  },
  wordCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: '600',
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  reading: {
    fontSize: 18,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginTop: 4,
  },
  definitionsContainer: {
    marginTop: 12,
  },
  definition: {
    fontSize: 14,
    color: PlatformColor('label'),
    marginBottom: 2,
  },
  moreDefinitions: {
    fontSize: 13,
    color: PlatformColor('tertiaryLabel'),
    fontStyle: 'italic',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: PlatformColor('label'),
    backgroundColor: PlatformColor('quaternarySystemFill'),
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
  },
  translationHint: {
    fontSize: 12,
    color: PlatformColor('secondaryLabel'),
    marginTop: 6,
  },
  noApiKeyHint: {
    fontSize: 12,
    color: PlatformColor('tertiaryLabel'),
    marginTop: 6,
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PlatformColor('quaternarySystemFill'),
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  takePhotoText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PlatformColor('systemBackground'),
    borderRadius: 12,
  },
  submitContainer: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: PlatformColor('label'),
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('systemBackground'),
  },
});
