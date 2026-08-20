import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { Property } from "@/src/api/client";
import { resolveMediaUrl, FALLBACK_IMAGES } from "@/src/constants";
import { useLang } from "@/src/context/LanguageContext";

export default function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const { t, loc } = useLang();
  const firstImage = property.media.find((m) => m.type === "image");
  const imageUri = firstImage ? resolveMediaUrl(firstImage.url) : FALLBACK_IMAGES[property.property_type] || FALLBACK_IMAGES.home;
  const isSold = property.status === "sold";

  return (
    <Pressable
      testID={`property-card-${property.id}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => router.push(`/property/${property.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.scrim} />

        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{t(`type.${property.property_type}`)}</Text>
          </View>
          {property.featured && !isSold && (
            <View style={[styles.typeBadge, { backgroundColor: colors.brandSecondary }]}>
              <Text style={styles.typeBadgeText}>{t("common.featured")}</Text>
            </View>
          )}
          {isSold && (
            <View style={[styles.typeBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.typeBadgeText}>{t("status.sold")}</Text>
            </View>
          )}
        </View>

        <View style={styles.overlayBottom}>
          <Text style={styles.price} numberOfLines={1}>₹ {property.price}</Text>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#fff" />
            <Text style={styles.location} numberOfLines={1}>{loc(property.location)}</Text>
            {!!property.area && (
              <>
                <View style={styles.dot} />
                <Ionicons name="resize-outline" size={13} color="#fff" />
                <Text style={styles.location} numberOfLines={1}>{property.area}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  imageWrap: { width: "100%", height: 240, backgroundColor: colors.surfaceTertiary },
  image: { width: "100%", height: "100%" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
  badgeRow: { position: "absolute", top: spacing.md, left: spacing.md, flexDirection: "row", gap: spacing.sm },
  typeBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  typeBadgeText: { color: "#fff", fontSize: font.sm, fontWeight: "700" },
  overlayBottom: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  price: { color: "#fff", fontSize: font.xl, fontWeight: "800" },
  title: { color: "#fff", fontSize: font.base, fontWeight: "600", marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs, gap: 3 },
  location: { color: "#EDEDED", fontSize: font.sm },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#EDEDED", marginHorizontal: spacing.xs },
});
