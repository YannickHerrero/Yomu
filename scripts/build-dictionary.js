#!/usr/bin/env node
/**
 * Build-time script to convert JMdict Yomitan JSON format to SQLite database
 * 
 * Usage: node scripts/build-dictionary.js
 * 
 * Input: assets/JMdict_english/term_bank_*.json
 * Output: assets/jmdict.db
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// We'll use a simple romaji conversion since wanakana requires ESM
// This is a basic hiragana to romaji mapping for search purposes
const HIRAGANA_TO_ROMAJI = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'っ': '', // Will be handled specially
  'ー': '-',
  // Small kana
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo',
};

const KATAKANA_TO_HIRAGANA = {};
// Build katakana to hiragana mapping (katakana starts at U+30A0, hiragana at U+3040)
for (let i = 0x30A1; i <= 0x30F6; i++) {
  KATAKANA_TO_HIRAGANA[String.fromCharCode(i)] = String.fromCharCode(i - 0x60);
}
// Special cases
KATAKANA_TO_HIRAGANA['ー'] = 'ー';
KATAKANA_TO_HIRAGANA['ヴ'] = 'ゔ';

/**
 * Convert katakana to hiragana
 */
function katakanaToHiragana(text) {
  let result = '';
  for (const char of text) {
    result += KATAKANA_TO_HIRAGANA[char] || char;
  }
  return result;
}

/**
 * Convert hiragana/katakana to romaji
 */
function toRomaji(text) {
  // First convert katakana to hiragana
  const hiragana = katakanaToHiragana(text);
  
  let result = '';
  let i = 0;
  
  while (i < hiragana.length) {
    // Check for two-character combinations first (e.g., きゃ)
    const twoChar = hiragana.substring(i, i + 2);
    if (HIRAGANA_TO_ROMAJI[twoChar]) {
      result += HIRAGANA_TO_ROMAJI[twoChar];
      i += 2;
      continue;
    }
    
    // Handle っ (small tsu) - doubles the next consonant
    if (hiragana[i] === 'っ') {
      const nextChar = hiragana[i + 1];
      const nextRomaji = HIRAGANA_TO_ROMAJI[nextChar];
      if (nextRomaji && nextRomaji.length > 0) {
        result += nextRomaji[0]; // Double the first consonant
      }
      i++;
      continue;
    }
    
    // Single character
    const oneChar = hiragana[i];
    if (HIRAGANA_TO_ROMAJI[oneChar] !== undefined) {
      result += HIRAGANA_TO_ROMAJI[oneChar];
    } else {
      result += oneChar; // Keep non-kana characters as-is
    }
    i++;
  }
  
  return result;
}

/**
 * Extract plain text definitions from Yomitan structured content
 */
function extractDefinitions(definitionsArray) {
  const definitions = [];
  
  for (const def of definitionsArray) {
    if (typeof def === 'string') {
      definitions.push(def);
    } else if (typeof def === 'object' && def !== null) {
      // Handle structured content
      const text = extractTextFromStructuredContent(def);
      if (text) {
        definitions.push(text);
      }
    }
  }
  
  return definitions;
}

/**
 * Recursively extract text from structured content
 */
function extractTextFromStructuredContent(content) {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map(extractTextFromStructuredContent).filter(Boolean).join('; ');
  }
  
  if (typeof content === 'object') {
    // Skip reference/link content
    if (content.data?.content === 'references') {
      return '';
    }
    
    // Skip info glossary markers
    if (content.data?.content === 'infoGlossary') {
      // Still extract the text but mark it
      const innerText = extractTextFromStructuredContent(content.content);
      return innerText;
    }
    
    // Handle glossary content
    if (content.data?.content === 'glossary') {
      const innerText = extractTextFromStructuredContent(content.content);
      return innerText;
    }
    
    // Handle list items
    if (content.tag === 'li') {
      return extractTextFromStructuredContent(content.content);
    }
    
    // Handle unordered lists
    if (content.tag === 'ul') {
      const items = [];
      if (Array.isArray(content.content)) {
        for (const item of content.content) {
          const text = extractTextFromStructuredContent(item);
          if (text) items.push(text);
        }
      } else {
        const text = extractTextFromStructuredContent(content.content);
        if (text) items.push(text);
      }
      return items.join('; ');
    }
    
    // Recursively handle content property
    if (content.content) {
      return extractTextFromStructuredContent(content.content);
    }
  }
  
  return '';
}

/**
 * Parse part of speech tags from the tag string
 */
function parsePartOfSpeech(tagString) {
  if (!tagString) return [];
  
  // Common JMdict POS tags
  const posMap = {
    'n': 'noun',
    'v1': 'ichidan verb',
    'v5': 'godan verb',
    'v5u': 'godan verb (u)',
    'v5k': 'godan verb (k)',
    'v5g': 'godan verb (g)',
    'v5s': 'godan verb (s)',
    'v5t': 'godan verb (t)',
    'v5n': 'godan verb (n)',
    'v5b': 'godan verb (b)',
    'v5m': 'godan verb (m)',
    'v5r': 'godan verb (r)',
    'vs': 'suru verb',
    'vk': 'kuru verb',
    'adj-i': 'i-adjective',
    'adj-na': 'na-adjective',
    'adj-no': 'no-adjective',
    'adv': 'adverb',
    'conj': 'conjunction',
    'int': 'interjection',
    'prt': 'particle',
    'pn': 'pronoun',
    'exp': 'expression',
    'suf': 'suffix',
    'pref': 'prefix',
    'ctr': 'counter',
    'aux': 'auxiliary',
    'aux-v': 'auxiliary verb',
    'aux-adj': 'auxiliary adjective',
  };
  
  const tags = tagString.split(' ').filter(Boolean);
  const posTags = [];
  
  for (const tag of tags) {
    // Check for exact match
    if (posMap[tag]) {
      posTags.push(posMap[tag]);
      continue;
    }
    
    // Check for prefix match (e.g., v5u, v5k)
    for (const [key, value] of Object.entries(posMap)) {
      if (tag.startsWith(key)) {
        posTags.push(value);
        break;
      }
    }
  }
  
  return [...new Set(posTags)]; // Remove duplicates
}

/**
 * Check if entry is a common word based on tags and score
 */
function isCommonWord(tagString, score) {
  // Words with positive scores or marked as common/frequent
  if (score > 0) return true;
  
  const tags = tagString?.toLowerCase() || '';
  if (tags.includes('common') || tags.includes('p')) return true;
  
  return false;
}

async function main() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const jmdictDir = path.join(assetsDir, 'JMdict_english');
  const outputPath = path.join(assetsDir, 'jmdict.db');
  
  // Remove existing database
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log('Removed existing database');
  }
  
  // Create new database
  const db = new Database(outputPath);
  
  console.log('Creating database schema...');
  
  // Create tables
  db.exec(`
    CREATE TABLE dictionary (
      id INTEGER PRIMARY KEY,
      kanji TEXT,
      reading TEXT NOT NULL,
      reading_romaji TEXT,
      definitions TEXT NOT NULL,
      part_of_speech TEXT,
      frequency_score INTEGER DEFAULT 0,
      common INTEGER DEFAULT 0
    );
    
    CREATE INDEX idx_kanji ON dictionary(kanji);
    CREATE INDEX idx_reading ON dictionary(reading);
    CREATE INDEX idx_romaji ON dictionary(reading_romaji);
    CREATE INDEX idx_common ON dictionary(common);
    CREATE INDEX idx_frequency ON dictionary(frequency_score DESC);
  `);
  
  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO dictionary (id, kanji, reading, reading_romaji, definitions, part_of_speech, frequency_score, common)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Find all term bank files
  const termBankFiles = fs.readdirSync(jmdictDir)
    .filter(f => f.startsWith('term_bank_') && f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
  
  console.log(`Found ${termBankFiles.length} term bank files`);
  
  let totalEntries = 0;
  let skippedEntries = 0;
  const seenIds = new Set();
  
  // Process each term bank file
  const insertMany = db.transaction((entries) => {
    for (const entry of entries) {
      insertStmt.run(...entry);
    }
  });
  
  for (const termBankFile of termBankFiles) {
    const filePath = path.join(jmdictDir, termBankFile);
    console.log(`Processing ${termBankFile}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const batch = [];
    
    for (const entry of data) {
      // Yomitan format: [term, reading, tags, rules, score, definitions, sequenceId, termTags]
      const [term, readingRaw, tags, , score, definitions, sequenceId] = entry;
      
      // Skip entries without valid definitions
      if (!definitions || definitions.length === 0) {
        skippedEntries++;
        continue;
      }
      
      // Skip duplicate sequence IDs (keep first occurrence which is usually the primary form)
      // Note: We use sequenceId as our primary key
      if (seenIds.has(sequenceId)) {
        skippedEntries++;
        continue;
      }
      seenIds.add(sequenceId);
      
      // Determine reading - if empty, use term
      const reading = readingRaw || term;
      
      // Determine kanji - if term equals reading, it's kana-only
      const kanji = term !== reading ? term : null;
      
      // Generate romaji from reading
      const readingRomaji = toRomaji(reading);
      
      // Extract definitions
      const definitionsList = extractDefinitions(definitions);
      if (definitionsList.length === 0) {
        skippedEntries++;
        continue;
      }
      
      // Parse part of speech
      const partOfSpeech = parsePartOfSpeech(tags);
      
      // Check if common word
      const common = isCommonWord(tags, score) ? 1 : 0;
      
      batch.push([
        sequenceId,
        kanji,
        reading,
        readingRomaji,
        JSON.stringify(definitionsList),
        JSON.stringify(partOfSpeech),
        score,
        common,
      ]);
      
      totalEntries++;
    }
    
    // Insert batch
    if (batch.length > 0) {
      insertMany(batch);
    }
    
    console.log(`  Processed ${batch.length} entries (${skippedEntries} skipped so far)`);
  }
  
  // Create FTS5 virtual table for full-text search
  console.log('Creating FTS5 index...');
  db.exec(`
    CREATE VIRTUAL TABLE dictionary_fts USING fts5(
      kanji,
      reading,
      reading_romaji,
      content='dictionary',
      content_rowid='id'
    );
    
    INSERT INTO dictionary_fts(dictionary_fts) VALUES('rebuild');
  `);
  
  // Optimize database
  console.log('Optimizing database...');
  db.exec('ANALYZE');
  db.exec('VACUUM');
  
  db.close();
  
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('\n=== Build Complete ===');
  console.log(`Total entries: ${totalEntries}`);
  console.log(`Skipped entries: ${skippedEntries}`);
  console.log(`Database size: ${sizeMB} MB`);
  console.log(`Output: ${outputPath}`);
}

main().catch(console.error);
