import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";

export default function BillingHistoryPage() {
  const { data: transactions = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/wallet/transactions"] });
  return (
    <div className="pixel-page space-y-5">
      <div><p className="pixel-label">ACCOUNT FINANCE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">BILLING HISTORY</h1></div>
      <section className="pixel-panel overflow-hidden bg-[#10215e]">
        <div className="flex items-center gap-2 border-b-[3px] border-black bg-[#1d3d93] px-4 py-3"><CreditCard className="h-4 w-4 text-[#ffe177]" /><p className="pixel-label text-white">LEDGER</p></div>
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#ffe177]" /></div> : transactions.length === 0 ? <p className="px-5 py-14 text-center font-mono text-xs text-white/45">NO BILLING ACTIVITY YET.</p> : (
          <div>{transactions.slice(0, 100).map((transaction: any) => {
            const positive = Number(transaction.amount) >= 0;
            return <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/50 px-4 py-4"><div><p className="text-xs font-bold text-white">{transaction.description || transaction.type || "ACCOUNT ACTIVITY"}</p><p className="mt-1 font-mono text-[9px] text-white/45">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : ""}</p></div><span className={`font-mono text-sm font-bold ${positive ? "text-[#43b94e]" : "text-[#ff6b6d]"}`}>{positive ? "+" : "-"}${(Math.abs(Number(transaction.amount)) / 100).toFixed(2)}</span></div>;
          })}</div>
        )}
      </section>
    </div>
  );
}