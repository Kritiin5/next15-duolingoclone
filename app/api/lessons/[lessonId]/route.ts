import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { lessons } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { lessonId } = await context.params;
  const id = parseInt(lessonId, 10);

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, id),
  });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { lessonId } = await context.params;
  const id = parseInt(lessonId, 10);
  const body = await req.json();

  const data = await db
    .update(lessons)
    .set({ ...body })
    .where(eq(lessons.id, id))
    .returning();

  return NextResponse.json(data[0]);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { lessonId } = await context.params;
  const id = parseInt(lessonId, 10);

  const data = await db
    .delete(lessons)
    .where(eq(lessons.id, id))
    .returning();

  return NextResponse.json(data[0]);
}
