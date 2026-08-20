import { Ionicons } from "@expo/vector-icons";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;

export type PropertyType = "plot" | "home" | "land" | "shop";

export const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "plot", label: "Plots", icon: "map-outline" },
  { key: "home", label: "Homes", icon: "home-outline" },
  { key: "land", label: "Land", icon: "leaf-outline" },
  { key: "shop", label: "Shops", icon: "storefront-outline" },
];

export const LOCATIONS = [
  "Khair",
  "Aligarh",
  "Mathura Road",
  "Agra Road",
  "Jewar",
  "Tapal",
  "Jatari",
  "New Yamuna Expressway",
];

export const TYPE_LABEL: Record<string, string> = {
  plot: "Plot",
  home: "Home",
  land: "Land",
  shop: "Shop",
};

export const FALLBACK_IMAGES: Record<string, string> = {
  home: "https://images.unsplash.com/photo-1723110994499-df46435aa4b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsdXh1cnklMjBob21lJTIwZXh0ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3ODcyMDkzNTZ8MA&ixlib=rb-4.1.0&q=85",
  plot: "https://images.pexels.com/photos/11201060/pexels-photo-11201060.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  land: "https://images.pexels.com/photos/11201060/pexels-photo-11201060.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  shop: "https://images.pexels.com/photos/32367382/pexels-photo-32367382.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}
