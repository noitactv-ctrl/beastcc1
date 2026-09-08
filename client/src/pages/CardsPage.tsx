import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, Loader2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";

function flagFor(code: string) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "🌐";
  return String.fromCodePoint(...normalized.split("").map(char => 0x1f1e6 + char.charCodeAt(0) - 65));
}

function countryCode(card: any) {
  const value = card?.binData?.countryCode || card?.country;
  return /^[A-Za-z]{2}$/.test(String(value || "")) ? String(value).toUpperCase() : "";
}

function countryName(code: string) {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function brandName(card: any) {
  return String(card?.binData?.scheme || card?.binData?.brand || "Unknown").toUpperCase();
}

function typeName(card: any) {
  return String(card?.binData?.type || "").replace(/[_-]+/g, " ").toUpperCase();
}

function binOf(card: any) {
  return String(card?.binData?.bin || card?.cardNumber || "").replace(/\D/g, "").slice(0, 6) || "——";
}

export default function CardsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const addCard = useCart(state => state.addCard);
  const setBulkBundle = useCart(state => state.setBulkBundle);
  const cartCards = useCart(state => state.cardItems);
  const [base, setBase] = useState("all");
  const [country, setCountry] = useState("all");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minValidation, setMinValidation] = useState("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: cards = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/cards"],
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const { data: bases = [] } = useQuery<any[]>({ queryKey: ["/api/card-bases"] });

  const countries = useMemo(
    () => Array.from(new Set(cards.map(countryCode).filter(Boolean))).sort(),
    [cards],
  );
  const brands = useMemo(
    () => Array.from(new Set(cards.map(brandName).filter(brand => brand !== "UNKNOWN"))).sort(),
    [cards],
  );

  const filteredCards = useMemo(() => cards.filter(card => {
    const price = Number(card.price || 0);
    const validation = Number(card.hrPercent ?? 80);
    if (base !== "all" && String(card.baseId) !== base) return false;
    if (country !== "all" && countryCode(card) !== country) return false;
    if (brand !== "all" && brandName(card) !== brand) return false;
    if (minPrice && price < Math.round(Number(minPrice) * 100)) return false;
    if (maxPrice && price > Math.round(Number(maxPrice) * 100)) return false;
    if (minValidation !== "all" && validation < Number(minValidation)) return false;
    return true;
  }), [cards, base, country, brand, minPrice, maxPrice, minValidation]);

  const addSingleCard = (card: any) => {
    addCard({
      id: card.id,
      bin: binOf(card),
      brand: brandName(card),
      type: typeName(card),
      baseName: card.baseName || "Standard",
      price: card.price,
    });
    toast({ title: "CARD ADDED", description: "Opening checkout so you can review your order." });
    setLocation("/checkout");
  };

  const toggleSelected = (card: any) => {
    setSelectedIds(current => current.includes(card.id)
      ? current.filter(id => id !== card.id)
      : current.length >= 20 ? current : [...current, card.id]);
  };

  const addBundle = () => {
    if (selectedIds.length !== 20) {
      toast({ title: "SELECT 20 CARDS", description: "A bundle requires exactly 20 unique cards.", variant: "destructive" });
      return;
    }
    const selected = cards.filter(card => selectedIds.includes(card.id));
    const originalTotal = selected.reduce((sum, card) => sum + Number(card.price || 0), 0);
    setBulkBundle({
      cardIds: selected.map(card => card.id),
      cards: selected.map(card => ({
        id: card.id,
        bin: binOf(card),
        brand: brandName(card),
        type: typeName(card),
        baseName: card.baseName || "Standard",
        price: card.price,
      })),
      originalTotal,
      discountedTotal: Math.round(originalTotal / 2),
    });
    setSelectedIds([]);
    setBulkMode(false);
    setLocation("/checkout");
  };

  return (
    <div className="pixel-page space-y-5">
      <section className="pixel-panel bg-[#10276a] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="pixel-label">CARD MARKET</p>
            <h1 className="mt-3 text-xl text-white sm:text-2xl">FIND YOUR NEXT DROP</h1>
            <p className="mt-3 max-w-2xl font-mono text-[10px] leading-5 text-white/55">
              Browse verified inventory by the signals that matter. No personal card details are shown in the marketplace.
            </p>
          </div>
          <button
            onClick={() => { setBulkMode(value => !value); setSelectedIds([]); }}
            className={`pixel-button flex items-center gap-2 px-3 py-3 text-[8px] ${bulkMode ? "!bg-[#ee292b] !text-white" : "!bg-[#43b94e] !text-white"}`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {bulkMode ? `CANCEL · ${selectedIds.length}/20` : "BUILD 20-CARD BUNDLE"}
          </button>
        </div>
        {bulkMode && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-black/50 pt-3">
            <p className="font-mono text-[10px] text-[#ffe177]">Select exactly 20 cards for 50% off each.</p>
            <button onClick={addBundle} className="pixel-button !bg-[#ffe177] px-3 py-2 text-[8px]">
              REVIEW BUNDLE
            </button>
          </div>
        )}
      </section>

      <section className="pixel-panel bg-[#0b1744] p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#ffe177]" />
          <p className="pixel-label">FILTER INVENTORY</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">BASE</span>
            <select value={base} onChange={event => setBase(event.target.value)} className="pixel-input h-10 py-2 text-[10px]">
              <option value="all">All bases</option>
              {bases.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">COUNTRY</span>
            <select value={country} onChange={event => setCountry(event.target.value)} className="pixel-input h-10 py-2 text-[10px]">
              <option value="all">All countries</option>
              {countries.map(code => <option key={code} value={code}>{flagFor(code)} {countryName(code)}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">BRAND</span>
            <select value={brand} onChange={event => setBrand(event.target.value)} className="pixel-input h-10 py-2 text-[10px]">
              <option value="all">All brands</option>
              {brands.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">MIN PRICE</span>
            <input type="number" min="0" step="0.01" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="$0.00" className="pixel-input h-10 py-2 text-[10px]" />
          </label>
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">MAX PRICE</span>
            <input type="number" min="0" step="0.01" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="No limit" className="pixel-input h-10 py-2 text-[10px]" />
          </label>
          <label className="space-y-1">
            <span className="pixel-label text-[8px]">VALIDATION RATE</span>
            <select value={minValidation} onChange={event => setMinValidation(event.target.value)} className="pixel-input h-10 py-2 text-[10px]">
              <option value="all">Any rate</option>
              <option value="90">90% and up</option>
              <option value="80">80% and up</option>
              <option value="70">70% and up</option>
            </select>
          </label>
        </div>
      </section>

      <section className="pixel-panel overflow-hidden bg-[#0b1744]">
        <div className="flex items-center justify-between border-b-[3px] border-black bg-[#1d3d93] px-4 py-3">
          <p className="pixel-label text-white">{filteredCards.length} CARDS AVAILABLE</p>
          <p className="font-mono text-[9px] text-white/55">BUY OPENS CHECKOUT</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#ffe177]" /></div>
        ) : filteredCards.length === 0 ? (
          <div className="px-4 py-16 text-center font-mono text-xs text-white/45">No cards match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b-2 border-black/70 text-left">
                  {bulkMode && <th className="px-3 py-3 pixel-label text-[8px]">SELECT</th>}
                  <th className="px-3 py-3 pixel-label text-[8px]">BIN</th>
                  <th className="px-3 py-3 pixel-label text-[8px]">BRAND</th>
                  <th className="px-3 py-3 pixel-label text-[8px]">COUNTRY</th>
                  <th className="px-3 py-3 pixel-label text-[8px]">BASE</th>
                  <th className="px-3 py-3 pixel-label text-[8px]">VALIDATION</th>
                  <th className="px-3 py-3 text-right pixel-label text-[8px]">PRICE</th>
                  {!bulkMode && <th className="px-3 py-3 text-right pixel-label text-[8px]">ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCards.map(card => {
                  const code = countryCode(card);
                  const selected = selectedIds.includes(card.id);
                  const inCart = cartCards.some(item => item.id === card.id);
                  return (
                    <tr key={card.id} className={`border-b border-black/50 ${selected ? "bg-[#193f91]" : "hover:bg-white/5"}`}>
                      {bulkMode && (
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selected} onChange={() => toggleSelected(card)} className="h-4 w-4 accent-[#ee292b]" />
                        </td>
                      )}
                      <td className="px-3 py-3 font-mono text-xs font-bold text-white">{binOf(card)}</td>
                      <td className="px-3 py-3 text-xs font-bold text-[#ffe177]">{brandName(card)}</td>
                      <td className="px-3 py-3 text-xs text-white/75">{flagFor(code)} {countryName(code)}</td>
                      <td className="px-3 py-3 text-xs text-white/65">{card.baseName || "Standard"}</td>
                      <td className="px-3 py-3"><span className="pixel-status-yes">{card.hrPercent ?? 80}%</span></td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-bold text-white">${(Number(card.price || 0) / 100).toFixed(2)}</td>
                      {!bulkMode && (
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => addSingleCard(card)} disabled={inCart} className="pixel-button !bg-[#ee292b] px-3 py-2 text-[8px] !text-white disabled:opacity-40">
                            {inCart ? "IN CART" : "BUY"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}