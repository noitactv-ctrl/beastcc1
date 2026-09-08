import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: transactions = [] } = useQuery<any[]>({ queryKey: ["/api/wallet/transactions"] });
  const spentCents = transactions.filter((transaction: any) => transaction.type === "purchase" && Number(transaction.amount) < 0).reduce((total: number, transaction: any) => total + Math.abs(Number(transaction.amount) || 0), 0);
  const depositedCents = transactions.filter((transaction: any) => ["deposit", "manual_deposit"].includes(transaction.type) && Number(transaction.amount) > 0).reduce((total: number, transaction: any) => total + (Number(transaction.amount) || 0), 0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const passwordMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/user/password", { currentPassword, newPassword }),
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast({ title: "PASSWORD UPDATED" }); },
    onError: (error: any) => toast({ title: "PASSWORD UPDATE FAILED", description: error.message, variant: "destructive" }),
  });
  const destroy = async () => {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    try {
      await apiRequest("DELETE", "/api/user/account", { confirmation });
      await logout();
      setLocation("/auth");
    } catch (error: any) {
      toast({ title: "ACCOUNT DELETION FAILED", description: error.message, variant: "destructive" });
    }
  };
  return (
    <div className="pixel-page space-y-5">
      <div><p className="pixel-label">PLAYER PROFILE</p><h1 className="mt-3 text-xl text-white sm:text-2xl">ACCOUNT</h1></div>
      <section className="pixel-panel bg-[#10215e] p-5">
        <div><p className="pixel-label">SIGNED IN AS</p><p className="mt-2 text-base font-bold text-white">{user?.username}</p></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#ececf2] bg-[#fafaff] p-4"><p className="text-xs font-semibold text-[#77798a]">Total spent</p><p className="mt-2 text-xl font-bold text-[#363847]">${(spentCents / 100).toFixed(2)}</p></div>
          <div className="rounded-md border border-[#ececf2] bg-[#fafaff] p-4"><p className="text-xs font-semibold text-[#77798a]">Total deposited</p><p className="mt-2 text-xl font-bold text-[#363847]">${(depositedCents / 100).toFixed(2)}</p></div>
        </div>
        <button onClick={() => logout()} className="pixel-button mt-5 inline-flex px-4 py-2">Log out</button>
      </section>
      <section className="pixel-panel bg-[#10215e] p-5">
        <p className="pixel-label">CHANGE PASSWORD</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} type="password" className="pixel-input" placeholder="Current password" />
          <input value={newPassword} onChange={event => setNewPassword(event.target.value)} type="password" className="pixel-input" placeholder="New password" />
          <input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" className="pixel-input" placeholder="Confirm new password" />
        </div>
        <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword} className="pixel-button mt-4 px-4 py-3 text-[8px] disabled:opacity-40">{passwordMutation.isPending ? "UPDATING..." : "UPDATE PASSWORD"}</button>
      </section>
      <section className="pixel-panel border-[#7f1d1d] bg-[#3a1421] p-5">
        <div><p className="pixel-label text-[#ff9b9d]">DANGER ZONE</p><h2 className="mt-3 text-sm text-white">DESTROY ACCOUNT</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">This permanently removes your account, orders, wallet ledger, support records, and linked profile data. This cannot be undone.</p></div>
        <input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="pixel-input mt-5 max-w-md" placeholder="TYPE DELETE MY ACCOUNT" />
        <button onClick={destroy} disabled={confirmation !== "DELETE MY ACCOUNT"} className="pixel-button mt-4 !bg-[#ee292b] px-4 py-3 text-[8px] !text-white disabled:opacity-40">PERMANENTLY DESTROY ACCOUNT</button>
      </section>
    </div>
  );
}