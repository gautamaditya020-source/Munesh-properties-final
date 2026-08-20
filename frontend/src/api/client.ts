import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";
import { BACKEND_URL } from "@/src/constants";

const TOKEN_KEY = "munesh_admin_token";
const API = `${BACKEND_URL}/api`;

export type MediaItem = { path: string; type: "image" | "video"; url: string };

export type Property = {
  id: string;
  title: string;
  property_type: string;
  location: string;
  price: string;
  area: string;
  description: string;
  amenities: string[];
  status: string;
  featured: boolean;
  media: MediaItem[];
  created_at: string;
};

export type Contact = {
  whatsapp: string;
  telegram: string;
  phone: string;
  email: string;
  address: string;
  about: string;
};

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  property_id?: string | null;
  property_title?: string | null;
  created_at: string;
};

// ---- token helpers ----
export async function getToken() {
  return storage.secureGet<string>(TOKEN_KEY, "");
}
export async function setToken(token: string) {
  return storage.secureSet(TOKEN_KEY, token);
}
export async function clearToken() {
  return storage.secureRemove(TOKEN_KEY);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- public ----
export async function fetchProperties(params: { property_type?: string; location?: string; q?: string; featured?: boolean } = {}): Promise<Property[]> {
  const qs = new URLSearchParams();
  if (params.property_type && params.property_type !== "all") qs.append("property_type", params.property_type);
  if (params.location && params.location !== "all") qs.append("location", params.location);
  if (params.q) qs.append("q", params.q);
  if (params.featured !== undefined) qs.append("featured", String(params.featured));
  const res = await fetch(`${API}/properties?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load properties");
  return res.json();
}

export async function fetchProperty(id: string): Promise<Property> {
  const res = await fetch(`${API}/properties/${id}`);
  if (!res.ok) throw new Error("Property not found");
  return res.json();
}

export async function fetchContact(): Promise<Contact> {
  const res = await fetch(`${API}/contact`);
  if (!res.ok) throw new Error("Failed to load contact");
  return res.json();
}

export async function submitEnquiry(body: Partial<Enquiry>): Promise<Enquiry> {
  const res = await fetch(`${API}/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to submit enquiry");
  return res.json();
}

// ---- auth ----
export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Incorrect username or password");
  const data = await res.json();
  await setToken(data.access_token);
  return data.access_token;
}

export async function verifyToken(): Promise<boolean> {
  const headers = await authHeaders();
  if (!headers.Authorization) return false;
  const res = await fetch(`${API}/auth/me`, { headers });
  return res.ok;
}

// ---- admin ----
export async function uploadMedia(uri: string, name: string, type: string): Promise<MediaItem> {
  const headers = await authHeaders();
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
  } else {
    form.append("file", { uri, name, type } as any);
  }
  const res = await fetch(`${API}/admin/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    if (res.status === 402) throw new Error("Storage credits exhausted");
    throw new Error("Upload failed");
  }
  return res.json();
}

export async function createProperty(body: Partial<Property>): Promise<Property> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API}/admin/properties`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Failed to create property");
  return res.json();
}

export async function updateProperty(id: string, body: Partial<Property>): Promise<Property> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API}/admin/properties/${id}`, { method: "PUT", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Failed to update property");
  return res.json();
}

export async function deleteProperty(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/admin/properties/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Failed to delete property");
}

export async function updateContact(body: Contact): Promise<Contact> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API}/admin/contact`, { method: "PUT", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Failed to update contact");
  return res.json();
}

export async function fetchEnquiries(): Promise<Enquiry[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/admin/enquiries`, { headers });
  if (!res.ok) throw new Error("Failed to load enquiries");
  return res.json();
}

export async function deleteEnquiry(id: string): Promise<void> {
  const headers = await authHeaders();
  await fetch(`${API}/admin/enquiries/${id}`, { method: "DELETE", headers });
}
