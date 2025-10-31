/**
 * Validates if a URL points to an image
 * @param url - The URL to validate
 * @returns Promise<boolean> - True if the URL is a valid image
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  // First check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Check if URL has image extension
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];
  const hasImageExtension = imageExtensions.some((ext) =>
    url.toLowerCase().includes(ext)
  );

  // If it has an image extension, we can assume it's valid
  if (hasImageExtension) {
    return true;
  }

  // Otherwise, try to load it as an image
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Validates if a URL points to an image (synchronous check based on extension only)
 * @param url - The URL to validate
 * @returns boolean - True if the URL appears to be an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    new URL(url);
  } catch {
    return false;
  }

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
}
