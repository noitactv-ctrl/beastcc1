import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function AccountSubnav() {
  return (
    <aside className="store-mobile-subnav lg:hidden">
      {[
        ["Infomation", "/account"],
        ["Update Info", "/account/update"],
        ["Change Password", "/account/password"],
        ["Backup Code", "/account/backup"],
        ["Destroy Account", "/account/destroy"],
      ].map(([label, href]) => <Link key={href} href={href}><span className="store-subnav-item">• <span>{label}</span></span></Link>)}
    </aside>
  );
}

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
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast({ title: "Password updated" }); },
    onError: (error: any) => toast({ title: "Unable to update password", description: error.message, variant: "destructive" }),
  });
  const destroy = async () => {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    try {
      await apiRequest("DELETE", "/api/user/account", { confirmation });
      await logout();
      setLocation("/auth");
    } catch (error: any) {
      toast({ title: "Account deletion failed", description: error.message, variant: "destructive" });
    }
  };
  const path = window.location.pathname;
  const isDestroy = path.endsWith("/destroy");
  const isPassword = path.endsWith("/password") || path === "/account";
  return (
    <div className="store-page">
      <div className="store-breadcrumb hidden sm:flex"><strong>Account</strong><span>⌂</span><span>·</span><span>{isDestroy ? "Destroy Account" : isPassword ? "Change Password" : "Information"}</span></div>
      <AccountSubnav />
      <div className="grid gap-5 lg:grid-cols-[1fr_200px]">
        <section className="store-card overflow-hidden">
          {isDestroy ? (
            <>
              <div className="store-card-title">Destroy Account</div>
              <div className="space-y-4 p-4 sm:p-5">
                <p className="text-sm leading-6 text-[#7d8091]">This permanently removes your account and related records. This action cannot be undone.</p>
                <label className="block max-w-md text-xs">Type <strong>DELETE MY ACCOUNT</strong>
                  <input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="store-input mt-2" placeholder="DELETE MY ACCOUNT" />
                </label>
                <button onClick={destroy} disabled={confirmation !== "DELETE MY ACCOUNT"} className="store-button store-button-danger disabled:opacity-40">Destroy Account</button>
              </div>
            </>
          ) : isPassword ? (
            <>
              <div className="store-card-title">Password</div>
              <div className="space-y-4 p-4 sm:p-5">
                <label className="store-label">Current password:<input value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} type="password" placeholder="Enter Current Password" className="store-input mt-2" /></label>
                <label className="store-label">New password:<input value={newPassword} onChange={event => setNewPassword(event.target.value)} type="password" placeholder="Enter New Password" className="store-input mt-2" /></label>
                <label className="store-label">Confirm New password:<input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" placeholder="Enter Confirm New Password" className="store-input mt-2" /></label>
              </div>
              <div className="border-t border-[#f0f0f5] p-4 sm:p-5">
                <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword} className="store-button disabled:opacity-40">{passwordMutation.isPending ? "Submitting..." : "Submit"}</button>
              </div>
            </>
          ) : (
            <>
              <div className="store-card-title">Information</div>
              <div className="grid gap-3 p-4 text-sm sm:grid-cols-2 sm:p-5">
                <div><span className="store-muted">Username</span><p className="mt-1">{user?.username}</p></div>
                <div><span className="store-muted">Email</span><p className="mt-1">{user?.email}</p></div>
                <div><span className="store-muted">Balance</span><p className="mt-1">${((user?.balance ?? 0) / 100).toFixed(2)}</p></div>
              </div>
            </>
          )}
        </section>
      </div>
      <div className="mt-5 flex justify-end"><button onClick={() => logout()} className="text-xs text-[#6848d8] hover:underline">Sign Out</button></div>
    </div>
  );
}