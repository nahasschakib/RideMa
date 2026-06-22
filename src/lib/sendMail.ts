import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const data = await transporter.sendMail({
      from: `MaRide <${process.env.BREVO_USER}>`,
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
