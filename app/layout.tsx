import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import JsonLd from "@/components/JsonLd";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "배드메이트 - 배드민턴 모임 & 파트너 매칭 플랫폼",
    template: "%s | 배드메이트",
  },
  description: "배드민턴 모임 찾기, 파트너 매칭, 체육관 정보까지! 전국의 배드민턴 동호인들과 함께하세요. 실력별 매칭, 지역별 모임, 대회 정보를 한곳에서.",
  keywords: [
    "배드민턴",
    "배드민턴 모임",
    "배드민턴 동호회",
    "배드민턴 파트너",
    "배드민턴 매칭",
    "배드민턴 체육관",
    "배드민턴 대회",
    "배드민턴 커뮤니티",
    "스포츠 매칭",
    "운동 파트너",
  ],
  authors: [{ name: "배드메이트" }],
  creator: "배드메이트",
  publisher: "배드메이트",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://badmate.club"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://badmate.club",
    title: "배드메이트 - 배드민턴 모임 & 파트너 매칭 플랫폼",
    description: "배드민턴 모임 찾기, 파트너 매칭, 체육관 정보까지! 전국의 배드민턴 동호인들과 함께하세요.",
    siteName: "배드메이트",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "배드메이트 - 배드민턴 커뮤니티",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "배드메이트 - 배드민턴 모임 & 파트너 매칭 플랫폼",
    description: "배드민턴 모임 찾기, 파트너 매칭, 체육관 정보까지! 전국의 배드민턴 동호인들과 함께하세요.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
    other: {
      "naver-site-verification": "naver-verification-code",
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "배드메이트",
  "alternateName": "Badmate",
  "url": "https://badmate.club",
  "logo": "https://badmate.club/logo.png",
  "description": "배드민턴 모임 찾기, 파트너 매칭, 체육관 정보까지! 전국의 배드민턴 동호인들과 함께하세요.",
  "sameAs": [
    "https://www.instagram.com/badmate.club",
    "https://blog.naver.com/badmate",
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "contact@badmate.club"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "배드메이트",
  "url": "https://badmate.club",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://badmate.club/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <SessionProvider>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
