import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureVisibility } from "@/hooks/use-feature-visibility";
import { useQuery } from "@tanstack/react-query";
import { Menu, ShoppingBasket, Layers3, UserRound, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";

const primaryNav = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Shop" },
  { href: "/orders", label: "Order" },
  { href: "/account", label: "Account" },
  { href: "/billing", label: "Billing" },
  { href: "/admin", label: "Admin" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { features } = useFeatureVisibility();
  const { data: creditBotStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/telegram/status"],
    staleTime: 15000,
  });
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCart(state => state.items.reduce((sum, item) => sum + item.quantity, 0) + state.cardItems.length + (state.bulkBundle ? state.bulkBundle.cardIds.length : 0));
  if (location === "/auth") return <>{children}</>;

  const visibleNav = primaryNav.filter(item => {
    if (item.href === "/cards") return features.cards;
    if (item.href === "/admin") return user?.role === "admin";
    return true;
  });
  const isActive = (href: string) =>
    location === href ||
    (href === "/" && location === "/") ||
    (href === "/cards" && location.startsWith("/product/"));

  return (
    <div className="white-shell pixel-shell min-h-screen bg-[#f5f7fb] text-[#24304a]">
      <header className="sticky top-0 z-40 border-b-[3px] border-[#1b3d91] bg-white/95 shadow-[0_3px_0_#9aa9c7] backdrop-blur">
        <div className="mx-auto flex min-h-[56px] max-w-[1120px] items-center gap-3 px-3 lg:px-6">
          <Link href="/" onClick={() => setMenuOpen(false)}><span className="pixel-logo-text shrink-0">BEASTCC</span></Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
            {visibleNav.map(item => (
              <Link key={item.href} href={item.href}>
                <span className={`game-nav-link ${isActive(item.href) ? "game-nav-link-active" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button className="game-top-action md:hidden" onClick={() => setMenuOpen(open => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link href="/checkout">
              <span className="game-top-action relative" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}><ShoppingBasket className="h-3.5 w-3.5" />{cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center border-2 border-black bg-[#ee292b] px-0.5 font-mono text-[9px] text-white">{cartCount}</span>}</span>
            </Link>
            {user && (
              <>
                <Link href="/billing">
                  <span className="game-top-action hidden gap-1.5 font-semibold text-[#ffe177] sm:inline-flex">
                    <Layers3 className="h-3 w-3 text-[#ffe177]" />
                    ${(user.balance / 100).toFixed(2)}
                  </span>
                </Link>
                <Link href="/account">
                  <span className="game-top-action hidden gap-1.5 sm:inline-flex">
                    <UserRound className="h-3 w-3 text-[#ffe177]" />
                    {user.username}
                  </span>
                </Link>
                <button className="game-top-action" onClick={() => logout()}><span className="hidden sm:inline">Sign Out</span><span className="sm:hidden">OUT</span></button>
              </>
            )}
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t-2 border-[#d7deec] bg-[#f7f9fd] p-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {visibleNav.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  <span className={`game-mobile-link ${isActive(item.href) ? "game-mobile-link-active" : ""}`}>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="pixel-content-gutter mx-auto min-h-[calc(100vh-56px)] max-w-[1120px] py-4 lg:py-6">
        {children}
      </main>
    </div>
  );
}