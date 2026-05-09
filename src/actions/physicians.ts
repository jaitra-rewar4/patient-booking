"use server";

import { db } from "@/lib/db";

export async function getPhysicians() {
  return db.physician.findMany({ orderBy: { name: "asc" } });
}
