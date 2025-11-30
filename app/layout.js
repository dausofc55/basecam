// app/layout.js
export const metadata = {
  title: "base nusantara",
  description: "jelajahi dunia mu di base nusantara."
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
