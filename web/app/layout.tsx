import type { Metadata, Viewport } from "next";
import { Archivo, Source_Code_Pro, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });
const sourceCode = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://toxic.harshithvarma.in"),
  title: { default: "Toxic Comment Detection", template: "%s · Toxic Comment Detection" },
  description:
    "A 33 MB transformer that flags toxic comments. Runs on-device in a browser extension to make YouTube comment sections child-safe, and as a FastAPI service for everything else.",
  openGraph: { type: "website", title: "Toxic Comment Detection", siteName: "Toxic Comment Detection" },
};

export const viewport: Viewport = { themeColor: "#14141c", colorScheme: "dark" };

const NAV = [
  { href: "/demo", label: "Demo" },
  { href: "/model", label: "Model" },
  { href: "/extension", label: "Extension" },
  { href: "/docs", label: "API" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${sourceSans.variable} ${sourceCode.variable}`}>
      <body className="grain min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span aria-hidden className="relative size-4">
                <span className="absolute inset-0 border border-accent/30" />
                <span className="absolute left-0 top-0 size-1.5 border-l border-t border-accent" />
                <span className="absolute bottom-0 right-0 size-1.5 border-b border-r border-accent" />
              </span>
              <span className="font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-peak">
                Toxic&nbsp;Comments
              </span>
            </Link>
            <ul className="flex items-center gap-1 sm:gap-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="rounded-[3px] px-2 py-1.5 text-sm text-secondary transition-colors hover:text-peak sm:px-3"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li className="hidden sm:block">
                <a
                  href="https://github.com/Harshithvarma007/Toxic-Comments"
                  className="rounded-[3px] px-3 py-1.5 text-sm text-secondary transition-colors hover:text-peak"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </header>
        <main id="main" className="relative z-10">
          {children}
        </main>
        <footer className="relative z-10 mt-32 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Built by{" "}
              <a className="text-secondary hover:text-peak" href="https://harshithvarma.in">
                Harshith Varma
              </a>
              . Model trained on the Jigsaw Toxic Comment dataset (CC0 / CC-BY-SA).
            </p>
            <p className="label-mono">Predictions can be wrong. Not a substitute for human moderation.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
