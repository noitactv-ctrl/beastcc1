import { Link } from "wouter";
import { ArrowRight, CreditCard, Crown, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="pixel-page space-y-5">
      <section className="pixel-panel relative overflow-hidden bg-[#142d78] px-5 py-8 sm:px-8 sm:py-12">
        <div className="absolute -right-8 -top-12 h-44 w-44 border-[18px] border-[#ee292b]/40 bg-[#ee292b]/20 rotate-12" />
        <div className="absolute -bottom-16 right-28 h-32 w-32 border-[10px] border-[#ffe177]/30 rotate-45" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 border-[3px] border-black bg-[#ffe177] px-3 py-2 text-[8px] font-black text-[#17110a] shadow-[3px_3px_0_#050505]">
            <Sparkles className="h-3 w-3" /> PLAYER MARKET ONLINE
          </div>
          <h1 className="max-w-2xl text-2xl leading-[1.8] text-white sm:text-4xl">WELCOME TO THE BEASTCC ARCADE</h1>
          <p className="mt-5 max-w-xl font-mono text-xs leading-6 text-white/65">
            Your fast lane to verified inventory, transparent checkout, and a marketplace built like a game.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/cards"><span className="pixel-button inline-flex items-center gap-2 !bg-[#ee292b] px-4 py-3 text-[9px] !text-white">BROWSE CARDS <ArrowRight className="h-3.5 w-3.5" /></span></Link>
            <Link href="/deposit"><span className="pixel-button inline-flex items-center gap-2 !bg-[#ffe177] px-4 py-3 text-[9px]">ADD BALANCE</span></Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/cards">
          <div className="pixel-panel h-full bg-[#10215e] p-5 transition-transform hover:-translate-y-1">
            <CreditCard className="h-7 w-7 text-[#ffe177]" />
            <h2 className="mt-5 text-sm text-white">CARD MARKET</h2>
            <p className="mt-3 font-mono text-[10px] leading-5 text-white/50">Filter by base, country, brand, price, and validation rate.</p>
          </div>
        </Link>
        <Link href="/orders">
          <div className="pixel-panel h-full bg-[#10215e] p-5 transition-transform hover:-translate-y-1">
            <ReceiptText className="h-7 w-7 text-[#ee292b]" />
            <h2 className="mt-5 text-sm text-white">TRACK ORDERS</h2>
            <p className="mt-3 font-mono text-[10px] leading-5 text-white/50">Keep every purchase and delivery status in one place.</p>
          </div>
        </Link>
        <Link href="/ranks">
          <div className="pixel-panel h-full bg-[#10215e] p-5 transition-transform hover:-translate-y-1">
            <Crown className="h-7 w-7 text-[#43b94e]" />
            <h2 className="mt-5 text-sm text-white">LEVEL UP</h2>
            <p className="mt-3 font-mono text-[10px] leading-5 text-white/50">Build your rank through deposits and unlock better pricing.</p>
          </div>
        </Link>
      </section>

      <section className="pixel-panel flex flex-wrap items-center justify-between gap-4 bg-[#0b1744] p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[#43b94e]" />
          <div>
            <p className="pixel-label">ACCOUNT STATUS</p>
            <p className="mt-2 font-mono text-[10px] text-white/65">{user?.username || "PLAYER"} · secure session active</p>
          </div>
        </div>
        <Link href="/account"><span className="pixel-button inline-flex items-center gap-2 px-3 py-2 text-[8px]">ACCOUNT SETTINGS <ArrowRight className="h-3 w-3" /></span></Link>
      </section>
    </div>
  );
}