"use server";

import { prisma } from "@fitflow/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function requestSignup(
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email já cadastrado. Faça login." };
  }

  await prisma.user.create({
    data: { name, email, hasOnboarded: false },
  });

  return { success: true };
}

export async function requestLoginOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Email não encontrado. Crie uma conta primeiro." };
  }

  const otp = await createOtp(email);

  try {
    await sendOtpEmail(email, user.name, otp);
  } catch {
    return { success: false, error: "Erro ao enviar email. Verifique as configurações de SMTP." };
  }

  return { success: true };
}

export async function resendOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Email não encontrado." };
  }

  const otp = await createOtp(email);

  try {
    await sendOtpEmail(email, user.name, otp);
  } catch {
    return { success: false, error: "Erro ao enviar email. Tente novamente." };
  }

  return { success: true };
}
