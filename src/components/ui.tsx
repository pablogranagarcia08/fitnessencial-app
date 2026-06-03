import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { photoFor } from '@/lib/avatars';
import { colors, font, radius, space } from '@/lib/theme';

// ---------- Texto ----------
type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'mute';
const textStyle: Record<Variant, object> = {
  display: { fontSize: 30, fontWeight: font.display, color: colors.ink, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: font.bold, color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 17, fontWeight: font.semibold, color: colors.ink },
  body: { fontSize: 15, fontWeight: font.regular, color: colors.inkSoft, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: font.semibold, color: colors.mute, letterSpacing: 0.3 },
  mute: { fontSize: 13, fontWeight: font.regular, color: colors.mute },
};
export function Txt({ variant = 'body', style, ...p }: TextProps & { variant?: Variant }) {
  return <Text {...p} style={[textStyle[variant], style]} />;
}

// ---------- Pantalla ----------
export function Screen({ children, scroll = true, style, ...p }: ScrollViewProps & { scroll?: boolean }) {
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Inner
        {...(scroll ? { contentContainerStyle: [s.screenContent, style], showsVerticalScrollIndicator: false } : { style: [s.screenContent, style] })}
        {...p}
      >
        {children}
      </Inner>
    </SafeAreaView>
  );
}

// ---------- Tarjeta ----------
export function Card({ style, soft, ...p }: ViewProps & { soft?: boolean }) {
  return <View {...p} style={[s.card, soft && { backgroundColor: colors.cardSoft }, style]} />;
}

// ---------- Botón ----------
type BtnProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  small?: boolean;
};
export function Button({ title, variant = 'primary', icon, loading, small, style, ...p }: BtnProps) {
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  return (
    <Pressable
      {...p}
      style={(state) => [
        s.btn,
        small && { paddingVertical: 9, paddingHorizontal: 14 },
        primary && s.btnPrimary,
        danger && s.btnDanger,
        !primary && !danger && s.btnGhost,
        state.pressed && { opacity: 0.7 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.bg : colors.ink} />
      ) : (
        <View style={s.btnRow}>
          {icon && (
            <Ionicons name={icon} size={small ? 16 : 18} color={primary ? colors.bg : danger ? colors.danger : colors.ink} />
          )}
          <Text style={[s.btnText, { color: primary ? colors.bg : danger ? colors.danger : colors.ink, fontSize: small ? 14 : 15 }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------- Botón de icono ----------
export function IconButton({ icon, onPress, color = colors.ink, size = 22, style }: { icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; color?: string; size?: number; style?: object }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

// ---------- Avatar ----------
export function Avatar({ name, uri, source, userId, size = 44 }: { name: string; uri?: string; source?: ImageSourcePropType; userId?: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const photo = source ?? photoFor(userId) ?? (uri ? { uri } : undefined);
  if (photo) {
    return (
      <Image
        source={photo}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.line }}
        contentFit="cover"
        contentPosition="top"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color: colors.accent, fontWeight: font.bold, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ---------- Badge / Pill ----------
export function Badge({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'success' | 'mute' }) {
  const map = { accent: colors.accent, success: colors.success, mute: colors.mute };
  const c = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: c + '22', borderColor: c + '44' }]}>
      <Text style={{ color: c, fontSize: 12, fontWeight: font.semibold }}>{label}</Text>
    </View>
  );
}

// ---------- Campo de texto ----------
export function Field({ label, style, ...p }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Txt variant="label">{label}</Txt>}
      <TextInput
        placeholderTextColor={colors.mute}
        {...p}
        style={[s.input, style]}
      />
    </View>
  );
}

// ---------- Sección ----------
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Txt variant="subtitle">{children}</Txt>
      {action}
    </View>
  );
}

// ---------- Vacío ----------
export function EmptyState({ icon = 'sparkles-outline', text }: { icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={34} color={colors.mute} />
      <Txt variant="mute" style={{ textAlign: 'center', maxWidth: 240 }}>{text}</Txt>
    </View>
  );
}

export function Row({ style, ...p }: ViewProps) {
  return <View {...p} style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm }, style]} />;
}

// ---------- Cabecera ----------
export function Header({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <Row style={{ flex: 1 }}>
        {onBack && <IconButton icon="chevron-back" onPress={onBack} />}
        <View style={{ flex: 1 }}>
          <Txt variant="title">{title}</Txt>
          {subtitle ? <Txt variant="mute">{subtitle}</Txt> : null}
        </View>
      </Row>
      {right}
    </View>
  );
}

// ---------- Control segmentado ----------
export function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[s.segItem, active && s.segActive]}>
            <Text style={{ color: active ? colors.bg : colors.inkSoft, fontWeight: font.semibold, fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, paddingBottom: 48, gap: space.md, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.sm,
  },
  btn: { borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.accent },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger + '55' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontWeight: font.bold },
  iconBtn: { padding: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  input: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 15,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  seg: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line },
  segItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  segActive: { backgroundColor: colors.accent },
});
