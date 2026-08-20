import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { submitEnquiry } from "@/src/api/client";

export default function EnquiryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ property_id?: string; property_title?: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!name.trim() || phone.trim().length < 8) {
      setErr("Please enter your name and a valid phone number.");
      return;
    }
    setSubmitting(true);
    try {
      await submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
        property_id: params.property_id || null,
        property_title: params.property_title || null,
      });
      setDone(true);
    } catch {
      setErr("Could not send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Enquiry Sent!</Text>
        <Text style={styles.successSub}>Thank you. Munesh Properties will contact you shortly.</Text>
        <Pressable
          testID="enquiry-new-button"
          style={styles.submitBtn}
          onPress={() => {
            setDone(false);
            setName(""); setPhone(""); setEmail(""); setMessage("");
          }}
        >
          <Text style={styles.submitText}>Send Another</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Enquiry Form</Text>
        <Text style={styles.headerSub}>Share your details and we'll reach out to you</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        {!!params.property_title && (
          <View style={styles.propBanner}>
            <Ionicons name="home-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.propBannerText} numberOfLines={2}>Regarding: {params.property_title}</Text>
          </View>
        )}

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          testID="enquiry-name-input"
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          testID="enquiry-phone-input"
          style={styles.input}
          placeholder="e.g. 98765 43210"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput
          testID="enquiry-email-input"
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          testID="enquiry-message-input"
          style={[styles.input, styles.textArea]}
          placeholder="I'm interested in..."
          placeholderTextColor={colors.muted}
          multiline
          value={message}
          onChangeText={setMessage}
        />

        {!!err && <Text style={styles.errText}>{err}</Text>}

        <Pressable testID="enquiry-submit-button" style={styles.submitBtn} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send Enquiry</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  header: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface },
  headerSub: { fontSize: font.base, color: colors.muted, marginTop: 2 },
  propBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  propBannerText: { flex: 1, color: colors.brandPrimary, fontWeight: "600", fontSize: font.base },
  label: { fontSize: font.base, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: font.base,
    color: colors.onSurface,
  },
  textArea: { height: 110, paddingTop: spacing.md, textAlignVertical: "top" },
  errText: { color: colors.error, marginTop: spacing.md, fontSize: font.base },
  submitBtn: {
    backgroundColor: colors.brandPrimary,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    ...shadow.card,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: font.lg },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface },
  successSub: { fontSize: font.base, color: colors.muted, textAlign: "center" },
});
