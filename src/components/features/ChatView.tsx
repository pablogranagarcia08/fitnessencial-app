import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Txt } from '@/components/ui';
import { useStore, useThread } from '@/lib/db/store';
import { chatAssistant } from '@/lib/chat/assistant';
import { colors, font, radius, space } from '@/lib/theme';

// coachId: si se pasa y el mensaje va dirigido al coach, el asistente del coach responde solo.
export function ChatView({ meId, otherId, coachId }: { meId: string; otherId: string; coachId?: string }) {
  const messages = useThread(meId, otherId);
  const sendMessage = useStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollSoon = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(meId, otherId, t);
    setText('');
    scrollSoon();

    // Respuesta automática del coach cuando el cliente le escribe.
    if (coachId && otherId === coachId) {
      setTyping(true);
      chatAssistant
        .reply(t)
        .then((answer) => {
          setTimeout(() => {
            sendMessage(coachId, meId, answer);
            setTyping(false);
            scrollSoon();
          }, 800);
        })
        .catch(() => setTyping(false));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: space.md, gap: 8, flexGrow: 1, justifyContent: 'flex-end' }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const mine = item.fromId === meId;
          return (
            <View style={[st.bubbleWrap, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
              <View style={[st.bubble, mine ? st.mine : st.theirs]}>
                <Txt style={{ color: mine ? colors.bg : colors.ink, fontSize: 15 }}>{item.text}</Txt>
              </View>
              <Txt variant="mute" style={[st.time, { textAlign: mine ? 'right' : 'left' }]}>
                {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Txt>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="chatbubbles-outline" size={34} color={colors.mute} />
            <Txt variant="mute" style={{ marginTop: 8 }}>Empieza la conversación.</Txt>
          </View>
        }
      />
      {typing && (
        <View style={st.typing}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.accent} />
          <Txt variant="mute" style={{ fontSize: 12 }}>escribiendo…</Txt>
        </View>
      )}
      <View style={st.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.mute}
          style={st.input}
          multiline
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={({ pressed }) => [st.sendBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="arrow-up" size={22} color={colors.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  bubbleWrap: { maxWidth: '80%' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md },
  mine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  time: { fontSize: 10, marginTop: 3, paddingHorizontal: 4 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingBottom: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
