# Fitnessencial — App (entrenador + cliente)

App móvil tipo Harbiz para **Fitnessencial** (Kike Grana). Hecha con **Expo / React Native +
TypeScript**. Dos roles (entrenador y cliente) y 4 funciones: **entrenamiento, nutrición, chat
y progreso**.

> **Versión demo**: los datos son de ejemplo y se guardan **en el propio teléfono**
> (AsyncStorage). Todavía no hay servidor en la nube; el chat y los datos no se comparten entre
> dispositivos. Eso llega en una fase posterior (Supabase).

## Probar la app ahora (gratis, sin Xcode ni cuenta de Apple)

1. Instala **Expo Go** en tu móvil:
   - iPhone: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"
2. En el Mac, dentro de esta carpeta:
   ```bash
   cd fitnessencial-app
   npx expo start
   ```
3. Aparece un **código QR** en la terminal. Escanéalo:
   - iPhone: con la **cámara** del iPhone.
   - Android: desde **dentro de Expo Go**.
4. La app se abre en tu teléfono. (El Mac y el teléfono deben estar en la **misma red wifi**.)

### Cómo recorrer la demo
- En la pantalla de inicio, entra como **Kike Grana (Entrenador)** o como un **cliente**
  (Marta / David).
- **Entrenador**: lista de clientes → abre un cliente → pestañas Entreno / Nutrición / Progreso
  / Chat. Edita rutinas, macros y comidas; chatea; revisa el progreso.
- **Cliente**: pestañas Hoy / Entreno / Nutrición / Progreso / Chat. Marca ejercicios, registra
  peso y sube foto, chatea con el entrenador.
- En **Perfil** (entrenador) puedes **reiniciar la demo** o **cerrar sesión**.

## Estructura
```
src/
  app/            rutas (Expo Router): login, (trainer)/, (client)/
  components/     UI de marca, gráficos y vistas de cada función
  lib/
    theme.ts      colores y tipografía de Fitnessencial
    db/           capa de datos (mock con AsyncStorage; se cambiará por Supabase)
assets/images/    icono y splash de la app (icon-brand.png, splash-brand.png)
```

## Publicar en la App Store (cuando decidas pagar los ~99 €/año)

Esto es la **fase final**. Resumen de pasos (te acompaño cuando llegue el momento):

1. **Apple Developer Program**: date de alta en https://developer.apple.com/programs/ (~99 €/año).
2. **Instala EAS** y entra con tu cuenta de Expo (gratis):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
3. **Compila en la nube** (no necesitas Xcode):
   ```bash
   eas build --platform ios --profile production
   ```
   EAS te guía para crear los certificados y perfiles de Apple automáticamente.
4. **Crea la app en App Store Connect** (nombre, icono, capturas, descripción, privacidad).
5. **Envía a revisión**:
   ```bash
   eas submit --platform ios
   ```
6. Apple revisa (suele tardar 1–3 días). Si la aprueban, ya está publicada.

> Apple **rechaza webs disfrazadas de app**. Esta app es nativa real (Expo/React Native), así
> que cumple ese requisito. Antes de publicar conviene tener el **backend real** (Supabase) para
> que el login, el chat y los datos sean de verdad multiusuario.

## Siguiente fase (backend real)
Cambiar `src/lib/db` (hoy mock) por **Supabase**: login con email, base de datos Postgres, chat
en tiempo real y almacenamiento de fotos. Las pantallas no cambian: solo la capa de datos.
