import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();
    const hourlyRate = Number(body.hourlyRate || 0);

    await db.collection("students").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: String(body.name || "").trim(),
          parentName: String(body.parentName || "").trim(),
          email: String(body.email || "").trim(),
          hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
          status: body.status === "inactive" ? "inactive" : "active",
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update student." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("students").deleteOne({ _id: new ObjectId(id) });
    await db.collection("entries").deleteMany({ studentId: id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete student." }, { status: 500 });
  }
}
