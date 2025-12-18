import React, { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Host, Button } from '@expo/ui/swift-ui';

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
        <Button
          onPress={isInDeck ? handleRemove : handleAdd}
          variant={isInDeck ? 'bordered' : 'default'}
        >
          {isLoading ? 'Loading...' : isInDeck ? 'Remove' : 'Add'}
        </Button>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 80,
  },
});
