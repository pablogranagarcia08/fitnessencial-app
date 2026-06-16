// Foto de un plato a partir de palabras clave (en inglés para mejores resultados).
// Usamos LoremFlickr con un "lock" estable para que el mismo plato muestre siempre
// la misma imagen. En producción se sustituiría por las fotos reales que suba Kike.

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
};

export const foodPhoto = (keywords: string): string =>
  `https://loremflickr.com/600/400/${encodeURIComponent(keywords)}?lock=${hash(keywords)}`;
