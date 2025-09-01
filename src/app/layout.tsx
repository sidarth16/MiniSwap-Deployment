import "./globals.css";
import { WalletConnectionProvider } from "@/components/WalletConnectionProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-900/80 via-pink-500/20 to-blue-900/70 text-white font-sans ">
      <div className="min-h-screen bg-gradient-to-br from-purple-900/80 via-pink-500/20 to-blue-900/70 text-white font-sans">
        <WalletConnectionProvider>{children}</WalletConnectionProvider>
      </div>
      </body>
    </html>
  );
}
