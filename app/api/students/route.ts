import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const students = await db
      .collection("students")
      .find({})
      .sort({ status: 1, name: 1 })
      .toArray();

    return NextResponse.json(
      students.map((student) => ({
        ...student,
        _id: student._id.toString()
      }))
    );
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Could not load students." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Student name is required." }, { status: 400 });
    }

    const hourlyRate = Number(body.hourlyRate || 0);
    const db = await getDb();
    const result = await db.collection("students").insertOne({
      name,
      parentName: String(body.parentName || "").trim(),
      email: String(body.email || "").trim(),
      hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
      status: "active",
      createdAt: new Date()
    });

    return NextResponse.json({ _id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Could not create student." }, { status: 500 });
  }
}
