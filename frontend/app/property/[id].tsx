import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { resolveMediaUrl, FALLBACK_IMAGES } from "@/src/constants";
import { fetchProperty, fetchContact, Property, Contact, MediaItem } from "@/src/api/client";
import { openWhatsApp, openPhone } from "@/src/lib/communication";
import { useLang } from "@/src/context/LanguageContext";

function VideoBlock({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={styles.media} contentFit="cover" nativeControls />;
}

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, loc } = useLang();
  const [property, setProperty] = useState<Property | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const [p, c] = await Promise.all([fetchProperty(id), fetchContact()]);
      setProperty(p);
      setContact(c);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyTitle}>{t("details.notFound")}</Text>
        <Pressable testID="details-retry" style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>{t("home.retry")}</Text>
        </Pressable>
        <Pressable testID="details-back-empty" onPress={() => router.back()}>
          <Text style={{ color: colors.brandPrimary, fontWeight: "600" }}>{t("details.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const media: MediaItem[] =
    property.media.length > 0
      ? property.media
      : [{ path: "fallback", type: "image", url: FALLBACK_IMAGES[property.property_type] || FALLBACK_IMAGES.home }];
  const isSold = property.status === "sold";
  const enquiryText = `Hi, I'm interested in "${property.title}" (${property.location}) priced at ₹${property.price}. Please share more details.`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View style={{ height: 320 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {media.map((m, i) => (
              <View key={i} style={{ width }}>
                {m.type === "video" ? (
                  <VideoBlock uri={resolveMediaUrl(m.url)} />
                ) : (
                  <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.media} contentFit="cover" transition={200} />
                )}
              </View>
            ))}
          </ScrollView>

          {media.length > 1 && (
            <View style={styles.dots}>
              {media.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
              ))}
            </View>
          )}

          <Pressable
            testID="details-back-button"
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>

          <View style={[styles.mediaBadge, { top: insets.top + spacing.sm }]}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.mediaBadgeText}>{media.length}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.body}>
          <View style={styles.tagRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{t(`type.${property.property_type}`)}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: isSold ? colors.error : colors.success }]}>
              <Text style={styles.typeTagText}>{isSold ? t("status.sold") : t("status.available")}</Text>
            </View>
            {property.featured && (
              <View style={[styles.statusTag, { backgroundColor: colors.brandSecondary }]}>
                <Text style={styles.typeTagText}>{t("common.featured")}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.price}>₹ {property.price}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={18} color={colors.brandPrimary} />
              <Text style={styles.metaText}>{loc(property.location)}</Text>
            </View>
            {!!property.area && (
              <View style={styles.metaItem}>
                <Ionicons name="resize-outline" size={18} color={colors.brandPrimary} />
                <Text style={styles.metaText}>{property.area}</Text>
              </View>
            )}
          </View>

          {!!property.description && (
            <>
              <Text style={styles.sectionTitle}>{t("details.description")}</Text>
              <Text style={styles.description}>{property.description}</Text>
            </>
          )}

          {property.amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t("details.amenities")}</Text>
              <View style={styles.amenityGrid}>
                {property.amenities.map((a, i) => (
                  <View key={i} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Persistent bottom CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <Pressable
          testID="cta-whatsapp"
          style={[styles.ctaBtn, { backgroundColor: colors.whatsapp }]}
          onPress={() => contact && openWhatsApp(contact.whatsapp, enquiryText)}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.ctaText}>{t("cta.whatsapp")}</Text>
        </Pressable>
        <Pressable
          testID="cta-call"
          style={[styles.ctaBtn, { backgroundColor: colors.brandPrimary }]}
          onPress={() => contact && openPhone(contact.phone)}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.ctaText}>{t("cta.call")}</Text>
        </Pressable>
        <Pressable
          testID="cta-enquiry"
          style={[styles.ctaBtn, { backgroundColor: colors.brandSecondary }]}
          onPress={() =>
            router.push({
              pathname: "/enquiry",
              params: { property_id: property.id, property_title: property.title },
            })
          }
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>{t("cta.enquiry")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  media: { width: "100%", height: 320, backgroundColor: colors.surfaceTertiary },
  dots: { position: "absolute", bottom: spacing.md, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff", width: 18 },
  backBtn: {
    position: "absolute",
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBadge: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.pill,
  },
  mediaBadgeText: { color: "#fff", fontWeight: "700", fontSize: font.sm },
  body: { padding: spacing.lg },
  tagRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  typeTag: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  statusTag: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  typeTagText: { color: "#fff", fontSize: font.sm, fontWeight: "700" },
  title: { fontSize: font["2xl"], fontWeight: "800", color: colors.onSurface },
  price: { fontSize: font.xl, fontWeight: "800", color: colors.brandSecondary, marginTop: spacing.xs },
  metaRow: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.md, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: font.base, color: colors.onSurfaceTertiary, fontWeight: "600" },
  sectionTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.sm },
  description: { fontSize: font.base, lineHeight: 22, color: colors.onSurfaceTertiary },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "46%" },
  amenityText: { fontSize: font.base, color: colors.onSurfaceTertiary },
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  ctaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: radius.md,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: font.base },
  emptyTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  retryBtn: { backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  retryText: { color: "#fff", fontWeight: "700" },
});
