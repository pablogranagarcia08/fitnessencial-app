// Vídeos de explicación por ejercicio (YouTube).
// ⚠️ EJEMPLOS / PLACEHOLDERS — sustituir por los vídeos reales de Kike Grana.
// Para cambiarlos: pega aquí el enlace de YouTube de Kike, o edítalo desde la
// app en la vista del entrenador (campo "Enlace YouTube" de cada ejercicio).
// Playlists reales de Kike Grana por grupo muscular (vídeos de explicación).
const PLAYLIST_PECHO = 'https://youtube.com/playlist?list=PLKw8bEuoVbuYQDPm_uzFI9CJQZCmGkM6A';
const PLAYLIST_PIERNA = 'https://youtube.com/playlist?list=PLKw8bEuoVbuaUtgI-U3qTbgdCQtf6t99p';
const PLAYLIST_ESPALDA = 'https://youtube.com/playlist?list=PLKw8bEuoVbuYuOIaa127q8YnYv_46Rl00';
const PLAYLIST_HOMBRO = 'https://youtube.com/playlist?list=PLKw8bEuoVbuawdkutjntI9FYbkqMZQWD0';

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

  // --- ESPALDA: playlist real de Kike ---
  'Remo con barra': PLAYLIST_ESPALDA,
  'Remo mancuerna': PLAYLIST_ESPALDA,
  'Dominadas / Jalón al pecho': PLAYLIST_ESPALDA,
  'Jalón al pecho': PLAYLIST_ESPALDA,
  'Face pull': PLAYLIST_ESPALDA,

  // --- HOMBRO: playlist real de Kike ---
  'Press militar': PLAYLIST_HOMBRO,
  'Elevaciones laterales': PLAYLIST_HOMBRO,

  // --- Resto: EJEMPLOS/placeholder hasta tener las playlists de Kike ---
  'Curl bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Curl de bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
};

export function videoFor(exerciseName: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseName];
}
