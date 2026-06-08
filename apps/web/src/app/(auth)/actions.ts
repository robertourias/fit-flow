"use server";

import { prisma } from "@fitflow/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function requestLoginOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Email não encontrado. Crie uma conta primeiro." };
  }

  const otp = await createOtp(email);
  await sendOtpEmail(email, user.name, otp);

  return { success: true };
}

export async function requestSignupOtp(
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

  const otp = await createOtp(email);
  await sendOtpEmail(email, name, otp);

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
  await sendOtpEmail(email, user.name, otp);

  return { success: true };
}
