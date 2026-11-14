export interface HoldOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export interface SpecialtyConfig {
  hasHoldForTest: boolean;
  holdOptions: HoldOption[];
  holdSectionTitle?: { ar: string; en: string };
  secretaryCanManageQueue?: boolean;
  hasRecurringPatients?: boolean;
  recurringTreatmentTypes?: { value: string; labelAr: string; labelEn: string }[];
}

export const SPECIALTY_CONFIGS: Record<string, SpecialtyConfig> = {

  // ── Orthopedics ──────────────────────────────────────────────
  orthopedics: {
    hasHoldForTest: true,
    hasRecurringPatients: true,
    recurringTreatmentTypes: [
      { value: "physical_therapy", labelAr: "علاج طبيعي", labelEn: "Physical Therapy" },
      { value: "fracture_followup", labelAr: "متابعة كسر", labelEn: "Fracture Follow-up" },
      { value: "joint_injection", labelAr: "حقن مفاصل دورية", labelEn: "Joint Injections" },
      { value: "post_surgery", labelAr: "متابعة ما بعد عملية", labelEn: "Post-Surgery Follow-up" },
      { value: "scoliosis", labelAr: "علاج انحراف العمود الفقري", labelEn: "Scoliosis Treatment" },
    ],
    holdSectionTitle: { ar: "إرسال لفحص", en: "Send for Test" },
    holdOptions: [
      { value: "xray", labelAr: "صورة أشعة سينية (X-Ray)", labelEn: "X-Ray" },
      { value: "mri", labelAr: "رنين مغناطيسي (MRI)", labelEn: "MRI Scan" },
      { value: "ct", labelAr: "أشعة مقطعية (CT Scan)", labelEn: "CT Scan" },
      { value: "ultrasound", labelAr: "موجات فوق صوتية", labelEn: "Ultrasound" },
      { value: "dexa", labelAr: "قياس كثافة العظام (DEXA)", labelEn: "DEXA Scan" },
    ],
  },

  // ── Cardiology ───────────────────────────────────────────────
  cardiology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص قلبي", en: "Cardiac Test" },
    holdOptions: [
      { value: "ecg", labelAr: "رسم القلب (ECG)", labelEn: "ECG / EKG" },
      { value: "echo", labelAr: "تخطيط صدى القلب (Echo)", labelEn: "Echocardiogram" },
      { value: "stress", labelAr: "اختبار الإجهاد", labelEn: "Stress Test" },
      { value: "holter", labelAr: "هولتر مونيتور (24 ساعة)", labelEn: "Holter Monitor" },
      { value: "xray", labelAr: "أشعة صدر", labelEn: "Chest X-Ray" },
      { value: "labs", labelAr: "تحاليل مخبرية", labelEn: "Lab Tests" },
    ],
  },

  // ── Neurology ────────────────────────────────────────────────
  neurology: {
    hasHoldForTest: true,
    hasRecurringPatients: true,
    recurringTreatmentTypes: [
      { value: "epilepsy", labelAr: "متابعة الصرع", labelEn: "Epilepsy Management" },
      { value: "migraine", labelAr: "علاج الشقيقة", labelEn: "Migraine Treatment" },
      { value: "parkinson", labelAr: "متابعة باركنسون", labelEn: "Parkinson's Follow-up" },
      { value: "ms", labelAr: "متابعة التصلب المتعدد", labelEn: "MS Follow-up" },
    ],
    holdSectionTitle: { ar: "إرسال لفحص عصبي", en: "Neuro Test" },
    holdOptions: [
      { value: "mri_brain", labelAr: "رنين مغناطيسي دماغ", labelEn: "Brain MRI" },
      { value: "ct_brain", labelAr: "أشعة مقطعية دماغ", labelEn: "Brain CT" },
      { value: "eeg", labelAr: "رسم المخ (EEG)", labelEn: "EEG" },
      { value: "emg", labelAr: "توصيل عصبي (EMG)", labelEn: "EMG / Nerve Conduction" },
      { value: "labs", labelAr: "تحاليل مخبرية", labelEn: "Lab Tests" },
    ],
  },

  // ── Ophthalmology ────────────────────────────────────────────
  ophthalmology: {
    hasHoldForTest: true,
    hasRecurringPatients: true,
    recurringTreatmentTypes: [
      { value: "glaucoma", labelAr: "متابعة الجلوكوما", labelEn: "Glaucoma Management" },
      { value: "retina", labelAr: "متابعة الشبكية", labelEn: "Retina Follow-up" },
      { value: "contacts", labelAr: "متابعة العدسات اللاصقة", labelEn: "Contact Lens Follow-up" },
      { value: "children_vision", labelAr: "تصحيح بصر الأطفال", labelEn: "Pediatric Vision Correction" },
    ],
    holdSectionTitle: { ar: "إرسال لفحص بصري", en: "Eye Test" },
    holdOptions: [
      { value: "visual_field", labelAr: "فحص المجال البصري", labelEn: "Visual Field Test" },
      { value: "oct", labelAr: "تصوير OCT للشبكية", labelEn: "OCT Scan" },
      { value: "fundus", labelAr: "تصوير قاع العين", labelEn: "Fundus Photography" },
      { value: "topography", labelAr: "خريطة القرنية", labelEn: "Cornea Topography" },
      { value: "iop", labelAr: "قياس ضغط العين", labelEn: "IOP Measurement" },
    ],
  },

  // ── Dentistry ────────────────────────────────────────────────
  dentistry: {
    hasHoldForTest: true,
    secretaryCanManageQueue: true,
    hasRecurringPatients: true, // Dentist usually can't leave patient to use computer
    holdSectionTitle: { ar: "إرسال لفحص أسنان", en: "Dental Test" },
    holdOptions: [
      { value: "xray_panoramic", labelAr: "أشعة بانورامية للأسنان", labelEn: "Panoramic X-Ray" },
      { value: "xray_periapical", labelAr: "أشعة محيط الجذر", labelEn: "Periapical X-Ray" },
      { value: "xray_bitewing", labelAr: "أشعة جانبية", labelEn: "Bitewing X-Ray" },
      { value: "ct_cbct", labelAr: "أشعة مقطعية أسنان (CBCT)", labelEn: "CBCT Scan" },
      { value: "labs", labelAr: "تحاليل قبل الجراحة", labelEn: "Pre-Surgery Labs" },
    ],
  },

  // ── ENT (Ear, Nose & Throat) ──────────────────────────────────
  ent: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "ENT Test" },
    holdOptions: [
      { value: "audiogram", labelAr: "فحص السمع (Audiogram)", labelEn: "Audiogram" },
      { value: "ct_sinuses", labelAr: "أشعة الجيوب الأنفية (CT)", labelEn: "Sinus CT" },
      { value: "tympanometry", labelAr: "قياس طبلة الأذن", labelEn: "Tympanometry" },
      { value: "endoscopy", labelAr: "منظار الأنف والحنجرة", labelEn: "Nasal Endoscopy" },
      { value: "xray", labelAr: "أشعة الرقبة", labelEn: "Neck X-Ray" },
    ],
  },

  // ── Radiology / Imaging ───────────────────────────────────────
  radiology: {
    hasHoldForTest: false,
    holdOptions: [],
  },

  // ── Gastroenterology ─────────────────────────────────────────
  gastroenterology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "GI Test" },
    holdOptions: [
      { value: "endoscopy_prep", labelAr: "تحضير للمنظار العلوي", labelEn: "Upper Endoscopy Prep" },
      { value: "colonoscopy_prep", labelAr: "تحضير لمنظار القولون", labelEn: "Colonoscopy Prep" },
      { value: "ultrasound", labelAr: "موجات فوق صوتية البطن", labelEn: "Abdominal Ultrasound" },
      { value: "ct_abdomen", labelAr: "أشعة مقطعية البطن", labelEn: "Abdominal CT" },
      { value: "labs", labelAr: "تحاليل مخبرية", labelEn: "Lab Tests" },
    ],
  },

  // ── Urology ──────────────────────────────────────────────────
  urology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "Urology Test" },
    holdOptions: [
      { value: "ultrasound", labelAr: "موجات فوق صوتية الكلى والمثانة", labelEn: "Kidney/Bladder Ultrasound" },
      { value: "urine_analysis", labelAr: "تحليل بول", labelEn: "Urine Analysis" },
      { value: "blood_labs", labelAr: "تحاليل دم", labelEn: "Blood Labs" },
      { value: "ct_urogram", labelAr: "أشعة مقطعية المسالك (CT Urogram)", labelEn: "CT Urogram" },
      { value: "cystoscopy_prep", labelAr: "تحضير منظار المثانة", labelEn: "Cystoscopy Prep" },
    ],
  },

  // ── Dermatology ──────────────────────────────────────────────
  dermatology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "Derm Test" },
    holdOptions: [
      { value: "biopsy", labelAr: "خزعة جلدية (Biopsy)", labelEn: "Skin Biopsy" },
      { value: "allergy_test", labelAr: "اختبار الحساسية", labelEn: "Allergy Test" },
      { value: "dermoscopy", labelAr: "فحص الدرماسكوب", labelEn: "Dermoscopy" },
      { value: "labs", labelAr: "تحاليل مخبرية", labelEn: "Lab Tests" },
    ],
  },

  // ── Oncology ─────────────────────────────────────────────────
  oncology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "Oncology Test" },
    holdOptions: [
      { value: "ct", labelAr: "أشعة مقطعية (CT)", labelEn: "CT Scan" },
      { value: "mri", labelAr: "رنين مغناطيسي (MRI)", labelEn: "MRI" },
      { value: "pet_ct", labelAr: "PET-CT Scan", labelEn: "PET-CT Scan" },
      { value: "biopsy", labelAr: "خزعة", labelEn: "Biopsy" },
      { value: "labs", labelAr: "تحاليل أورام", labelEn: "Tumor Markers" },
    ],
  },

  // ── Pulmonology ───────────────────────────────────────────────
  pulmonology: {
    hasHoldForTest: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "Pulm Test" },
    holdOptions: [
      { value: "spirometry", labelAr: "فحص التنفس (Spirometry)", labelEn: "Spirometry" },
      { value: "chest_xray", labelAr: "أشعة صدر", labelEn: "Chest X-Ray" },
      { value: "ct_chest", labelAr: "أشعة مقطعية الصدر", labelEn: "Chest CT" },
      { value: "sputum", labelAr: "فحص بلغم", labelEn: "Sputum Test" },
      { value: "sleep_study", labelAr: "دراسة النوم", labelEn: "Sleep Study" },
    ],
  },

  // ── Endocrinology ─────────────────────────────────────────────
  endocrinology: {
    hasHoldForTest: true,
    hasRecurringPatients: true,
    recurringTreatmentTypes: [
      { value: "diabetes", labelAr: "متابعة السكري", labelEn: "Diabetes Management" },
      { value: "thyroid", labelAr: "متابعة الغدة الدرقية", labelEn: "Thyroid Management" },
      { value: "obesity", labelAr: "برنامج إدارة الوزن", labelEn: "Weight Management" },
      { value: "hormones", labelAr: "علاج الهرمونات", labelEn: "Hormone Therapy" },
    ],
    holdSectionTitle: { ar: "إرسال لتحاليل", en: "Labs / Tests" },
    holdOptions: [
      { value: "hormone_labs", labelAr: "تحاليل هرمونية", labelEn: "Hormone Labs" },
      { value: "glucose_tolerance", labelAr: "اختبار تحمل الجلوكوز", labelEn: "Glucose Tolerance Test" },
      { value: "thyroid_ultrasound", labelAr: "موجات صوتية الغدة الدرقية", labelEn: "Thyroid Ultrasound" },
      { value: "dexa", labelAr: "كثافة العظام (DEXA)", labelEn: "DEXA Scan" },
      { value: "labs", labelAr: "تحاليل شاملة", labelEn: "Comprehensive Labs" },
    ],
  },

  // ── Rheumatology ─────────────────────────────────────────────
  rheumatology: {
    hasHoldForTest: true,
    hasRecurringPatients: true,
    holdSectionTitle: { ar: "إرسال لفحص", en: "Rheum Test" },
    holdOptions: [
      { value: "xray", labelAr: "أشعة المفاصل", labelEn: "Joint X-Ray" },
      { value: "mri_joints", labelAr: "رنين مغناطيسي المفاصل", labelEn: "Joint MRI" },
      { value: "ultrasound_joints", labelAr: "موجات صوتية المفاصل", labelEn: "Joint Ultrasound" },
      { value: "autoimmune_labs", labelAr: "تحاليل مناعة ذاتية", labelEn: "Autoimmune Labs" },
      { value: "labs", labelAr: "تحاليل مخبرية", labelEn: "Lab Tests" },
    ],
  },

  // ── Default (no hold) ─────────────────────────────────────────
  default: {
    hasHoldForTest: false,
    holdOptions: [],
  },
};

const SPECIALTY_MAP: Record<string, string> = {
  "orthopedics": "orthopedics", "العظام والمفاصل": "orthopedics", "عظام": "orthopedics",
  "cardiology": "cardiology", "أمراض القلب": "cardiology", "قلب": "cardiology",
  "neurology": "neurology", "أمراض الأعصاب": "neurology", "أعصاب": "neurology",
  "ophthalmology": "ophthalmology", "طب العيون": "ophthalmology", "عيون": "ophthalmology",
  "dentistry": "dentistry", "طب الأسنان": "dentistry", "أسنان": "dentistry",
  "ent": "ent", "أنف وأذن وحنجرة": "ent", "حنجرة": "ent",
  "gastroenterology": "gastroenterology", "الجهاز الهضمي": "gastroenterology", "هضمي": "gastroenterology",
  "urology": "urology", "المسالك البولية": "urology",
  "dermatology": "dermatology", "الجلدية": "dermatology",
  "oncology": "oncology", "أورام": "oncology",
  "pulmonology": "pulmonology", "أمراض الصدر والجهاز التنفسي": "pulmonology", "صدرية": "pulmonology",
  "endocrinology": "endocrinology", "الغدد الصماء والسكري": "endocrinology", "سكري": "endocrinology",
  "rheumatology": "rheumatology", "الروماتيزم": "rheumatology", "روماتيزم": "rheumatology",
};

export function getSpecialtyConfig(specialtyName: string, customConfigJson?: string | null): SpecialtyConfig {
  if (customConfigJson) {
    try { return JSON.parse(customConfigJson) as SpecialtyConfig; } catch { /* ignore */ }
  }
  const lower = specialtyName.toLowerCase();
  for (const [key, configKey] of Object.entries(SPECIALTY_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return SPECIALTY_CONFIGS[configKey] ?? SPECIALTY_CONFIGS.default;
    }
  }
  return SPECIALTY_CONFIGS.default;
}
