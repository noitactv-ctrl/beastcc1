import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    <div className="pixel-page max-w-5xl space-y-6">
      <section className="store-card overflow-hidden">
        <div className="store-card-title flex items-center justify-between gap-3">
          <span>Cart {empty ? "(0 results)" : `(${cardItems.length + items.length} results)`}</span>
          <Link href="/cards" className="text-xs font-semibold text-[#5b5bd6] hover:underline">Continue shopping</Link>
        </div>
      {empty ? (
        <div className="p-12 text-center">
          <h2 className="text-lg font-bold text-[#555766]">Cart is empty</h2>
          <p className="mt-3 text-sm text-[#9597a4]">Choose a card and it will appear here for review.</p>
          <Link href="/cards"><span className="pixel-button mt-6 inline-flex">Browse cards</span></Link>
        </div>
      ) : (
        <div>
          <div className="border-t border-[#f0f0f4]">
            {bulkBundle && (
              <div className="border-b border-[#ececf2] p-5">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#3f4150]">20-card bulk bundle</p><button onClick={clearBulkBundle} className="text-xs font-semibold text-[#c96875] hover:underline">Remove</button></div>
                <p className="mt-2 text-xs text-[#398660]">50% discount applied</p>
              </div>
            )}
            {cardItems.map(card => (
              <article key={card.id} className="border-b border-[#ececf2]">
                <div className="store-card-title">Info</div>
                <dl className="text-sm">
                  {[
                    ["Brand", card.brand],
                    ["BIN", card.bin || "—"],
                    ["Card type", card.type || "—"],
                    ["Country", card.country || "—"],
                    ["Base", card.baseName || "—"],
                    ["Refundable", card.refundable ? "Yes" : "No"],
                  ].map(([label, value]) => <div key={label} className="grid grid-cols-[7.5rem_1fr] border-b border-[#f0f0f4] last:border-0"><dt className="border-r border-[#f0f0f4] px-5 py-3 text-[#77798a]">{label}</dt><dd className="px-5 py-3 font-semibold text-[#555766]">{value}</dd></div>)}
                </dl>
                <div className="store-card-title">Pricing</div>
                <dl className="text-sm">
                  <div className="grid grid-cols-[1fr_7.5rem] border-b border-[#f0f0f4]"><dt className="px-5 py-3 text-[#5b5bd6]">Card price</dt><dd className="border-l border-[#f0f0f4] px-5 py-3 font-semibold text-[#555766]">${(card.price / 100).toFixed(2)}</dd></div>
                  <div className="grid grid-cols-[1fr_7.5rem]"><dt className="px-5 py-3 font-bold text-[#555766]">Purchase option</dt><dd className="border-l border-[#f0f0f4] px-5 py-3 font-bold text-[#555766]">Refundable</dd></div>
                </dl>
                <div className="store-card-title">Action</div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><p className="text-sm text-[#555766]">Remove this card from your cart?</p><button onClick={() => removeCard(card.id)} className="text-sm font-semibold text-[#c96875] hover:underline">Remove card</button></div>
              </article>
            ))}
            {items.map(item => (
              <div key={item.variantId} className="border-b border-[#ececf2] p-5">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#555766]">{item.productName}</p><p className="mt-1 text-xs text-[#858896]">Qty {item.quantity} · {item.variantName}</p></div><button onClick={() => removeItem(item.variantId)} className="text-sm font-semibold text-[#c96875] hover:underline">Remove</button></div>
              </div>
            ))}
            <button onClick={clearCart} className="m-5 text-sm font-semibold text-[#858896] underline hover:text-[#5b5bd6]">Clear cart</button>
          </div>
          <div className="store-card-title">Action</div>
          <div className="p-5">
            <p className="text-center text-sm font-bold text-[#3f4150]">Your balance: <span className="text-[#c96875]">${((user?.balance || 0) / 100).toFixed(2)}</span></p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f4] pt-4 text-sm"><span className="font-semibold text-[#77798a]">Total</span><span className="text-lg font-bold text-[#3f4150]">${(total / 100).toFixed(2)}</span></div>
            <button onClick={() => checkout.mutate()} disabled={checkout.isPending} className="pixel-button mt-5 w-full disabled:opacity-50">{checkout.isPending ? "Placing order..." : "Buy card"}</button>
            <p className="mt-3 text-center text-xs leading-5 text-[#858896]">Final price and availability are checked securely on the server.</p>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}