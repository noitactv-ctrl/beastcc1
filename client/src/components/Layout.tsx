import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureVisibility } from "@/hooks/use-feature-visibility";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBasket, Layers3, UserRound, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const primaryNav = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Shop" },
  { href: "/orders", label: "Order" },
  { href: "/account", label: "Account" },
  { href: "/billing", label: "Billing" },
  { href: "/news", label: "News" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { features } = useFeatureVisibility();
  const { data: creditBotStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/telegram/status"],
    staleTime: 15000,
  });
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location]);

  if (location === "/auth") return <>{children}</>;

  const visibleNav = primaryNav.filter(item => {
    if (item.href === "/cards") return features.cards;
    return true;
  });
  const isActive = (href: string) =>
    location === href ||
    (href === "/" && location === "/") ||
    (href === "/cards" && location.startsWith("/product/"));

  return (
    <div className="store-shell min-h-screen bg-[#f8f8fb] text-[#5d6072]">
      <header className="store-header sticky top-0 z-40 border-b border-[#eeeeF5] bg-white">
        <div className="mx-auto flex h-[54px] max-w-[1024px] items-center justify-between gap-4 px-4">
          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map(item => (
              <Link key={item.href} href={item.href}>
                <span className={`store-nav-link ${isActive(item.href) ? "store-nav-link-active" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <button className="store-icon-button md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/checkout">
              <span className="store-top-action" aria-label="Cart"><ShoppingBasket className="h-3.5 w-3.5" /></span>
            </Link>
            {user && (
              <>
                <Link href="/billing">
                  <span className="store-top-action gap-1.5 font-semibold text-[#ed3e4d]">
                    <Layers3 className="h-3 w-3 text-[#6e4be6]" />
                    ${(user.balance / 100).toFixed(2)}
                  </span>
                </Link>
                <Link href="/account">
                  <span className="store-top-action gap-1.5">
                    <UserRound className="h-3 w-3 text-[#6e4be6]" />
                    {user.username}
                  </span>
                </Link>
                <button className="store-top-action text-[#6e4be6]" onClick={() => logout()}>Sign Out</button>
              </>
            )}
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-[#eeeeF5] bg-white px-4 py-3 md:hidden">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-[#454858]">Menu</span>
              <button className="store-icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {visibleNav.map(item => <Link key={item.href} href={item.href}><span className={`store-mobile-link ${isActive(item.href) ? "store-mobile-link-active" : ""}`}>{item.label}</span></Link>)}
              {user?.role === "admin" && <Link href="/admin"><span className="store-mobile-link"><ShieldCheck className="mr-2 inline h-3 w-3" />Admin</span></Link>}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto min-h-[calc(100vh-54px)] max-w-[1024px] px-4 py-5 sm:py-6">
        {children}
      </main>
    </div>
  );
}