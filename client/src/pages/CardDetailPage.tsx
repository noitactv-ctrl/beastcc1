import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

function countryLabel(card: any) {
  const code = String(card?.binData?.countryCode || card?.country || "").toUpperCase();
  try { return code ? `${new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code}` : "—"; } catch { return code || "—"; }
}
function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...code.split("").map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default function CardDetailPage() {
  const [, params] = useRoute("/card/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const addCard = useCart(state => state.addCard);
  const { data: cards = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/cards"] });
  const card = cards.find(item => String(item.id) === String(params?.id));
  const buy = useMutation({
    mutationFn: async () => {
      if (!card) throw new Error("Card not found");
      addCard({
        id: card.id,
        bin: String(card.binData?.bin || "").slice(0, 6),
        brand: String(card.binData?.scheme || card.binData?.brand || "").toUpperCase(),
        type: String(card.binData?.type || "").toUpperCase(),
        baseName: card.baseName || "Standard",
        price: card.price,
      });
      return true;
    },
    onSuccess: () => setLocation("/checkout"),
    onError: (error: any) => toast({ title: "Unable to add card", description: error.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="store-page text-xs text-[#999baa]">Loading...</div>;
  if (!card) return <div className="store-card p-8 text-center text-sm"><p>Card not found.</p><Link href="/cards"><span className="mt-4 inline-block text-[#6545d4]">Back to Shop</span></Link></div>;

  const price = Number(card.price || 0) / 100;
  const noRefund = price * 0.95;
  const additional = price * 0.1;
  const countryCode = String(card.binData?.countryCode || card.country || "").toUpperCase();
  const detailRows = [
    ["Brand", String(card.binData?.scheme || card.binData?.brand || "—").toUpperCase()],
    ["Bin", String(card.binData?.bin || "—").slice(0, 6)],
    ["Exp", "—"],
    ["Name", "—"],
    ["Card Type", String(card.binData?.type || "—").toUpperCase()],
    ["Card Bank", card.binData?.bank || "—"],
    ["Card Level", String(card.binData?.level || "—").toUpperCase()],
    ["Zipcode", "—"],
    ["State", "—"],
    ["City", "—"],
    ["Country", `${flag(countryCode)} ${countryLabel(card)}`],
    ["Phone", "—"],
    ["Checker", "✓"],
    ["Refundable", "✓"],
    ["Valid Rate", `${card.hrPercent ?? 65}%`],
  ];
  return (
    <div className="store-page card-detail-compact">
      <div className="store-breadcrumb"><Link href="/cards"><span>Shop</span></Link><span>⌂</span><span>·</span><span>Card</span></div>
      <section className="store-card overflow-hidden">
        <div className="store-card-title">INFO</div>
        <div className="divide-y divide-[#f0f0f4]">
          {detailRows.map(([label, value]) => <div key={label} className="grid grid-cols-[110px_1fr] border-b border-[#f0f0f4] text-[10px] sm:grid-cols-[110px_1fr]"><span className="bg-[#fafafd] px-3 py-2 text-[#77798a]">{label}</span><span className="px-3 py-2 text-[#7d80a7]">{value}</span></div>)}
        </div>
      </section>
      <section className="store-card mt-5 overflow-hidden">
        <div className="store-card-title">PRICING</div>
        <div className="px-3">
          <div className="py-3 text-center text-[10px] text-[#77798a]">Info</div>
          {[
            ["Original Price", `$${price.toFixed(2)}`],
            ["Price with no refund (5%)", `$${noRefund.toFixed(2)}`],
            ["Additional money", `$${additional.toFixed(2)}`],
          ].map(([label, value]) => <div key={label} className="flex items-center justify-between border-t border-[#f0f0f4] px-3 py-2 text-[10px]"><span className="text-[#6853c7]">• &nbsp;{label}</span><span className="text-[#77798a]">{value}</span></div>)}
          <div className="border-t border-[#f0f0f4] py-3 text-center text-[10px] text-[#77798a]">Purchase options</div>
          <div className="border-t border-[#f0f0f4] px-3 py-2 text-[10px]"><span className="text-[#6853c7]">• &nbsp;Buy (Refundable)</span><span className="float-right text-[#77798a]">${(price + additional).toFixed(2)}</span></div>
          <div className="border-t border-[#f0f0f4] px-3 py-2 text-[10px]"><span className="text-[#6853c7]">• &nbsp;Buy without checker (No Refund)</span><span className="float-right text-[#77798a]">${(price + additional / 2).toFixed(2)}</span></div>
        </div>
      </section>
      <section className="store-card mt-5 overflow-hidden">
        <div className="store-card-title">ACTION</div>
        <div className="p-4 text-[10px]">
          <p className="text-center font-semibold">YOUR BALANCE: <span className="text-[#ed3e4d]">$0.00</span></p>
          <p className="mt-6"><strong>BUY CARD.</strong> You can check this card in 7 minutes after bought it (if card dead, you will get refund)</p>
          <p className="mt-4"><strong>BUY WITHOUT CHECKER.</strong> You will see this card without check it. Cheaper and you can&apos;t check and refund it after bought</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => buy.mutate()} className="store-button min-w-[205px]">{`BUY CARD ($${(price + additional).toFixed(2)})`}</button>
            <button onClick={() => buy.mutate()} className="store-button min-w-[205px]">{`BUY CARD WITHOUT CHECKER ($${(price + additional / 2).toFixed(2)})`}</button>
          </div>
        </div>
      </section>
    </div>
  );
}