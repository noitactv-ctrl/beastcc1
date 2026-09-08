import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, LogOut, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
        <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-[#43b94e]" /><div><p className="pixel-label">SIGNED IN AS</p><p className="mt-2 font-mono text-sm text-white">{user?.username}</p></div></div>
        <button onClick={() => logout()} className="pixel-button mt-5 inline-flex items-center gap-2 px-3 py-2 text-[8px]"><LogOut className="h-3 w-3" /> LOG OUT</button>
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
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff7779]" /><div><p className="pixel-label text-[#ff9b9d]">DANGER ZONE</p><h2 className="mt-3 text-sm text-white">DESTROY ACCOUNT</h2><p className="mt-3 max-w-xl font-mono text-[10px] leading-5 text-white/65">This permanently removes your account, orders, wallet ledger, support records, and linked profile data. This cannot be undone.</p></div></div>
        <input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="pixel-input mt-5 max-w-md" placeholder="TYPE DELETE MY ACCOUNT" />
        <button onClick={destroy} disabled={confirmation !== "DELETE MY ACCOUNT"} className="pixel-button mt-4 !bg-[#ee292b] px-4 py-3 text-[8px] !text-white disabled:opacity-40">PERMANENTLY DESTROY ACCOUNT</button>
      </section>
    </div>
  );
}