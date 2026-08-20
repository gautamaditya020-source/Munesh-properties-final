import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { fetchContact, Contact } from "@/src/api/client";
import { openWhatsApp, openTelegram, openPhone, openEmail } from "@/src/lib/communication";
import { useLang } from "@/src/context/LanguageContext";
import LanguageToggle from "@/src/components/LanguageToggle";
import { LOCATIONS } from "@/src/constants";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { t, loc } = useLang();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchContact()
        .then(setContact)
        .finally(() => setLoading(false));
    }, [])
  );

  const channels = contact
    ? [
        { key: "whatsapp", label: t("contact.whatsapp"), value: contact.whatsapp, icon: "logo-whatsapp" as const, color: colors.whatsapp, action: () => openWhatsApp(contact.whatsapp, "Hi, I'm interested in a property.") },
        { key: "call", label: t("contact.call"), value: contact.phone, icon: "call" as const, color: colors.brandPrimary, action: () => openPhone(contact.phone) },
        { key: "telegram", label: t("contact.telegram"), value: `@${contact.telegram}`, icon: "paper-plane" as const, color: colors.telegram, action: () => openTelegram(contact.telegram) },
        { key: "email", label: t("contact.email"), value: contact.email, icon: "mail" as const, color: colors.brandSecondary, action: () => openEmail(contact.email, "Property Enquiry") },
      ]
    : [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t("contact.title")}</Text>
            <Text style={styles.headerSub}>{t("contact.subtitle")}</Text>
          </View>
          <LanguageToggle />
        </View>
      </View>

      {loading || !contact ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {channels.map((c) => (
            <Pressable
              key={c.key}
              testID={`contact-${c.key}-button`}
              style={styles.channelCard}
              onPress={c.action}
            >
              <View style={[styles.channelIcon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelLabel}>{c.label}</Text>
                <Text style={styles.channelValue} numberOfLines={1}>{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.brandPrimary} />
              <Text style={styles.infoText}>{contact.address}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.aboutTitle}>{t("contact.about")}</Text>
            <Text style={styles.aboutText}>{contact.about}</Text>
          </View>

          <Text style={styles.locTitle}>{t("contact.areas")}</Text>
          <View style={styles.locWrap}>
            {LOCATIONS.map((l) => (
              <View key={l} style={styles.locPill}>
                <Ionicons name="location-outline" size={13} color={colors.brandPrimary} />
                <Text style={styles.locPillText}>{loc(l)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerTitle: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface },
  headerSub: { fontSize: font.base, color: colors.muted, marginTop: 2 },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  channelIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  channelLabel: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  channelValue: { fontSize: font.base, color: colors.muted, marginTop: 1 },
  infoCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadow.card,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoText: { flex: 1, fontSize: font.base, color: colors.onSurfaceTertiary, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  aboutTitle: { fontSize: font.base, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.xs },
  aboutText: { fontSize: font.base, lineHeight: 21, color: colors.onSurfaceTertiary },
  locTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  locWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  locPillText: { fontSize: font.sm, color: colors.brandPrimary, fontWeight: "600" },
});
