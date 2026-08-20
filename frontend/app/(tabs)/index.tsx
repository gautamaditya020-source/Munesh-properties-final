import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { colors, spacing, radius, font, shadow } from "@/src/theme";
import { CATEGORIES, LOCATIONS } from "@/src/constants";
import { fetchProperties, fetchContact, Property, Contact } from "@/src/api/client";
import PropertyCard from "@/src/components/PropertyCard";
import { openWhatsApp, openPhone } from "@/src/lib/communication";

export default function HomeFeed() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await fetchProperties({ property_type: category, location, q: query });
      setProperties(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, location, query]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [category, location]);

  useFocusEffect(
    useCallback(() => {
      fetchContact().then(setContact).catch(() => {});
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const locationChips = ["all", ...LOCATIONS];

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="business" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Munesh Properties</Text>
            <Text style={styles.brandSub}>Plots · Homes · Land · Shops in UP</Text>
          </View>
          <Pressable
            testID="header-whatsapp-button"
            style={[styles.iconCircle, { backgroundColor: colors.whatsapp }]}
            onPress={() => contact && openWhatsApp(contact.whatsapp, "Hi, I'm interested in a property from Munesh Properties.")}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          </Pressable>
          <Pressable
            testID="header-call-button"
            style={[styles.iconCircle, { backgroundColor: colors.brandPrimary }]}
            onPress={() => contact && openPhone(contact.phone)}
          >
            <Ionicons name="call" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search by title or location"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={load}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable testID="search-clear" onPress={() => { setQuery(""); setTimeout(load, 0); }}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <Pressable
                key={c.key}
                testID={`category-chip-${c.key}`}
                onPress={() => setCategory(c.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={c.icon} size={15} color={active ? "#fff" : colors.onSurfaceTertiary} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Location chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locChipRow}
        >
          {locationChips.map((loc) => {
            const active = location === loc;
            return (
              <Pressable
                key={loc}
                testID={`location-chip-${loc}`}
                onPress={() => setLocation(loc)}
                style={[styles.locChip, active && styles.locChipActive]}
              >
                <Text style={[styles.locChipText, active && styles.locChipTextActive]}>
                  {loc === "all" ? "All Locations" : loc}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Pressable testID="retry-button" style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : properties.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1590305427954-bfad6e2cba31?crop=entropy&cs=srgb&fm=jpg&w=400&q=70" }}
            style={styles.emptyImg}
            contentFit="cover"
          />
          <Text style={styles.emptyTitle}>No properties found</Text>
          <Text style={styles.emptySub}>Try changing filters or check back soon.</Text>
          <Pressable
            testID="clear-filters-button"
            style={styles.retryBtn}
            onPress={() => { setCategory("all"); setLocation("all"); setQuery(""); }}
          >
            <Text style={styles.retryText}>Clear Filters</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <FlatList
          testID="properties-list"
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: font.lg, fontWeight: "800", color: colors.onSurface },
  brandSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginTop: spacing.md,
  },
  searchInput: { flex: 1, fontSize: font.base, color: colors.onSurface },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.md },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: font.base, fontWeight: "600", color: colors.onSurfaceTertiary },
  chipTextActive: { color: "#fff" },
  locChipRow: { gap: spacing.sm, paddingBottom: spacing.xs },
  locChip: {
    flexShrink: 0,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  locChipActive: { backgroundColor: colors.brandSecondary },
  locChipText: { fontSize: font.sm, fontWeight: "600", color: colors.onBrandTertiary },
  locChipTextActive: { color: "#fff" },
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  emptyImg: { width: 140, height: 140, borderRadius: radius.lg },
  emptyTitle: { fontSize: font.lg, fontWeight: "700", color: colors.onSurface },
  emptySub: { fontSize: font.base, color: colors.muted, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: font.base },
});
