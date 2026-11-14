"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, CheckCircle2 } from "lucide-react";
import { updatePatientProfile, uploadPatientAvatar } from "@/app/actions/patientAuth";

interface InitialData {
  name: string;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  phone: string;
  avatarUrl: string | null;
  nationalId: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
}

export default function PatientProfileForm({
  locale,
  userId,
  initial,
}: {
  locale: string;
  userId: string;
  initial: InitialData;
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
      name, gender, dateOfBirth, bloodType, nationalId, emergencyContact, emergencyPhone,
    });
    setSaving(false);
    if (r.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  const initials = (initial.name[0] ?? "P").toUpperCase();

  return (
    <form onSubmit={handleSave} className="space-y-5">

      {/* ── avatar row ── */}
      <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--bg-card-raised)" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-xl font-black text-white"
        >
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            : initials}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
            {avatarUploading
              ? <Loader2 size={18} className="animate-spin text-white" />
              : <Camera size={18} className="text-white" />}
          </span>
        </button>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {ar ? "الصورة الشخصية" : "Profile photo"}
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="text-xs mt-1 text-indigo-400 hover:text-indigo-300 transition"
          >
            {ar ? "تغيير الصورة" : "Change photo"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* ── basic info ── */}
      <FieldGroup label={ar ? "المعلومات الأساسية" : "Basic info"}>
        <Field label={ar ? "الاسم الكامل" : "Full name"}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input w-full"
          />
        </Field>
        <Field label={ar ? "رقم الهاتف" : "Phone"} hint={ar ? "للتواصل والحجز فقط" : "For contact & booking only"}>
          <input value={initial.phone} disabled dir="ltr" className="form-input w-full opacity-50 cursor-not-allowed" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "تاريخ الميلاد" : "Date of birth"}>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="form-input w-full [color-scheme:dark]"
            />
          </Field>
          <Field label={ar ? "الجنس" : "Gender"}>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input w-full">
              <option value="">—</option>
              <option value="male">{ar ? "ذكر" : "Male"}</option>
              <option value="female">{ar ? "أنثى" : "Female"}</option>
            </select>
          </Field>
        </div>
        <Field label={ar ? "فصيلة الدم" : "Blood type"}>
          <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="form-input w-full">
            <option value="">—</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
      </FieldGroup>

      {/* ── medical info ── */}
      <FieldGroup
        label={ar ? "المعلومات الطبية" : "Medical info"}
        hint={ar ? "تُرسل للطبيب عند الحجز" : "Sent to doctor when booking"}
      >
        <Field label={ar ? "رقم الهوية الوطنية" : "National ID"}>
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            dir="ltr"
            className="form-input w-full font-mono tracking-wider"
            placeholder={ar ? "أدخل رقم الهوية" : "Enter national ID"}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "جهة اتصال الطوارئ" : "Emergency name"}>
            <input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder={ar ? "اسم القريب" : "Name"}
              className="form-input w-full"
            />
          </Field>
          <Field label={ar ? "هاتف الطوارئ" : "Emergency phone"}>
            <input
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              type="tel"
              dir="ltr"
              className="form-input w-full"
            />
          </Field>
        </div>
      </FieldGroup>

      {/* ── save button ── */}
      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50"
        style={{
          background: saved ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.15)",
          border: `1px solid ${saved ? "rgba(16,185,129,.35)" : "rgba(99,102,241,.35)"}`,
          color: saved ? "#34d399" : "#a5b4fc",
        }}
      >
        {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saved
          ? (ar ? "تم الحفظ" : "Saved!")
          : saving
            ? (ar ? "..." : "...")
            : (ar ? "حفظ التغييرات" : "Save changes")}
      </button>
    </form>
  );
}

/* ── sub-components ── */
function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-raised)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{label}</p>
        {hint && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{hint}</p>}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{label}</label>
        {hint && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
