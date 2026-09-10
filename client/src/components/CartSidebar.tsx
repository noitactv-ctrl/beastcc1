import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShoppingCart, X, Tag, Check, Loader2 } from "lucide-react";
import { SiCashapp } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useCart, type AppliedDiscount } from "@/hooks/use-cart";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CryptoPaymentPanel, type CryptoInvoiceData } from "@/components/CryptoPaymentPanel";

type CashAppResult = {
  paymentNote: string;
  cashappTag?: string;
  cashappUrl?: string;
  total: number;
  fee?: number;
};

export function CartSidebar({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    items,
    cardItems,
    bulkBundle,
    discountInput,
    appliedDiscount,
    removeItem,
    removeCard,
    clearBulkBundle,
    clearCart,
    setDiscountInput,
    setAppliedDiscount,
    total,
  } = useCart();
  const [cashappResult, setCashappResult] = useState<CashAppResult | null>(null);
  const [cryptoInvoice, setCryptoInvoice] = useState<CryptoInvoiceData | null>(null);
  const [selectedCryptoCode, setSelectedCryptoCode] = useState("");

  const { data: paymentMethods } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/payment-methods"],
  });
  const { data: manualMethods } = useQuery<{
    cashapp: { enabled: boolean; tag: string; url: string };
  }>({
    queryKey: ["/api/site-settings/manual-payments"],
  });
  const { data: cryptoCurrencies = [] } = useQuery<Array<{ code: string; name: string; ticker: string; color: string }>>({
    queryKey: ["/api/crypto-currencies"],
  });

  useEffect(() => {
    if (!selectedCryptoCode || !cryptoCurrencies.some(currency => currency.code === selectedCryptoCode)) {
      setSelectedCryptoCode(cryptoCurrencies[0]?.code ?? "");
    }
  }, [cryptoCurrencies, selectedCryptoCode]);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
    + cardItems.length
    + (bulkBundle?.cardIds.length ?? 0);
  const productTotal = total();
  const cardSubtotal = cardItems.reduce((sum, card) => sum + card.price, 0);
  const baseTotal = productTotal + cardSubtotal + (bulkBundle?.discountedTotal ?? 0);
  const isBulk = Boolean(bulkBundle);
  const isEmpty = itemCount === 0;
  const currentDiscount = !isBulk && appliedDiscount?.baseTotal === baseTotal
    ? appliedDiscount
    : null;
  const discountAmount = currentDiscount?.discountAmount ?? 0;
  const cartTotal = Math.max(0, baseTotal - discountAmount);
  const cashappEnabled = manualMethods?.cashapp.enabled === true
    && paymentMethods?.cashapp === true
    && Boolean(manualMethods.cashapp.tag);
  const cryptoEnabled = paymentMethods?.crypto === true && cryptoCurrencies.length > 0;

  useEffect(() => {
    if (appliedDiscount && (isBulk || appliedDiscount.baseTotal !== baseTotal)) {
      setAppliedDiscount(null);
    }
  }, [appliedDiscount, baseTotal, isBulk, setAppliedDiscount]);

  const discountMutation = useMutation({
    mutationFn: async () => {
      if (isBulk) throw new Error("Bulk bundles cannot use discount codes");
      const response = await apiRequest("POST", "/api/discount/validate", {
        code: discountInput.trim(),
        cartTotal: baseTotal,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Could not apply this discount code");
      }
      return response.json() as Promise<Omit<AppliedDiscount, "baseTotal">>;
    },
    onSuccess: (discount) => {
      setAppliedDiscount({ ...discount, baseTotal });
      toast({ title: "Discount applied", description: `${discount.code} saved $${(discount.discountAmount / 100).toFixed(2)}.` });
    },
    onError: (error: Error) => {
      setAppliedDiscount(null);
      toast({ title: "Discount not applied", description: error.message, variant: "destructive" });
    },
  });

  const orderPayload = () => ({
    items: items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
    cardIds: cardItems.map(card => card.id),
    bulkCardIds: bulkBundle?.cardIds ?? [],
    discountCodeId: currentDiscount?.id ?? null,
  });

  const balanceOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        setLocation("/auth");
        throw new Error("Please sign in to checkout");
      }
      const response = await apiRequest("POST", api.orders.create.path, orderPayload());
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Order failed");
      }
      return response.json();
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/card-bases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Order placed!", description: "Your order has been placed and will be fulfilled soon." });
      onClose();
      setLocation("/orders");
    },
    onError: (error: Error) => {
      if (error.message === "Please sign in to checkout") return;
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    },
  });

  const cashappMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        setLocation("/auth");
        throw new Error("Please sign in to checkout");
      }
      const response = await apiRequest("POST", "/api/orders/cashapp", orderPayload());
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "CashApp checkout failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCashappResult({
        paymentNote: data.paymentNote,
        cashappTag: data.cashappTag,
        cashappUrl: data.cashappUrl,
        total: data.order?.total ?? 0,
        fee: data.fee,
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({ title: "CashApp order created", description: "Send the exact amount with the payment note shown." });
    },
    onError: (error: Error) => {
      if (error.message === "Please sign in to checkout") return;
      toast({ title: "CashApp checkout failed", description: error.message, variant: "destructive" });
    },
  });

  const cryptoMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        setLocation("/auth");
        throw new Error("Please sign in to checkout");
      }
      if (!selectedCryptoCode) throw new Error("Select a crypto currency");
      const response = await apiRequest("POST", "/api/orders/crypto", {
        ...orderPayload(),
        currencyCode: selectedCryptoCode,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Crypto checkout failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCryptoInvoice(data);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      if (error.message === "Please sign in to checkout") return;
      toast({ title: "Crypto checkout failed", description: error.message, variant: "destructive" });
    },
  });

  const resetPayment = () => {
    setCashappResult(null);
    setCryptoInvoice(null);
  };

  const checkoutPending = balanceOrderMutation.isPending || cashappMutation.isPending || cryptoMutation.isPending;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-[calc(100vw-16px)] max-w-[320px] flex-col border-l-[3px] border-black bg-[#14276b] text-[#fff0c5] shadow-[-5px_0_0_rgba(0,0,0,0.45)] transition-transform duration-200 lg:w-[292px] 2xl:w-[320px] ${open ? "translate-x-0" : "translate-x-full"}`}
      aria-label="Shopping cart"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b-[3px] border-black bg-[#162d78] px-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-3.5 w-3.5 text-[#ffe177]" />
          <h2 className="pixel-text text-[10px] text-white">YOUR CART</h2>
        </div>
        <button onClick={onClose} className="p-1 text-[#b9cfff] transition-colors hover:text-white" aria-label="Close cart panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#14276b] p-2">
        {cryptoInvoice ? (
          <CryptoPaymentPanel
            invoice={cryptoInvoice}
            coinName={cryptoCurrencies.find(currency => currency.code === cryptoInvoice.currency)?.name}
            coinTicker={cryptoCurrencies.find(currency => currency.code === cryptoInvoice.currency)?.ticker}
            coinColor={cryptoCurrencies.find(currency => currency.code === cryptoInvoice.currency)?.color}
            onReset={resetPayment}
            onPaymentComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            }}
          />
        ) : cashappResult ? (
          <div className="space-y-3 border-[3px] border-black bg-[#0c174b] p-3">
            <div className="flex items-center gap-2 text-[#72df7c]">
              <Check className="h-4 w-4" />
              <p className="pixel-text text-[9px]">ORDER READY</p>
            </div>
            <p className="font-mono text-[10px] text-white/70">Send the exact amount below, then include the payment note.</p>
            <div className="space-y-2 border-2 border-black bg-[#10215e] p-3 font-mono text-[10px]">
              <p className="flex justify-between gap-2"><span className="text-white/50">Amount</span><strong className="text-[#ffe177]">${(cashappResult.total / 100).toFixed(2)}</strong></p>
              {cashappResult.fee ? <p className="text-right text-[9px] text-white/45">Includes ${(cashappResult.fee / 100).toFixed(2)} processing fee</p> : null}
              <p className="flex justify-between gap-2"><span className="text-white/50">Note</span><strong className="text-white">{cashappResult.paymentNote}</strong></p>
              {cashappResult.cashappTag && <p className="flex justify-between gap-2"><span className="text-white/50">Send to</span><strong className="text-[#72df7c]">{cashappResult.cashappTag}</strong></p>}
            </div>
            {cashappResult.cashappUrl && (
              <a href={cashappResult.cashappUrl} target="_blank" rel="noreferrer" className="block border-2 border-black bg-[#43b94e] py-2 text-center pixel-text text-[8px] text-white">
                OPEN CASHAPP
              </a>
            )}
            <button onClick={resetPayment} className="w-full font-mono text-[10px] text-white/45 hover:text-white">Close</button>
          </div>
        ) : isEmpty ? (
          <div className="border-[3px] border-black bg-[#0c174b] px-3 py-4 text-center">
            <p className="font-mono text-[10px] text-[#b9cfff]">Your cart is empty.</p>
          </div>
        ) : (
          <div className="border-[3px] border-black bg-[#0c174b]">
            {bulkBundle && (
              <div className="flex items-start gap-2 border-b-2 border-black px-2.5 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center border-2 border-black bg-[#ee292b]"><ShoppingCart className="h-3.5 w-3.5 text-white" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-white">20-CARD BULK BUNDLE</p>
                  <p className="mt-1 font-mono text-[9px] text-[#72df7c]">${(bulkBundle.discountedTotal / 100).toFixed(2)} · 50% OFF</p>
                </div>
                <button onClick={clearBulkBundle} className="shrink-0 p-1 text-[#b9cfff] hover:text-white" aria-label="Remove bulk bundle"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            {cardItems.map(card => (
              <div key={`card-${card.id}`} className="flex items-center gap-2 border-b-2 border-black px-2.5 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center border-2 border-black bg-[#1d3d93]"><span className="text-[8px] font-bold text-[#ffe177]">{card.brand || "CARD"}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{card.bin || "CARD"}</p><p className="mt-1 font-mono text-[9px] text-[#b9cfff]">${(card.price / 100).toFixed(2)}</p></div>
                <button onClick={() => removeCard(card.id)} className="shrink-0 p-1 text-[#b9cfff] hover:text-white" aria-label={`Remove ${card.bin || "card"}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {items.map(item => (
              <div key={`item-${item.variantId}`} className="flex items-center gap-2 border-b-2 border-black px-2.5 py-3 last:border-b-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center border-2 border-black bg-[#1d3d93]"><span className="text-[11px] font-bold text-[#ffe177]">{item.productName?.charAt(0) || "?"}</span></div>
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{item.productName}</p><p className="mt-1 font-mono text-[9px] text-[#b9cfff]">Qty {item.quantity} · ${(item.price * item.quantity / 100).toFixed(2)}</p></div>
                <button onClick={() => removeItem(item.variantId)} className="shrink-0 p-1 text-[#b9cfff] hover:text-white" aria-label={`Remove ${item.productName}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!cryptoInvoice && !cashappResult && (
        <div className="shrink-0 space-y-2 border-t-[3px] border-black bg-[#10215e] p-2.5">
          {!isEmpty && (
            <div className="border-b-2 border-black/50 pb-2">
              <div className="mb-1 flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-[#ffe177]" />
                <p className="pixel-label">DISCOUNT CODE</p>
              </div>
              {isBulk ? (
                <p className="font-mono text-[9px] text-[#b9cfff]">Bulk bundles already receive 50% off and cannot use coupons.</p>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    value={discountInput}
                    onChange={event => setDiscountInput(event.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    disabled={checkoutPending || discountMutation.isPending}
                    className="pixel-input h-8 min-w-0 flex-1 px-2 font-mono text-[10px]"
                    data-testid="input-cart-discount-code"
                  />
                  {currentDiscount ? (
                    <button onClick={() => { setDiscountInput(""); setAppliedDiscount(null); }} className="border-2 border-black bg-[#a7a4aa] px-2 pixel-text text-[8px] text-[#17110a]" data-testid="button-remove-discount">REMOVE</button>
                  ) : (
                    <button onClick={() => discountMutation.mutate()} disabled={!discountInput.trim() || discountMutation.isPending} className="border-2 border-black bg-[#5f90ef] px-2 pixel-text text-[8px] text-white disabled:opacity-45" data-testid="button-apply-discount">
                      {discountMutation.isPending ? "..." : "APPLY"}
                    </button>
                  )}
                </div>
              )}
              {currentDiscount && <p className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[#72df7c]"><Check className="h-3 w-3" /> {currentDiscount.code} · -${(discountAmount / 100).toFixed(2)}</p>}
            </div>
          )}
          <div className="flex items-end justify-between border-b-2 border-black/50 pb-2">
            <div>
              <p className="pixel-label">TOTAL</p>
              <p className="mt-1 font-mono text-[9px] text-[#aabbe9]">Balance: ${((user?.balance ?? 0) / 100).toFixed(2)}</p>
            </div>
            <div className="text-right">
              {discountAmount > 0 && <p className="font-mono text-[9px] text-white/45 line-through">${(baseTotal / 100).toFixed(2)}</p>}
              <p className="font-mono text-sm font-bold text-white">${(cartTotal / 100).toFixed(2)}</p>
            </div>
          </div>

          <button onClick={clearCart} disabled={isEmpty || checkoutPending} className="w-full border-[2px] border-black bg-[#a7a4aa] py-2 pixel-text text-[8px] text-[#17110a] disabled:cursor-not-allowed disabled:opacity-45">▪ Clear cart</button>
          <button onClick={() => balanceOrderMutation.mutate()} disabled={isEmpty || checkoutPending} className="w-full border-[2px] border-black bg-[#43b94e] py-2.5 pixel-text text-[8px] text-white shadow-[2px_2px_0_#07130a] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-cart-balance-checkout">
            {balanceOrderMutation.isPending ? "▪ Placing order..." : "▪ Checkout with Balance"}
          </button>
          {cashappEnabled && (
            <button onClick={() => cashappMutation.mutate()} disabled={isEmpty || checkoutPending} className="flex w-full items-center justify-center gap-2 border-[2px] border-black bg-[#00d632] py-2.5 pixel-text text-[8px] text-[#061306] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-cart-cashapp-checkout">
              <SiCashapp className="h-3.5 w-3.5" /> {cashappMutation.isPending ? "CREATING..." : "CHECKOUT WITH CASHAPP"}
            </button>
          )}
          {cryptoEnabled && (
            <div className="space-y-1.5">
              <select value={selectedCryptoCode} onChange={event => setSelectedCryptoCode(event.target.value)} disabled={checkoutPending} className="pixel-input h-8 w-full px-2 font-mono text-[10px]">
                {cryptoCurrencies.map(currency => <option key={currency.code} value={currency.code}>{currency.ticker} · {currency.name}</option>)}
              </select>
              <button onClick={() => cryptoMutation.mutate()} disabled={isEmpty || checkoutPending || !selectedCryptoCode} className="w-full border-[2px] border-black bg-[#6d1ed4] py-2.5 pixel-text text-[8px] text-white disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-cart-crypto-checkout">
                {cryptoMutation.isPending ? "CREATING INVOICE..." : "CHECKOUT WITH CRYPTO"}
              </button>
            </div>
          )}
          {checkoutPending && <p className="flex items-center justify-center gap-1 font-mono text-[9px] text-white/50"><Loader2 className="h-3 w-3 animate-spin" /> Recalculating securely...</p>}
        </div>
      )}
    </aside>
  );
}