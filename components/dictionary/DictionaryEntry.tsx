import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Badge, BadgeText } from '@/components/ui/badge';
import { AddToDeckButton } from './AddToDeckButton';
import type { DictionaryEntry as DictionaryEntryType } from '@/database/dictionary';

type DictionaryEntryProps = {
  entry: DictionaryEntryType;
  isInDeck: boolean;
  onAddToDeck: () => Promise<void>;
  onRemoveFromDeck?: () => Promise<void>;
};

export function DictionaryEntry({
  entry,
  isInDeck,
  onAddToDeck,
  onRemoveFromDeck,
}: DictionaryEntryProps) {
  const displayWord = entry.kanji || entry.reading;
  const showReading = entry.kanji !== null;
  const primaryPos = entry.partOfSpeech[0];

  return (
    <Card variant="outline" className="p-4 mb-2 bg-background-50">
      <HStack className="justify-between items-start">
        <VStack className="flex-1 mr-3">
          {/* Word with furigana */}
          <HStack className="items-baseline flex-wrap">
            <Heading size="xl" className="text-typography-900">
              {displayWord}
            </Heading>
            {showReading && (
              <Text size="md" className="text-typography-500 ml-2">
                {entry.reading}
              </Text>
            )}
            {entry.common && (
              <Badge action="success" size="sm" className="ml-2">
                <BadgeText>common</BadgeText>
              </Badge>
            )}
          </HStack>

          {/* Part of speech */}
          {primaryPos && (
            <Badge action="muted" size="sm" className="self-start mt-1">
              <BadgeText>{primaryPos}</BadgeText>
            </Badge>
          )}

          {/* Definitions */}
          <VStack className="mt-2">
            {entry.definitions.slice(0, 5).map((def, index) => (
              <Text
                key={index}
                size="sm"
                className="text-typography-700"
              >
                {entry.definitions.length > 1 ? `${index + 1}. ` : ''}
                {def}
              </Text>
            ))}
            {entry.definitions.length > 5 && (
              <Text size="xs" className="text-typography-400 mt-1">
                +{entry.definitions.length - 5} more definitions
              </Text>
            )}
          </VStack>
        </VStack>

        {/* Add to deck button */}
        <AddToDeckButton
          isInDeck={isInDeck}
          onAdd={onAddToDeck}
          onRemove={onRemoveFromDeck}
        />
      </HStack>
    </Card>
  );
}
