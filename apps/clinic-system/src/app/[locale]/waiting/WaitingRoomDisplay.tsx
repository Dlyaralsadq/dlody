"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  queueNumber: number | null;
  arrivalStatus: string;
  returnedFromTest?: boolean;
  patient: { name: string; nameAr: string | null; };
  type: string;
}

interface RoomData {
  waiting: Appointment[];
  called?: Appointment | null;
  withDoctor?: Appointment | null;
  onHold?: Appointment[];
  done: Appointment[];
  pending: Appointment[];
  total: number;
}

export default function WaitingRoomDisplay({ roomData, doctor, locale }: {
  roomData: RoomData; doctor: any; locale: string; doctorId: string;
}) {
  const router = useRouter();
  const ar = locale === "ar";
  const [time, setTime] = useState<Date | null>(null);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    setTime(new Date());
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!roomData.called) { setBlink(true); return; }
    const t = setInterval(() => setBlink(b => !b), 650);
    return () => clearInterval(t);
  }, [roomData.called]);

  const timeStr = time ? time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--";
  const dateStr = time ? time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "";

  const activeCalled  = roomData.called;
  const activeWithDoc = roomData.withDoctor;
  const onHold        = (roomData.onHold ?? []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#060912] text-white select-none" dir={ar ? "rtl" : "ltr"}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/6 blur-[100px] rounded-full" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/6 px-10 py-5 backdrop-blur-sm bg-black/20">
        <div className="flex items-center gap-5">
          {/* Specialty icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-950/60 text-2xl">
            {doctor.specialty?.name === "Cardiology" ? "❤️"
              : doctor.specialty?.name === "Neurology" ? "🧠"
              : doctor.specialty?.name === "Orthopedics" ? "🦴"
              : doctor.specialty?.name === "Ophthalmology" ? "👁️"
              : doctor.specialty?.name === "Dentistry" ? "🦷"
              : "🏥"}
          </div>
          <div>
            <p className="text-xl font-black text-white tracking-tight">{ar ? doctor.nameAr : doctor.name}</p>
            <p className="text-sm text-indigo-300/70 mt-0.5">{ar ? doctor.specialty?.nameAr : doctor.specialty?.name}</p>
          </div>
        </div>

        {/* Clock */}
        <div className="text-end">
          <p className="text-5xl font-black tabular-nums tracking-tight text-white">{timeStr}</p>
          <p className="text-sm text-white/30 mt-1 font-medium">{dateStr}</p>
        </div>
      </div>

      <div className="relative z-10 p-8 space-y-6">

        {/* ── CALLED — blinking alert ── */}
        {activeCalled && (
          <div className={`rounded-3xl border-2 p-10 text-center transition-all duration-500 ${
            blink
              ? "border-yellow-400/70 bg-yellow-500/8 shadow-[0_0_60px_rgba(234,179,8,.15)]"
              : "border-yellow-400/20 bg-yellow-500/4"
          }`}>
            <div className={`flex items-center justify-center gap-3 mb-6 transition-opacity duration-500 ${blink ? "opacity-100" : "opacity-40"}`}>
              <span className="h-3 w-3 rounded-full bg-yellow-400 animate-ping absolute" />
              <span className="h-3 w-3 rounded-full bg-yellow-400 relative" />
              <p className="text-xl font-bold text-yellow-300 tracking-wide">
                {ar ? "يُرجى التوجه لغرفة الطبيب" : "Please Proceed to Doctor's Room"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-16">
              <div>
                <p className="text-xs text-yellow-400/50 uppercase tracking-widest mb-2">{ar ? "رقم الدور" : "Queue No."}</p>
                <p className={`text-[130px] font-black leading-none transition-colors duration-500 ${blink ? "text-yellow-300" : "text-yellow-300/40"}`}>
                  {activeCalled.queueNumber}
                </p>
              </div>
              <div className="w-px h-28 bg-yellow-400/15" />
              <div className="text-start">
                <p className="text-xs text-yellow-400/50 uppercase tracking-widest mb-3">{ar ? "المريض" : "Patient"}</p>
                <p className="text-4xl font-bold text-white">{activeCalled.patient.name}</p>
                {activeCalled.patient.nameAr && (
                  <p className="text-2xl text-yellow-300/50 mt-2">{activeCalled.patient.nameAr}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WITH DOCTOR — steady ── */}
        {activeWithDoc && !activeCalled && (
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/40 to-violet-900/20 p-10 text-center shadow-[0_0_60px_rgba(99,102,241,.1)]">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-base text-indigo-300 font-semibold tracking-wide uppercase">
                {ar ? "جلسة كشف جارية" : "Consultation in Progress"}
              </p>
            </div>
            <div className="flex items-center justify-center gap-16">
              <div>
                <p className="text-xs text-indigo-400/50 uppercase tracking-widest mb-2">{ar ? "رقم الدور" : "Queue No."}</p>
                <p className="text-[110px] font-black leading-none text-white">{activeWithDoc.queueNumber}</p>
              </div>
              <div className="w-px h-24 bg-indigo-400/15" />
              <div className="text-start">
                <p className="text-xs text-indigo-400/50 uppercase tracking-widest mb-3">{ar ? "المريض" : "Patient"}</p>
                <p className="text-4xl font-bold text-white">{activeWithDoc.patient.name}</p>
                {activeWithDoc.patient.nameAr && (
                  <p className="text-2xl text-indigo-300/50 mt-2">{activeWithDoc.patient.nameAr}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── IDLE ── */}
        {!activeCalled && !activeWithDoc && (
          <div className="rounded-3xl border border-white/5 bg-white/3 p-16 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <p className="text-2xl font-bold text-white/20">{ar ? "العيادة جاهزة" : "Clinic Ready"}</p>
          </div>
        )}

        {/* ── WAITING LIST ── */}
        <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-3 px-7 py-4 border-b border-white/6">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
              {ar ? "قائمة الانتظار" : "Waiting Queue"} — {roomData.waiting.length}
            </h2>
          </div>

          {roomData.waiting.length === 0 ? (
            <p className="px-7 py-10 text-center text-white/15 text-lg font-medium">
              {ar ? "لا أحد في الانتظار حالياً" : "Nobody waiting"}
            </p>
          ) : (
            <div className="divide-y divide-white/4">
              {roomData.waiting.map((apt, i) => (
                <div key={apt.id} className={`flex items-center gap-6 px-7 py-5 ${apt.returnedFromTest ? "bg-emerald-500/5" : ""}`}>
                  {/* Queue number */}
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${
                    apt.returnedFromTest
                      ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-300"
                      : i === 0
                        ? "bg-amber-500/20 border border-amber-500/25 text-amber-300"
                        : "bg-white/5 border border-white/8 text-white/50"
                  }`}>
                    {apt.queueNumber}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className={`text-xl font-semibold ${apt.returnedFromTest ? "text-emerald-200" : "text-white"}`}>
                      {apt.patient.name}
                    </p>
                    {apt.patient.nameAr && (
                      <p className="text-sm text-white/30 mt-0.5">{apt.patient.nameAr}</p>
                    )}
                  </div>

                  {/* Returned indicator — subtle, no text */}
                  {apt.returnedFromTest && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ON HOLD — minimal, no test details ── */}
        {onHold.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
            <div className="flex items-center gap-3 px-7 py-4 border-b border-white/5">
              <div className="h-2 w-2 rounded-full bg-orange-400/60" />
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">
                {ar ? "خارج العيادة مؤقتاً" : "Temporarily Away"} — {onHold.length}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 px-7 py-4">
              {onHold.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/6 px-4 py-2.5">
                  <span className="text-base font-black text-white/50">{apt.queueNumber}</span>
                  <span className="text-sm text-white/40">{apt.patient.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-white/10 font-mono tracking-widest uppercase">
          ClinicPro · {ar ? "يتجدد كل ثانيتين" : "Refreshes every 2 seconds"}
        </p>
      </div>
    </div>
  );
}
