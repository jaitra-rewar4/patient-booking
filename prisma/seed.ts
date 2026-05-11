import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PHYSICIANS = [
  {
    name: "Dr. Amelia Chen",
    specialty: "Family Medicine",
    bio: "Primary care physician with 12 years of experience. Special interest in preventive medicine and chronic disease management. Speaks English, Mandarin, and Cantonese.",
  },
  {
    name: "Dr. Marcus Okafor",
    specialty: "Internal Medicine",
    bio: "Internist focused on adult primary care, complex multi-system conditions, and post-discharge follow-up. Speaks English, French, and Igbo.",
  },
  {
    name: "Dr. Priya Raman",
    specialty: "Pediatrics",
    bio: "Pediatrician serving newborns through adolescents. Areas of focus include developmental screening and asthma care. Speaks English, Tamil, Hindi, and Punjabi.",
  },
  {
    name: "Dr. Joel Lindqvist",
    specialty: "Dermatology",
    bio: "Board-certified dermatologist offering skin checks, acne care, eczema management, and minor procedures. Speaks English and Swedish.",
  },
];

// Generate 30-minute slots, 9:00 AM - 4:30 PM, weekdays only, for the next 14 days.
function generateSlots(startDate: Date): { startTime: Date; endTime: Date }[] {
  const slots: { startTime: Date; endTime: Date }[] = [];
  for (let day = 0; day < 14; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    for (let hour = 9; hour < 17; hour++) {
      for (const min of [0, 30]) {
        if (hour === 12) continue; // lunch hour
        const start = new Date(date);
        start.setHours(hour, min, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        slots.push({ startTime: start, endTime: end });
      }
    }
  }
  return slots;
}

async function main() {
  console.log("Seeding database...");

  // Wipe existing data (idempotent reseed)
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.physician.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of PHYSICIANS) {
    const physician = await prisma.physician.create({ data: p });
    const slots = generateSlots(today);
    await prisma.slot.createMany({
      data: slots.map((s) => ({
        physicianId: physician.id,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
    console.log(`  ${physician.name}: ${slots.length} slots`);
  }

  // Sample bookings to populate the admin view
  const firstPhysician = await prisma.physician.findFirstOrThrow();
  const sampleSlots = await prisma.slot.findMany({
    where: { physicianId: firstPhysician.id },
    take: 3,
    orderBy: { startTime: "asc" },
  });

  const sampleBookings = [
    {
      patientName: "Riley Thompson",
      patientDob: "1985-03-14",
      patientEmail: "riley.thompson@example.com",
      patientPhone: "(416) 555-0142",
      reasonForVisit: "Annual physical exam and blood work review.",
      status: "PENDING",
    },
    {
      patientName: "Hannah Park",
      patientDob: "1992-11-08",
      patientEmail: "h.park@example.com",
      patientPhone: "(647) 555-0188",
      reasonForVisit: "Follow-up on hypertension medication.",
      status: "CONFIRMED",
    },
    {
      patientName: "Devon Alvarez",
      patientDob: "2001-07-22",
      patientEmail: "devon.a@example.com",
      patientPhone: "(905) 555-0173",
      reasonForVisit: "Persistent cough for 3 weeks, no fever.",
      status: "PENDING",
    },
  ];

  for (let i = 0; i < sampleBookings.length && i < sampleSlots.length; i++) {
    await prisma.booking.create({
      data: {
        ...sampleBookings[i],
        physicianId: firstPhysician.id,
        slotId: sampleSlots[i].id,
      },
    });
  }

  console.log("Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
