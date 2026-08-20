import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { useLang } from "@/src/context/LanguageContext";
import { colors, radius, font } from "@/src/theme";

export default function LanguageToggle({ light = false }: { light?: boolean }) {
  const { lang, toggle } = useLang();
  const active = light ? "#fff" : colors.brandPrimary;
  const inactive = light ? "rgba(255,255,255,0.5)" : colors.muted;
  const bg = light ? "rgba(255,255,255,0.18)" : colors.brandTertiary;

  return (
    <Pressable testID="language-toggle" onPress={toggle} style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.seg, { color: lang === "hi" ? active : inactive }]}>हि</Text>
      <View style={[styles.divider, { backgroundColor: inactive }]} />
      <Text style={[styles.seg, { color: lang === "en" ? active : inactive }]}>EN</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  seg: { fontSize: font.base, fontWeight: "800" },
  divider: { width: 1, height: 16, opacity: 0.6 },
});
