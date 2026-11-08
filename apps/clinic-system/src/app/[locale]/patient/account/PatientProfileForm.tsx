"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, User, Camera, Loader2 } from "lucide-react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { updatePatientProfile, uploadPatientAvatar } from "@/app/actions/patientAuth";

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
    avatarUrl: string | null;
    nationalId: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
  };
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [gender, setGender] = useState(initial.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth ?? "");
  const [bloodType, setBloodType] = useState(initial.bloodType ?? "");
  const [nationalId, setNationalId] = useState(initial.nationalId ?? "");
  const [emergencyContact, setEmergencyContact] = useState(initial.emergencyContact ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(initial.emergencyPhone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadPatientAvatar(fd);
    if (r.success && r.url) {
      setAvatarUrl(r.url);
      router.refresh();
    }
    setAvatarUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await updatePatientProfile(userId, {
      name,
      gender,
      dateOfBirth,
      bloodType,
      nationalId,
      emergencyContact,
      emergencyPhone,
    });
    setSaving(false);
    if (r.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
        <User size={15} className="text-cyan-400" />
        {ar ? "معلوماتي الشخصية" : "My profile"}
        <InfoTooltip locale={locale} text={ar ? "تُستخدم تلقائياً عند حجز موعد لنفسك" : "Auto-filled when booking for yourself"} />
      </h2>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 border-2 border-white/10"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-black text-white">{name[0]?.toUpperCase() ?? "P"}</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
            {avatarUploading ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
          </span>
        </button>
        <div>
          <p className="text-xs font-semibold text-white">{ar ? "الصورة الشخصية" : "Profile photo"}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 mt-0.5"
          >
            {ar ? "تغيير الصورة" : "Change photo"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
      </div>

      <div>
        <label className="form-label">{ar ? "الاسم" : "Name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="form-input w-full" />
      </div>
      <div>
        <label className="form-label">{ar ? "رقم الهاتف" : "Phone"}</label>
        <input value={initial.phone} disabled dir="ltr" className="form-input w-full opacity-60" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">{ar ? "تاريخ الميلاد" : "Date of birth"}</label>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="form-input w-full [color-scheme:dark]" />
        </div>
        <div>
          <label className="form-label">{ar ? "الجنس" : "Gender"}</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input w-full">
            <option value="">{ar ? "—" : "—"}</option>
            <option value="male">{ar ? "ذكر" : "Male"}</option>
            <option value="female">{ar ? "أنثى" : "Female"}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">{ar ? "فصيلة الدم" : "Blood type"}</label>
        <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="form-input w-full">
          <option value="">—</option>
          {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="flex items-center gap-1.5 text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>
          {ar ? "معلومات مهمة" : "Important info"}
          <InfoTooltip locale={locale} text={ar ? "تُرسل للطبيب عند الحجز (رقم الهوية وجهة الطوارئ)" : "Sent to the doctor when you book (ID & emergency contact)"} />
        </p>
        <div className="space-y-3">
          <div>
            <label className="form-label flex items-center gap-1.5">
              {ar ? "رقم الهوية الوطنية" : "National ID"}
              <span className="text-amber-400 text-[10px] font-normal">
                {ar ? "— مطلوب للحجز" : "— required for booking"}
              </span>
            </label>
            <input
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              dir="ltr"
              className="form-input w-full font-mono tracking-widest"
              placeholder={ar ? "أدخل رقم الهوية" : "Enter national ID"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{ar ? "جهة اتصال الطوارئ" : "Emergency contact"}</label>
              <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder={ar ? "اسم القريب" : "Contact name"} className="form-input w-full" />
            </div>
            <div>
              <label className="form-label">{ar ? "هاتف الطوارئ" : "Emergency phone"}</label>
              <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} type="tel" dir="ltr" className="form-input w-full" />
            </div>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600/20 border border-cyan-500/30 py-2.5 text-sm font-semibold text-cyan-300 disabled:opacity-50">
        <Save size={14} />
        {saved ? (ar ? "تم الحفظ ✓" : "Saved ✓") : saving ? "..." : (ar ? "حفظ المعلومات" : "Save profile")}
      </button>
    </form>
  );
}
