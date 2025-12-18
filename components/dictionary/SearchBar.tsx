import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Host, TextField } from '@expo/ui/swift-ui';
import { View, StyleSheet } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export type SearchBarRef = {
  focus: () => void;
};

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(
  function SearchBar(
    {
      value,
      onChangeText,
      placeholder = 'Search dictionary...',
    },
    ref
  ) {
    const fieldRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        // SwiftUI TextField focus handling
        fieldRef.current?.focus?.();
      },
    }));

    return (
      <View style={styles.container}>
        <Host style={styles.hostContainer}>
          <TextField
            ref={fieldRef}
            placeholder={placeholder}
            defaultValue={value}
            onChangeText={onChangeText}
            autocorrection={false}
          />
        </Host>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  hostContainer: {
    minHeight: 44,
  },
});
