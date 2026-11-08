"use server";

import { getListedDoctors } from "@/lib/publicDoctors";
import { getSpecialtyIcon, inferGovFromAddress } from "@/lib/iraq";
import { getDoctorRatingStatsMap } from "@/app/actions/doctorRatings";
import { getActiveStoryDoctorIds } from "@/app/actions/doctorStories";

export type MapDoctorPin = {
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
  specialtyIcon: string;
  ratingAverage: number;
  ratingCount: number;
  hasActiveStory: boolean;
};

export async function fetchMapDoctorPins(filters: {
  specialty?: string;
  gov?: string;
  district?: string;
  q?: string;
}): Promise<MapDoctorPin[]> {
  const rawDoctors = await getListedDoctors({
    specialtyId: filters.specialty,
    governorate: filters.gov,
    district: filters.district,
    query: filters.q,
  });

  const [ratingMap, activeStoryIds] = await Promise.all([
    getDoctorRatingStatsMap(rawDoctors.map((d) => d.id)),
    getActiveStoryDoctorIds(rawDoctors.map((d) => d.id)),
  ]);

  return rawDoctors.map((doc) => {
    const govInfo = inferGovFromAddress(doc.clinicAddress ?? "");
    const rating = ratingMap.get(doc.id);
    return {
      id: doc.id,
      nameAr: doc.nameAr,
      name: doc.name,
      specialtyId: doc.specialtyId,
      specialtyAr: doc.specialty.nameAr,
      specialtyEn: doc.specialty.name,
      lat: doc.clinicLat ?? null,
      lng: doc.clinicLng ?? null,
      govLat: govInfo?.lat ?? 33.2,
      govLng: govInfo?.lng ?? 44.0,
      clinicAddress: doc.clinicAddress,
      phone: doc.phone,
      consultationFee: doc.consultationFee,
      workingHoursStart: doc.workingHoursStart,
      workingHoursEnd: doc.workingHoursEnd,
      workingDays: doc.workingDays,
      experienceYears: doc.experienceYears,
      bio: doc.bio,
      bioAr: doc.bioAr,
      logoUrl: doc.logoUrl,
      showConsultationFee: doc.showConsultationFee ?? true,
      specialtyIcon: getSpecialtyIcon(doc.specialtyId),
      ratingAverage: rating?.average ?? 0,
      ratingCount: rating?.count ?? 0,
      hasActiveStory: activeStoryIds.has(doc.id),
    };
  });
}
