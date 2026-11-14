import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Typography, Layout } from "@/theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  password?: boolean;
  rtl?: boolean;
};

const Input = forwardRef<TextInput, Props>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      password = false,
      rtl = true,
      style,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const borderColor = error
      ? Colors.rose
      : focused
      ? Colors.indigoLight
      : Colors.border;

    const bgColor = focused
      ? "rgba(99,102,241,0.13)"
      : Colors.bgInput;

    return (
      <View style={styles.wrapper}>
        {label && (
          <Text style={[styles.label, rtl && styles.rtlLabel]}>{label}</Text>
        )}
        <View
          style={[
            styles.inputRow,
            {
              borderColor,
              backgroundColor: bgColor,
              borderWidth: focused ? 1.5 : 1,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.iconLeft}>{leftIcon}</View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              rtl && { textAlign: "right", writingDirection: "rtl" },
              leftIcon ? { paddingLeft: 0 } : undefined,
              style,
            ]}
            placeholderTextColor={Colors.text3}
            secureTextEntry={password && !showPassword}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {password && (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.iconRight}
              hitSlop={12}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={Colors.text3}
              />
            </TouchableOpacity>
          )}
          {!password && rightIcon && (
            <View style={styles.iconRight}>{rightIcon}</View>
          )}
        </View>
        {(error || hint) && (
          <Text
            style={[
              styles.hint,
              error ? styles.hintError : undefined,
              rtl && { textAlign: "right" },
            ]}
          >
            {error ?? hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
export default Input;

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text1,
    letterSpacing: 0.1,
  },
  rtlLabel: {
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    height: Layout.inputHeight,
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 16, // ← 16px minimum to prevent iOS auto-zoom
    color: Colors.text1,
    fontWeight: Typography.weights.normal,
    height: "100%",
  },
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.text3,
  },
  hintError: {
    color: Colors.rose,
  },
});
