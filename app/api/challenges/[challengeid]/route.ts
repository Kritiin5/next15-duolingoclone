import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ challengeId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { challengeId } = await context.params;
  const id = parseInt(challengeId, 10);

  const data = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ challengeId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { challengeId } = await context.params;
  const id = parseInt(challengeId, 10);
  const body = await req.json();

  const data = await db
    .update(challenges)
    .set({ ...body })
    .where(eq(challenges.id, id))
    .returning();

  return NextResponse.json(data[0]);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ challengeId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { challengeId } = await context.params;
  const id = parseInt(challengeId, 10);

  const data = await db
    .delete(challenges)
    .where(eq(challenges.id, id))
    .returning();

  return NextResponse.json(data[0]);
}
