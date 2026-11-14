import { apiFetch } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type DoctorPin = {
  id: string;
  nameAr: string;
  name: string;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  lat: number | null;
  lng: number | null;
  govLat: number;
  govLng: number;
  clinicAddress: string | null;
  phone: string | null;
  consultationFee: number | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string | null;
  experienceYears: number | null;
  bio: string | null;
  bioAr: string | null;
  logoUrl: string | null;
  showConsultationFee: boolean;
  ratingAverage: number;
  ratingCount: number;
  hasActiveStory: boolean;
};

export type DoctorPublic = {
  id: string;
  name: string;
  nameAr: string;
  specialty: { id: string; name: string; nameAr: string };
  phone: string | null;
  clinicAddress: string | null;
  clinicLat: number | null;
  clinicLng: number | null;
  consultationFee: number | null;
  showConsultationFee: boolean;
  workingDays: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  appointmentDuration: number;
  bio: string | null;
  bioAr: string | null;
  services: string | null;
  announcement: string | null;
  logoUrl: string | null;
  experienceYears: number | null;
  ratingAverage: number;
  ratingCount: number;
  followerCount: number;
  isFollowing: boolean;
  hasActiveStory: boolean;
};

export type PatientAppointment = {
  id: string;
  date: string;
  status: string;
  type: string;
  doctor: {
    id: string;
    name: string;
    nameAr: string;
    specialty: { name: string; nameAr: string };
    clinicAddress: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
};

export type Specialty = {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
};

export type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  doctor: {
    id: string;
    name: string;
    nameAr: string;
    logoUrl: string | null;
    specialtyId: string;
    specialty: { name: string; nameAr: string };
  };
};

export type AvailableSlot = {
  time: string;
  label: string;
};

/** Alias used by map screen */
export type MapPin = DoctorPin;

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatarUrl: string | null };
};

export type StoryGroup = {
  doctorId: string;
  doctor: {
    id: string;
    nameAr: string;
    logoUrl: string | null;
  };
  stories: Array<{
    id: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    createdAt: string;
  }>;
};

export type PatientProfile = {
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  avatarUrl: string | null;
};

// ── Map ───────────────────────────────────────────────────────────────────────
export async function getMapPins(filters?: {
  specialty?: string;
  gov?: string;
  district?: string;
  q?: string;
}): Promise<DoctorPin[]> {
  const params = new URLSearchParams();
  if (filters?.specialty) params.set("specialty", filters.specialty);
  if (filters?.gov) params.set("gov", filters.gov);
  if (filters?.district) params.set("district", filters.district);
  if (filters?.q) params.set("q", filters.q);
  return apiFetch<DoctorPin[]>(`/patient/map?${params}`);
}

// ── Doctor profile ────────────────────────────────────────────────────────────
export async function getDoctorPublic(
  id: string,
  date?: string,
  viewerId?: string
): Promise<{
  doctor: DoctorPublic;
  posts: FeedPost[];
  rating: { avg: number; count: number };
  slots: { slots: { time: string; available: boolean }[]; durationMinutes?: number } | null;
}> {
  const params = new URLSearchParams({ id });
  if (date)     params.set("date", date);
  if (viewerId) params.set("viewerId", viewerId);
  return apiFetch(`/patient/doctor?${params}`);
}

export async function getDoctorPosts(doctorId: string, page = 1): Promise<FeedPost[]> {
  return apiFetch<FeedPost[]>(`/patient/doctor/${doctorId}/posts?page=${page}`);
}

// ── Home Feed ─────────────────────────────────────────────────────────────────
export async function getHomeFeed(): Promise<{ following: FeedPost[]; suggested: FeedPost[] }> {
  return apiFetch(`/patient/feed`);
}

// ── Explore ───────────────────────────────────────────────────────────────────
export async function getExploreFeed(params?: { q?: string; page?: number }): Promise<{ feed: FeedPost[] }> {
  const q = new URLSearchParams();
  if (params?.q)    q.set("q", params.q);
  if (params?.page) q.set("page", String(params.page));
  const qs = q.toString();
  return apiFetch(`/patient/explore${qs ? `?${qs}` : ""}`);
}

export async function searchExplore(q: string): Promise<{ posts: FeedPost[]; doctors: DoctorPublic[] }> {
  return apiFetch(`/patient/explore/search?q=${encodeURIComponent(q)}`);
}

// ── Specialties ───────────────────────────────────────────────────────────────
export async function getSpecialties(): Promise<Specialty[]> {
  return apiFetch<Specialty[]>(`/patient/specialties`);
}

// ── Appointments ──────────────────────────────────────────────────────────────
export async function getMyAppointments(): Promise<{
  upcoming: PatientAppointment[];
  past: PatientAppointment[];
}> {
  return apiFetch(`/patient/appointments`);
}

export async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<AvailableSlot[]> {
  return apiFetch(`/patient/book/${doctorId}/slots?date=${date}`);
}

export async function bookAppointment(data: {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
  patientName?: string;
  patientPhone?: string;
}): Promise<{ success: boolean; appointmentId: string }> {
  return apiFetch(`/patient/book`, { method: "POST", body: data });
}

export async function cancelAppointment(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/patient/appointments/${id}/cancel`, { method: "POST" });
}

// ── Social ────────────────────────────────────────────────────────────────────
export async function likePost(postId: string): Promise<{ liked: boolean; count: number }> {
  return apiFetch(`/patient/posts/${postId}/like`, { method: "POST" });
}

export async function savePost(postId: string): Promise<{ saved: boolean }> {
  return apiFetch(`/patient/posts/${postId}/save`, { method: "POST" });
}

export async function getSavedPosts(): Promise<{ posts: FeedPost[] }> {
  return apiFetch(`/patient/saved`);
}

export async function getPostComments(postId: string): Promise<{ comments: Comment[] }> {
  return apiFetch(`/patient/posts/${postId}/comments`);
}

export async function addComment(postId: string, content: string): Promise<{ success: boolean; comment: Comment }> {
  return apiFetch(`/patient/posts/${postId}/comments`, { method: "POST", body: { content } });
}

export async function followDoctor(doctorId: string): Promise<{ following: boolean }> {
  return apiFetch(`/patient/doctor/${doctorId}/follow`, { method: "POST" });
}

export async function rateDoctor(
  doctorId: string,
  score: number
): Promise<{ success: boolean }> {
  return apiFetch(`/patient/doctor/${doctorId}/rate`, { method: "POST", body: { score } });
}

export async function getStories(): Promise<{ stories: StoryGroup[] }> {
  return apiFetch(`/patient/stories`);
}

// ── Patient profile ───────────────────────────────────────────────────────────
export async function getMyProfile(): Promise<{
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  avatarUrl: string | null;
}> {
  return apiFetch(`/patient/profile`);
}

export async function updateMyProfile(data: {
  name?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodType?: string;
}): Promise<{ success: boolean }> {
  return apiFetch(`/patient/profile`, { method: "PATCH", body: data });
}
