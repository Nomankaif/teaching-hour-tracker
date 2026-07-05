import { NextResponse } from "next/server";
import { endOfWeek, startOfWeek, toDateInputValue } from "@/lib/dates";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type EntryDoc = {
  studentId: string;
  studentName: string;
  date: string;
  hours: number;
  hourlyRate?: number;
};

function buildRows(entries: EntryDoc[]) {
  const rows = new Map<string, {
    studentId: string;
    studentName: string;
    totalHours: number;
    totalEarnings: number;
    days: Record<string, number>;
  }>();

  for (const entry of entries) {
    const row = rows.get(entry.studentId) || {
      studentId: entry.studentId,
      studentName: entry.studentName,
      totalHours: 0,
      totalEarnings: 0,
      days: {}
    };
    row.totalHours += entry.hours;
    row.totalEarnings += entry.hours * Number(entry.hourlyRate || 0);
    row.days[entry.date] = (row.days[entry.date] || 0) + entry.hours;
    rows.set(entry.studentId, row);
  }

  return Array.from(rows.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function GET() {
  try {
    const today = new Date();
    const todayValue = toDateInputValue(today);
    const weekStart = toDateInputValue(startOfWeek(today));
    const weekEnd = toDateInputValue(endOfWeek(today));

    const db = await getDb();
    const [entries, recentEntries, activeStudents] = await Promise.all([
      db.collection<EntryDoc>("entries").find({}).toArray(),
      db.collection("entries").find({}).sort({ date: -1, createdAt: -1 }).limit(8).toArray(),
      db.collection("students").countDocuments({ status: "active" })
    ]);

    const todayEntries = entries.filter((entry) => entry.date === todayValue);
    const weekEntries = entries.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd);

    return NextResponse.json({
      todayHours: todayEntries.reduce((sum, entry) => sum + entry.hours, 0),
      weekHours: weekEntries.reduce((sum, entry) => sum + entry.hours, 0),
      totalHours: entries.reduce((sum, entry) => sum + entry.hours, 0),
      activeStudents,
      recentEntries: recentEntries.map((entry) => ({ ...entry, _id: entry._id.toString() })),
      weeklyRows: buildRows(weekEntries),
      totalRows: buildRows(entries)
    });
  } catch (error) {
    console.error("GET /api/summary error:", error);
    return NextResponse.json({ error: "Could not load summary." }, { status: 500 });
  }
}
