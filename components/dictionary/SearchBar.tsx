import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TextInput } from 'react-native';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import { Search, X } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';

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
      onClear,
      placeholder = 'Search dictionary...',
      autoFocus = false,
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
      <Input size="lg" variant="outline" className="bg-background-50">
        <InputSlot className="pl-3">
          <InputIcon as={Search} className="text-typography-400" />
        </InputSlot>
        <InputField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={inputRef as any}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          returnKeyType="search"
          className="text-typography-900"
        />
        {value.length > 0 && (
          <InputSlot className="pr-3">
            <Pressable onPress={onClear}>
              <InputIcon as={X} className="text-typography-400" />
            </Pressable>
          </InputSlot>
        )}
      </Input>
    );
  }
);
