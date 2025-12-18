import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

type AddToDeckButtonProps = {
  isInDeck: boolean;
  onAdd: () => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

export function AddToDeckButton({
  isInDeck,
  onAdd,
  onRemove,
  size = 'sm',
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

  if (isInDeck) {
    return (
      <Button
        size={size}
        variant="outline"
        action="negative"
        onPress={handleRemove}
        isDisabled={isLoading}
      >
        {isLoading ? (
          <ButtonSpinner className="mr-1" />
        ) : (
          <Icon as={Trash2} className="text-error-500 mr-1" size="sm" />
        )}
        <ButtonText className="text-error-500">
          {isLoading ? 'Removing...' : 'Remove'}
        </ButtonText>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="solid"
      action="primary"
      onPress={handleAdd}
      isDisabled={isLoading}
    >
      {isLoading ? (
        <ButtonSpinner className="mr-1" />
      ) : (
        <Icon as={Plus} className="text-typography-0 mr-1" size="sm" />
      )}
      <ButtonText>{isLoading ? 'Adding...' : 'Add'}</ButtonText>
    </Button>
  );
}
