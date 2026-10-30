export interface District {
  id: string;
  ar: string;
  en: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface Governorate {
  id: string;
  ar: string;
  en: string;
  lat: number;
  lng: number;
  districts: District[];
}

export const IRAQ_GOVERNORATES: Governorate[] = [
  {
    id: "baghdad", ar: "بغداد", en: "Baghdad", lat: 33.3152, lng: 44.3661,
    districts: [
      { id: "karkh",        ar: "الكرخ",          en: "Karkh",         lat: 33.290, lng: 44.330, radiusKm: 8 },
      { id: "rusafa",       ar: "الرصافة",         en: "Rusafa",        lat: 33.340, lng: 44.410, radiusKm: 8 },
      { id: "adhamiya",     ar: "الأعظمية",        en: "Adhamiyah",     lat: 33.382, lng: 44.383, radiusKm: 4 },
      { id: "kadhimiya",    ar: "الكاظمية",        en: "Kadhimiyah",    lat: 33.390, lng: 44.319, radiusKm: 4 },
      { id: "mansour",      ar: "المنصور",         en: "Mansour",       lat: 33.322, lng: 44.330, radiusKm: 5 },
      { id: "karrada",      ar: "الكرادة",         en: "Karrada",       lat: 33.300, lng: 44.400, radiusKm: 3 },
      { id: "zayouna",      ar: "الزيونة",         en: "Zayouna",       lat: 33.335, lng: 44.450, radiusKm: 3 },
      { id: "sadr_city",    ar: "مدينة الصدر",     en: "Sadr City",     lat: 33.370, lng: 44.430, radiusKm: 7 },
      { id: "dora",         ar: "الدورة",          en: "Dora",          lat: 33.240, lng: 44.400, radiusKm: 4 },
      { id: "bayaa",        ar: "البياع",          en: "Bayaa",         lat: 33.278, lng: 44.352, radiusKm: 3 },
      { id: "shuala",       ar: "الشعلة",          en: "Shuala",        lat: 33.360, lng: 44.274, radiusKm: 3 },
      { id: "amil",         ar: "العامل",          en: "Amil",          lat: 33.280, lng: 44.382, radiusKm: 3 },
      { id: "zafaraniya",   ar: "الزعفرانية",      en: "Zafaraniyah",   lat: 33.258, lng: 44.451, radiusKm: 4 },
      { id: "new_baghdad",  ar: "بغداد الجديدة",   en: "New Baghdad",   lat: 33.342, lng: 44.490, radiusKm: 4 },
      { id: "abu_ghraib",   ar: "أبو غريب",       en: "Abu Ghraib",    lat: 33.290, lng: 44.070, radiusKm: 20 },
      { id: "mahmoudiya",   ar: "المحمودية",       en: "Mahmoudiyah",   lat: 33.050, lng: 44.362, radiusKm: 15 },
      { id: "tarmiya",      ar: "الطارمية",        en: "Tarmiyah",      lat: 33.713, lng: 44.112, radiusKm: 20 },
      { id: "madain",       ar: "المدائن",         en: "Madain",        lat: 33.213, lng: 44.590, radiusKm: 15 },
    ],
  },
  {
    id: "basra", ar: "البصرة", en: "Basra", lat: 30.5085, lng: 47.7804,
    districts: [
      { id: "basra_city",   ar: "البصرة",          en: "Basra City",    lat: 30.508, lng: 47.780, radiusKm: 12 },
      { id: "qurna",        ar: "القرنة",          en: "Qurna",         lat: 31.009, lng: 47.430, radiusKm: 15 },
      { id: "abu_khasib",   ar: "أبو الخصيب",     en: "Abu Al-Khasib", lat: 30.438, lng: 47.973, radiusKm: 10 },
      { id: "fao",          ar: "الفاو",           en: "Fao",           lat: 29.979, lng: 48.474, radiusKm: 15 },
      { id: "zubair",       ar: "الزبير",          en: "Zubair",        lat: 30.389, lng: 47.705, radiusKm: 10 },
      { id: "shat_arab",    ar: "شط العرب",        en: "Shatt Al-Arab", lat: 30.420, lng: 48.020, radiusKm: 8 },
      { id: "al_madina",    ar: "المدينة",         en: "Al-Madina",     lat: 30.940, lng: 47.310, radiusKm: 12 },
      { id: "hartha",       ar: "الهارثة",         en: "Hartha",        lat: 30.620, lng: 47.822, radiusKm: 10 },
      { id: "midaina",      ar: "الميدين",         en: "Al-Midaina",    lat: 31.480, lng: 47.300, radiusKm: 20 },
    ],
  },
  {
    id: "nineveh", ar: "نينوى", en: "Nineveh", lat: 36.3450, lng: 43.1450,
    districts: [
      { id: "mosul",        ar: "الموصل",          en: "Mosul",         lat: 36.340, lng: 43.145, radiusKm: 20 },
      { id: "talafar",      ar: "تلعفر",           en: "Talafar",       lat: 36.375, lng: 42.447, radiusKm: 15 },
      { id: "sinjar",       ar: "سنجار",           en: "Sinjar",        lat: 36.320, lng: 41.870, radiusKm: 25 },
      { id: "hamdaniya",    ar: "الحمدانية",       en: "Hamdaniyah",    lat: 36.170, lng: 43.480, radiusKm: 15 },
      { id: "makhmour",     ar: "مخمور",           en: "Makhmour",      lat: 35.776, lng: 43.583, radiusKm: 15 },
      { id: "baaj",         ar: "البعاج",          en: "Baaj",          lat: 35.802, lng: 41.974, radiusKm: 30 },
      { id: "rabia",        ar: "ربيعة",           en: "Rabia",         lat: 36.857, lng: 42.000, radiusKm: 20 },
      { id: "akre",         ar: "أكرى",            en: "Akre",          lat: 36.745, lng: 43.885, radiusKm: 15 },
      { id: "bashiqa",      ar: "بعشيقة",          en: "Bashiqa",       lat: 36.480, lng: 43.450, radiusKm: 10 },
    ],
  },
  {
    id: "erbil", ar: "أربيل", en: "Erbil", lat: 36.1912, lng: 44.0092,
    districts: [
      { id: "erbil_city",   ar: "أربيل",           en: "Erbil City",    lat: 36.191, lng: 44.009, radiusKm: 20 },
      { id: "koya",         ar: "كوية",            en: "Koya",          lat: 36.085, lng: 44.626, radiusKm: 15 },
      { id: "shaqlawa",     ar: "شقلاوة",          en: "Shaqlawa",      lat: 36.408, lng: 44.320, radiusKm: 10 },
      { id: "rawanduz",     ar: "روانز",           en: "Rawanduz",      lat: 36.614, lng: 44.524, radiusKm: 15 },
      { id: "soran",        ar: "سوران",           en: "Soran",         lat: 36.660, lng: 44.543, radiusKm: 10 },
      { id: "makhmour_e",   ar: "مخمور",           en: "Makhmour",      lat: 35.776, lng: 43.583, radiusKm: 12 },
      { id: "mergasur",     ar: "مرغسور",          en: "Mergasur",      lat: 36.841, lng: 44.308, radiusKm: 15 },
    ],
  },
  {
    id: "sulaymaniyah", ar: "السليمانية", en: "Sulaymaniyah", lat: 35.5578, lng: 45.4350,
    districts: [
      { id: "suly_city",    ar: "السليمانية",      en: "Sulaymaniyah",  lat: 35.558, lng: 45.435, radiusKm: 15 },
      { id: "halabja",      ar: "حلبجة",           en: "Halabja",       lat: 35.179, lng: 45.985, radiusKm: 10 },
      { id: "kalar",        ar: "كلار",            en: "Kalar",         lat: 34.621, lng: 45.320, radiusKm: 12 },
      { id: "jamjamal",     ar: "جمجمال",          en: "Jamjamal",      lat: 35.540, lng: 44.836, radiusKm: 10 },
      { id: "ranya",        ar: "رانية",           en: "Ranya",         lat: 36.252, lng: 44.875, radiusKm: 12 },
      { id: "dukan",        ar: "دوكان",           en: "Dukan",         lat: 35.957, lng: 44.962, radiusKm: 10 },
      { id: "penjwin",      ar: "بنجوين",          en: "Penjwin",       lat: 35.620, lng: 45.930, radiusKm: 15 },
      { id: "darbandikhan", ar: "دربندخان",        en: "Darbandikhan",  lat: 35.109, lng: 45.693, radiusKm: 12 },
    ],
  },
  {
    id: "duhok", ar: "دهوك", en: "Duhok", lat: 36.8669, lng: 42.9866,
    districts: [
      { id: "duhok_city",   ar: "دهوك",            en: "Duhok City",    lat: 36.867, lng: 42.987, radiusKm: 12 },
      { id: "zakho",        ar: "زاخو",            en: "Zakho",         lat: 37.144, lng: 42.680, radiusKm: 12 },
      { id: "amadiya",      ar: "العمادية",         en: "Amadiyah",      lat: 37.091, lng: 43.489, radiusKm: 12 },
      { id: "aqra",         ar: "عقرة",            en: "Aqra",          lat: 36.744, lng: 43.894, radiusKm: 15 },
      { id: "bardarash",    ar: "بردرش",           en: "Bardarash",     lat: 36.499, lng: 43.602, radiusKm: 10 },
      { id: "shekhan",      ar: "الشيخان",         en: "Shekhan",       lat: 36.620, lng: 43.344, radiusKm: 12 },
    ],
  },
  {
    id: "kirkuk", ar: "كركوك", en: "Kirkuk", lat: 35.4681, lng: 44.3922,
    districts: [
      { id: "kirkuk_city",  ar: "كركوك",           en: "Kirkuk City",   lat: 35.468, lng: 44.392, radiusKm: 15 },
      { id: "daquq",        ar: "داقوق",           en: "Daquq",         lat: 35.035, lng: 44.241, radiusKm: 12 },
      { id: "hawija",       ar: "الحويجة",         en: "Hawija",        lat: 35.388, lng: 43.670, radiusKm: 20 },
      { id: "dibis",        ar: "دبس",             en: "Dibis",         lat: 35.680, lng: 44.050, radiusKm: 15 },
    ],
  },
  {
    id: "anbar", ar: "الأنبار", en: "Anbar", lat: 33.4455, lng: 43.3001,
    districts: [
      { id: "ramadi",       ar: "الرمادي",         en: "Ramadi",        lat: 33.428, lng: 43.302, radiusKm: 15 },
      { id: "falluja",      ar: "الفلوجة",         en: "Falluja",       lat: 33.352, lng: 43.790, radiusKm: 12 },
      { id: "heet",         ar: "هيت",             en: "Heet",          lat: 33.646, lng: 42.827, radiusKm: 12 },
      { id: "qaim",         ar: "القائم",           en: "Al-Qaim",       lat: 34.390, lng: 41.092, radiusKm: 20 },
      { id: "haditha",      ar: "حديثة",           en: "Haditha",       lat: 34.113, lng: 42.381, radiusKm: 15 },
      { id: "rutba",        ar: "الرطبة",          en: "Rutba",         lat: 33.040, lng: 40.286, radiusKm: 40 },
      { id: "ana",          ar: "عانة",            en: "Ana",           lat: 34.465, lng: 41.997, radiusKm: 15 },
      { id: "rawa",         ar: "راوة",            en: "Rawa",          lat: 34.479, lng: 41.900, radiusKm: 12 },
    ],
  },
  {
    id: "diyala", ar: "ديالى", en: "Diyala", lat: 33.7456, lng: 44.6415,
    districts: [
      { id: "baquba",       ar: "بعقوبة",          en: "Baquba",        lat: 33.745, lng: 44.641, radiusKm: 12 },
      { id: "khanaqin",     ar: "خانقين",          en: "Khanaqin",      lat: 34.346, lng: 45.378, radiusKm: 12 },
      { id: "muqdadiya",    ar: "المقدادية",       en: "Muqdadiyah",    lat: 33.972, lng: 44.938, radiusKm: 15 },
      { id: "kifri",        ar: "كفري",            en: "Kifri",         lat: 34.685, lng: 44.958, radiusKm: 12 },
      { id: "balad_ruz",    ar: "بلدروز",          en: "Balad Ruz",     lat: 33.866, lng: 45.061, radiusKm: 10 },
    ],
  },
  {
    id: "saladin", ar: "صلاح الدين", en: "Saladin", lat: 34.5370, lng: 43.5800,
    districts: [
      { id: "tikrit",       ar: "تكريت",           en: "Tikrit",        lat: 34.601, lng: 43.673, radiusKm: 12 },
      { id: "baiji",        ar: "بيجي",            en: "Baiji",         lat: 34.919, lng: 43.492, radiusKm: 12 },
      { id: "samarra",      ar: "سامراء",          en: "Samarra",       lat: 34.198, lng: 43.874, radiusKm: 12 },
      { id: "balad",        ar: "بلد",             en: "Balad",         lat: 34.016, lng: 44.147, radiusKm: 10 },
      { id: "dour",         ar: "الدور",           en: "Al-Dour",       lat: 34.505, lng: 43.657, radiusKm: 10 },
      { id: "shirqat",      ar: "الشرقاط",         en: "Shirqat",       lat: 35.517, lng: 43.248, radiusKm: 15 },
      { id: "tuz",          ar: "طوز خورماتو",     en: "Tuz Khurmatu",  lat: 34.877, lng: 44.633, radiusKm: 12 },
    ],
  },
  {
    id: "wasit", ar: "واسط", en: "Wasit", lat: 32.5150, lng: 45.8162,
    districts: [
      { id: "kut",          ar: "الكوت",           en: "Kut",           lat: 32.500, lng: 45.823, radiusKm: 12 },
      { id: "numaniya",     ar: "النعمانية",       en: "Al-Numaniyah",  lat: 32.533, lng: 45.330, radiusKm: 10 },
      { id: "hay",          ar: "الحي",            en: "Al-Hay",        lat: 32.171, lng: 46.039, radiusKm: 10 },
      { id: "suwaira",      ar: "الصويرة",         en: "Al-Suwaira",    lat: 32.921, lng: 44.974, radiusKm: 10 },
      { id: "badra",        ar: "بدرة",            en: "Badra",         lat: 33.097, lng: 45.956, radiusKm: 12 },
    ],
  },
  {
    id: "babil", ar: "بابل", en: "Babil", lat: 32.4786, lng: 44.4208,
    districts: [
      { id: "hilla",        ar: "الحلة",           en: "Hilla",         lat: 32.479, lng: 44.421, radiusKm: 12 },
      { id: "mahawil",      ar: "المحاويل",        en: "Mahawil",       lat: 32.651, lng: 44.448, radiusKm: 10 },
      { id: "hashimiya",    ar: "الهاشمية",        en: "Hashimiyah",    lat: 32.461, lng: 44.638, radiusKm: 10 },
      { id: "musayyib",     ar: "المسيب",          en: "Musayyib",      lat: 32.779, lng: 44.285, radiusKm: 10 },
      { id: "nil",          ar: "النيل",           en: "Nile",          lat: 32.698, lng: 44.164, radiusKm: 8 },
    ],
  },
  {
    id: "karbala", ar: "كربلاء", en: "Karbala", lat: 32.6157, lng: 44.0243,
    districts: [
      { id: "karbala_city", ar: "كربلاء",          en: "Karbala City",  lat: 32.616, lng: 44.024, radiusKm: 10 },
      { id: "hindiya",      ar: "الهندية",         en: "Hindiyah",      lat: 32.530, lng: 44.228, radiusKm: 10 },
      { id: "ain_tamur",    ar: "عين التمر",       en: "Ain Tamur",     lat: 32.519, lng: 43.581, radiusKm: 15 },
    ],
  },
  {
    id: "najaf", ar: "النجف", en: "Najaf", lat: 32.0000, lng: 44.3356,
    districts: [
      { id: "najaf_city",   ar: "النجف",           en: "Najaf City",    lat: 32.000, lng: 44.336, radiusKm: 12 },
      { id: "kufa",         ar: "الكوفة",          en: "Kufa",          lat: 32.034, lng: 44.401, radiusKm: 8 },
      { id: "manathera",    ar: "المناذرة",        en: "Manathera",     lat: 31.825, lng: 44.246, radiusKm: 10 },
      { id: "abu_sukhair",  ar: "أبو صخير",        en: "Abu Sukhair",   lat: 31.877, lng: 44.504, radiusKm: 8 },
    ],
  },
  {
    id: "qadisiyah", ar: "القادسية", en: "Qadisiyah", lat: 32.0000, lng: 44.9500,
    districts: [
      { id: "diwaniya",     ar: "الديوانية",       en: "Diwaniyah",     lat: 31.989, lng: 44.929, radiusKm: 12 },
      { id: "shamiya",      ar: "الشامية",         en: "Shamiyah",      lat: 32.074, lng: 44.737, radiusKm: 10 },
      { id: "afak",         ar: "عفك",             en: "Afak",          lat: 32.075, lng: 45.248, radiusKm: 10 },
      { id: "hamza",        ar: "الحمزة",          en: "Al-Hamza",      lat: 31.740, lng: 44.981, radiusKm: 10 },
    ],
  },
  {
    id: "muthanna", ar: "المثنى", en: "Muthanna", lat: 31.3231, lng: 45.2847,
    districts: [
      { id: "samawa",       ar: "السماوة",         en: "Samawa",        lat: 31.323, lng: 45.285, radiusKm: 12 },
      { id: "rumaitha",     ar: "الرميثة",         en: "Rumaitha",      lat: 31.532, lng: 45.211, radiusKm: 12 },
      { id: "khidr",        ar: "الخضر",           en: "Al-Khidr",      lat: 30.847, lng: 44.768, radiusKm: 15 },
    ],
  },
  {
    id: "thi_qar", ar: "ذي قار", en: "Thi Qar", lat: 31.0446, lng: 46.2569,
    districts: [
      { id: "nasiriya",     ar: "الناصرية",        en: "Nasiriyah",     lat: 31.044, lng: 46.257, radiusKm: 12 },
      { id: "suq_shuyukh",  ar: "سوق الشيوخ",      en: "Suq Al-Shuyukh",lat: 30.965, lng: 46.420, radiusKm: 10 },
      { id: "shatrah",      ar: "الشطرة",          en: "Shatrah",       lat: 31.424, lng: 46.177, radiusKm: 10 },
      { id: "rifai",        ar: "الرفاعي",         en: "Al-Rifai",      lat: 31.654, lng: 46.112, radiusKm: 10 },
      { id: "jabayish",     ar: "الجبايش",         en: "Al-Jabayish",   lat: 30.884, lng: 47.005, radiusKm: 15 },
    ],
  },
  {
    id: "maysan", ar: "ميسان", en: "Maysan", lat: 31.8495, lng: 47.1517,
    districts: [
      { id: "amara",        ar: "العمارة",         en: "Amara",         lat: 31.850, lng: 47.152, radiusKm: 12 },
      { id: "qalat_salih",  ar: "قلعة صالح",       en: "Qalat Salih",   lat: 31.520, lng: 47.268, radiusKm: 10 },
      { id: "majar_kabir",  ar: "المجر الكبير",     en: "Al-Majar",      lat: 31.873, lng: 47.431, radiusKm: 12 },
      { id: "ali_gharbi",   ar: "علي الغربي",      en: "Ali Al-Gharbi", lat: 32.467, lng: 47.334, radiusKm: 10 },
    ],
  },
];

export function getGovernorate(id: string): Governorate | undefined {
  return IRAQ_GOVERNORATES.find((g) => g.id === id);
}

export function getDistrict(govId: string, districtId: string): District | undefined {
  return getGovernorate(govId)?.districts.find((d) => d.id === districtId);
}

export function inferGovFromAddress(address: string): Governorate | undefined {
  if (!address) return undefined;
  return IRAQ_GOVERNORATES.find(
    (g) =>
      address.includes(g.ar) ||
      address.toLowerCase().includes(g.en.toLowerCase())
  );
}

// All medical specialties — comprehensive list
export const ALL_SPECIALTIES = [
  { id: "cardiology",           nameAr: "أمراض القلب",                    name: "Cardiology",                    icon: "🫀" },
  { id: "neurology",            nameAr: "أمراض الأعصاب",                  name: "Neurology",                     icon: "🧠" },
  { id: "orthopedics",          nameAr: "العظام والمفاصل",                name: "Orthopedics",                   icon: "🦴" },
  { id: "pediatrics",           nameAr: "طب الأطفال",                     name: "Pediatrics",                    icon: "👶" },
  { id: "dermatology",          nameAr: "الأمراض الجلدية",                name: "Dermatology",                   icon: "🧴" },
  { id: "ophthalmology",        nameAr: "طب العيون",                      name: "Ophthalmology",                 icon: "👁️" },
  { id: "general-medicine",     nameAr: "الطب العام",                     name: "General Medicine",              icon: "🩺" },
  { id: "dentistry",            nameAr: "طب الأسنان",                     name: "Dentistry",                     icon: "🦷" },
  { id: "ent",                  nameAr: "الأنف والأذن والحنجرة",          name: "ENT",                           icon: "👂" },
  { id: "pulmonology",          nameAr: "أمراض الصدر والجهاز التنفسي",   name: "Pulmonology",                   icon: "🫁" },
  { id: "endocrinology",        nameAr: "الغدد الصماء والسكري",           name: "Endocrinology",                 icon: "⚗️" },
  { id: "rheumatology",         nameAr: "أمراض الروماتيزم",               name: "Rheumatology",                  icon: "🦾" },
  { id: "urology",              nameAr: "المسالك البولية",                name: "Urology",                       icon: "🔬" },
  { id: "psychiatry",           nameAr: "الطب النفسي",                    name: "Psychiatry",                    icon: "🧘" },
  { id: "oncology",             nameAr: "أمراض الأورام",                  name: "Oncology",                      icon: "🎗️" },
  { id: "obstetrics",           nameAr: "النسائية والتوليد",              name: "Obstetrics & Gynecology",       icon: "🤱" },
  { id: "nephrology",           nameAr: "أمراض الكلى",                    name: "Nephrology",                    icon: "💉" },
  { id: "hematology",           nameAr: "أمراض الدم",                     name: "Hematology",                    icon: "🩸" },
  { id: "surgery",              nameAr: "الجراحة العامة",                 name: "General Surgery",               icon: "🔪" },
  { id: "emergency",            nameAr: "طب الطوارئ",                     name: "Emergency Medicine",            icon: "🚨" },
  { id: "radiology",            nameAr: "الأشعة والتصوير الطبي",          name: "Radiology",                     icon: "🩻" },
  { id: "internal-medicine",    nameAr: "الباطنية",                       name: "Internal Medicine",             icon: "🫀" },
  { id: "gastroenterology",     nameAr: "الجهاز الهضمي والكبد",           name: "Gastroenterology",              icon: "🫃" },
  { id: "hepatology",           nameAr: "أمراض الكبد",                    name: "Hepatology",                    icon: "🫀" },
  { id: "infectious-disease",   nameAr: "الأمراض المعدية",                name: "Infectious Disease",            icon: "🦠" },
  { id: "neurosurgery",         nameAr: "جراحة الأعصاب",                  name: "Neurosurgery",                  icon: "🧠" },
  { id: "plastic-surgery",      nameAr: "الجراحة التجميلية",              name: "Plastic Surgery",               icon: "💆" },
  { id: "vascular-surgery",     nameAr: "جراحة الأوعية الدموية",          name: "Vascular Surgery",              icon: "🩺" },
  { id: "cardiothoracic",       nameAr: "جراحة القلب والصدر",             name: "Cardiothoracic Surgery",        icon: "🫀" },
  { id: "neonatology",          nameAr: "طب حديثي الولادة",               name: "Neonatology",                   icon: "👼" },
  { id: "allergy",              nameAr: "الحساسية والمناعة",              name: "Allergy & Immunology",          icon: "🌿" },
  { id: "physical-therapy",     nameAr: "العلاج الطبيعي",                 name: "Physical Therapy",              icon: "🏃" },
  { id: "nutrition",            nameAr: "التغذية والحمية",                name: "Nutrition & Dietetics",         icon: "🥗" },
  { id: "reproductive-med",     nameAr: "طب الخصوبة وأطفال الأنابيب",    name: "Reproductive Medicine",         icon: "🍼" },
  { id: "pain-management",      nameAr: "علاج الألم",                     name: "Pain Management",               icon: "💊" },
  { id: "anesthesiology",       nameAr: "التخدير والإنعاش",               name: "Anesthesiology",                icon: "😴" },
  { id: "geriatrics",           nameAr: "طب المسنين",                     name: "Geriatrics",                    icon: "👴" },
  { id: "sports-medicine",      nameAr: "طب الرياضة",                     name: "Sports Medicine",               icon: "⚽" },
  { id: "family-medicine",      nameAr: "طب الأسرة",                      name: "Family Medicine",               icon: "👨‍👩‍👧" },
];

export const SPECIALTY_ICONS: Record<string, string> = Object.fromEntries(
  ALL_SPECIALTIES.map((s) => [s.id, s.icon])
);

export function getSpecialtyIcon(specialtyId: string): string {
  return SPECIALTY_ICONS[specialtyId] ?? "🏥";
}

// Legacy alias
export const GOVERNORATES = IRAQ_GOVERNORATES.map(({ id, ar, en }) => ({ id, ar, en }));
