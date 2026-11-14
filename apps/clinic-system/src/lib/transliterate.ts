/**
 * Arabic → English medical-name transliteration.
 * Designed for Iraqi/Arabic doctor names commonly used in Iraq.
 */

// Common complete name overrides (exact match → exact result)
const NAME_OVERRIDES: Record<string, string> = {
  "أحمد":     "Ahmed",    "محمد":    "Mohammed",  "علي":      "Ali",
  "حسين":     "Hussein",  "عمر":     "Omar",       "عبدالله":  "Abdullah",
  "يوسف":     "Yusuf",    "إبراهيم": "Ibrahim",    "خالد":     "Khalid",
  "حسن":      "Hassan",   "عباس":    "Abbas",      "صالح":     "Saleh",
  "كريم":     "Kareem",   "زيد":     "Zaid",       "تارق":     "Tariq",
  "طارق":     "Tariq",    "سعد":     "Saad",       "مصطفى":    "Mustafa",
  "عادل":     "Adel",     "نبيل":    "Nabil",      "وليد":     "Walid",
  "رياض":     "Riyad",    "فارس":    "Faris",      "حيدر":     "Haider",
  "جاسم":     "Jasim",    "عمار":    "Ammar",      "أمير":     "Amir",
  "باسم":     "Basim",    "ماجد":    "Majid",      "سامي":     "Sami",
  "راضي":     "Radi",     "قاسم":    "Qasim",      "جواد":     "Jawad",
  "مهدي":     "Mahdi",    "منذر":    "Munther",    "لقمان":    "Luqman",
  "زهير":     "Zuhair",   "نضال":    "Nidal",      "ياسر":     "Yaser",
  "أسامة":    "Osama",    "لؤي":     "Luwai",      "فاضل":     "Fadhil",
  "نوفل":     "Nawfal",   "صفاء":    "Safaa",      "هيثم":     "Haytham",
  "سليم":     "Saleem",   "ثامر":    "Thamer",     "عصام":     "Issam",
  "فيصل":     "Faisal",   "زياد":    "Ziad",       "شاكر":     "Shaker",
  // Female names
  "زينب":     "Zainab",   "فاطمة":   "Fatima",     "مريم":     "Maryam",
  "نور":      "Noor",     "رنا":     "Rana",       "سارة":     "Sara",
  "هناء":     "Hanaa",    "أميرة":   "Amira",      "لمياء":    "Lamia",
  "دلال":     "Dalal",    "رشا":     "Rasha",      "سلمى":     "Salma",
  "إيمان":    "Iman",     "هدى":     "Huda",       "رغد":      "Raghad",
  "ميسم":     "Maysam",   "شيماء":   "Shayma",     "نسرين":    "Nasrin",
  // Prefixes / titles
  "دكتور":    "Dr",       "دكتورة":  "Dr",         "أستاذ":    "Prof",
  // Family name parts
  "الراشد":   "Al-Rashid","المنصور": "Al-Mansouri","الجبوري":  "Al-Jubouri",
  "الكريمي":  "Al-Karimi","الساعدي": "Al-Saadi",   "التميمي":  "Al-Tamimi",
  "البغدادي": "Al-Baghdadi","العبيدي":"Al-Ubaidi",  "الدليمي":  "Al-Dulaimi",
  "الحسيني":  "Al-Hussaini","العلوي": "Al-Alawi",  "الموسوي":  "Al-Moussawi",
  "الهاشمي":  "Al-Hashimi","الكعبي": "Al-Kaabi",   "الشمري":   "Al-Shammari",
  "الربيعي":  "Al-Rubaie","الفهد":   "Al-Fahad",   "الزبيدي":  "Al-Zubaidi",
};

// Char-by-char map (fallback)
const CHAR_MAP: Record<string, string> = {
  "ا": "a",  "أ": "a",  "إ": "i",  "آ": "aa",
  "ب": "b",  "ت": "t",  "ث": "th", "ج": "j",
  "ح": "h",  "خ": "kh", "د": "d",  "ذ": "dh",
  "ر": "r",  "ز": "z",  "س": "s",  "ش": "sh",
  "ص": "s",  "ض": "d",  "ط": "t",  "ظ": "th",
  "ع": "a",  "غ": "gh", "ف": "f",  "ق": "q",
  "ك": "k",  "ل": "l",  "م": "m",  "ن": "n",
  "ه": "h",  "و": "o",  "ي": "i",  "ى": "a",
  "ة": "a",  "ء": "",   "ئ": "i",  "ؤ": "o",
  // Diacritics — strip
  "\u064b": "", "\u064c": "", "\u064d": "", "\u064e": "",
  "\u064f": "", "\u0650": "", "\u0651": "", "\u0652": "",
};

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

function charTransliterate(word: string): string {
  let result = "";
  let i = 0;
  const w = word.trim();
  while (i < w.length) {
    const two = w.slice(i, i + 2);
    if (CHAR_MAP[two] !== undefined) { result += CHAR_MAP[two]; i += 2; continue; }
    const one = w[i];
    if (CHAR_MAP[one] !== undefined) result += CHAR_MAP[one];
    else if (/[a-zA-Z0-9\-]/.test(one)) result += one;
    i++;
  }
  return result;
}

export function arabicToEnglish(text: string): string {
  if (!text) return "";

  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      // Try exact word override first
      if (NAME_OVERRIDES[word]) return NAME_OVERRIDES[word];
      // Try without ال prefix
      if (word.startsWith("ال") && NAME_OVERRIDES[word.slice(2)]) {
        return "Al-" + NAME_OVERRIDES[word.slice(2)];
      }
      // Fall back to char-by-char
      const translit = charTransliterate(word);
      return translit ? capitalize(translit) : "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}
