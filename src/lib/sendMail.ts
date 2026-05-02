// src/lib/mail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const data = await resend.emails.send({
      from: "RideMA <chakib@vistalogisticsapp.com>", // temporaire
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

