import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  return String(card?.binData?.scheme || card?.binData?.brand || "").toUpperCase() || "UNKNOWN";
}
function cardBin(card: any) {
  return String(card?.binData?.bin || card?.cardNumber || "").replace(/\D/g, "").slice(0, 6);
}

type Filters = { base: string; country: string; brand: string; minPrice: string; maxPrice: string; minRate: string; maxRate: string };
const emptyFilters: Filters = { base: "all", country: "all", brand: "all", minPrice: "", maxPrice: "", minRate: "", maxRate: "" };

export default function CardsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const addCard = useCart(state => state.addCard);
  const cardCount = useCart(state => state.cardItems.length);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const { data: cards = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 15000 });
  const { data: bases = [] } = useQuery<any[]>({ queryKey: ["/api/card-bases"] });

  const values = useMemo(() => ({
    countries: Array.from(new Set(cards.map(countryCode).filter(Boolean))).sort(),
    brands: Array.from(new Set(cards.map(cardBrand).filter(Boolean))).sort(),
  }), [cards]);
  const visibleCards = useMemo(() => cards.filter(card => {
    const price = Number(card.price || 0) / 100;
    const rate = Number(card.hrPercent ?? 80);
    return (filters.base === "all" || String(card.baseId) === filters.base)
      && (filters.country === "all" || countryCode(card) === filters.country)
      && (filters.brand === "all" || cardBrand(card) === filters.brand)
      && (!filters.minPrice || price >= Number(filters.minPrice))
      && (!filters.maxPrice || price <= Number(filters.maxPrice))
      && (!filters.minRate || rate >= Number(filters.minRate))
      && (!filters.maxRate || rate <= Number(filters.maxRate));
  }), [cards, filters]);

  const setFilter = (key: keyof Filters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const reset = () => setFilters(emptyFilters);
  const hasFilters = Object.entries(filters).some(([key, value]) => key === "base" || key === "country" || key === "brand" ? value !== "all" : Boolean(value));
  const addToCart = (card: any, checkout = false) => {
    const alreadyInCart = useCart.getState().cardItems.some(item => item.id === card.id);
    addCard({ id: card.id, bin: cardBin(card), brand: cardBrand(card), type: String(card.binData?.type || "").toUpperCase(), country: countryCode(card) || undefined, baseName: card.baseName || "Standard", price: card.price, refundable: true });
    toast({ title: alreadyInCart ? "ALREADY IN CART" : "ADDED TO CART", description: `${cardBrand(card)} ${cardBin(card)} · REFUNDABLE` });
    if (checkout) setLocation("/checkout");
  };
  const selectClass = "store-select mt-1 h-10 w-full min-w-0";

  const cardDetails = (card: any, index: number, compact = false) => {
    const code = countryCode(card);
    const brand = cardBrand(card);
    return compact ? (
      <article key={card.id} className="border-[3px] border-black bg-[#10215e] p-4 shadow-[3px_3px_0_#050505]">
        <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] text-white/45">#{index + 1} · {cardBin(card) || "NO BIN"}</p><h2 className="mt-2 text-sm text-white">{brand}</h2></div><span className="text-xl" title={code || "Unknown country"}>{flagFor(code)}</span></div>
         <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="bg-[#0a1645] px-2 py-2 text-white/65">Type <b className="text-white">{String(card.binData?.type || "—").toUpperCase()}</b></span><span className="bg-[#0a1645] px-2 py-2 text-white/65">Base <b className="text-white">{card.baseName || "—"}</b></span><span className="bg-[#0a1645] px-2 py-2 text-[#72df7c]">Validation {card.hrPercent ?? 80}%</span><span className="game-check">Refundable</span></div>
         <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-lg font-bold text-[#ffe177]">${(Number(card.price || 0) / 100).toFixed(2)}</span><div className="flex gap-2"><button onClick={() => addToCart(card)} className="pixel-button px-3 py-2">Add</button><button onClick={() => addToCart(card, true)} className="pixel-button !bg-[#ee292b] px-3 py-2 !text-white">Buy</button></div></div>
      </article>
    ) : (
       <tr key={card.id} className="border-b border-black/40 text-white/80 transition-colors hover:bg-[#19377e]">
         <td className="px-3 py-3 text-white/55">#{index + 1}</td><td className="px-3 py-3 font-bold text-[#ffe177]">{brand}</td><td className="px-3 py-3 text-[#ffe177]">{cardBin(card) || "—"}</td><td className="px-3 py-3">{String(card.binData?.type || "—").toUpperCase()}</td><td className="px-3 py-3">{flagFor(code)} {code || "—"}</td><td className="px-3 py-3">{card.baseName || "—"}</td><td className="px-3 py-3 text-[#72df7c]">{card.hrPercent ?? 80}%</td><td className="px-3 py-3"><span className="game-check">Yes</span></td><td className="px-3 py-3 font-bold text-[#ffe177]">${(Number(card.price || 0) / 100).toFixed(2)}</td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => addToCart(card)} className="pixel-button px-2 py-2">Add</button><button onClick={() => addToCart(card, true)} className="pixel-button !bg-[#ee292b] px-2 py-2 !text-white">Buy</button></div></td>
      </tr>
    );
  };

  return (
    <div className="pixel-page space-y-5">
       <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="pixel-label">Marketplace</p><h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Buy cards</h1></div><div className="text-right"><p className="pixel-label">{visibleCards.length} available</p><p className="mt-1 text-xs text-white/45">{cardCount} in cart</p></div></div>
       <section className="store-card bg-[#10215e] p-4 sm:p-5">
         <div className="flex flex-wrap items-center justify-between gap-3"><p className="pixel-label">Filters</p>{hasFilters && <button onClick={reset} className="text-xs font-semibold text-[#ffe177] underline">Clear all</button>}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="store-label">Base<select className={selectClass} value={filters.base} onChange={e => setFilter("base", e.target.value)}><option value="all">All bases</option>{bases.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="store-label">Country<select className={selectClass} value={filters.country} onChange={e => setFilter("country", e.target.value)}><option value="all">All countries</option>{values.countries.map(code => <option key={code} value={code}>{flagFor(code)} {code}</option>)}</select></label>
          <label className="store-label">Brand<select className={selectClass} value={filters.brand} onChange={e => setFilter("brand", e.target.value)}><option value="all">All brands</option>{values.brands.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="store-label">Price range<div className="mt-1 grid grid-cols-2 gap-2"><input className="store-input min-w-0" inputMode="decimal" value={filters.minPrice} onChange={e => setFilter("minPrice", e.target.value)} placeholder="Min $" /><input className="store-input min-w-0" inputMode="decimal" value={filters.maxPrice} onChange={e => setFilter("maxPrice", e.target.value)} placeholder="Max $" /></div></div>
          <div className="store-label">Validation rate<div className="mt-1 grid grid-cols-2 gap-2"><input className="store-input min-w-0" inputMode="numeric" value={filters.minRate} onChange={e => setFilter("minRate", e.target.value)} placeholder="Min %" /><input className="store-input min-w-0" inputMode="numeric" value={filters.maxRate} onChange={e => setFilter("maxRate", e.target.value)} placeholder="Max %" /></div></div>
        </div>
      </section>
        <section className="hidden overflow-hidden border-[3px] border-black bg-[#10215e] md:block">
        <div className="overflow-x-auto"><table className="min-w-[1120px] w-full border-collapse text-xs"><thead><tr className="border-b-[3px] border-black text-left text-[#abbceb]">{["#", "BRAND", "BIN", "TYPE", "COUNTRY", "BASE", "VALID RATE", "REFUNDABLE", "PRICE", "ADD TO CART"].map(label => <th key={label} className="whitespace-nowrap px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{isLoading ? <tr><td colSpan={10} className="py-10 text-center font-mono text-xs text-[#abbceb]">LOADING...</td></tr> : visibleCards.length === 0 ? <tr><td colSpan={10} className="py-10 text-center font-mono text-xs text-[#abbceb]">NO CARDS FOUND</td></tr> : visibleCards.map((card, index) => cardDetails(card, index))}</tbody></table></div>
      </section>
      <section className="space-y-3 md:hidden">{isLoading ? <div className="pixel-panel bg-[#10215e] py-10 text-center font-mono text-xs text-[#abbceb]">LOADING...</div> : visibleCards.length === 0 ? <div className="pixel-panel bg-[#10215e] py-10 text-center font-mono text-xs text-[#abbceb]">NO CARDS FOUND</div> : visibleCards.map((card, index) => cardDetails(card, index, true))}</section>
    </div>
  );
}