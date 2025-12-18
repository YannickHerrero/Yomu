import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Host, Button } from '@expo/ui/swift-ui';

type UnburnButtonProps = {
  onUnburn: () => Promise<void>;
  cardName?: string;
};

export function UnburnButton({ onUnburn, cardName }: UnburnButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = () => {
    Alert.alert(
      'Resurrect Card',
      `Are you sure you want to reset ${cardName ? `"${cardName}"` : 'this card'} to Apprentice 1? It will be added back to your review queue.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resurrect',
          onPress: async () => {
            setIsLoading(true);
            try {
              await onUnburn();
            } catch (error) {
              console.error('Failed to unburn card:', error);
              Alert.alert('Error', 'Failed to resurrect card. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Host matchContents>
        <Button onPress={handlePress} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Resurrect'}
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 90,
  },
});
