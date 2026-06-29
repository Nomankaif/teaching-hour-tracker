import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const query: Record<string, unknown> = {};

    if (start || end) {
      query.date = {
        ...(start ? { $gte: start } : {}),
        ...(end ? { $lte: end } : {})
      };
    }

    const db = await getDb();
    const entries = await db.collection("entries").find(query).sort({ date: -1, createdAt: -1 }).toArray();
    return NextResponse.json(entries.map((entry) => ({ ...entry, _id: entry._id.toString() })));
  } catch (error) {
    console.error("GET /api/entries error:", error);
    return NextResponse.json({ error: "Could not load entries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = String(body.studentId || "");
    const date = String(body.date || "");
    const hours = Number(body.hours);

    if (!studentId || !date || !Number.isFinite(hours) || hours <= 0) {
      return NextResponse.json({ error: "Student, date, and valid hours are required." }, { status: 400 });
    }

    const db = await getDb();
    const student = await db.collection("students").findOne({ _id: new ObjectId(studentId) });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const result = await db.collection("entries").insertOne({
      studentId,
      studentName: student.name,
      date,
      hours,
      hourlyRate: Number(student.hourlyRate || 0),
      notes: String(body.notes || "").trim(),
      createdAt: new Date()
    });

    return NextResponse.json({ _id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries error:", error);
    return NextResponse.json({ error: "Could not create entry." }, { status: 500 });
  }
}
