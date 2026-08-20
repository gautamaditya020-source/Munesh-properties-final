import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLang } from "@/src/context/LanguageContext";
import {
  fetchProperties,
  fetchEnquiries,
  fetchContact,
  updateContact,
  deleteProperty,
  deleteEnquiry,
  changeCredentials,
  Property,
  Enquiry,
  Contact,
} from "@/src/api/client";
import { resolveMediaUrl, FALLBACK_IMAGES, TYPE_LABEL } from "@/src/constants";

/* ------------------------- Login ------------------------- */
function LoginView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLang();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch {
      setErr(t("admin.wrongCreds"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        testID="admin-back-to-site"
        style={[styles.backToSite, { top: insets.top + spacing.sm }]}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      >
        <Ionicons name="chevron-back" size={20} color={colors.brandPrimary} />
        <Text style={styles.backToSiteText}>{t("admin.website")}</Text>
      </Pressable>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
        bottomOffset={20}
      >
        <View style={styles.loginLogo}>
          <Ionicons name="lock-closed" size={30} color="#fff" />
        </View>
        <Text style={styles.loginTitle}>{t("admin.login")}</Text>
        <Text style={styles.loginSub}>{t("admin.loginSub")}</Text>

        <Text style={styles.label}>{t("admin.username")}</Text>
        <TextInput
          testID="admin-username-input"
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>{t("admin.password")}</Text>
        <View style={styles.passRow}>
          <TextInput
            testID="admin-password-input"
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable testID="toggle-password" onPress={() => setShow((s) => !s)} style={{ padding: spacing.md }}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        </View>

        {!!err && <Text style={styles.errText}>{err}</Text>}

        <Pressable testID="admin-login-button" style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t("admin.signIn")}</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

/* ------------------------- Dashboard ------------------------- */
type Tab = "properties" | "enquiries" | "settings";

function PropertiesTab() {
  const router = useRouter();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchProperties()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    try { await deleteProperty(id); } catch { load(); }
  };

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>;

  return (
    <View style={{ flex: 1 }}>
      {items.length === 0 ? (
        <View style={styles.tabCenter}>
          <Ionicons name="home-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No active listings</Text>
          <Text style={styles.emptySub}>Tap the + button to add your first property.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const img = item.media.find((m) => m.type === "image");
            const uri = img ? resolveMediaUrl(img.url) : FALLBACK_IMAGES[item.property_type];
            return (
              <View style={styles.adminRow} testID={`admin-property-${item.id}`}>
                <Image source={{ uri }} style={styles.adminThumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.adminMeta}>{TYPE_LABEL[item.property_type]} · {item.location}</Text>
                  <Text style={styles.adminPrice}>₹ {item.price} · {item.status === "sold" ? "Sold" : "Available"}</Text>
                </View>
                <View style={{ gap: spacing.sm }}>
                  <Pressable
                    testID={`edit-property-${item.id}`}
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: "/admin/property-form", params: { id: item.id } })}
                  >
                    <Ionicons name="pencil" size={16} color={colors.brandPrimary} />
                  </Pressable>
                  <Pressable
                    testID={`delete-property-${item.id}`}
                    style={[styles.actionBtn, { backgroundColor: "#FBE9E7" }]}
                    onPress={() => remove(item.id)}
                  >
                    <Ionicons name="trash" size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
      <Pressable
        testID="add-property-fab"
        style={styles.fab}
        onPress={() => router.push("/admin/property-form")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

function EnquiriesTab() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchEnquiries().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((e) => e.id !== id));
    try { await deleteEnquiry(id); } catch { load(); }
  };

  if (loading) return <View style={styles.tabCenter}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>;

  if (items.length === 0) {
    return (
      <View style={styles.tabCenter}>
        <Ionicons name="mail-open-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyTitle}>No enquiries yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.enqCard} testID={`enquiry-${item.id}`}>
          <View style={styles.enqHead}>
            <Text style={styles.adminTitle}>{item.name}</Text>
            <Pressable testID={`delete-enquiry-${item.id}`} onPress={() => remove(item.id)}>
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.enqRow}>
            <Ionicons name="call-outline" size={14} color={colors.brandPrimary} />
            <Text style={styles.enqText}>{item.phone}</Text>
          </View>
          {!!item.email && (
            <View style={styles.enqRow}>
              <Ionicons name="mail-outline" size={14} color={colors.brandPrimary} />
              <Text style={styles.enqText}>{item.email}</Text>
            </View>
          )}
          {!!item.property_title && (
            <View style={styles.enqRow}>
              <Ionicons name="home-outline" size={14} color={colors.brandPrimary} />
              <Text style={styles.enqText}>{item.property_title}</Text>
            </View>
          )}
          {!!item.message && <Text style={styles.enqMessage}>{item.message}</Text>}
        </View>
      )}
    />
  );
}

function SettingsTab() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchContact().then(setContact).catch(() => {});
  }, []));

  const set = (k: keyof Contact, v: string) => setContact((c) => (c ? { ...c, [k]: v } : c));

  const save = async () => {
    if (!contact) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateContact(contact);
      setSaved(true);
    } catch {}
    finally { setSaving(false); }
  };

  if (!contact) return <View style={styles.tabCenter}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>;

  const fields: { key: keyof Contact; label: string; multiline?: boolean }[] = [
    { key: "whatsapp", label: "WhatsApp Number" },
    { key: "phone", label: "Phone Number" },
    { key: "telegram", label: "Telegram Username" },
    { key: "email", label: "Email Address" },
    { key: "address", label: "Address" },
    { key: "about", label: "About Text", multiline: true },
  ];

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }} bottomOffset={20}>
      <Text style={styles.settingsTitle}>Contact Details</Text>
      <Text style={styles.emptySub}>These appear across the website & app.</Text>
      {fields.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            testID={`contact-${f.key}-input`}
            style={[styles.input, f.multiline && styles.textArea]}
            value={String(contact[f.key] ?? "")}
            onChangeText={(v) => set(f.key, v)}
            placeholderTextColor={colors.muted}
            multiline={f.multiline}
            autoCapitalize="none"
          />
        </View>
      ))}
      {saved && <Text style={styles.savedText}>Saved successfully!</Text>}
      <Pressable testID="save-contact-button" style={styles.submitBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Changes</Text>}
      </Pressable>

      <SecuritySection />
    </KeyboardAwareScrollView>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setMsg("");
    if (!currentPassword) {
      setErr("Please enter your current password.");
      return;
    }
    if (!newUsername.trim() && !newPassword) {
      setErr("Enter a new username and/or a new password.");
      return;
    }
    if (newUsername.trim() && newUsername.trim().length < 3) {
      setErr("Username must be at least 3 characters.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setErr("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      await changeCredentials(currentPassword, newUsername.trim() || undefined, newPassword || undefined);
      setMsg("Credentials updated successfully!");
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setErr(e?.message || "Failed to update credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={styles.settingsTitle}>Login &amp; Security</Text>
      <Text style={styles.emptySub}>Change the admin username or password used to sign in.</Text>

      <Text style={styles.label}>Current Password</Text>
      <View style={styles.passRow}>
        <TextInput
          testID="current-password-input"
          style={[styles.input, { flex: 1, borderWidth: 0 }]}
          placeholder="Current password"
          placeholderTextColor={colors.muted}
          secureTextEntry={!show}
          autoCapitalize="none"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Pressable testID="toggle-credentials-visibility" onPress={() => setShow((s) => !s)} style={{ padding: spacing.md }}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
        </Pressable>
      </View>

      <Text style={styles.label}>New Username (optional)</Text>
      <TextInput
        testID="new-username-input"
        style={styles.input}
        placeholder="Leave blank to keep current username"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        value={newUsername}
        onChangeText={setNewUsername}
      />

      <Text style={styles.label}>New Password (optional)</Text>
      <TextInput
        testID="new-password-input"
        style={styles.input}
        placeholder="Leave blank to keep current password"
        placeholderTextColor={colors.muted}
        secureTextEntry={!show}
        autoCapitalize="none"
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {!!newPassword && (
        <>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            testID="confirm-password-input"
            style={styles.input}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!show}
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </>
      )}

      {!!err && <Text style={styles.errText}>{err}</Text>}
      {!!msg && <Text style={styles.savedText}>{msg}</Text>}

      <Pressable testID="update-credentials-button" style={styles.submitBtn} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Credentials</Text>}
      </Pressable>
    </View>
  );
}

function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("properties");

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "properties", label: "Listings", icon: "list-outline" },
    { key: "enquiries", label: "Enquiries", icon: "mail-outline" },
    { key: "settings", label: "Settings", icon: "settings-outline" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.dashHeader, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          testID="admin-view-site-button"
          style={styles.viewSiteBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        >
          <Ionicons name="globe-outline" size={18} color={colors.brandPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Munesh Properties</Text>
        </View>
        <Pressable testID="admin-logout-button" style={styles.logoutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.dashTabs}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              testID={`admin-tab-${t.key}`}
              style={[styles.dashTab, active && styles.dashTabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={18} color={active ? colors.brandPrimary : colors.muted} />
              <Text style={[styles.dashTabText, active && styles.dashTabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "properties" && <PropertiesTab />}
      {tab === "enquiries" && <EnquiriesTab />}
      {tab === "settings" && <SettingsTab />}
    </View>
  );
}

export default function AdminScreen() {
  const { isAuthed, loading, signOut } = useAuth();

  // Auto-logout when the admin panel is closed (screen unmounts / navigates back
  // to the website). Editing a property pushes a modal ON TOP, so this screen
  // stays mounted and the admin is NOT logged out mid-edit.
  const stateRef = useRef({ isAuthed, signOut });
  stateRef.current = { isAuthed, signOut };
  useEffect(() => {
    return () => {
      if (stateRef.current.isAuthed) stateRef.current.signOut();
    };
  }, []);

  if (loading) {
    return <View style={[styles.container, styles.tabCenter]}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>;
  }
  return isAuthed ? <Dashboard /> : <LoginView />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  tabCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  loginLogo: {
    width: 70, height: 70, borderRadius: radius.lg, backgroundColor: colors.brandPrimary,
    alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: spacing.lg,
  },
  loginTitle: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface, textAlign: "center" },
  loginSub: { fontSize: font.base, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: spacing.xl },
  label: { fontSize: font.base, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50, fontSize: font.base, color: colors.onSurface,
  },
  textArea: { height: 100, paddingTop: spacing.md, textAlignVertical: "top" },
  passRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  errText: { color: colors.error, marginTop: spacing.md, fontSize: font.base },
  submitBtn: {
    backgroundColor: colors.brandPrimary, height: 52, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", marginTop: spacing.xl, ...shadow.card,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: font.lg },
  savedText: { color: colors.success, fontWeight: "600", marginTop: spacing.md, textAlign: "center" },
  dashHeader: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  viewSiteBtn: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  backToSite: {
    position: "absolute", left: spacing.lg, zIndex: 10, flexDirection: "row", alignItems: "center", gap: 2,
    paddingVertical: spacing.xs, paddingRight: spacing.sm,
  },
  backToSiteText: { color: colors.brandPrimary, fontWeight: "700", fontSize: font.base },
  headerTitle: { fontSize: font.xl, fontWeight: "800", color: colors.onSurface },
  headerSub: { fontSize: font.sm, color: colors.muted },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FBE9E7", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  logoutText: { color: colors.error, fontWeight: "700", fontSize: font.sm },
  dashTabs: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  dashTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  dashTabActive: { backgroundColor: colors.brandTertiary },
  dashTabText: { fontSize: font.sm, fontWeight: "600", color: colors.muted },
  dashTabTextActive: { color: colors.brandPrimary },
  adminRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceSecondary,
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, ...shadow.card,
  },
  adminThumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  adminTitle: { fontSize: font.base, fontWeight: "700", color: colors.onSurface },
  adminMeta: { fontSize: font.sm, color: colors.muted, marginTop: 2 },
  adminPrice: { fontSize: font.sm, color: colors.brandSecondary, fontWeight: "600", marginTop: 2 },
  actionBtn: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  fab: {
    position: "absolute", right: spacing.lg, bottom: 90, width: 56, height: 56, borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center", ...shadow.card,
  },
  enqCard: { backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, ...shadow.card },
  enqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  enqRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  enqText: { fontSize: font.base, color: colors.onSurfaceTertiary },
  enqMessage: { fontSize: font.base, color: colors.onSurfaceTertiary, marginTop: spacing.sm, fontStyle: "italic" },
  settingsTitle: { fontSize: font.xl, fontWeight: "800", color: colors.onSurface },
  emptyTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  emptySub: { fontSize: font.base, color: colors.muted, textAlign: "center" },
});
