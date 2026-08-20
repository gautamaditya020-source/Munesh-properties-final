import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { CATEGORIES, LOCATIONS, resolveMediaUrl } from "@/src/constants";
import {
  fetchProperty,
  createProperty,
  updateProperty,
  uploadMedia,
  MediaItem,
} from "@/src/api/client";

const TYPES = CATEGORIES.filter((c) => c.key !== "all");

export default function PropertyForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("plot");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [status, setStatus] = useState("available");
  const [featured, setFeatured] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    fetchProperty(id as string)
      .then((p) => {
        setTitle(p.title);
        setPropertyType(p.property_type);
        setLocation(p.location);
        setPrice(p.price);
        setArea(p.area);
        setDescription(p.description);
        setAmenitiesText(p.amenities.join(", "));
        setStatus(p.status);
        setFeatured(p.featured);
        setMedia(p.media);
      })
      .catch(() => setErr("Could not load property"))
      .finally(() => setLoading(false));
  }, [id]);

  const ensurePermission = async () => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (req.granted) return true;
      if (req.canAskAgain) {
        setErr("Media access is needed to upload photos and videos.");
        return false;
      }
    }
    setErr("Media access is blocked. Please enable it in Settings.");
    return false;
  };

  const pick = async (kind: "images" | "videos") => {
    setErr("");
    const ok = await ensurePermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [kind],
      quality: 0.7,
      allowsMultipleSelection: kind === "images",
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      for (const asset of result.assets) {
        const name = asset.fileName || `${Date.now()}.${kind === "videos" ? "mp4" : "jpg"}`;
        const type = asset.mimeType || (kind === "videos" ? "video/mp4" : "image/jpeg");
        const item = await uploadMedia(asset.uri, name, type);
        setMedia((prev) => [...prev, item]);
      }
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (path: string) => setMedia((prev) => prev.filter((m) => m.path !== path));

  const save = async () => {
    setErr("");
    if (!title.trim() || !price.trim()) {
      setErr("Title and price are required.");
      return;
    }
    setSaving(true);
    const body = {
      title: title.trim(),
      property_type: propertyType,
      location,
      price: price.trim(),
      area: area.trim(),
      description: description.trim(),
      amenities: amenitiesText.split(",").map((a) => a.trim()).filter(Boolean),
      status,
      featured,
      media,
    };
    try {
      if (isEdit) await updateProperty(id as string, body);
      else await createProperty(body);
      router.back();
    } catch (e: any) {
      setErr(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="form-close-button" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Property" : "Add Property"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} bottomOffset={20}>
        <Text style={styles.label}>Title *</Text>
        <TextInput testID="form-title-input" style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. 200 sq yd Plot near Highway" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Property Type</Text>
        <View style={styles.optionRow}>
          {TYPES.map((t) => {
            const active = propertyType === t.key;
            return (
              <Pressable key={t.key} testID={`type-${t.key}`} style={[styles.option, active && styles.optionActive]} onPress={() => setPropertyType(t.key)}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Location</Text>
        <View style={styles.optionRow}>
          {LOCATIONS.map((l) => {
            const active = location === l;
            return (
              <Pressable key={l} testID={`loc-${l}`} style={[styles.option, active && styles.optionActive]} onPress={() => setLocation(l)}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Price *</Text>
        <TextInput testID="form-price-input" style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. 25 Lakh / 1.2 Cr" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Area / Size</Text>
        <TextInput testID="form-area-input" style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. 1200 sq ft / 200 sq yd" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Description</Text>
        <TextInput testID="form-description-input" style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Describe the property..." placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Amenities (comma separated)</Text>
        <TextInput testID="form-amenities-input" style={styles.input} value={amenitiesText} onChangeText={setAmenitiesText} placeholder="e.g. Corner, Road facing, Boundary wall" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.optionRow}>
          {["available", "sold"].map((s) => {
            const active = status === s;
            return (
              <Pressable key={s} testID={`status-${s}`} style={[styles.option, active && styles.optionActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{s === "sold" ? "Sold" : "Available"}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable testID="form-featured-toggle" style={styles.toggleRow} onPress={() => setFeatured((f) => !f)}>
          <View style={[styles.checkbox, featured && styles.checkboxOn]}>
            {featured && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.toggleText}>Mark as Featured</Text>
        </Pressable>

        {/* Media */}
        <Text style={styles.label}>Photos & Videos</Text>
        <View style={styles.mediaGrid}>
          {media.map((m) => (
            <View key={m.path} style={styles.mediaItem}>
              {m.type === "video" ? (
                <View style={[styles.mediaThumb, styles.videoThumb]}>
                  <Ionicons name="videocam" size={22} color="#fff" />
                </View>
              ) : (
                <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.mediaThumb} contentFit="cover" />
              )}
              <Pressable testID={`remove-media-${m.path}`} style={styles.mediaRemove} onPress={() => removeMedia(m.path)}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {uploading && (
            <View style={[styles.mediaThumb, styles.center]}>
              <ActivityIndicator color={colors.brandPrimary} />
            </View>
          )}
        </View>

        <View style={styles.uploadRow}>
          <Pressable testID="add-photo-button" style={styles.uploadBtn} onPress={() => pick("images")} disabled={uploading}>
            <Ionicons name="image-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.uploadText}>Add Photos</Text>
          </Pressable>
          <Pressable testID="add-video-button" style={styles.uploadBtn} onPress={() => pick("videos")} disabled={uploading}>
            <Ionicons name="videocam-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.uploadText}>Add Video</Text>
          </Pressable>
        </View>

        {err.toLowerCase().includes("settings") && (
          <Pressable testID="open-settings-button" style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
            <Ionicons name="settings-outline" size={16} color="#fff" />
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        )}
        {!!err && <Text style={styles.errText}>{err}</Text>}

        <Pressable testID="form-save-button" style={styles.submitBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{isEdit ? "Update Property" : "Publish Property"}</Text>}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: font.lg, fontWeight: "800", color: colors.onSurface },
  label: { fontSize: font.base, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50, fontSize: font.base, color: colors.onSurface,
  },
  textArea: { height: 100, paddingTop: spacing.md, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: { paddingHorizontal: spacing.md, height: 38, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
  optionActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  optionText: { fontSize: font.base, fontWeight: "600", color: colors.onSurfaceTertiary },
  optionTextActive: { color: "#fff" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  checkbox: { width: 24, height: 24, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  toggleText: { fontSize: font.base, color: colors.onSurface, fontWeight: "600" },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  mediaItem: { position: "relative" },
  mediaThumb: { width: 90, height: 90, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  videoThumb: { backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  mediaRemove: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.error, alignItems: "center", justifyContent: "center" },
  uploadRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  uploadBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 46, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.brandPrimary, borderStyle: "dashed",
  },
  uploadText: { color: colors.brandPrimary, fontWeight: "700", fontSize: font.base },
  settingsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.brandPrimary, height: 44, borderRadius: radius.md, marginTop: spacing.md },
  settingsBtnText: { color: "#fff", fontWeight: "700" },
  errText: { color: colors.error, marginTop: spacing.md, fontSize: font.base },
  submitBtn: { backgroundColor: colors.brandSecondary, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: spacing.xl, ...shadow.card },
  submitText: { color: "#fff", fontWeight: "700", fontSize: font.lg },
});
