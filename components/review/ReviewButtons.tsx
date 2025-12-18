import React from 'react';
import { Text, StyleSheet, PlatformColor, Pressable } from 'react-native';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

type ReviewButtonsProps = {
  onWrong: () => void;
  onCorrect: () => void;
  disabled?: boolean;
};

export function ReviewButtons({ onWrong, onCorrect, disabled = false }: ReviewButtonsProps) {
  const handleWrong = async () => {
    if (disabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    onWrong();
  };

  const handleCorrect = async () => {
    if (disabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCorrect();
  };

  return (
    <GlassContainer spacing={16} style={styles.container}>
      {/* Wrong Button */}
      <GlassView
        style={[styles.button, disabled && styles.disabledButton]}
        glassEffectStyle="regular"
        isInteractive
      >
        <Pressable
          onPress={handleWrong}
          disabled={disabled}
          style={styles.buttonPressable}
        >
          <Text style={[styles.buttonIcon, disabled && styles.disabledText]}>✕</Text>
        </Pressable>
      </GlassView>

      {/* Correct Button */}
      <GlassView
        style={[styles.button, disabled && styles.disabledButton]}
        glassEffectStyle="regular"
        isInteractive
      >
        <Pressable
          onPress={handleCorrect}
          disabled={disabled}
          style={styles.buttonPressable}
        >
          <Text style={[styles.buttonIcon, disabled && styles.disabledText]}>✓</Text>
        </Pressable>
      </GlassView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  disabledText: {
    color: PlatformColor('tertiaryLabel'),
  },
});
