import React, { useState, useCallback, useEffect } from 'react';
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
import { useDeckStore, type DeckCard } from '@/stores/useDeckStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { translateToEnglish } from '@/utils/deepl';
import { saveCardImage, deleteCardImage, getCardImageUri } from '@/utils/imageStorage';

type EditCardSheetProps = {
  card: DeckCard;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export function EditCardSheet({ card, isOpen, onClose, onDelete }: EditCardSheetProps) {
  const { db } = useDatabase();
  const { updateCard } = useDeckStore();
  const { deeplApiKey } = useSettingsStore();

  const [exampleSentence, setExampleSentence] = useState(card.exampleSentence || '');
  const [photoUri, setPhotoUri] = useState<string | null>(getCardImageUri(card.imagePath));
  const [isNewPhoto, setIsNewPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Display word
  const displayWord = card.kanji || card.reading;
  const showReading = card.kanji !== null;

  // Reset form when card changes
  useEffect(() => {
    setExampleSentence(card.exampleSentence || '');
    setPhotoUri(getCardImageUri(card.imagePath));
    setIsNewPhoto(false);
    setIsCameraOpen(false);
  }, [card]);

  // Handle open camera
  const handleOpenCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  // Handle photo captured
  const handlePhotoCaptured = useCallback((uri: string) => {
    setPhotoUri(uri);
    setIsNewPhoto(true);
    setIsCameraOpen(false);
  }, []);

  // Handle camera close
  const handleCameraClose = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  // Handle remove photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoUri(null);
    setIsNewPhoto(true); // Mark that we've changed the photo state
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!db) return;

    setIsSubmitting(true);
    try {
      let translatedSentence: string | null = card.translatedSentence;
      let imagePath: string | null = card.imagePath;

      // If sentence changed and we have an API key, re-translate
      const sentenceChanged = exampleSentence.trim() !== (card.exampleSentence || '');
      if (sentenceChanged) {
        if (exampleSentence.trim() && deeplApiKey) {
          translatedSentence = await translateToEnglish(exampleSentence.trim(), deeplApiKey);
        } else if (!exampleSentence.trim()) {
          translatedSentence = null;
        }
      }

      // Handle image changes
      if (isNewPhoto) {
        // Delete old image if exists
        if (card.imagePath) {
          await deleteCardImage(card.imagePath);
        }

        // Save new photo if we have one
        if (photoUri) {
          imagePath = await saveCardImage(photoUri, card.id);
        } else {
          imagePath = null;
        }
      }

      // Update the card
      await updateCard(db, card.id, {
        exampleSentence: exampleSentence.trim() || null,
        translatedSentence,
        imagePath,
      });

      onClose();
    } catch (error) {
      console.error('Failed to save card:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    db,
    card,
    exampleSentence,
    photoUri,
    isNewPhoto,
    deeplApiKey,
    updateCard,
    onClose,
  ]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Card',
      `Remove "${displayWord}" from your deck? Your progress will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete image if exists
            if (card.imagePath) {
              await deleteCardImage(card.imagePath);
            }
            onDelete();
          },
        },
      ]
    );
  }, [displayWord, card.imagePath, onDelete]);

  // Handle close
  const handleClose = useCallback(() => {
    // Reset form to original values
    setExampleSentence(card.exampleSentence || '');
    setPhotoUri(getCardImageUri(card.imagePath));
    setIsNewPhoto(false);
    onClose();
  }, [card, onClose]);

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
            <Text style={styles.title}>Edit Card</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={PlatformColor('secondaryLabel')} />
            </Pressable>
          </View>

          {/* Word Preview */}
          <GlassView style={styles.wordCard} glassEffectStyle="regular">
            <Text style={styles.word}>{displayWord}</Text>
            {showReading && <Text style={styles.reading}>{card.reading}</Text>}
            <View style={styles.definitionsContainer}>
              {card.definitions.slice(0, 2).map((def, index) => (
                <Text key={index} style={styles.definition} numberOfLines={1}>
                  {index + 1}. {def}
                </Text>
              ))}
            </View>
          </GlassView>

          {/* Example Sentence Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Example Sentence</Text>
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
          </View>

          {/* Photo Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Context Photo</Text>
            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <Pressable onPress={handleRemovePhoto} style={styles.removePhotoButton}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={PlatformColor('label')} />
                </Pressable>
                <Pressable onPress={handleOpenCamera} style={styles.retakePhotoButton}>
                  <IconSymbol name="camera.fill" size={16} color={PlatformColor('label')} />
                  <Text style={styles.retakePhotoText}>Retake</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleOpenCamera} style={styles.takePhotoButton}>
                <IconSymbol name="camera.fill" size={24} color={PlatformColor('secondaryLabel')} />
                <Text style={styles.takePhotoText}>Take Photo</Text>
              </Pressable>
            )}
          </View>

          {/* Save Button */}
          <View style={styles.submitContainer}>
            <Pressable
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>

          {/* Delete Button */}
          <View style={styles.deleteContainer}>
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Card</Text>
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
  retakePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PlatformColor('systemBackground'),
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  retakePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: PlatformColor('label'),
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
  deleteContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
});
