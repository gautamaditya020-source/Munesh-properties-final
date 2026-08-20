export type Lang = "hi" | "en";

type Dict = Record<string, string>;

export const translations: Record<Lang, Dict> = {
  en: {
    "tabs.properties": "Properties",
    "tabs.enquiry": "Enquiry",
    "tabs.contact": "Contact",

    "home.brandSub": "Plots · Homes · Land · Shops in UP",
    "home.search": "Search by title or location",
    "home.allLocations": "All Locations",
    "home.noProps": "No properties found",
    "home.noPropsSub": "Try changing filters or check back soon.",
    "home.clearFilters": "Clear Filters",
    "home.error": "Something went wrong",
    "home.retry": "Retry",

    "cat.all": "All",
    "cat.plot": "Plots",
    "cat.home": "Homes",
    "cat.land": "Land",
    "cat.shop": "Shops",

    "type.plot": "Plot",
    "type.home": "Home",
    "type.land": "Land",
    "type.shop": "Shop",

    "status.available": "Available",
    "status.sold": "Sold",
    "common.featured": "Featured",

    "details.description": "Description",
    "details.amenities": "Features & Amenities",
    "details.notFound": "Property Not Found",
    "details.goBack": "Go Back",

    "cta.whatsapp": "WhatsApp",
    "cta.call": "Call",
    "cta.enquiry": "Enquiry",

    "enq.title": "Enquiry Form",
    "enq.subtitle": "Share your details and we will reach out to you",
    "enq.name": "Full Name *",
    "enq.phone": "Phone Number *",
    "enq.email": "Email (optional)",
    "enq.message": "Message",
    "enq.namePh": "Your name",
    "enq.phonePh": "e.g. 98765 43210",
    "enq.emailPh": "you@example.com",
    "enq.messagePh": "I'm interested in...",
    "enq.submit": "Send Enquiry",
    "enq.validation": "Please enter your name and a valid phone number.",
    "enq.failed": "Could not send enquiry. Please try again.",
    "enq.successTitle": "Enquiry Sent!",
    "enq.successSub": "Thank you. Munesh Properties will contact you shortly.",
    "enq.sendAnother": "Send Another",
    "enq.regarding": "Regarding",

    "contact.title": "Get in Touch",
    "contact.subtitle": "Reach Munesh Properties any way you like",
    "contact.whatsapp": "WhatsApp",
    "contact.call": "Call Us",
    "contact.telegram": "Telegram",
    "contact.email": "Email",
    "contact.about": "About Us",
    "contact.areas": "Areas We Serve",

    "admin.website": "Website",
    "admin.login": "Admin Login",
    "admin.loginSub": "Manage listings, media & contact details",
    "admin.username": "Username",
    "admin.password": "Password",
    "admin.signIn": "Sign In",
    "admin.wrongCreds": "Incorrect username or password.",
  },
  hi: {
    "tabs.properties": "प्रॉपर्टी",
    "tabs.enquiry": "पूछताछ",
    "tabs.contact": "संपर्क",

    "home.brandSub": "यूपी में प्लॉट · मकान · ज़मीन · दुकान",
    "home.search": "नाम या स्थान से खोजें",
    "home.allLocations": "सभी स्थान",
    "home.noProps": "कोई प्रॉपर्टी नहीं मिली",
    "home.noPropsSub": "फ़िल्टर बदलें या थोड़ी देर बाद देखें।",
    "home.clearFilters": "फ़िल्टर हटाएँ",
    "home.error": "कुछ गड़बड़ हो गई",
    "home.retry": "पुनः प्रयास करें",

    "cat.all": "सभी",
    "cat.plot": "प्लॉट",
    "cat.home": "मकान",
    "cat.land": "ज़मीन",
    "cat.shop": "दुकान",

    "type.plot": "प्लॉट",
    "type.home": "मकान",
    "type.land": "ज़मीन",
    "type.shop": "दुकान",

    "status.available": "उपलब्ध",
    "status.sold": "बिक गया",
    "common.featured": "विशेष",

    "details.description": "विवरण",
    "details.amenities": "सुविधाएँ",
    "details.notFound": "प्रॉपर्टी नहीं मिली",
    "details.goBack": "वापस जाएँ",

    "cta.whatsapp": "व्हाट्सएप",
    "cta.call": "कॉल",
    "cta.enquiry": "पूछताछ",

    "enq.title": "पूछताछ फ़ॉर्म",
    "enq.subtitle": "अपनी जानकारी दें, हम आपसे संपर्क करेंगे",
    "enq.name": "पूरा नाम *",
    "enq.phone": "फ़ोन नंबर *",
    "enq.email": "ईमेल (वैकल्पिक)",
    "enq.message": "संदेश",
    "enq.namePh": "आपका नाम",
    "enq.phonePh": "जैसे 98765 43210",
    "enq.emailPh": "you@example.com",
    "enq.messagePh": "मुझे इसमें रुचि है...",
    "enq.submit": "पूछताछ भेजें",
    "enq.validation": "कृपया अपना नाम और सही फ़ोन नंबर भरें।",
    "enq.failed": "पूछताछ नहीं भेजी जा सकी। कृपया पुनः प्रयास करें।",
    "enq.successTitle": "पूछताछ भेजी गई!",
    "enq.successSub": "धन्यवाद। मुनेश प्रॉपर्टीज़ जल्द ही आपसे संपर्क करेगी।",
    "enq.sendAnother": "और भेजें",
    "enq.regarding": "संबंधित",

    "contact.title": "संपर्क करें",
    "contact.subtitle": "मुनेश प्रॉपर्टीज़ से किसी भी तरह जुड़ें",
    "contact.whatsapp": "व्हाट्सएप",
    "contact.call": "कॉल करें",
    "contact.telegram": "टेलीग्राम",
    "contact.email": "ईमेल",
    "contact.about": "हमारे बारे में",
    "contact.areas": "हमारे कार्यक्षेत्र",

    "admin.website": "वेबसाइट",
    "admin.login": "एडमिन लॉगिन",
    "admin.loginSub": "लिस्टिंग, मीडिया और संपर्क विवरण प्रबंधित करें",
    "admin.username": "यूज़रनेम",
    "admin.password": "पासवर्ड",
    "admin.signIn": "साइन इन",
    "admin.wrongCreds": "यूज़रनेम या पासवर्ड ग़लत है।",
  },
};

export const LOCATION_LABELS: Record<string, { hi: string; en: string }> = {
  Khair: { hi: "खैर", en: "Khair" },
  Aligarh: { hi: "अलीगढ़", en: "Aligarh" },
  "Mathura Road": { hi: "मथुरा रोड", en: "Mathura Road" },
  "Agra Road": { hi: "आगरा रोड", en: "Agra Road" },
  Jewar: { hi: "जेवर", en: "Jewar" },
  Tapal: { hi: "टप्पल", en: "Tapal" },
  Jatari: { hi: "जटारी", en: "Jatari" },
  "New Yamuna Expressway": { hi: "न्यू यमुना एक्सप्रेसवे", en: "New Yamuna Expressway" },
};

export function locationLabel(lang: Lang, value: string): string {
  return LOCATION_LABELS[value]?.[lang] ?? value;
}
