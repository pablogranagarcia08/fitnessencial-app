// Asistente del coach para el chat. Hoy: respuestas locales (offline, sin coste).
// Mañana: IA real (Claude) vía backend — misma interfaz, se cambia `chatAssistant`.

export interface ChatAssistant {
  id: string;
  label: string;
  reply(message: string): Promise<string>;
}

interface Rule {
  keys: string[];
  answers: string[];
}

// normaliza: minúsculas y sin acentos (rango unicode de diacríticos combinados).
const DIACRITICS = /[̀-ͯ]/g;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Reglas ordenadas por prioridad (las primeras mandan).
const RULES: Rule[] = [
  {
    keys: ['dolor', 'lesion', 'lesión', 'molestia', 'me duele', 'pinchazo', 'tiron', 'tirón'],
    answers: [
      'Si notas dolor (no la típica fatiga muscular), para ese ejercicio. No fuerces. Cuéntame dónde y cuándo te duele y, si persiste, conviene que lo vea un fisio o médico antes de seguir.',
      'Lo primero es tu salud: si hay dolor articular o agudo, detente y no cargues esa zona. Dime exactamente dónde lo notas y adaptamos el entreno; si sigue, consúltalo con un profesional.',
    ],
  },
  {
    keys: ['hola', 'buenas', 'hey', 'que tal', 'qué tal', 'buenos dias', 'buenas tardes', 'buenas noches'],
    answers: [
      '¡Hola! 💪 Aquí estoy. ¿En qué te ayudo hoy: entreno, nutrición o progreso?',
      '¡Buenas! ¿Cómo va todo? Cuéntame qué necesitas y vamos a por ello.',
    ],
  },
  {
    keys: ['gracias', 'genial', 'perfecto', 'ok', 'vale', 'entendido'],
    answers: [
      '¡A por ello! Aquí me tienes para lo que necesites. Una repetición más. 🔥',
      '¡Genial! Cualquier duda, me escribes. Vamos con todo.',
    ],
  },
  {
    keys: ['proteina', 'proteína', 'proteinas'],
    answers: [
      'Para tu objetivo apunta a 1,8–2,2 g de proteína por kg de peso al día, repartida en 3–4 comidas. Prioriza pollo, pescado, huevos, lácteos y legumbres. Es la base para mantener músculo.',
      'La proteína es clave: ~2 g por kg de peso al día. Si te cuesta llegar, un batido tras entrenar ayuda. Reparte bien entre comidas para aprovecharla mejor.',
    ],
  },
  {
    keys: ['agua', 'hidrat', 'beber'],
    answers: ['Bebe entre 2 y 3 litros de agua al día, y un poco más los días de entreno. Una buena hidratación mejora fuerza y recuperación.'],
  },
  {
    keys: ['dormir', 'sueno', 'sueño', 'descanso', 'descansar', 'recuper'],
    answers: [
      'El descanso es donde creces. Duerme 7–9 horas y deja al menos 48 h antes de repetir el mismo grupo muscular. Sin recuperación no hay progreso.',
      'Dormir bien es parte del plan: 7–9 h. Si entrenas fuerte, los días de descanso son tan importantes como los de gym.',
    ],
  },
  {
    keys: ['estanc', 'meseta', 'no bajo', 'no adelgazo', 'no avanzo', 'no progreso', 'parado'],
    answers: [
      'Los estancamientos son normales. Revisamos 3 cosas: que cumplas las calorías y proteína, que subas algo de carga o reps cada semana, y el descanso/pasos diarios. Mándame tus últimos registros y lo ajustamos.',
      'Si te has estancado, solemos tocar un poco las calorías o el volumen de entreno y aumentar los pasos diarios. Pásame tu peso de las últimas semanas y lo afinamos.',
    ],
  },
  {
    keys: ['adelgaz', 'perder grasa', 'definir', 'definicion', 'definición', 'bajar peso', 'quemar'],
    answers: [
      'Para perder grasa: déficit calórico moderado (sin pasarte), proteína alta para no perder músculo, fuerza 3–5 días y sumar pasos diarios. Constancia > prisa. Lo tienes todo en tu plan.',
      'Definir es déficit + fuerza + proteína alta + cardio/pasos. Nada de dietas extremas: vamos progresivo para que sea sostenible y no pierdas músculo.',
    ],
  },
  {
    keys: ['masa', 'musculo', 'músculo', 'volumen', 'ganar peso', 'hipertrofia', 'crecer'],
    answers: [
      'Para ganar músculo: ligero superávit calórico, proteína alta, y sobrecarga progresiva (subir reps o kilos poco a poco). Entrena cerca del fallo con buena técnica. Paciencia: el músculo se construye con el tiempo.',
      'Hipertrofia = comer un poco por encima de tu mantenimiento + entrenar duro y progresar cada semana + dormir. Sin prisa pero sin pausa.',
    ],
  },
  {
    keys: ['creatina', 'suplement', 'proteina en polvo', 'bcaa', 'pre entreno', 'preentreno'],
    answers: [
      'De suplementos, los que de verdad valen la pena: creatina monohidrato (3–5 g al día, todos los días) y, si te cuesta llegar a la proteína, un batido. El resto es secundario. La comida real es lo primero.',
      'Creatina (5 g/día) es el suplemento con más respaldo y barato. La proteína en polvo es comodidad, no magia. Antes de gastar en suplementos, asegura comida, sueño y entreno.',
    ],
  },
  {
    keys: ['agujetas', 'dolor muscular', 'cargado'],
    answers: ['Las agujetas son normales, sobre todo al empezar o cambiar de rutina. Muévete suave, hidrátate y descansa. No hace falta parar del todo salvo que sea dolor articular.'],
  },
  {
    keys: ['motiv', 'desanim', 'no puedo', 'me cuesta', 'pereza', 'rendir', 'rindo'],
    answers: [
      'Todos tenemos días flojos. No busques motivación, busca constancia: ve al gym aunque sea a hacer la mitad. Lo importante es no romper la cadena. Confío en ti. Una repetición más. 🔥',
      'La motivación va y viene; los hábitos quedan. Hazlo aunque no te apetezca y te sentirás mejor después. Estoy contigo en esto.',
    ],
  },
  {
    keys: ['cuantas series', 'cuántas series', 'cuantas repe', 'cuántas repe', 'reps', 'repeticiones', 'series'],
    answers: ['Sigue lo que marca tu plan en cada ejercicio (tienes el objetivo de series y reps al lado). Si te sobra fácil, sube algo de carga; si no llegas, baja un poco. Anota lo que haces para ajustarlo.'],
  },
  {
    keys: ['tecnica', 'técnica', 'forma', 'lo hago bien', 'postura'],
    answers: ['La técnica es lo primero: mejor menos peso y bien ejecutado. Si quieres, grábate una serie y me la mandas por aquí y te corrijo. Calidad antes que ego. 💪'],
  },
  {
    keys: ['cuantos dias', 'cuántos días', 'frecuencia', 'cuanto entreno', 'cuánto entreno'],
    answers: ['Lo ideal para ti son los días que marca tu plan, repartidos para descansar entre grupos musculares. Mejor 3–4 días constantes toda la vida que 6 una semana y luego parar.'],
  },
  {
    keys: ['comer', 'comida', 'dieta', 'que como', 'qué como', 'cena', 'desayuno', 'macros', 'calorias', 'calorías'],
    answers: [
      'Tienes tu plan de nutrición en la pestaña Nutrición: objetivo de kcal y macros con ejemplos de comidas. Prioriza comida real, proteína en cada comida y verdura. Si una comida no te encaja, dímelo y te doy alternativas.',
      'Revisa tu pestaña de Nutrición: ahí están tus calorías y macros. La clave es proteína suficiente y comida de verdad. Cuéntame qué alimentos te gustan y te los encajo.',
    ],
  },
  {
    keys: ['calentar', 'calentamiento'],
    answers: ['Antes de entrenar: 5 min de movilidad de la zona + 1–2 series ligeras del primer ejercicio para activar. No hace falta más. El estiramiento intenso déjalo para el final.'],
  },
];

const FALLBACKS = [
  'Buena pregunta. Lo tienes cubierto en tu plan, pero dime un poco más de contexto (qué ejercicio, qué objetivo o qué comida) y te lo concreto al detalle. 💪',
  'Te ayudo seguro. Cuéntame algo más para afinar la respuesta a tu caso: tu objetivo, cómo te encuentras o qué parte del plan te genera la duda.',
  'Anotado. Dame un par de detalles más y te doy la respuesta exacta para ti. Recuerda: constancia y técnica. Una repetición más. 🔥',
];

export const localAssistant: ChatAssistant = {
  id: 'local-coach',
  label: 'Asistente del coach (offline)',
  async reply(message) {
    const m = norm(message);
    for (const rule of RULES) {
      if (rule.keys.some((k) => m.includes(norm(k)))) {
        return pick(rule.answers);
      }
    }
    return pick(FALLBACKS);
  },
};

// Motor de IA real (Claude). Necesita backend con clave API.
export const aiAssistant: ChatAssistant = {
  id: 'ai-claude',
  label: 'IA Claude (requiere backend)',
  async reply() {
    throw new Error('El asistente con IA necesita el backend. Disponible en la siguiente fase.');
  },
};

// Asistente activo. Cambiar a `aiAssistant` cuando el backend esté listo.
export const chatAssistant: ChatAssistant = localAssistant;
