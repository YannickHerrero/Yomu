const DEEPL_FREE_API_URL = 'https://api-free.deepl.com/v2/translate';

type DeepLResponse = {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
};

/**
 * Translate Japanese text to English using DeepL API
 * Returns null on any error (network, API key invalid, etc.)
 */
export async function translateToEnglish(
  text: string,
  apiKey: string
): Promise<string | null> {
  if (!text.trim() || !apiKey.trim()) {
    return null;
  }

  try {
    const response = await fetch(DEEPL_FREE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'JA',
        target_lang: 'EN',
      }),
    });

    if (!response.ok) {
      console.error('DeepL API error:', response.status, response.statusText);
      return null;
    }

    const data: DeepLResponse = await response.json();
    
    if (data.translations && data.translations.length > 0) {
      return data.translations[0].text;
    }

    return null;
  } catch (error) {
    console.error('DeepL translation failed:', error);
    return null;
  }
}

/**
 * Validate if a DeepL API key is valid by making a usage request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) {
    return false;
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
