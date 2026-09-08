import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

function flagFor(code: string) {
  const value = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return "🌐";
  return String.fromCodePoint(...value.split("").map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export default function HomePage() {
  const { data: cards = [] } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 30000 });
  const { data: announcements = [] } = useQuery<any[]>({ queryKey: ["/api/announcements"] });
  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach(card => { const name = String(card.binData?.scheme || card.binData?.brand || "UNKNOWN").toUpperCase(); counts.set(name, (counts.get(name) || 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cards]);
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach(card => { const code = String(card.binData?.countryCode || card.country || "").toUpperCase(); if (code) counts.set(code, (counts.get(code) || 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [cards]);
  return (
    <div className="store-page">
      <section className="store-card">
        <div className="store-card-title">⌁ &nbsp; HOME</div>
        <div className="p-4 sm:p-5">
          <h1 className="text-center text-base font-semibold text-[#626478]">BEASTCC MARKETPLACE</h1>
          <p className="mt-2 text-center text-xs text-[#9698a7]">Browse cards by country, brand, validation rate, and price.</p>
          <div className="mx-auto mt-5 max-w-[545px]">
            <div className="store-card-title">BRAND</div>
            <table className="w-full border-collapse border border-[#ececf2] text-[10px]"><thead><tr className="border-b border-[#ececf2] text-[#989aa8]"><th className="w-10 px-2 py-2">#</th><th className="w-24 px-2 py-2">CARD</th><th className="px-2 py-2 text-left">NAME</th><th className="w-20 px-2 py-2">CARDS</th></tr></thead><tbody>{brands.length === 0 ? <tr><td colSpan={4} className="py-5 text-center text-[#a0a2af]">NOT FOUND</td></tr> : brands.map(([name, count], index) => <tr key={name} className="border-b border-[#f0f0f4] text-[#77798b]"><td className="px-2 py-2 text-center">{index + 1}</td><td className="px-2 py-2 text-center"><span className="inline-block bg-[#3557a0] px-2 py-0.5 text-[8px] font-bold text-white">{name.slice(0, 4)}</span></td><td className="px-2 py-2 text-[#7770bd]">{name}</td><td className="px-2 py-2 text-center">{count}</td></tr>)}</tbody></table>
          </div>
          <div className="mx-auto mt-5 max-w-[545px]">
            <div className="store-card-title">TOP COUNTRIES</div>
            <table className="w-full border-collapse border border-[#ececf2] text-[10px]"><thead><tr className="border-b border-[#ececf2] text-[#989aa8]"><th className="w-10 px-2 py-2">#</th><th className="w-24 px-2 py-2">CODE</th><th className="px-2 py-2 text-left">NAME</th><th className="w-20 px-2 py-2">CARDS</th></tr></thead><tbody>{countries.length === 0 ? <tr><td colSpan={4} className="py-5 text-center text-[#a0a2af]">NOT FOUND</td></tr> : countries.map(([code, count], index) => <tr key={code} className="border-b border-[#f0f0f4] text-[#77798b]"><td className="px-2 py-2 text-center">{index + 1}</td><td className="px-2 py-2 text-center text-lg">{flagFor(code)}</td><td className="px-2 py-2 text-[#7770bd]">{code}</td><td className="px-2 py-2 text-center">{count}</td></tr>)}</tbody></table>
          </div>
          <div className="mx-auto mt-5 max-w-[545px]"><div className="store-card-title">NEWS</div>{announcements.length === 0 ? <p className="bg-[#fafafd] p-3 text-xs text-[#a0a2af]">No news yet.</p> : announcements.slice(0, 3).map((item: any) => <article key={item.id} className="border-b border-[#f0f0f4] bg-[#fafafd] p-3"><h2 className="text-xs font-semibold text-[#6848d8]">{item.title}</h2><p className="mt-1 text-[10px] text-[#888a99]">{item.body}</p></article>)}</div>
        </div>
      </section>
    </div>
  );
}