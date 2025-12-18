import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TextInput, StyleSheet, PlatformColor } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
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
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    return (
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={PlatformColor('placeholderText')}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        enablesReturnKeyAutomatically
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    height: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 17,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: 10,
    color: PlatformColor('label'),
  },
});
