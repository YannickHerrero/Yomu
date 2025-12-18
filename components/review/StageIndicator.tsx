import React from 'react';
import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { SRS_GROUP_NAMES, getGroupFromStage } from '@/constants/srs';

type StageIndicatorProps = {
  stage: number;
  size?: 'small' | 'medium' | 'large';
  showFullName?: boolean;
};

export function StageIndicator({ stage, size = 'medium', showFullName = true }: StageIndicatorProps) {
  const group = getGroupFromStage(stage);
  const stageName = SRS_GROUP_NAMES[stage];

  // Display text based on showFullName
  const displayText = showFullName ? stageName : group.charAt(0).toUpperCase() + group.slice(1);

  // Size-based styles
  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          borderRadius: currentSize.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    backgroundColor: PlatformColor('secondarySystemFill'),
  },
  text: {
    color: PlatformColor('secondaryLabel'),
    fontWeight: '600',
  },
});
