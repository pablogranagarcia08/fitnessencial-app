import type { ImageSourcePropType } from 'react-native';

// Imágenes reales de Kike Grana para personalizar la app.
export const kikeAvatar = require('@/assets/images/kike-avatar.png');
export const kikeHero = require('@/assets/images/kike-hero.webp');

// Fotos asociadas a usuarios conocidos (el entrenador). Los clientes usan su
// propia foto subida (avatarUri) o las iniciales.
const userPhotos: Record<string, ImageSourcePropType> = {
  'trainer-kike': kikeAvatar,
};

export function photoFor(userId?: string): ImageSourcePropType | undefined {
  return userId ? userPhotos[userId] : undefined;
}
