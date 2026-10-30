// @ts-nocheck
import bcrypt from "bcryptjs";

// Universal client - works with SQLite (local) and PostgreSQL (Railway/Vercel)
async function createPrisma() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { Pool } = await import("pg");
    const { PrismaClient } = await import("@prisma/client");
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  } else {
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const { PrismaClient } = await import("@prisma/client");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
  }
}

async function main() {
  const prisma = await createPrisma();
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  // Admin user
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hashedPassword, name: "مدير النظام", role: "admin" },
  });

  // All medical specialties — comprehensive list
  const specs = [
    { id: "cardiology",             name: "Cardiology",                  nameAr: "أمراض القلب" },
    { id: "neurology",          name: "Neurology",                 nameAr: "أمراض الأعصاب" },
    { id: "orthopedics",        name: "Orthopedics",               nameAr: "العظام والمفاصل" },
    { id: "pediatrics",         name: "Pediatrics",                nameAr: "طب الأطفال" },
    { id: "dermatology",        name: "Dermatology",               nameAr: "الأمراض الجلدية" },
    { id: "ophthalmology",      name: "Ophthalmology",             nameAr: "طب العيون" },
    { id: "general-medicine",       name: "General Medicine",            nameAr: "الطب العام" },
    { id: "dentistry",              name: "Dentistry",                   nameAr: "طب الأسنان" },
    { id: "ent",                    name: "ENT",                         nameAr: "الأنف والأذن والحنجرة" },
    { id: "pulmonology",            name: "Pulmonology",                 nameAr: "أمراض الصدر والجهاز التنفسي" },
    { id: "endocrinology",          name: "Endocrinology",               nameAr: "الغدد الصماء والسكري" },
    { id: "rheumatology",           name: "Rheumatology",                nameAr: "أمراض الروماتيزم" },
    { id: "urology",                name: "Urology",                     nameAr: "المسالك البولية" },
    { id: "psychiatry",             name: "Psychiatry",                  nameAr: "الطب النفسي" },
    { id: "oncology",               name: "Oncology",                    nameAr: "أمراض الأورام" },
    { id: "obstetrics",             name: "Obstetrics & Gynecology",     nameAr: "النسائية والتوليد" },
    { id: "nephrology",             name: "Nephrology",                  nameAr: "أمراض الكلى" },
    { id: "hematology",             name: "Hematology",                  nameAr: "أمراض الدم" },
    { id: "surgery",                name: "General Surgery",             nameAr: "الجراحة العامة" },
    { id: "emergency",              name: "Emergency Medicine",          nameAr: "طب الطوارئ" },
    { id: "radiology",              name: "Radiology",                   nameAr: "الأشعة والتصوير الطبي" },
    { id: "internal-medicine",      name: "Internal Medicine",           nameAr: "الباطنية" },
    { id: "gastroenterology",       name: "Gastroenterology",            nameAr: "الجهاز الهضمي والكبد" },
    { id: "hepatology",             name: "Hepatology",                  nameAr: "أمراض الكبد" },
    { id: "infectious-disease",     name: "Infectious Disease",          nameAr: "الأمراض المعدية" },
    { id: "neurosurgery",           name: "Neurosurgery",                nameAr: "جراحة الأعصاب" },
    { id: "plastic-surgery",        name: "Plastic Surgery",             nameAr: "الجراحة التجميلية" },
    { id: "vascular-surgery",       name: "Vascular Surgery",            nameAr: "جراحة الأوعية الدموية" },
    { id: "cardiothoracic",         name: "Cardiothoracic Surgery",      nameAr: "جراحة القلب والصدر" },
    { id: "neonatology",            name: "Neonatology",                 nameAr: "طب حديثي الولادة" },
    { id: "allergy",                name: "Allergy & Immunology",        nameAr: "الحساسية والمناعة" },
    { id: "physical-therapy",       name: "Physical Therapy",            nameAr: "العلاج الطبيعي" },
    { id: "nutrition",              name: "Nutrition & Dietetics",       nameAr: "التغذية والحمية" },
    { id: "reproductive-med",       name: "Reproductive Medicine",       nameAr: "طب الخصوبة وأطفال الأنابيب" },
    { id: "pain-management",        name: "Pain Management",             nameAr: "علاج الألم" },
    { id: "anesthesiology",         name: "Anesthesiology",              nameAr: "التخدير والإنعاش" },
    { id: "geriatrics",             name: "Geriatrics",                  nameAr: "طب المسنين" },
    { id: "sports-medicine",        name: "Sports Medicine",             nameAr: "طب الرياضة" },
    { id: "family-medicine",        name: "Family Medicine",             nameAr: "طب الأسرة" },
  ];

  for (const spec of specs) {
    await prisma.specialty.upsert({ where: { id: spec.id }, update: {}, create: spec });
  }

  // Doctor user account for Dr. Ahmad
  const drAhmadUser = await prisma.user.upsert({
    where: { username: "dr.ahmad" },
    update: {},
    create: { username: "dr.ahmad", password: hashedPassword, name: "د. أحمد الراشد", role: "doctor" },
  });

  // Doctor Dr. Ahmad (with user account)
  const drAhmad = await prisma.doctor.upsert({
    where: { email: "ahmad@clinic.com" },
    update: { userId: drAhmadUser.id },
    create: {
      name: "Dr. Ahmad Al-Rashid", nameAr: "د. أحمد الراشد",
      specialtyId: "cardiology", phone: "+966501234567", email: "ahmad@clinic.com",
      experienceYears: 15, consultationFee: 200,
      workingDays: "sat-thu", workingHoursStart: "08:00", workingHoursEnd: "16:00",
      userId: drAhmadUser.id,
    },
  });

  // More doctors (no accounts yet)
  const doctorsData = [
    { name: "Dr. Sara Al-Mansouri", nameAr: "د. سارة المنصوري", specialtyId: "neurology", email: "sara@clinic.com", phone: "+966502234567", experienceYears: 10, consultationFee: 250, workingDays: "sat-thu", workingHoursStart: "09:00", workingHoursEnd: "17:00" },
    { name: "Dr. Khalid Bin Saleh", nameAr: "د. خالد بن صالح", specialtyId: "orthopedics", email: "khalid@clinic.com", phone: "+966503234567", experienceYears: 12, consultationFee: 220, workingDays: "sat-thu", workingHoursStart: "08:00", workingHoursEnd: "15:00" },
    { name: "Dr. Fatima Al-Zahra", nameAr: "د. فاطمة الزهراء", specialtyId: "pediatrics", email: "fatima@clinic.com", phone: "+966504234567", experienceYears: 8, consultationFee: 180, workingDays: "sun-thu", workingHoursStart: "10:00", workingHoursEnd: "18:00" },
    { name: "Dr. Omar Hassan", nameAr: "د. عمر حسن", specialtyId: "general-medicine", email: "omar@clinic.com", phone: "+966505234567", experienceYears: 6, consultationFee: 150, workingDays: "sat-thu", workingHoursStart: "08:00", workingHoursEnd: "16:00" },
  ];

  const createdDoctors: Record<string, string> = { "dr.ahmad": drAhmad.id };

  for (const doc of doctorsData) {
    const d = await prisma.doctor.upsert({
      where: { email: doc.email },
      update: {},
      create: doc,
    });
    createdDoctors[doc.name] = d.id;
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  for (const doctorId of Object.values(createdDoctors)) {
    await prisma.doctorSubscription.upsert({
      where: { doctorId },
      update: { expiresAt: oneYearFromNow },
      create: { doctorId, expiresAt: oneYearFromNow },
    });
  }

  console.log("✅ Admin + Doctors + Specialties + Subscriptions created");

  // Patients (assigned to dr.ahmad)
  const patientsData = [
    { name: "Mohammed Al-Ghamdi", nameAr: "محمد الغامدي", gender: "male", phone: "+966511111111", dateOfBirth: new Date("1985-03-15"), bloodType: "A+" },
    { name: "Nora Al-Otaibi", nameAr: "نورة العتيبي", gender: "female", phone: "+966522222222", dateOfBirth: new Date("1990-07-22"), bloodType: "B+" },
    { name: "Abdullah Al-Qahtani", nameAr: "عبدالله القحطاني", gender: "male", phone: "+966533333333", dateOfBirth: new Date("1978-11-05"), bloodType: "O+" },
    { name: "Hessa Al-Shammari", nameAr: "حصة الشمري", gender: "female", phone: "+966544444444", dateOfBirth: new Date("1995-01-30"), bloodType: "AB+" },
    { name: "Faisal Al-Dosari", nameAr: "فيصل الدوسري", gender: "male", phone: "+966555555555", dateOfBirth: new Date("1982-08-18"), bloodType: "A-" },
  ];

  const createdPatients: string[] = [];
  let patNum = 1001;
  for (const pat of patientsData) {
    const p = await prisma.patient.upsert({
      where: { patientNumber: `P-${patNum}` },
      update: {},
      create: { ...pat, patientNumber: `P-${patNum}`, doctorId: drAhmad.id },
    });
    createdPatients.push(p.id);
    patNum++;
  }

  // Appointments for dr.ahmad
  const now = new Date();
  const aptData = [
    { patientId: createdPatients[0], date: new Date(now.getTime() + 2 * 3600000), type: "consultation", status: "confirmed", reason: "Chest pain follow-up" },
    { patientId: createdPatients[1], date: new Date(now.getTime() + 4 * 3600000), type: "followUp", status: "scheduled", reason: "Routine checkup" },
    { patientId: createdPatients[2], date: new Date(now.getTime() + 24 * 3600000), type: "consultation", status: "scheduled", reason: "Shortness of breath" },
    { patientId: createdPatients[3], date: new Date(now.getTime() - 2 * 3600000), type: "followUp", status: "completed", reason: "Post-surgery follow-up" },
    { patientId: createdPatients[4], date: new Date(now.getTime() + 48 * 3600000), type: "procedure", status: "scheduled", reason: "ECG Test" },
  ];

  let aptNum = 2001;
  for (const apt of aptData) {
    const num = `APT-${aptNum++}`;
    const existing = await prisma.appointment.findUnique({ where: { appointmentNumber: num } });
    if (!existing) {
      await prisma.appointment.create({
        data: { ...apt, appointmentNumber: num, doctorId: drAhmad.id, duration: 30 },
      });
    }
  }

  console.log("✅ Patients and Appointments created");
  console.log("\n🎉 Database seeded!");
  console.log("   Admin login:  admin / admin123");
  console.log("   Doctor login: dr.ahmad / admin123");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
