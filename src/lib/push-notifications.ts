import User from "@/models/user.model";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: object
) {
  try {
    const user = await User.findById(userId).select("expoPushToken");
    if (!user?.expoPushToken) return;

    const message = {
      to: user.expoPushToken,
      sound: "default",
      title,
      body,
      data: data ?? {},
    };

    console.log('[push] Sending to:', user.expoPushToken, 'title:', title);
    const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(message),
    });
    const pushData = await pushRes.json();
    console.log('[push] Response:', JSON.stringify(pushData));
  } catch (error) {
    console.error("Push notification error:", error);
  }
}