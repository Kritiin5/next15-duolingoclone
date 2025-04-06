import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await context.params;
  const id = parseInt(courseId, 10);

  const data = await db.query.courses.findFirst({
    where: eq(courses.id, id),
  });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await context.params;
  const id = parseInt(courseId, 10);
  const body = await req.json();

  const data = await db
    .update(courses)
    .set({ ...body })
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json(data[0]);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await context.params;
  const id = parseInt(courseId, 10);

  const data = await db
    .delete(courses)
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json(data[0]);
}
