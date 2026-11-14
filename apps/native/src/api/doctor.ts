import { apiFetch } from "./client";

export type AppointmentStatus =
  | "scheduled" | "confirmed" | "in_progress" | "completed"
  | "cancelled" | "no_show" | "on_hold";

export type Appointment = {
  id: string;
  appointmentNumber: string;
  date: string;
  status: AppointmentStatus;
  arrivalStatus: string;
  type: string;
  isPaid: boolean;
  feeAmount: number | null;
  queueNumber: number | null;
  reason: string | null;
  notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  source: string;
  patient: {
    id: string;
    name: string;
    nameAr: string | null;
    phone: string;
    gender: string;
    dateOfBirth: string | null;
    bloodType: string | null;
    patientNumber: string;
  };
};

export type DashboardData = {
  doctor: {
    id: string;
    name: string;
    nameAr: string;
    specialty: { name: string; nameAr: string };
    logoUrl: string | null;
    clinicAddress: string | null;
    workingHoursStart: string | null;
    workingHoursEnd: string | null;
  };
  stats: {
    todayTotal: number;
    todayCompleted: number;
    todayWaiting: number;
    weekTotal: number;
    totalPatients: number;
    unreadMessages: number;
  };
  queue: Appointment[];
  subscription: { active: boolean; expiresAt: string | null };
};

export type Patient = {
  id: string;
  patientNumber: string;
  name: string;
  nameAr: string | null;
  phone: string;
  gender: string;
  dateOfBirth: string | null;
  bloodType: string | null;
  isActive: boolean;
  isRecurring: boolean;
  treatmentType: string | null;
  createdAt: string;
  appointmentCount: number;
};

export type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

export type DoctorSettings = {
  name: string;
  nameAr: string;
  bio: string | null;
  bioAr: string | null;
  services: string | null;
  announcement: string | null;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  qualification: string | null;
  qualificationAr: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  showConsultationFee: boolean;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  appointmentDuration: number;
  clinicAddress: string | null;
  clinicLat: number | null;
  clinicLng: number | null;
  logoUrl: string | null;
  recurringPatientsEnabled: boolean;
};

export type QueueAppointment = {
  id: string;
  appointmentNumber: string;
  queueNumber: number;
  date: string;
  time?: string;
  status: AppointmentStatus;
  arrivalStatus: string;
  reason: string | null;
  patient: {
    id: string;
    name: string;
    nameAr: string | null;
    phone: string;
    patientNumber: string;
  };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboard(): Promise<DashboardData> {
  return apiFetch(`/doctor/dashboard`);
}

// ── Today's Queue ─────────────────────────────────────────────────────────────
export async function getTodayQueue(): Promise<{ queue: QueueAppointment[] }> {
  return apiFetch(`/doctor/queue`);
}

// ── Create Appointment ────────────────────────────────────────────────────────
export async function createAppointment(data: {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  reason?: string;
}): Promise<{ success: boolean; appointmentId: string; appointmentNumber: string }> {
  return apiFetch(`/doctor/appointments/create`, { method: "POST", body: data });
}

// ── Delete Appointment ────────────────────────────────────────────────────────
export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/appointments/${id}`, { method: "DELETE" });
}

// ── Appointments ──────────────────────────────────────────────────────────────
export async function getAppointments(params?: {
  date?: string;
  status?: string;
  page?: number;
}): Promise<{ appointments: Appointment[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.date)   q.set("date", params.date);
  if (params?.status) q.set("status", params.status);
  if (params?.page)   q.set("page", String(params.page));
  return apiFetch(`/doctor/appointments?${q}`);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  extra?: { notes?: string; diagnosis?: string; prescription?: string }
): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/appointments/${id}/status`, {
    method: "PATCH",
    body: { status, ...extra },
  });
}

export async function updateAppointment(
  id: string,
  data: {
    status?: string;
    arrivalStatus?: string;
    notes?: string;
    diagnosis?: string;
    prescription?: string;
  }
): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/appointments/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function markArrived(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/appointments/${id}/arrive`, { method: "POST" });
}

export async function markPaid(
  id: string,
  amount: number
): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/appointments/${id}/pay`, {
    method: "POST",
    body: { amount },
  });
}

// ── Patients ──────────────────────────────────────────────────────────────────
export async function getPatients(params?: {
  search?: string;
  page?: number;
}): Promise<{ patients: Patient[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page)   q.set("page", String(params.page));
  return apiFetch(`/doctor/patients?${q}`);
}

export async function getPatient(id: string): Promise<Patient & {
  appointments: Appointment[];
  clinicalNotes: Array<{ id: string; body: string; createdAt: string }>;
}> {
  return apiFetch(`/doctor/patients/${id}`);
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export async function getPosts(): Promise<Post[]> {
  const result = await apiFetch<{ posts: Post[]; total: number }>(`/doctor/posts`);
  return result.posts;
}

export async function createPost(data: {
  content: string;
  title?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<{ success: boolean; postId: string }> {
  return apiFetch(`/doctor/posts`, { method: "POST", body: data });
}

export async function deletePost(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/posts?id=${id}`, { method: "DELETE" });
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<DoctorSettings> {
  return apiFetch(`/doctor/settings`);
}

export async function updateSettings(
  data: Partial<DoctorSettings>
): Promise<{ success: boolean }> {
  return apiFetch(`/doctor/settings`, { method: "PATCH", body: data });
}

// ── Aliases used by screen components ─────────────────────────────────────────
export const getDoctorAppointments = getAppointments;
export const updateStatus = (id: string, status: string) =>
  updateAppointmentStatus(id, status as AppointmentStatus);
export const getDoctorPatients = getPatients;
export const getDoctorPosts = () => getPosts().then((posts) => ({ posts, total: posts.length }));
export const getDoctorSettings = getSettings;
