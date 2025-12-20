import * as FileSystem from 'expo-file-system/legacy';

const CARD_IMAGES_DIR = 'card_images/';

/**
 * Get the full path to the card images directory
 */
function getCardImagesDirectory(): string {
  return `${FileSystem.documentDirectory}${CARD_IMAGES_DIR}`;
}

/**
 * Ensure the card images directory exists
 */
async function ensureDirectoryExists(): Promise<void> {
  const dir = getCardImagesDirectory();
  const info = await FileSystem.getInfoAsync(dir);
  
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Save an image for a card
 * Images from CameraCapture are already cropped and resized
 * Returns the relative path (filename only) to store in database
 */
export async function saveCardImage(
  sourceUri: string,
  cardId?: number
): Promise<string> {
  await ensureDirectoryExists();

  // Generate a unique filename
  const timestamp = Date.now();
  const cardIdPart = cardId ? `_${cardId}` : '';
  const filename = `card${cardIdPart}_${timestamp}.jpg`;
  const destPath = `${getCardImagesDirectory()}${filename}`;

  // Copy the image to the documents directory
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destPath,
  });

  // Clean up the source file if it's in cache
  if (sourceUri.includes('cache') || sourceUri.includes('Cache')) {
    try {
      await FileSystem.deleteAsync(sourceUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  return filename;
}

/**
 * Get the full URI for a card image from its stored path
 */
export function getCardImageUri(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  // If it's already a full path, return as is
  if (imagePath.startsWith('file://') || imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Otherwise, it's a relative filename
  return `${getCardImagesDirectory()}${imagePath}`;
}

/**
 * Delete a card's image file
 */
export async function deleteCardImage(imagePath: string | null): Promise<void> {
  if (!imagePath) return;

  const fullPath = getCardImageUri(imagePath);
  if (!fullPath) return;

  try {
    const info = await FileSystem.getInfoAsync(fullPath);
    if (info.exists) {
      await FileSystem.deleteAsync(fullPath, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete card image:', error);
  }
}

/**
 * Check if a card image exists
 */
export async function cardImageExists(imagePath: string | null): Promise<boolean> {
  if (!imagePath) return false;

  const fullPath = getCardImageUri(imagePath);
  if (!fullPath) return false;

  try {
    const info = await FileSystem.getInfoAsync(fullPath);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Delete all card images (used when resetting learning progress)
 */
export async function deleteAllCardImages(): Promise<void> {
  const dir = getCardImagesDirectory();

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete card images directory:', error);
  }
}

/**
 * Get the total size of all card images in bytes
 */
export async function getCardImagesSize(): Promise<number> {
  const dir = getCardImagesDirectory();

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(dir);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${dir}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += (fileInfo as { size: number }).size ?? 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get card images size:', error);
    return 0;
  }
}

/**
 * Get the number of card images
 */
export async function getCardImagesCount(): Promise<number> {
  const dir = getCardImagesDirectory();

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(dir);
    return files.length;
  } catch (error) {
    console.error('Failed to get card images count:', error);
    return 0;
  }
}
