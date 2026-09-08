import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function flagFor(code: string) {
  const value = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return "🌐";
  return String.fromCodePoint(...value.split("").map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: cards = [] } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 30000 });
  const { data: rankData } = useQuery<{ totalDeposited: number }>({
    queryKey: ["/api/user/rank"],
    enabled: !!user,
  });
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/wallet/transactions"],
    enabled: !!user,
  });
  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach(card => {
      const name = String(card.binData?.scheme || card.binData?.brand || "UNKNOWN").toUpperCase();
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cards]);
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach(card => {
      const code = String(card.binData?.countryCode || card.country || "").toUpperCase();
      if (code) counts.set(code, (counts.get(code) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [cards]);
  const spentCents = useMemo(
    () => transactions
      .filter((transaction: any) => transaction.type === "purchase" && Number(transaction.amount) < 0)
      .reduce((total: number, transaction: any) => total + Math.abs(Number(transaction.amount) || 0), 0),
    [transactions],
  );
  const depositedCents = Number(rankData?.totalDeposited ?? transactions
    .filter((transaction: any) => ["deposit", "manual_deposit"].includes(transaction.type) && Number(transaction.amount) > 0)
    .reduce((total: number, transaction: any) => total + (Number(transaction.amount) || 0), 0));
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="pixel-page space-y-6">
      <section className="store-card overflow-hidden">
        <div className="store-card-title flex items-center gap-2">
          <span className="text-base font-bold text-[#5b5bd6]">⌁</span>
          <span>Home</span>
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#77798a]">Welcome back</p>
              <h1 className="mt-2 text-2xl font-bold text-[#363847] sm:text-3xl">Your marketplace dashboard</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#858896]">Browse verified inventory, review your account activity, and check out when you are ready.</p>
            </div>
            <Link href="/cards"><span className="pixel-button inline-flex items-center px-5 py-3">Browse cards</span></Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="store-card flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-[#77798a]">Total spent</p>
            <p className="mt-2 text-2xl font-bold text-[#363847]">{money(spentCents)}</p>
            <p className="mt-1 text-xs text-[#a0a2af]">Purchases from your account</p>
          </div>
          <ShoppingBag className="h-6 w-6 text-[#5b5bd6]" />
        </div>
        <div className="store-card flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-[#77798a]">Total deposited</p>
            <p className="mt-2 text-2xl font-bold text-[#363847]">{money(depositedCents)}</p>
            <p className="mt-1 text-xs text-[#a0a2af]">Funds added to your account</p>
          </div>
          <ArrowDownToLine className="h-6 w-6 text-[#5b5bd6]" />
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="store-card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-[#555766]">Brand inventory</p>
          <table className="mt-4 w-full border-collapse text-sm"><thead><tr className="border-b border-[#ececf2] text-left text-xs font-semibold uppercase tracking-wide text-[#9a9ca8]"><th className="px-2 py-3">#</th><th className="px-2 py-3">Brand</th><th className="px-2 py-3 text-right">Cards</th></tr></thead><tbody>{brands.map(([name, count], index) => <tr key={name} className="border-b border-[#f0f0f4] text-[#6f7180]"><td className="px-2 py-3">{index + 1}</td><td className="px-2 py-3 font-semibold text-[#5b5bd6]">{name}</td><td className="px-2 py-3 text-right">{count}</td></tr>)}</tbody></table>
        </div>
        <div className="store-card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-[#555766]">Top countries</p>
          <table className="mt-4 w-full border-collapse text-sm"><thead><tr className="border-b border-[#ececf2] text-left text-xs font-semibold uppercase tracking-wide text-[#9a9ca8]"><th className="px-2 py-3">#</th><th className="px-2 py-3">Country</th><th className="px-2 py-3 text-right">Cards</th></tr></thead><tbody>{countries.map(([code, count], index) => <tr key={code} className="border-b border-[#f0f0f4] text-[#6f7180]"><td className="px-2 py-3">{index + 1}</td><td className="px-2 py-3 font-semibold text-[#5b5bd6]">{flagFor(code)} {code}</td><td className="px-2 py-3 text-right">{count}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}