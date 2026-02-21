import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrError, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      virtualBudget: true,
      realBalance: true,
      aiUnlocked: true,
      createdAt: true,
    },
  });

  if (!user) {
    return errorResponse("Usuario no encontrado", 404);
  }

  return successResponse(user);
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const { name, email } = body as { name?: string; email?: string };

  if (!name && !email) {
    return errorResponse("Se requiere al menos un campo para actualizar");
  }

  const updateData: { name?: string; email?: string } = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      virtualBudget: true,
      realBalance: true,
      aiUnlocked: true,
      createdAt: true,
    },
  });

  return successResponse(updated);
}
