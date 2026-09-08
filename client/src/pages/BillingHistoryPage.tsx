import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BillingSubnav } from "@/components/BillingSubnav";

export default function BillingHistoryPage() {
  const { data: transactions = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/wallet/transactions"] });
  return (
    <div className="store-page">
      <BillingSubnav />
      <div className="store-breadcrumb hidden sm:flex"><strong>Billing</strong><span>⌂</span><span>·</span><span>History</span></div>
      <section className="store-card">
        <div className="store-card-title flex items-center justify-between"><span>Histories (Last 100 records)</span><Link href="/billing"><span className="text-xs font-normal text-[#6848d8]">Deposit</span></Link></div>
        {isLoading ? <p className="p-6 text-center text-xs text-[#9a9cab]">Loading...</p> : transactions.length === 0 ? <p className="p-6 text-center text-xs text-[#9a9cab]">NOT FOUND</p> : (
          <div className="divide-y divide-[#f0f0f5]">{transactions.slice(0, 100).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-xs"><span>{item.description || item.type}</span><strong className={Number(item.amount) >= 0 ? "text-[#36ad78]" : "text-[#ed3e4d]"}>{Number(item.amount) >= 0 ? "+" : "-"}${(Math.abs(Number(item.amount)) / 100).toFixed(2)}</strong></div>)}</div>
        )}
      </section>
    </div>
  );
}