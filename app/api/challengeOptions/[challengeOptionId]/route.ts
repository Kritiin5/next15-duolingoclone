import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challengeOptions } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(
    req: Request,
    context: { params: Promise<{ challengeOptionId: string }> }
  ) {
    if (!getIsAdmin()) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    const { challengeOptionId } = await context.params;
    const id = parseInt(challengeOptionId, 10);
  
    const data = await db.query.challengeOptions.findFirst({
      where: eq(challengeOptions.id, id),
    });
  
    return NextResponse.json(data);
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ challengeOptionId: string }> }
  ) {
    if (!getIsAdmin()) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    const { challengeOptionId } = await context.params;
    const id = parseInt(challengeOptionId, 10);
    const body = await req.json();
  
    const data = await db
      .update(challengeOptions)
      .set({ ...body })
      .where(eq(challengeOptions.id, id))
      .returning();
  
    return NextResponse.json(data[0]);
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ challengeOptionId: string }> }
  ) {
    if (!getIsAdmin()) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    const { challengeOptionId } = await context.params;
    const id = parseInt(challengeOptionId, 10);
  
    const data = await db
      .delete(challengeOptions)
      .where(eq(challengeOptions.id, id))
      .returning();
  
    return NextResponse.json(data[0]);
}
