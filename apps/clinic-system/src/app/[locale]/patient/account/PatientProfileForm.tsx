"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, User } from "lucide-react";
import { updatePatientProfile } from "@/app/actions/patientAuth";

export default function PatientProfileForm({
  locale,
  userId,
  initial,
}: {
  locale: string;
  userId: string;
  initial: {
    name: string;
    gender: string | null;
    dateOfBirth: string | null;
    bloodType: string | null;
    phone: string;
  };
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [gender, setGender] = useState(initial.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth ?? "");
  const [bloodType, setBloodType] = useState(initial.bloodType ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await updatePatientProfile(userId, { name, gender, dateOfBirth, bloodType });
    setSaving(false);
    if (r.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white flex items-center gap-2">
        <User size={15} className="text-cyan-400" />
        {ar ? "معلوماتي الشخصية" : "My profile"}
      </h2>
      <p className="text-[11px] text-white/30">{ar ? "تُستخدم تلقائياً عند حجز موعد لنفسك" : "Auto-filled when booking for yourself"}</p>

      <div>
        <label className="block text-xs text-white/40 mb-1">{ar ? "الاسم" : "Name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="form-input w-full" />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">{ar ? "رقم الهاتف" : "Phone"}</label>
        <input value={initial.phone} disabled dir="ltr" className="form-input w-full opacity-60" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">{ar ? "تاريخ الميلاد" : "Date of birth"}</label>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="form-input w-full [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">{ar ? "الجنس" : "Gender"}</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input w-full">
            <option value="">{ar ? "—" : "—"}</option>
            <option value="male">{ar ? "ذكر" : "Male"}</option>
            <option value="female">{ar ? "أنثى" : "Female"}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">{ar ? "فصيلة الدم" : "Blood type"}</label>
        <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="form-input w-full">
          <option value="">—</option>
          {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600/20 border border-cyan-500/30 py-2.5 text-sm font-semibold text-cyan-300 disabled:opacity-50">
        <Save size={14} />
        {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? "..." : (ar ? "حفظ المعلومات" : "Save profile")}
      </button>
    </form>
  );
}
