import { createUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Campos obrigatórios: email, password, name" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json({ error: "A senha deve conter maiúscula, minúscula e número" }, { status: 400 });
    }

    const user = await createUser(email, password, name);
    
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}