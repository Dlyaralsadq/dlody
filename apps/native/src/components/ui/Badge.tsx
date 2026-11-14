import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Radius } from "@/theme";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "indigo";

type Props = {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
};

const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
  default:  { bg: Colors.bgHover,                 text: Colors.text2,       border: Colors.border },
  success:  { bg: "rgba(16,185,129,0.12)",         text: "#34d399",          border: "rgba(16,185,129,0.25)" },
  warning:  { bg: "rgba(245,158,11,0.12)",         text: "#fbbf24",          border: "rgba(245,158,11,0.25)" },
  danger:   { bg: "rgba(244,63,94,0.12)",          text: "#fb7185",          border: "rgba(244,63,94,0.25)" },
  info:     { bg: "rgba(6,182,212,0.12)",          text: Colors.cyan,        border: "rgba(6,182,212,0.25)" },
  indigo:   { bg: "rgba(99,102,241,0.15)",         text: Colors.indigoLight, border: "rgba(99,102,241,0.3)" },
};

export default function Badge({ label, variant = "default", size = "sm" }: Props) {
  const vs = variantStyles[variant];
  const fontSize = size === "sm" ? Typography.sizes.xs : Typography.sizes.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color: vs.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
