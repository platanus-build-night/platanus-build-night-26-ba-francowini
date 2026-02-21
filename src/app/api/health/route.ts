import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      db: "connected",
      userCount,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        status: "error",
        db: "failed",
        error: message,
        dbUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"),
      },
      { status: 500 },
    );
  }
}
