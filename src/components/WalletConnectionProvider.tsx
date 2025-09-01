"use client";

import { FC, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";  // 👈 to track active page
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";
import "@solana/wallet-adapter-react-ui/styles.css";
import Link from "next/link";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const WalletConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const pathname = usePathname(); // 👈 current URL

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/add-liquidity", label: "Add Liquidity" },
    { href: "/remove-liquidity", label: "Remove Liquidity" },
    { href: "/swap", label: "Swap" },
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* HEADER */}
          <header className="sticky top-0 z-50 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80 backdrop-blur-md border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
              {/* Logo */}
              <Link
                href="/"
                className="text-3xl font-extrabold tracking-wider drop-shadow-md hover:text-yellow-300 transition"
              >
                ⚡️ MiniSwap
              </Link>

              {/* Nav links */}
              <nav className="hidden md:flex gap-8 text-lg font-semibold">
                {navItems.map(({ href, label }) => {
                  const isActive = pathname === href; // 👈 check match
                  return (
                    <a
                      key={href}
                      href={href}
                      className={`transition ${
                        isActive
                          ? "text-yellow-300 border-b-2 border-yellow-300 pb-1"
                          : "hover:text-yellow-300"
                      }`}
                    >
                      {label}
                    </a>
                  );
                })}
              </nav>

              {/* Wallet Button */}
              <WalletMultiButton className="!bg-gradient-to-r !from-pink-500 !to-yellow-400 !hover:from-yellow-400 !hover:to-pink-500 !text-black !rounded-2xl !px-6 !py-2 !font-bold !shadow-xl transition" />
            </div>
          </header>

          {/* MAIN */}
          <main className="max-w-5xl mx-auto px-6 py-10">
            <div className="rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/20">
              {children}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="mt-4 py-6 border-t border-white/20 text-center text-sm text-gray-200">
            ✨ MiniSwap · Made with ❤️ on <span className="text-yellow-300">Solana</span>
            <br />
            <span className="text-green-300/80 underline">
              <Link href="https://linktr.ee/sidarthx0">linktr.ee/sidarthx0</Link>
            </span>
          </footer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
