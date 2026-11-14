import fs from "node:fs";
import path from "node:path";

type Geometry = { type: string; coordinates: unknown };
type Feature = { properties: { shapeName?: string }; geometry: Geometry };
type Collection = { features: Feature[] };

/** Official governorate names in the geoBoundaries ADM1 file. */
const GOVERNORATE_SHAPES: Record<string, string> = {
  baghdad: "Baghdad",
  basra: "Al-Basrah",
  nineveh: "Ninawa",
  erbil: "Erbil",
  sulaymaniyah: "Al-Sulaimaniyah",
  duhok: "Dohuk",
  kirkuk: "Kirkuk",
  anbar: "Al-Anbar",
  diyala: "Diyala",
  saladin: "Salah al-Din",
  wasit: "Wasit",
  babil: "Babil",
  karbala: "Karbala",
  najaf: "An-Najaf",
  qadisiyah: "Al-Qadisiyah",
  muthanna: "Al-Muthanna",
  thi_qar: "Dhi Qar",
  maysan: "Maysan",
};

/** Official district names in the geoBoundaries ADM2 file. */
const DISTRICT_SHAPES: Record<string, string> = {
  "baghdad:karkh": "Al-Karkh",
  "baghdad:rusafa": "Al-Risafa",
  "baghdad:adhamiya": "Al-Adhamiya",
  "baghdad:kadhimiya": "Al-Kadhmiyah",
  "baghdad:sadr_city": "Al-Thawra",
  "baghdad:mahmoudiya": "Al-Mahmoudiya",
  "baghdad:madain": "Al-Mada'in",
  "basra:basra_city": "Al-Basrah",
  "basra:qurna": "Al-Qurna",
  "basra:abu_khasib": "Abu Al-Khaseeb",
  "basra:fao": "Al-Faw",
  "basra:zubair": "Al-Zubair",
  "basra:shat_arab": "Shat Al-Arab",
  "basra:midaina": "Al-Midaina",
  "nineveh:mosul": "Al-Mosul",
  "nineveh:talafar": "Telafar",
  "nineveh:sinjar": "Sinjar",
  "nineveh:hamdaniya": "Al-Hamdaniya",
  "nineveh:makhmour": "Makhmour",
  "nineveh:baaj": "Al-Baaj",
  "nineveh:akre": "Aqra",
  "nineveh:tilkaif": "Tilkaef",
  "nineveh:sheikhan": "Al-Shikhan",
  "erbil:erbil_city": "Erbil",
  "erbil:koya": "Koysinjaq",
  "erbil:shaqlawa": "Shaqlawa",
  "erbil:rawanduz": "Rawanduz",
  "sulaymaniyah:suly_city": "Al-Sulaymaniyah",
  "sulaymaniyah:halabja": "Halabcha",
  "sulaymaniyah:kalar": "Kalar",
  "sulaymaniyah:jamjamal": "Chamchamal",
  "sulaymaniyah:ranya": "Rania",
  "sulaymaniyah:dukan": "Dokan",
  "sulaymaniyah:penjwin": "Panjwin",
  "sulaymaniyah:darbandikhan": "Derbendikhan",
  "duhok:duhok_city": "Duhok",
  "duhok:zakho": "Zakho",
  "duhok:amadiya": "Al-Amadiya",
  "duhok:aqra": "Aqra",
  "duhok:sumel": "Sumail",
  "kirkuk:kirkuk_city": "Kirkuk",
  "kirkuk:daquq": "Daquq",
  "kirkuk:hawija": "Al-Hawiga",
  "kirkuk:dibis": "Dibis",
  "anbar:ramadi": "Al-Ramadi",
  "anbar:falluja": "Al-Falluja",
  "anbar:heet": "Heet",
  "anbar:qaim": "Al-Kaim",
  "anbar:haditha": "Haditha",
  "anbar:rutba": "Al-Rutba",
  "anbar:ana": "Ana",
  "diyala:baquba": "Baquba",
  "diyala:khanaqin": "Khanaqin",
  "diyala:muqdadiya": "Al-Muqdadiya",
  "diyala:kifri": "Kifri",
  "diyala:balad_ruz": "Baladruz",
  "saladin:tikrit": "Tikrit",
  "saladin:baiji": "Beygee",
  "saladin:samarra": "Samarra",
  "saladin:balad": "Balad",
  "saladin:dour": "Al-Daur",
  "saladin:shirqat": "Al-Shirqat",
  "saladin:tuz": "Tooz Khurmato",
  "wasit:kut": "Al-Kut",
  "wasit:numaniya": "Al-Namaniya",
  "wasit:hay": "Al-Hai",
  "wasit:suwaira": "Al-Suwaira",
  "wasit:badra": "Badra",
  "babil:hilla": "Al-Hilla",
  "babil:mahawil": "Al-Mahaweel",
  "babil:hashimiya": "Al-Hashimiya",
  "babil:musayyib": "Al-Mussyab",
  "karbala:karbala_city": "Kerbela",
  "karbala:hindiya": "Al-Hindiya",
  "karbala:ain_tamur": "Ain Al-Tamur",
  "najaf:najaf_city": "Al-Najaf",
  "najaf:kufa": "Al-Kufa",
  "najaf:manathera": "Al-Manathera",
  "qadisiyah:diwaniya": "Al-Diwaniya",
  "qadisiyah:shamiya": "Al-Shamiya",
  "qadisiyah:afak": "Afaq",
  "qadisiyah:hamza": "Al-Hamza",
  "muthanna:samawa": "Al-Samawa",
  "muthanna:rumaitha": "Al-Rumaitha",
  "muthanna:khidr": "Al-Khidhir",
  "thi_qar:nasiriya": "Al-Nasiriya",
  "thi_qar:suq_shuyukh": "Suq Al-Shoyokh",
  "thi_qar:shatrah": "Al-Shatra",
  "thi_qar:rifai": "Al-Rifai",
  "thi_qar:jabayish": "Al-Chibayish",
  "maysan:amara": "Al-Amara",
  "maysan:qalat_salih": "Qalat Saleh",
  "maysan:majar_kabir": "Al-Mejar Al-Kabir",
  "maysan:ali_gharbi": "Ali Al-Gharbi",
};

/**
 * Sub-districts and neighbourhoods that are not an ADM2 district.
 * Values are OpenStreetMap relation ids with a real polygon.
 */
const DISTRICT_OSM: Record<string, string> = {
  "baghdad:mansour": "R2964832",
  "baghdad:karrada": "R11085614",
  "baghdad:bayaa": "R2964800",
  "baghdad:zafaraniya": "R15756058",
  "baghdad:new_baghdad": "R2964553",
  "baghdad:abu_ghraib": "R3382072",
  "baghdad:tarmiya": "R3382078",
  "basra:hartha": "R11042192",
  "nineveh:bashiqa": "R11073336",
  "nineveh:rabia": "R11073364",
  "erbil:soran": "R3829924",
  "erbil:choman": "R3829920",
  "babil:nil": "R11053203",
  "baghdad:amil": "R2964801",
};

let shapeIndex: Map<string, Geometry> | null = null;

function loadShapes(): Map<string, Geometry> {
  if (shapeIndex) return shapeIndex;
  const dir = path.join(process.cwd(), "data", "boundaries");
  const index = new Map<string, Geometry>();
  for (const file of ["irq-adm1.geojson", "irq-adm2.geojson"]) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const collection = JSON.parse(raw) as Collection;
    for (const feature of collection.features) {
      const name = feature.properties.shapeName;
      if (name && feature.geometry) index.set(name, feature.geometry);
    }
  }
  shapeIndex = index;
  return index;
}

export function localBoundary(govId: string, districtId?: string): Geometry | null {
  const shapes = loadShapes();
  if (districtId) {
    const shapeName = DISTRICT_SHAPES[`${govId}:${districtId}`];
    return shapeName ? shapes.get(shapeName) ?? null : null;
  }
  const shapeName = GOVERNORATE_SHAPES[govId];
  return shapeName ? shapes.get(shapeName) ?? null : null;
}

export function osmRelationId(govId: string, districtId?: string): string | null {
  if (!districtId) return null;
  return DISTRICT_OSM[`${govId}:${districtId}`] ?? null;
}
