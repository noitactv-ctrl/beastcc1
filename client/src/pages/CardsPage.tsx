import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

function flagFor(value: string) {
  const code = String(value || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}
function countryCode(card: any) {
  const value = card?.binData?.countryCode || card?.country;
  return /^[A-Za-z]{2}$/.test(String(value || "")) ? String(value).toUpperCase() : "";
}
function cardBrand(card: any) {
  return String(card?.binData?.scheme || card?.binData?.brand || "").toUpperCase();
}
function cardBin(card: any) {
  return String(card?.binData?.bin || card?.cardNumber || "").replace(/\D/g, "").slice(0, 6);
}

export default function CardsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const addCard = useCart(state => state.addCard);
  const [filters, setFilters] = useState({ base: "all", country: "all", brand: "all", minPrice: "", maxPrice: "", minRate: "", maxRate: "" });
  const { data: cards = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 15000 });
  const { data: bases = [] } = useQuery<any[]>({ queryKey: ["/api/card-bases"] });

  const values = useMemo(() => ({
    countries: Array.from(new Set(cards.map(countryCode).filter(Boolean))).sort(),
    brands: Array.from(new Set(cards.map(cardBrand).filter(Boolean))).sort(),
  }), [cards]);
  const setFilter = (key: string, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const visibleCards = useMemo(() => cards.filter(card => {
    const price = Number(card.price || 0) / 100;
    const rate = Number(card.hrPercent ?? 80);
    if (filters.base !== "all" && String(card.baseId) !== filters.base) return false;
    if (filters.country !== "all" && countryCode(card) !== filters.country) return false;
    if (filters.brand !== "all" && cardBrand(card) !== filters.brand) return false;
    if (filters.minPrice && price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
    if (filters.minRate && rate < Number(filters.minRate)) return false;
    if (filters.maxRate && rate > Number(filters.maxRate)) return false;
    return true;
  }), [cards, filters]);

  const buyMutation = useMutation({
    mutationFn: async (card: any) => {
      addCard({ id: card.id, bin: cardBin(card), brand: cardBrand(card), type: String(card.binData?.type || "").toUpperCase(), baseName: card.baseName || "Standard", price: card.price });
      return true;
    },
    onSuccess: () => setLocation("/checkout"),
    onError: (error: any) => toast({ title: "Unable to add card", description: error.message, variant: "destructive" }),
  });
  const reset = () => setFilters({ base: "all", country: "all", brand: "all", minPrice: "", maxPrice: "", minRate: "", maxRate: "" });
  const selectClass = "pixel-input h-9 w-full";

  return (
    <div className="pixel-page space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div><p className="pixel-label">MARKETPLACE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">BUY CARDS</h1></div>
        <span className="pixel-label">{visibleCards.length} FOUND</span>
      </div>
      <section className="pixel-panel space-y-4 bg-[#10215e] p-4 sm:p-5">
        <p className="pixel-label">FILTER CARDS</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="font-mono text-[10px] text-[#abbceb]">BASE<select className={`${selectClass} mt-1`} value={filters.base} onChange={e => setFilter("base", e.target.value)}><option value="all">ALL BASES</option>{bases.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="font-mono text-[10px] text-[#abbceb]">COUNTRY<select className={`${selectClass} mt-1`} value={filters.country} onChange={e => setFilter("country", e.target.value)}><option value="all">ALL COUNTRIES</option>{values.countries.map(code => <option key={code} value={code}>{flagFor(code)} {code}</option>)}</select></label>
          <label className="font-mono text-[10px] text-[#abbceb]">BRAND<select className={`${selectClass} mt-1`} value={filters.brand} onChange={e => setFilter("brand", e.target.value)}><option value="all">ALL BRANDS</option>{values.brands.map(item => <option key={item}>{item}</option>)}</select></label>
          <div className="font-mono text-[10px] text-[#abbceb]">PRICE RANGE<div className="mt-1 grid grid-cols-2 gap-2"><input className={selectClass} value={filters.minPrice} onChange={e => setFilter("minPrice", e.target.value)} placeholder="MIN $" /><input className={selectClass} value={filters.maxPrice} onChange={e => setFilter("maxPrice", e.target.value)} placeholder="MAX $" /></div></div>
          <div className="font-mono text-[10px] text-[#abbceb]">VALIDATION RATE<div className="mt-1 grid grid-cols-2 gap-2"><input className={selectClass} value={filters.minRate} onChange={e => setFilter("minRate", e.target.value)} placeholder="MIN %" /><input className={selectClass} value={filters.maxRate} onChange={e => setFilter("maxRate", e.target.value)} placeholder="MAX %" /></div></div>
        </div>
        <button onClick={reset} className="pixel-button px-3 py-2 text-[8px]">RESET FILTERS</button>
      </section>

      <section className="pixel-panel overflow-hidden bg-[#10215e]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-[10px]">
            <thead><tr className="border-b-[3px] border-black text-left text-[#abbceb]">{["#", "BIN", "TYPE", "COUNTRY", "BASE", "VALID RATE", "PRICING", "OPTION"].map(label => <th key={label} className="px-3 py-3 font-normal">{label}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-10 text-center font-mono text-xs text-[#abbceb]">LOADING...</td></tr> : visibleCards.length === 0 ? <tr><td colSpan={8} className="py-10 text-center font-mono text-xs text-[#abbceb]">NO CARDS FOUND</td></tr> : visibleCards.map((card, index) => {
                const code = countryCode(card);
                return <tr key={card.id} className="border-b border-black/40 text-white/80 hover:bg-[#19377e]">
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3 font-mono text-[#ffe177]">{cardBin(card) || "—"}</td>
                  <td className="px-3 py-3">{String(card.binData?.type || "—").toUpperCase()}</td>
                  <td className="px-3 py-3">{flagFor(code)} {code || "—"}</td>
                  <td className="px-3 py-3">{card.baseName || "—"}</td>
                  <td className="px-3 py-3 text-[#72df7c]">{card.hrPercent ?? 80}%</td>
                  <td className="px-3 py-3 font-bold text-[#ffe177]">${(Number(card.price || 0) / 100).toFixed(2)}</td>
                  <td className="px-3 py-3"><button onClick={() => buyMutation.mutate(card)} className="pixel-button px-2 py-2 text-[8px] !bg-[#ee292b] !text-white">BUY</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}