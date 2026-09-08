import { useMemo, useState } from "react";
import { ShoppingCart, SlidersHorizontal, X } from "lucide-react";
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
    addCard({ id: card.id, bin: cardBin(card), brand: cardBrand(card), type: String(card.binData?.type || "").toUpperCase(), baseName: card.baseName || "Standard", price: card.price, refundable: true });
    toast({ title: alreadyInCart ? "ALREADY IN CART" : "ADDED TO CART", description: `${cardBrand(card)} ${cardBin(card)} · REFUNDABLE` });
    if (checkout) setLocation("/checkout");
  };
  const selectClass = "pixel-input mt-1 h-10 w-full min-w-0";

  const cardDetails = (card: any, index: number, compact = false) => {
    const code = countryCode(card);
    const brand = cardBrand(card);
    return compact ? (
      <article key={card.id} className="border-[3px] border-black bg-[#10215e] p-4 shadow-[3px_3px_0_#050505]">
        <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] text-white/45">#{index + 1} · {cardBin(card) || "NO BIN"}</p><h2 className="mt-2 text-sm text-white">{brand}</h2></div><span className="text-xl" title={code || "Unknown country"}>{flagFor(code)}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px]"><span className="bg-[#0a1645] px-2 py-2 text-white/65">TYPE <b className="text-white">{String(card.binData?.type || "—").toUpperCase()}</b></span><span className="bg-[#0a1645] px-2 py-2 text-white/65">BASE <b className="text-white">{card.baseName || "—"}</b></span><span className="bg-[#0a1645] px-2 py-2 text-[#72df7c]">VALID {card.hrPercent ?? 80}%</span><span className="bg-[#0a1645] px-2 py-2 text-[#ffe177]">REFUNDABLE</span></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-lg font-bold text-[#ffe177]">${(Number(card.price || 0) / 100).toFixed(2)}</span><div className="flex gap-2"><button onClick={() => addToCart(card)} className="pixel-button inline-flex items-center gap-1 px-3 py-3 text-[8px]"><ShoppingCart className="h-3 w-3" /> ADD</button><button onClick={() => addToCart(card, true)} className="pixel-button !bg-[#ee292b] px-3 py-3 text-[8px] !text-white">BUY</button></div></div>
      </article>
    ) : (
      <tr key={card.id} className="border-b border-black/40 text-white/80 transition-colors hover:bg-[#19377e]">
        <td className="px-3 py-3 font-mono text-white/55">#{index + 1}</td><td className="px-3 py-3 font-bold text-[#ffe177]">{brand}</td><td className="px-3 py-3 font-mono text-[#ffe177]">{cardBin(card) || "—"}</td><td className="px-3 py-3">{String(card.binData?.type || "—").toUpperCase()}</td><td className="px-3 py-3">{flagFor(code)} {code || "—"}</td><td className="px-3 py-3">{card.baseName || "—"}</td><td className="px-3 py-3 text-[#72df7c]">{card.hrPercent ?? 80}%</td><td className="px-3 py-3"><span className="inline-flex border-2 border-[#43b94e] bg-[#43b94e]/15 px-2 py-1 font-mono text-[9px] text-[#72df7c]">YES</span></td><td className="px-3 py-3 font-bold text-[#ffe177]">${(Number(card.price || 0) / 100).toFixed(2)}</td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => addToCart(card)} className="pixel-button inline-flex items-center gap-1 px-2 py-2 text-[8px]"><ShoppingCart className="h-3 w-3" /> ADD</button><button onClick={() => addToCart(card, true)} className="pixel-button !bg-[#ee292b] px-2 py-2 text-[8px] !text-white">BUY</button></div></td>
      </tr>
    );
  };

  return (
    <div className="pixel-page space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="pixel-label">MARKETPLACE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">BUY CARDS</h1></div><div className="text-right"><p className="pixel-label">{visibleCards.length} AVAILABLE</p><p className="mt-1 font-mono text-[10px] text-white/45">{cardCount} IN CART</p></div></div>
      <section className="pixel-panel bg-[#10215e] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 pixel-label"><SlidersHorizontal className="h-4 w-4" /> FILTER CARDS</p>{hasFilters && <button onClick={reset} className="inline-flex items-center gap-1 font-mono text-[10px] text-[#ffe177] underline"><X className="h-3 w-3" /> CLEAR ALL</button>}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="font-mono text-[10px] text-[#abbceb]">BASE<select className={selectClass} value={filters.base} onChange={e => setFilter("base", e.target.value)}><option value="all">ALL BASES</option>{bases.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="font-mono text-[10px] text-[#abbceb]">COUNTRY<select className={selectClass} value={filters.country} onChange={e => setFilter("country", e.target.value)}><option value="all">ALL COUNTRIES</option>{values.countries.map(code => <option key={code} value={code}>{flagFor(code)} {code}</option>)}</select></label>
          <label className="font-mono text-[10px] text-[#abbceb]">BRAND<select className={selectClass} value={filters.brand} onChange={e => setFilter("brand", e.target.value)}><option value="all">ALL BRANDS</option>{values.brands.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="font-mono text-[10px] text-[#abbceb]">PRICE RANGE<div className="mt-1 grid grid-cols-2 gap-2"><input className="pixel-input h-10 min-w-0" inputMode="decimal" value={filters.minPrice} onChange={e => setFilter("minPrice", e.target.value)} placeholder="MIN $" /><input className="pixel-input h-10 min-w-0" inputMode="decimal" value={filters.maxPrice} onChange={e => setFilter("maxPrice", e.target.value)} placeholder="MAX $" /></div></div>
          <div className="font-mono text-[10px] text-[#abbceb]">VALIDATION RATE<div className="mt-1 grid grid-cols-2 gap-2"><input className="pixel-input h-10 min-w-0" inputMode="numeric" value={filters.minRate} onChange={e => setFilter("minRate", e.target.value)} placeholder="MIN %" /><input className="pixel-input h-10 min-w-0" inputMode="numeric" value={filters.maxRate} onChange={e => setFilter("maxRate", e.target.value)} placeholder="MAX %" /></div></div>
        </div>
      </section>
      <section className="hidden overflow-hidden border-[3px] border-black bg-[#10215e] md:block">
        <div className="overflow-x-auto"><table className="min-w-[1120px] w-full border-collapse text-[10px]"><thead><tr className="border-b-[3px] border-black text-left text-[#abbceb]">{["#", "BRAND", "BIN", "TYPE", "COUNTRY", "BASE", "VALID RATE", "REFUNDABLE", "PRICE", "ADD TO CART"].map(label => <th key={label} className="whitespace-nowrap px-3 py-3 font-normal">{label}</th>)}</tr></thead><tbody>{isLoading ? <tr><td colSpan={10} className="py-10 text-center font-mono text-xs text-[#abbceb]">LOADING...</td></tr> : visibleCards.length === 0 ? <tr><td colSpan={10} className="py-10 text-center font-mono text-xs text-[#abbceb]">NO CARDS FOUND</td></tr> : visibleCards.map((card, index) => cardDetails(card, index))}</tbody></table></div>
      </section>
      <section className="space-y-3 md:hidden">{isLoading ? <div className="pixel-panel bg-[#10215e] py-10 text-center font-mono text-xs text-[#abbceb]">LOADING...</div> : visibleCards.length === 0 ? <div className="pixel-panel bg-[#10215e] py-10 text-center font-mono text-xs text-[#abbceb]">NO CARDS FOUND</div> : visibleCards.map((card, index) => cardDetails(card, index, true))}</section>
    </div>
  );
}