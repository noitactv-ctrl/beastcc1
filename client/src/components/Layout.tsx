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
    <div className="pixel-shell min-h-screen bg-[#030303] text-[#fff4dc]">
      <header className="sticky top-0 z-40 border-b-[3px] border-[#183c9d] bg-[#070d25]/95 shadow-[0_3px_0_#02040d] backdrop-blur">
        <div className="mx-auto flex min-h-[56px] max-w-[1120px] items-center gap-3 px-3 lg:px-6">
          <Link href="/"><span className="pixel-logo-text hidden shrink-0 sm:inline">BEASTCC</span></Link>
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {visibleNav.map(item => (
              <Link key={item.href} href={item.href}>
                <span className={`game-nav-link ${isActive(item.href) ? "game-nav-link-active" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link href="/checkout">
              <span className="game-top-action" aria-label="Cart"><ShoppingBasket className="h-3.5 w-3.5" /></span>
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
                <button className="game-top-action" onClick={() => logout()}>Sign Out</button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="pixel-content-gutter mx-auto min-h-[calc(100vh-56px)] max-w-[1120px] py-4 lg:py-6">
        {children}
      </main>
    </div>
  );
}