// Vídeos de explicación por ejercicio (YouTube).
// ⚠️ EJEMPLOS / PLACEHOLDERS — sustituir por los vídeos reales de Kike Grana.
// Para cambiarlos: pega aquí el enlace de YouTube de Kike, o edítalo desde la
// app en la vista del entrenador (campo "Enlace YouTube" de cada ejercicio).
// Playlists reales de Kike Grana por grupo muscular (vídeos de explicación).
const PLAYLIST_PECHO = 'https://youtube.com/playlist?list=PLKw8bEuoVbuYQDPm_uzFI9CJQZCmGkM6A';
const PLAYLIST_PIERNA = 'https://youtube.com/playlist?list=PLKw8bEuoVbuaUtgI-U3qTbgdCQtf6t99p';

const EXERCISE_VIDEOS: Record<string, string> = {
  // --- PECHO: playlist real de Kike ---
  'Press banca': PLAYLIST_PECHO,
  'Press inclinado mancuerna': PLAYLIST_PECHO,

  // --- PIERNA: playlist real de Kike ---
  'Sentadilla': PLAYLIST_PIERNA,
  'Peso muerto rumano': PLAYLIST_PIERNA,
  'Prensa': PLAYLIST_PIERNA,
  'Curl femoral': PLAYLIST_PIERNA,
  'Zancadas': PLAYLIST_PIERNA,
  'Elevación de gemelo': PLAYLIST_PIERNA,

  // --- Resto: EJEMPLOS/placeholder hasta tener las playlists de Kike ---
  'Remo con barra': 'https://www.youtube.com/watch?v=kBWAon7ItDw',
  'Press militar': 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  'Curl bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Curl de bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Elevaciones laterales': 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  'Dominadas / Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
};

export function videoFor(exerciseName: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseName];
}
