import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://mystreet.canada.nshipyard.com"),
  title: "What's Happening on My Street? | Toronto street briefing",
  description:
    "Type your Toronto address and get the real road work, building permits and planning notices within 500 metres of your home, straight from the city's open data.",
  openGraph: {
    title: "What's Happening on My Street? | Toronto street briefing",
    description:
      "Type your Toronto address and get the real road work, building permits and planning notices within 500 metres of your home, straight from the city's open data.",
    url: "https://mystreet.canada.nshipyard.com",
    siteName: "My Street",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "What's Happening on My Street? — Toronto street briefing" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's Happening on My Street? | Toronto street briefing",
    description:
      "Type your Toronto address and get the real road work, building permits and planning notices within 500 metres of your home, straight from the city's open data.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
