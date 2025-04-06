import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { units } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ unitId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { unitId } = await context.params;
  const id = parseInt(unitId, 10);

  const data = await db.query.units.findFirst({
    where: eq(units.id, id),
  });

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ unitId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { unitId } = await context.params;
  const id = parseInt(unitId, 10);
  const body = await req.json();

  const data = await db
    .update(units)
    .set({ ...body })
    .where(eq(units.id, id))
    .returning();

  return NextResponse.json(data[0]);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ unitId: string }> }
) {
  if (!getIsAdmin()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { unitId } = await context.params;
  const id = parseInt(unitId, 10);

  const data = await db
    .delete(units)
    .where(eq(units.id, id))
    .returning();

  return NextResponse.json(data[0]);
}
