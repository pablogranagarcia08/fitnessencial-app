// Vídeos de explicación por ejercicio.
// Vídeos REALES de Kike Grana (biblioteca en Google Drive) — enlace exacto por ejercicio.
// Para cambiarlos: pega el enlace (YouTube o Drive) desde la vista de entrenador.
const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;

// Respaldo: playlist de pierna de Kike, para ejercicios sin vídeo exacto (p. ej. gemelo).
const PLAYLIST_PIERNA = 'https://youtube.com/playlist?list=PLKw8bEuoVbuaUtgI-U3qTbgdCQtf6t99p';

const EXERCISE_VIDEOS: Record<string, string> = {
  // PECHO
  'Press banca': drive('1HDS4cEzXBIHwpH8UD9-1jnv6cucrcWFc'), // PRESS BANCA PAUSA
  'Press inclinado mancuerna': drive('10ny0wEd6fTsKW_OXm_JF2w9_5p5ZeLEa'), // PRESS INCLINADO MANCUERNAS 30°

  // PIERNA
  'Sentadilla': drive('1bWZiAKSDOO80kAk4LmR6qLKqMDGxh_oE'), // SENTADILLA MULTIPOWER
  'Peso muerto rumano': drive('19NqC_qDpAzAZ37QR1jyMOfsubbORiPb1'), // PESO MUERTO RUMANO
  'Prensa': drive('1jujShLj4v1qVHPs0mP9w-8mdsZbhetlr'), // PRENSA
  'Curl femoral': drive('11MFOrWh6hCtFgOftMShez_Wsb3bm90b3'), // CURL FEMORAL TUMBADO
  'Zancadas': drive('1x8uw89iPY1NiiCt0A7jGFDtM9nygrDEH'), // SENTADILLA BÚLGARA
  'Elevación de gemelo': PLAYLIST_PIERNA, // (sin vídeo exacto)

  // ESPALDA
  'Remo con barra': drive('1aS2r_NsaMmoq8JsrdqIuzpaLIYAwXSjo'), // REMO CON BARRA
  'Remo mancuerna': drive('1uR9vk-TpYEHEr4rJObmmoLAjyBSXlc2v'), // REMO DORIAN
  'Dominadas / Jalón al pecho': drive('1TVh5mHTngWhP3SaoyepViyexDgsWtqJS'), // DOMINADAS AGARRE NEUTRO
  'Jalón al pecho': drive('1ty94ZPZjD4ir1JuuuB41XHBRa82zcDYi'), // JALON AL PECHO NEUTRO
  'Face pull': drive('1vjcjtRfP0-v3_Au7GgMhoRVHC7cTQtUl'), // RETRACCIONES CON BANDAS

  // HOMBRO
  'Press militar': drive('153PeD5_XVS6-Yyj0gJkoKb0z-KrFMzLV'), // PRESS MILITAR MAQUINA
  'Elevaciones laterales': drive('19cdYYp750PBKL0jq0WQ9CxPosHHbO-hO'), // ELEVACIONES LATERALES MANCUERNAS

  // BRAZO
  'Curl bíceps': drive('11TCinSrTtnQ12f4mjpo8AduFFnpJZsrj'), // CURL SCOTT MÁQUINA
  'Curl de bíceps': drive('11TCinSrTtnQ12f4mjpo8AduFFnpJZsrj'),
  'Extensión de tríceps': drive('10_tLeV8X0mJqTxy2JyWi5NDt_FVJBWSd'), // EXTENSIÓN OVERHEAD POLEA

  // ABDOMEN
  'Plancha': drive('1AmY8kfxuMNL6A9AjTVZOB4XaLevxrdyT'), // ELEVACION DE PIERNAS
  'Abdominales': drive('1kgtitipBzSpM-QA1oTaA3sJ-zbqvpfXz'), // CRUNCH MAQUINA
  'Crunch': drive('1kgtitipBzSpM-QA1oTaA3sJ-zbqvpfXz'),
};

export function videoFor(exerciseName: string): string | undefined {
  return EXERCISE_VIDEOS[exerciseName];
}
