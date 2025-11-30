// app/layout.js
export const metadata = {
  title: "Kamera ke Telegram",
  description: "Capture kamera dan kirim ke Telegram bot."
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
