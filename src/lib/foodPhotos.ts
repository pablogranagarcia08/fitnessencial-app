// Fotos reales de cada plato (TheMealDB, URLs estables y gratuitas).
// Cada plato del generador referencia una de estas claves. En producción se
// sustituiría por las fotos propias que suba Kike.

const M = (file: string) => `https://www.themealdb.com/images/media/meals/${file}`;

export const DISH_PHOTOS: Record<string, string> = {
  // Desayunos
  oatmeal: M('c400ok1764439058.jpg'),
  avocado_toast: M('1549542994.jpg'),
  yogurt_granola: M('y2irzl1585563479.jpg'),
  pancakes: M('rwuyqx1511383174.jpg'),
  rye_turkey: M('iydbwy1763816111.jpg'),
  omelette_fruit: M('hqaejl1695738653.jpg'),
  // Comidas
  chicken_rice: M('wyxwsp1486979827.jpg'),
  beef_potato: M('pbzcrx1763765096.jpg'),
  salmon_quinoa: M('ikizdm1763760862.jpg'),
  pasta_turkey: M('wvqpwt1468339226.jpg'),
  hake_rice: M('ysxwuq1487323065.jpg'),
  lentils: M('vpxyqt1511464175.jpg'),
  roast_chicken: M('ssrrrs1503664277.jpg'),
  // Meriendas
  yogurt_nuts: M('y2irzl1585563479.jpg'),
  cottage_apple: M('c0gmo31766594751.jpg'),
  protein_shake: M('sywswr1511383814.jpg'),
  turkey_toast: M('j80gmw1764372176.jpg'),
  nuts_fruit: M('gkcdpl1764441325.jpg'),
  cheese_berries: M('oal8x31764119345.jpg'),
  // Cenas
  salmon_sweetpotato: M('p02vq41763754350.jpg'),
  eggwhite_veg: M('1529446137.jpg'),
  chicken_salad: M('zry07j1763779321.jpg'),
  steamed_hake: M('njj1681763297231.jpg'),
  tuna_salad: M('yypwwq1511304979.jpg'),
  turkey_burger: M('lgmnff1763789847.jpg'),
};

// Foto genérica de plato para opciones sin imagen propia (p. ej. añadidas por Kike).
export const DEFAULT_FOOD_PHOTO = M('zry07j1763779321.jpg');

export const foodPhoto = (key: string): string => DISH_PHOTOS[key] ?? DEFAULT_FOOD_PHOTO;
