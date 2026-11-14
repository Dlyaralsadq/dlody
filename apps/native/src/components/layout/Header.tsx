import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography, Layout } from "@/theme";

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  rtl?: boolean;
  transparent?: boolean;
};

export default function Header({
  title,
  subtitle,
  back = false,
  right,
  rtl = true,
  transparent = false,
}: Props) {
  return (
    <View
      style={[
        styles.header,
        transparent && styles.transparent,
        !transparent && styles.bordered,
        rtl && styles.rtl,
      ]}
    >
      {/* Back button */}
      <View style={styles.side}>
        {back && (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Ionicons
              name={rtl ? "chevron-forward" : "chevron-back"}
              size={22}
              color={Colors.text1}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text
          style={[styles.title, rtl && styles.rtlText]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, rtl && styles.rtlText]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right action */}
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: Layout.headerHeight,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgRoot,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  transparent: {
    backgroundColor: "transparent",
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  side: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black as any,
    color: Colors.text1,
    letterSpacing: -0.3,
  },
  rtlText: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text3,
    marginTop: 1,
  },
});
