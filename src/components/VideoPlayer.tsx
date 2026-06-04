import { Ionicons } from '@expo/vector-icons';
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

// Abre el vídeo: en web muestra el modal (iframe); en móvil abre YouTube/navegador.
export async function openVideoNative(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {}
}

// Modal de reproducción (solo se usa en web; en móvil se abre el navegador).
export function VideoModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  const id = youTubeId(url ?? undefined);
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.box} onPress={() => {}}>
          <View style={st.bar}>
            <Txt variant="subtitle" style={{ fontSize: 15 }}>Explicación del ejercicio</Txt>
            <IconButton icon="close" onPress={onClose} />
          </View>
          <View style={st.player}>
            {Platform.OS === 'web' && id ? (
              // @ts-ignore — iframe es un elemento DOM válido en react-native-web
              <iframe
                src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                style={{ border: 0, width: '100%', height: '100%', borderRadius: 12 }}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="logo-youtube" size={40} color={colors.danger} />
                <Txt variant="mute">{id ? 'Abriendo el vídeo…' : 'Enlace de vídeo no válido'}</Txt>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: space.md },
  box: { width: '100%', maxWidth: 640, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: space.sm },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
});
