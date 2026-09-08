import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

function flagFor(code: string) {
  const value = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return "🌐";
  return String.fromCodePoint(...value.split("").map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export default function HomePage() {
  const { data: cards = [] } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 30000 });
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
  return (
    <div className="pixel-page space-y-5">
      <section className="pixel-panel overflow-hidden bg-[#10215e] p-5 sm:p-7">
        <p className="pixel-label">DASHBOARD / MARKET STATUS</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-xl leading-relaxed text-white sm:text-2xl">WELCOME TO LOOFY</h1><p className="mt-3 max-w-xl font-mono text-[10px] leading-5 text-white/55">Verified inventory, country-aware BIN data, and fast checkout.</p></div>
          <Link href="/cards"><span className="pixel-button inline-flex !bg-[#ee292b] px-4 py-3 text-[8px] !text-white">BROWSE CARDS</span></Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="pixel-panel bg-[#10215e] p-4">
          <p className="pixel-label">BRAND INVENTORY</p>
          <table className="mt-4 w-full border-collapse text-[10px]"><thead><tr className="border-b-2 border-black text-left text-[#abbceb]"><th className="px-2 py-2">#</th><th className="px-2 py-2">BRAND</th><th className="px-2 py-2 text-right">CARDS</th></tr></thead><tbody>{brands.map(([name, count], index) => <tr key={name} className="border-b border-black/40 text-white/75"><td className="px-2 py-2">{index + 1}</td><td className="px-2 py-2 text-[#ffe177]">{name}</td><td className="px-2 py-2 text-right">{count}</td></tr>)}</tbody></table>
        </div>
        <div className="pixel-panel bg-[#10215e] p-4">
          <p className="pixel-label">TOP COUNTRIES</p>
          <table className="mt-4 w-full border-collapse text-[10px]"><thead><tr className="border-b-2 border-black text-left text-[#abbceb]"><th className="px-2 py-2">#</th><th className="px-2 py-2">COUNTRY</th><th className="px-2 py-2 text-right">CARDS</th></tr></thead><tbody>{countries.map(([code, count], index) => <tr key={code} className="border-b border-black/40 text-white/75"><td className="px-2 py-2">{index + 1}</td><td className="px-2 py-2 text-[#ffe177]">{flagFor(code)} {code}</td><td className="px-2 py-2 text-right">{count}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}