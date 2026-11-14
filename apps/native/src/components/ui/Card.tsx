import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { Colors, Radius, Shadows } from "@/theme";

type Props = ViewProps & {
  raised?: boolean;
  glow?: boolean;
  padding?: number;
};

export default function Card({ raised = false, glow = false, padding = 16, style, children, ...props }: Props) {
  return (
    <View
      style={[
        styles.card,
        raised && styles.raised,
        glow && styles.glow,
        { padding },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  raised: {
    backgroundColor: Colors.bgCardRaised,
    ...Shadows.md,
  },
  glow: {
    borderColor: "rgba(99,102,241,0.4)",
    ...Shadows.indigo,
  },
});
