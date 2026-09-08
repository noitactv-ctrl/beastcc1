import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const destroy = async () => {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setPending(true);
    try {
      await apiRequest("DELETE", "/api/user/account", { confirmation });
      toast({ title: "ACCOUNT DESTROYED", description: "Your account and associated data were permanently removed." });
      await logout();
      setLocation("/auth");
    } catch (error: any) {
      toast({ title: "ACCOUNT DELETION FAILED", description: error.message, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="pixel-page max-w-3xl space-y-5">
      <div><p className="pixel-label">PLAYER PROFILE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">ACCOUNT SETTINGS</h1></div>
      <section className="pixel-panel bg-[#10215e] p-5">
        <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-[#43b94e]" /><div><p className="pixel-label">SIGNED IN AS</p><p className="mt-2 font-mono text-sm text-white">{user?.username}</p></div></div>
        <button onClick={() => logout()} className="pixel-button mt-6 inline-flex items-center gap-2 !bg-[#ffe177] px-3 py-2 text-[8px]"><LogOut className="h-3 w-3" /> LOG OUT</button>
      </section>
      <section className="pixel-panel border-[#7f1d1d] bg-[#3a1421] p-5">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff7779]" /><div><p className="pixel-label text-[#ff9b9d]">DANGER ZONE</p><h2 className="mt-3 text-sm text-white">DESTROY ACCOUNT</h2><p className="mt-3 max-w-xl font-mono text-[10px] leading-5 text-white/65">This permanently deletes your account, orders, wallet ledger, saved addresses, support records, and linked profile data. This cannot be undone.</p></div></div>
        <label className="mt-5 block max-w-md"><span className="pixel-label text-[#ff9b9d]">TYPE DELETE MY ACCOUNT</span><input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="pixel-input mt-2" placeholder="DELETE MY ACCOUNT" /></label>
        <button onClick={destroy} disabled={confirmation !== "DELETE MY ACCOUNT" || pending} className="pixel-button mt-5 !bg-[#ee292b] px-4 py-3 text-[8px] !text-white disabled:opacity-40">{pending ? "DESTROYING..." : "PERMANENTLY DESTROY ACCOUNT"}</button>
      </section>
    </div>
  );
}