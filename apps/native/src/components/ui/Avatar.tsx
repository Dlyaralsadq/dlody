import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius, Typography } from "@/theme";

type Props = {
  name?: string;
  logoUrl?: string | null;
  /** Alias for logoUrl – used throughout the app */
  uri?: string | null;
  size?: number;
  round?: boolean;
  variant?: "doctor" | "patient" | "admin";
  style?: object;
};

export default function Avatar({
  name,
  logoUrl,
  uri,
  size = 44,
  round = true,
  variant = "doctor",
  style,
}: Props) {
  // Allow either `uri` or `logoUrl` prop
  const resolvedUri = uri ?? logoUrl;
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "؟";

  const radius = round ? size / 2 : Radius.lg;
  const fontSize = size > 48 ? Typography.sizes.lg : Typography.sizes.sm;

  const gradients: Record<string, readonly [string, string]> = {
    doctor:  ["#6366f1", "#8b5cf6"],
    patient: ["#0891b2", "#6366f1"],
    admin:   ["#f59e0b", "#ef4444"],
  };

  if (resolvedUri) {
    return (
      <Image
        source={{ uri: resolvedUri.startsWith("http") ? resolvedUri : `https://tabibee.com${resolvedUri}` }}
        style={[{ width: size, height: size, borderRadius: radius }, style as any]}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: radius, ...styles.center }, style as any]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: Typography.weights.bold,
  },
});
