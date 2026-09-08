import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureVisibility } from "@/hooks/use-feature-visibility";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBasket, Layers3, UserRound } from "lucide-react";

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
        <div className="mx-auto flex h-20 max-w-[1024px] items-center justify-between gap-4 px-2 md:h-[54px] md:px-[50px]">
          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map(item => (
              <Link key={item.href} href={item.href}>
                <span className={`store-nav-link ${isActive(item.href) ? "store-nav-link-active" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <nav className="store-mobile-sections md:hidden">
            {[
              { href: "/account", label: "Account" },
              { href: "/billing", label: "Billing" },
              { href: "/news", label: "News" },
            ].map(item => <Link key={item.href} href={item.href}><span className={`store-mobile-section ${location.startsWith(item.href) ? "store-mobile-section-active" : ""}`}>{item.label}</span></Link>)}
          </nav>
          <div className="ml-auto hidden items-center gap-1.5 md:flex">
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
      </header>
      <main className="mx-auto min-h-[calc(100vh-54px)] max-w-[1024px] px-2 py-2 md:px-[36px] md:py-6">
        {children}
      </main>
    </div>
  );
}