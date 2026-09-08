import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ShoppingCart, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { items, cardItems, bulkBundle, removeItem, removeCard, clearBulkBundle, clearCart } = useCart();
  const productTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cardTotal = cardItems.reduce((sum, item) => sum + item.price, 0);
  const total = productTotal + cardTotal + (bulkBundle?.discountedTotal || 0);
  const empty = items.length === 0 && cardItems.length === 0 && !bulkBundle;

  const checkout = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", api.orders.create.path, {
        items: items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
        cardIds: cardItems.map(card => card.id),
        bulkCardIds: bulkBundle?.cardIds || [],
        discountCodeId: null,
      });
      return response.json();
    },
    onSuccess: () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ["/api/cards"] });
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "ORDER PLACED", description: "Your order is now being prepared." });
      setLocation("/orders");
    },
    onError: (error: any) => toast({ title: "CHECKOUT FAILED", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="pixel-page max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div><p className="pixel-label">CHECKOUT</p><h1 className="mt-3 text-xl text-white sm:text-2xl">REVIEW YOUR DROP</h1></div>
        <Link href="/cards"><span className="pixel-button inline-flex items-center gap-2 px-3 py-2 text-[8px]"><ArrowLeft className="h-3 w-3" /> KEEP SHOPPING</span></Link>
      </div>
      {empty ? (
        <div className="pixel-panel bg-[#10215e] p-12 text-center">
          <ShoppingCart className="mx-auto h-9 w-9 text-[#ffe177]" />
          <h2 className="mt-5 text-sm text-white">YOUR CART IS EMPTY</h2>
          <p className="mt-3 font-mono text-[10px] text-white/50">Choose a card and it will appear here for review.</p>
          <Link href="/cards"><span className="pixel-button mt-6 inline-block !bg-[#ee292b] px-4 py-3 text-[8px] !text-white">BROWSE CARDS</span></Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="pixel-panel overflow-hidden bg-[#10215e]">
            {bulkBundle && (
              <div className="flex items-center justify-between gap-3 border-b-2 border-black p-4">
                <div><p className="text-xs font-bold text-white">20-CARD BULK BUNDLE</p><p className="mt-1 font-mono text-[10px] text-[#43b94e]">50% discount applied</p></div>
                <button onClick={clearBulkBundle} className="text-white/55 hover:text-white" aria-label="Remove bundle"><Trash2 className="h-4 w-4" /></button>
              </div>
            )}
            {cardItems.map(card => (
              <div key={card.id} className="flex items-center justify-between gap-3 border-b-2 border-black p-4">
                <div><p className="font-mono text-xs font-bold text-white">{card.bin}</p><p className="mt-1 text-[10px] text-[#ffe177]">{card.brand} · {card.baseName}</p></div>
                <div className="flex items-center gap-3"><span className="font-mono text-xs text-white">${(card.price / 100).toFixed(2)}</span><button onClick={() => removeCard(card.id)} className="text-white/55 hover:text-white"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            ))}
            {items.map(item => (
              <div key={item.variantId} className="flex items-center justify-between gap-3 border-b-2 border-black p-4">
                <div><p className="text-xs font-bold text-white">{item.productName}</p><p className="mt-1 font-mono text-[10px] text-white/55">Qty {item.quantity} · {item.variantName}</p></div>
                <div className="flex items-center gap-3"><span className="font-mono text-xs text-white">${(item.price * item.quantity / 100).toFixed(2)}</span><button onClick={() => removeItem(item.variantId)} className="text-white/55 hover:text-white"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            ))}
            <button onClick={clearCart} className="m-4 font-mono text-[10px] text-white/45 underline hover:text-white">Clear cart</button>
          </div>
          <aside className="pixel-panel h-fit bg-[#142d78] p-5">
            <p className="pixel-label">ORDER SUMMARY</p>
            <div className="mt-5 space-y-3 border-b-2 border-black/50 pb-4 font-mono text-[10px]">
              <div className="flex justify-between text-white/60"><span>Items</span><span>{items.length + cardItems.length + (bulkBundle ? 20 : 0)}</span></div>
              <div className="flex justify-between text-white/60"><span>Balance</span><span>${((user?.balance || 0) / 100).toFixed(2)}</span></div>
            </div>
            <div className="mt-4 flex items-end justify-between"><span className="pixel-label">TOTAL</span><span className="font-mono text-xl font-bold text-white">${(total / 100).toFixed(2)}</span></div>
            <button onClick={() => checkout.mutate()} disabled={checkout.isPending} className="pixel-button mt-5 flex w-full items-center justify-center gap-2 !bg-[#43b94e] px-3 py-3 text-[8px] !text-white disabled:opacity-50">
              {checkout.isPending ? "PLACING ORDER..." : <><Check className="h-3.5 w-3.5" /> CHECKOUT WITH BALANCE</>}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] leading-4 text-white/45">Final price and availability are checked securely on the server.</p>
          </aside>
        </div>
      )}
    </div>
  );
}