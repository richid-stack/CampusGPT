import type { FileUIPart } from 'ai';

export const MAX_IMAGES = 4;
const MAX_SIDE = 1600;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export class ImageError extends Error {}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageError('Could not read that photo.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('That file does not look like a photo.'));
    img.src = url;
  });
}

/**
 * Turns a picked photo into something the assistant can read: phone photos are
 * scaled down (they are often 5–10 MB) and saved as JPEG.
 */
export async function prepareImage(file: File): Promise<FileUIPart> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Please choose a PNG, JPEG, WebP or GIF photo.');

  const original = await readAsDataUrl(file);
  // Animated GIFs stay as they are (small enough, and a canvas would flatten them).
  if (file.type === 'image/gif') {
    if (original.length > 6_000_000) throw new ImageError('That GIF is too large. Please choose a smaller one.');
    return { type: 'file', mediaType: 'image/gif', url: original, filename: file.name };
  }

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Could not process that photo.');
  ctx.fillStyle = '#fff'; // transparent PNGs become white instead of black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const url = canvas.toDataURL('image/jpeg', 0.85);
  if (url.length > 6_000_000) throw new ImageError('That photo is too large. Please choose a smaller one.');
  return { type: 'file', mediaType: 'image/jpeg', url, filename: file.name.replace(/\.\w+$/, '') + '.jpg' };
}
