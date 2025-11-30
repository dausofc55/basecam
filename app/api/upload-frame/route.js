// app/api/upload-frame/route.js

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return new Response("No image", { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Missing Telegram env vars");
      return new Response("Server misconfigured", { status: 500 });
    }

    const tgForm = new FormData();
    tgForm.append("chat_id", chatId);
    // `image` sudah berupa Blob dari client
    tgForm.append("photo", image, `frame-${Date.now()}.jpg`);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: tgForm
      }
    );

    if (!tgRes.ok) {
      const text = await tgRes.text();
      console.error("Telegram error:", text);
      return new Response("Failed to send to Telegram", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response("Server error", { status: 500 });
  }
}
