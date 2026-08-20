import { Linking, Platform } from "react-native";

function digits(s: string) {
  return (s || "").replace(/[^0-9]/g, "");
}

export async function openWhatsApp(number: string, text?: string) {
  const num = digits(number);
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  const appUrl = `whatsapp://send?phone=${num}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  const webUrl = `https://wa.me/${num}${msg}`;
  try {
    if (Platform.OS !== "web") {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) return Linking.openURL(appUrl);
    }
  } catch {}
  return Linking.openURL(webUrl);
}

export async function openTelegram(handle: string) {
  const clean = (handle || "").replace(/^@/, "").replace("https://t.me/", "").trim();
  const appUrl = `tg://resolve?domain=${clean}`;
  const webUrl = `https://t.me/${clean}`;
  try {
    if (Platform.OS !== "web") {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) return Linking.openURL(appUrl);
    }
  } catch {}
  return Linking.openURL(webUrl);
}

export function openPhone(number: string) {
  return Linking.openURL(`tel:${digits(number)}`);
}

export function openEmail(email: string, subject?: string) {
  const s = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return Linking.openURL(`mailto:${email}${s}`);
}
