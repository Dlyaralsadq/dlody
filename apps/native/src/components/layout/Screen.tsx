import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/theme";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboard?: boolean;
  bg?: string;
};

export default function Screen({
  children,
  scroll = false,
  edges = ["top", "bottom"],
  style,
  contentStyle,
  keyboard = false,
  bg = Colors.bgRoot,
}: Props) {
  const inner = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  const content = keyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.fill}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={edges}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
