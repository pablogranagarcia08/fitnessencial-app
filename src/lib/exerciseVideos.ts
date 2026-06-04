// Vídeos de explicación por ejercicio (YouTube).
// ⚠️ EJEMPLOS / PLACEHOLDERS — sustituir por los vídeos reales de Kike Grana.
// Para cambiarlos: pega aquí el enlace de YouTube de Kike, o edítalo desde la
// app en la vista del entrenador (campo "Enlace YouTube" de cada ejercicio).
// Playlist real de Kike Grana — PECHO (vídeos de explicación).
const PLAYLIST_PECHO = 'https://youtube.com/playlist?list=PLKw8bEuoVbuYQDPm_uzFI9CJQZCmGkM6A';

const EXERCISE_VIDEOS: Record<string, string> = {
  // --- PECHO: vídeos reales de Kike (playlist). Cuando tengamos el enlace
  // individual de cada vídeo, se puede poner el específico por ejercicio. ---
  'Press banca': PLAYLIST_PECHO,
  'Press inclinado mancuerna': PLAYLIST_PECHO,

  // --- Resto: EJEMPLOS/placeholder hasta tener las playlists de Kike ---
  'Sentadilla': 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'Peso muerto rumano': 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
  'Prensa': 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  'Remo con barra': 'https://www.youtube.com/watch?v=kBWAon7ItDw',
  'Press militar': 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  'Curl bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Curl de bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Elevaciones laterales': 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  'Dominadas / Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Elevación de gemelo': 'https://www.youtube.com/watch?v=-M4-G8p8fmc',
};

export function videoFor(exerciseName: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseName];
}
