import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { IconSymbol } from '@/components/ui/icon-symbol';

type AddToDeckButtonProps = {
  isInDeck: boolean;
  onAdd: () => Promise<void>;
  onRemove?: () => Promise<void>;
};

export function AddToDeckButton({
  isInDeck,
  onAdd,
  onRemove,
}: AddToDeckButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (isInDeck || isLoading) return;

    setIsLoading(true);
    try {
      await onAdd();
    } catch (error) {
      console.error('Failed to add card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (!isInDeck || isLoading || !onRemove) return;

    Alert.alert(
      'Remove from Deck',
      'Are you sure you want to remove this card from your deck? Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await onRemove();
            } catch (error) {
              console.error('Failed to remove card:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <GlassView style={styles.button} isInteractive>
        <IconSymbol
          name="arrow.triangle.2.circlepath"
          size={20}
          color={PlatformColor('secondaryLabel')}
          weight="regular"
        />
      </GlassView>
    );
  }

  if (isInDeck) {
    return (
      <GlassView style={styles.button} isInteractive>
        <Pressable onPress={handleRemove} style={styles.pressable}>
          <IconSymbol
            name="trash.fill"
            size={20}
            color={PlatformColor('label')}
            weight="regular"
          />
        </Pressable>
      </GlassView>
    );
  }

  return (
    <GlassView style={styles.button} isInteractive>
      <Pressable onPress={handleAdd} style={styles.pressable}>
        <IconSymbol
          name="plus"
          size={20}
          color={PlatformColor('label')}
          weight="semibold"
        />
      </Pressable>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
