import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
function brand(card: any) {
  return String(card?.binData?.scheme || card?.binData?.brand || "").toUpperCase();
}
function bank(card: any) {
  return String(card?.binData?.bank || "").trim();
}
function bin(card: any) {
  return String(card?.binData?.bin || card?.cardNumber || "").replace(/\D/g, "").slice(0, 6);
}
function regionName(code: string) {
  try { return code ? new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code : "—"; } catch { return code || "—"; }
}

export default function CardsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const addCard = useCart(state => state.addCard);
  const [filters, setFilters] = useState({
    base: "all", country: "all", brand: "all", level: "all", bank: "",
    expMonth: "all", expYear: "all", zipcode: "", city: "", state: "", bin: "",
    minPrice: "", maxPrice: "", minRate: "", maxRate: "",
  });
  const { data: cards = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/cards"], refetchInterval: 15000 });
  const { data: bases = [] } = useQuery<any[]>({ queryKey: ["/api/card-bases"] });

  const values = useMemo(() => ({
    countries: Array.from(new Set(cards.map(countryCode).filter(Boolean))).sort(),
    brands: Array.from(new Set(cards.map(brand).filter(Boolean))).sort(),
    banks: Array.from(new Set(cards.map(bank).filter(Boolean))).sort(),
  }), [cards]);
  const setFilter = (key: string, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const visibleCards = useMemo(() => cards.filter(card => {
    const country = countryCode(card);
    const price = Number(card.price || 0) / 100;
    const rate = Number(card.hrPercent ?? 80);
    const metadata = card.metadata || {};
    if (filters.base !== "all" && String(card.baseId) !== filters.base) return false;
    if (filters.country !== "all" && country !== filters.country) return false;
    if (filters.brand !== "all" && brand(card) !== filters.brand) return false;
    if (filters.level !== "all" && String(card.binData?.type || "").toUpperCase() !== filters.level) return false;
    if (filters.bank && !bank(card).toLowerCase().includes(filters.bank.toLowerCase())) return false;
    if (filters.bin && !bin(card).includes(filters.bin.replace(/\D/g, ""))) return false;
    if (filters.city && !String(metadata.city || "").toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.state && !String(metadata.state || "").toLowerCase().includes(filters.state.toLowerCase())) return false;
    if (filters.zipcode && !String(metadata.zip || "").includes(filters.zipcode)) return false;
    if (filters.minPrice && price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
    if (filters.minRate && rate < Number(filters.minRate)) return false;
    if (filters.maxRate && rate > Number(filters.maxRate)) return false;
    return true;
  }), [cards, filters]);

  const buyMutation = useMutation({
    mutationFn: async (card: any) => {
      addCard({ id: card.id, bin: bin(card), brand: brand(card), type: String(card.binData?.type || "").toUpperCase(), baseName: card.baseName || "Standard", price: card.price });
    },
    onSuccess: () => setLocation("/checkout"),
    onError: (error: any) => toast({ title: "Unable to add card", description: error.message, variant: "destructive" }),
  });

  const reset = () => setFilters({ base: "all", country: "all", brand: "all", level: "all", bank: "", expMonth: "all", expYear: "all", zipcode: "", city: "", state: "", bin: "", minPrice: "", maxPrice: "", minRate: "", maxRate: "" });
  const selectClass = "store-select";
  const inputClass = "store-input";
  return (
    <div className="store-page">
      <section className="store-card">
        <div className="store-card-title">SEARCH</div>
        <div className="grid gap-x-3 gap-y-3 p-4 md:grid-cols-3">
          <label className="store-label">Base:<select className={`${selectClass} mt-1`} value={filters.base} onChange={e => setFilter("base", e.target.value)}><option value="all">Select</option>{bases.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="store-label">Country:<select className={`${selectClass} mt-1`} value={filters.country} onChange={e => setFilter("country", e.target.value)}><option value="all">Select</option>{values.countries.map(code => <option key={code} value={code}>{regionName(code)}</option>)}</select></label>
          <label className="store-label">Brand:<select className={`${selectClass} mt-1`} value={filters.brand} onChange={e => setFilter("brand", e.target.value)}><option value="all">Select</option>{values.brands.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="store-label">Level (+0.1$):<select className={`${selectClass} mt-1`} value={filters.level} onChange={e => setFilter("level", e.target.value)}><option value="all">Select</option><option value="CREDIT">CREDIT</option><option value="DEBIT">DEBIT</option><option value="PREPAID">PREPAID</option></select></label>
          <label className="store-label">Bank (+0.1$):<input className={`${inputClass} mt-1`} value={filters.bank} onChange={e => setFilter("bank", e.target.value)} placeholder="Bank Name" /></label>
          <div className="grid grid-cols-2 gap-2"><label className="store-label">Exp Month:<select className={`${selectClass} mt-1`} value={filters.expMonth} onChange={e => setFilter("expMonth", e.target.value)}><option value="all">Select</option>{Array.from({ length: 12 }, (_, i) => <option key={i}>{String(i + 1).padStart(2, "0")}</option>)}</select></label><label className="store-label">Exp Year (+0.2$):<select className={`${selectClass} mt-1`} value={filters.expYear} onChange={e => setFilter("expYear", e.target.value)}><option value="all">Select</option><option>2026</option><option>2027</option><option>2028</option></select></label></div>
          <label className="store-label">Zipcode (+0.2$):<input className={`${inputClass} mt-1`} value={filters.zipcode} onChange={e => setFilter("zipcode", e.target.value)} placeholder="80123, BL5BN" /></label>
          <label className="store-label">City (+0.1$):<input className={`${inputClass} mt-1`} value={filters.city} onChange={e => setFilter("city", e.target.value)} placeholder="City" /></label>
          <label className="store-label">State (+0.1$):<input className={`${inputClass} mt-1`} value={filters.state} onChange={e => setFilter("state", e.target.value)} placeholder="State" /></label>
          <label className="store-label">Bin (+0.2$):<input className={`${inputClass} mt-1`} value={filters.bin} onChange={e => setFilter("bin", e.target.value)} placeholder="457714,453978" /></label>
          <div className="store-label">Price:<div className="mt-1 grid grid-cols-2 gap-1"><input className={inputClass} value={filters.minPrice} onChange={e => setFilter("minPrice", e.target.value)} placeholder="MIN" /><input className={inputClass} value={filters.maxPrice} onChange={e => setFilter("maxPrice", e.target.value)} placeholder="MAX" /></div></div>
          <div className="store-label">Valid Rate:<div className="mt-1 grid grid-cols-2 gap-1"><input className={inputClass} value={filters.minRate} onChange={e => setFilter("minRate", e.target.value)} placeholder="MIN" /><input className={inputClass} value={filters.maxRate} onChange={e => setFilter("maxRate", e.target.value)} placeholder="MAX" /></div></div>
          <div className="col-span-full grid gap-2 pt-1 text-[10px] text-[#9294a1] sm:grid-cols-3">
            {["DOB", "Phone", "Checker", "SSN", "Email", "Discount cards", "Last 4 SSN", "MMN", "VBV", "Do not show hidden cards"].map(label => <label key={label} className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 accent-[#6546d6]" />{label}</label>)}
          </div>
          <div className="col-span-full flex justify-end gap-2 pt-1"><button className="store-button" onClick={reset}>Reset</button><span className="self-center text-[10px] text-[#a1a3af]">{visibleCards.length} cards found</span></div>
        </div>
      </section>

      <section className="store-card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse text-[10px]">
            <thead><tr className="border-b border-[#ececf2] text-left uppercase text-[#8f91a0]">{["#", "BIN", "TYPE", "COUNTRY", "EXP", "NAME", "BANK", "LEVEL", "ZIPCODE", "STATE", "CITY", "PHONE", "OPTION", "BASE", "VALID RATE", "CHECKER", "PRICING"].map(label => <th key={label} className="whitespace-nowrap px-2 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={17} className="py-10 text-center text-[#a0a2ae]">Loading...</td></tr> : visibleCards.length === 0 ? <tr><td colSpan={17} className="py-10 text-center text-[#a0a2ae]">NOT FOUND</td></tr> : visibleCards.map((card, index) => {
                const code = countryCode(card);
                return <tr key={card.id} className="border-b border-[#f0f0f4] text-[#737687] hover:bg-[#fbfaff]">
                  <td className="px-2 py-3">{index + 1}</td>
                  <td className="px-2 py-3 font-mono text-[#6870bb]">{bin(card) || "—"}</td>
                  <td className="px-2 py-3">{String(card.binData?.type || "—").toUpperCase()}</td>
                  <td className="px-2 py-3 whitespace-nowrap">{flagFor(code)} {code || "—"}</td>
                  <td className="px-2 py-3">—</td><td className="px-2 py-3">—</td>
                  <td className="max-w-[130px] truncate px-2 py-3">{bank(card) || "—"}</td>
                  <td className="px-2 py-3">{String(card.binData?.level || "—").toUpperCase()}</td><td className="px-2 py-3">—</td><td className="px-2 py-3">—</td><td className="px-2 py-3">—</td><td className="px-2 py-3">—</td>
                  <td className="px-2 py-3"><button className="text-lg leading-none text-[#6042d2]" onClick={() => buyMutation.mutate(card)} aria-label="Buy card">•••</button></td>
                  <td className="max-w-[100px] truncate px-2 py-3">{card.baseName || "—"}</td>
                  <td className="px-2 py-3 text-[#7370c2]">{card.hrPercent ?? 80}%</td>
                  <td className="px-2 py-3 text-[#76c7ba]">✓</td>
                  <td className="px-2 py-3 font-semibold text-[#7a7ca0]">${(Number(card.price || 0) / 100).toFixed(2)}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}