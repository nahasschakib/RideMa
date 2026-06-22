export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: "MaRide", email: "cnahass@gmail.com" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Brevo error:", err);
      throw new Error("Email send failed");
    }
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};