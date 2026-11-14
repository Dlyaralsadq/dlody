import { getWaitingRoomData, getDoctorForDisplay } from "@/app/actions/clinic";
import WaitingRoomDisplay from "./WaitingRoomDisplay";
import { notFound } from "next/navigation";

export default async function WaitingRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { locale } = await params;
  const { d: doctorId } = await searchParams;

  if (!doctorId) notFound();

  const [roomData, doctor] = await Promise.all([
    getWaitingRoomData(doctorId),
    getDoctorForDisplay(doctorId),
  ]);

  if (!doctor) notFound();

  return (
    <WaitingRoomDisplay
      roomData={roomData}
      doctor={doctor}
      locale={locale}
      doctorId={doctorId}
    />
  );
}
