import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Txt } from '@/components/ui';
import { colors, radius, space } from '@/lib/theme';

// Extrae el ID de vídeo de cualquier formato de enlace de YouTube.
export function youTubeId(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  // por si pegan solo el ID
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

// Extrae el ID de una playlist de YouTube (enlaces con ?list=...).
export function youTubePlaylistId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/[?&]list=([\w-]+)/);
  return m ? m[1] : null;
}

// Extrae el ID de un archivo de Google Drive (enlaces /file/d/ID o ?id=ID).
export function driveId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m && url.includes('drive.google.com') ? m[1] : null;
}

// ¿El enlace es reproducible (YouTube vídeo/playlist o Google Drive)?
export function hasVideo(url?: string): boolean {
  return !!(youTubeId(url) || youTubePlaylistId(url) || driveId(url));
}

// Miniatura del vídeo (YouTube o Drive). Las playlists no tienen miniatura única.
export function videoThumb(url?: string): string | null {
  const d = driveId(url);
  if (d) return `https://drive.google.com/thumbnail?id=${d}&sz=w320`;
  const y = youTubeId(url);
  if (y) return `https://img.youtube.com/vi/${y}/mqdefault.jpg`;
  return null;
}

// Reproductor incrustado en línea (al lado del ejercicio). En web muestra el vídeo;
// en móvil muestra una miniatura grande que abre el vídeo en el navegador/app.
export function InlineVideo({ url, height = 420 }: { url?: string; height?: number }) {
  const src = embedSrc(url ?? null);
  if (Platform.OS === 'web' && src) {
    return (
      <View style={[st.inline, { height }]}>
        {/* @ts-ignore — iframe es válido en react-native-web */}
        <iframe src={src} style={{ border: 0, width: '100%', height: '100%' }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
      </View>
    );
  }
  // Móvil: miniatura a tamaño completo que abre el vídeo (frame entero, sin recortar).
  const thumb = videoThumb(url);
  return (
    <Pressable onPress={() => url && openVideoNative(url)} style={[st.inline, { height, alignItems: 'center', justifyContent: 'center' }]}>
      {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
      <View style={st.playDot}><Ionicons name="play" size={16} color="#fff" /></View>
    </Pressable>
  );
}

// Miniatura clicable. `full` la hace ocupar todo el ancho en 16:9 (para móvil).
// Usa contentFit="contain" para mostrar el frame del vídeo entero, sin recortes.
export function VideoThumb({ url, onPress, width = 96, height = 54, full }: { url?: string; onPress: () => void; width?: number; height?: number; full?: boolean }) {
  const thumb = videoThumb(url);
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [full && { width: '100%' }, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[st.thumb, full ? { width: '100%', aspectRatio: 16 / 9 } : { width, height }]}>
        {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
        <View style={st.playDot}>
          <Ionicons name="play" size={full ? 22 : 14} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

function embedSrc(url: string | null): string | null {
  const drive = driveId(url ?? undefined);
  if (drive) return `https://drive.google.com/file/d/${drive}/preview`;
  const id = youTubeId(url ?? undefined);
  const list = youTubePlaylistId(url ?? undefined);
  if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0${list ? `&list=${list}` : ''}`;
  if (list) return `https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1&rel=0`;
  return null;
}

// Abre el vídeo: en web muestra el modal (iframe); en móvil abre YouTube/navegador.
export async function openVideoNative(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {}
}

// Modal de reproducción (solo se usa en web; en móvil se abre el navegador).
export function VideoModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  const src = embedSrc(url);
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.box} onPress={() => {}}>
          <View style={st.bar}>
            <Txt variant="subtitle" style={{ fontSize: 15 }}>Explicación del ejercicio</Txt>
            <IconButton icon="close" onPress={onClose} />
          </View>
          <View style={st.player}>
            {Platform.OS === 'web' && src ? (
              // @ts-ignore — iframe es un elemento DOM válido en react-native-web
              <iframe
                src={src}
                style={{ border: 0, width: '100%', height: '100%' }}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="logo-youtube" size={40} color={colors.danger} />
                <Txt variant="mute">{src ? 'Abriendo el vídeo…' : 'Enlace de vídeo no válido'}</Txt>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  // Reproductor horizontal (apaisado 16:9), centrado.
  box: { width: '94%', maxWidth: 640, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: space.sm },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  inline: { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: colors.line },
  thumb: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
