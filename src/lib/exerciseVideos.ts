// Vídeos de explicación por ejercicio (YouTube).
// ⚠️ EJEMPLOS / PLACEHOLDERS — sustituir por los vídeos reales de Kike Grana.
// Para cambiarlos: pega aquí el enlace de YouTube de Kike, o edítalo desde la
// app en la vista del entrenador (campo "Enlace YouTube" de cada ejercicio).
const EXERCISE_VIDEOS: Record<string, string> = {
  'Sentadilla': 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'Press banca': 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  'Peso muerto rumano': 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
  'Prensa': 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  'Remo con barra': 'https://www.youtube.com/watch?v=kBWAon7ItDw',
  'Press militar': 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  'Curl bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Curl de bíceps': 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  'Press inclinado mancuerna': 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  'Elevaciones laterales': 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  'Dominadas / Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Jalón al pecho': 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  'Elevación de gemelo': 'https://www.youtube.com/watch?v=-M4-G8p8fmc',
};

export function videoFor(exerciseName: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseName];
}
