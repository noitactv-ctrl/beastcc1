import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function BillingHistoryPage() {
  const { data: transactions = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/wallet/transactions"] });
  return (
    <div className="pixel-page space-y-5">
      <div><p className="pixel-label">ACCOUNT FINANCE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">BILLING HISTORY</h1><p className="mt-2 text-sm text-white/45">Wallet deposits, purchases, and refunds.</p></div>
      <section className="store-card overflow-hidden">
        <div className="store-card-title">Billing</div>
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#5b5bd6]" /></div> : transactions.length === 0 ? <p className="px-5 py-14 text-center text-xs text-white/45">NO BILLING ACTIVITY YET.</p> : (
          <div>{transactions.slice(0, 100).map((transaction: any) => {
            const positive = Number(transaction.amount) >= 0;
            return <div key={transaction.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#f0f0f4] px-4 py-4 last:border-0"><div><p className="text-xs font-bold text-white">{transaction.description || transaction.type || "ACCOUNT ACTIVITY"}</p><p className="mt-1 text-[9px] text-white/45">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : ""}</p></div><span className={`font-mono text-sm font-bold ${positive ? "text-[#398660]" : "text-[#c96875]"}`}>{positive ? "+" : "-"}${(Math.abs(Number(transaction.amount)) / 100).toFixed(2)}</span></div>;
          })}</div>
        )}
      </section>
    </div>
  );
}