export const SPECIALTY_ICONS: Record<string, string> = {
  // Cardiology
  "cardiology": "❤️", "أمراض القلب": "❤️", "قلب": "❤️",
  // Neurology
  "neurology": "🧠", "أمراض الأعصاب": "🧠", "أعصاب": "🧠",
  // Orthopedics
  "orthopedics": "🦴", "العظام والمفاصل": "🦴", "عظام": "🦴",
  // Pediatrics
  "pediatrics": "👶", "طب الأطفال": "👶",
  // Dermatology
  "dermatology": "✨", "الجلدية": "✨",
  // Ophthalmology
  "ophthalmology": "👁️", "طب العيون": "👁️", "عيون": "👁️",
  // General Medicine
  "general medicine": "🩺", "الطب العام": "🩺",
  // Dentistry
  "dentistry": "🦷", "طب الأسنان": "🦷", "أسنان": "🦷",
  // ENT
  "ent": "👂", "أنف وأذن وحنجرة": "👂",
  // Psychiatry
  "psychiatry": "🧘", "الطب النفسي": "🧘", "نفسية": "🧘",
  // Surgery
  "surgery": "🔬", "الجراحة": "🔬",
  // Obstetrics & Gynecology
  "obstetrics": "🤱", "النساء والولادة": "🤱",
  // Oncology
  "oncology": "🎗️", "أورام": "🎗️",
  // Urology
  "urology": "💊", "المسالك البولية": "💊",
  // Gastroenterology
  "gastroenterology": "🫁", "الجهاز الهضمي": "🫁",
  // Pulmonology
  "pulmonology": "🫁", "أمراض الصدر والجهاز التنفسي": "🫁", "صدرية": "🫁",
  // Endocrinology
  "endocrinology": "⚗️", "الغدد الصماء والسكري": "⚗️", "سكري": "⚗️",
  // Rheumatology
  "rheumatology": "🦾", "الروماتيزم": "🦾",
  // Nephrology
  "nephrology": "🩻", "كلى": "🩻",
  // Hematology
  "hematology": "🩸", "أمراض الدم": "🩸",
  // Radiology
  "radiology": "📡", "الأشعة": "📡",
  // Emergency
  "emergency": "🚨", "الطوارئ": "🚨",
  // Default
  "default": "🏥",
};

export function getSpecialtyIcon(specialtyName: string): string {
  if (!specialtyName) return SPECIALTY_ICONS.default;
  const lower = specialtyName.toLowerCase();
  if (SPECIALTY_ICONS[lower]) return SPECIALTY_ICONS[lower];
  for (const [key, icon] of Object.entries(SPECIALTY_ICONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return icon;
  }
  return SPECIALTY_ICONS.default;
}
