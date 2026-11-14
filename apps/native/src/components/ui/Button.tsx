import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius, Typography, Layout } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "patient";
type Size = "sm" | "md" | "lg";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const gradients: Record<string, readonly [string, string]> = {
  primary: ["#6366f1", "#8b5cf6"],
  patient: ["#0891b2", "#6366f1"],
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}: Props) {
  const isGradient = variant === "primary" || variant === "patient";
  const opacity = disabled || loading ? 0.5 : 1;

  const h = size === "sm" ? 40 : size === "lg" ? 56 : Layout.buttonHeight;
  const fontSize =
    size === "sm"
      ? Typography.sizes.sm
      : size === "lg"
      ? Typography.sizes.md
      : Typography.sizes.base;
  const px = size === "sm" ? 16 : size === "lg" ? 28 : 20;

  const content = (
    <>
      {icon && !loading && icon}
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? Colors.indigo : "#fff"}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color:
                variant === "secondary"
                  ? Colors.text2
                  : variant === "ghost"
                  ? Colors.indigoLight
                  : variant === "danger"
                  ? Colors.rose
                  : "#fff",
              fontWeight: Typography.weights.bold,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </>
  );

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[{ width: fullWidth ? "100%" : undefined, opacity }, style]}
      >
        <LinearGradient
          colors={gradients[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { height: h, paddingHorizontal: px },
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bgColor =
    variant === "secondary"
      ? Colors.bgHover
      : variant === "danger"
      ? "rgba(244,63,94,0.15)"
      : "transparent";

  const borderColor =
    variant === "secondary"
      ? Colors.border
      : variant === "danger"
      ? "rgba(244,63,94,0.3)"
      : "transparent";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          height: h,
          paddingHorizontal: px,
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === "ghost" ? 0 : 1,
          opacity,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  label: {
    letterSpacing: 0.2,
  },
});
