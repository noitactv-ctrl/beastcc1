import { Link, useLocation } from "wouter";

export function BillingSubnav() {
  const [location] = useLocation();
  return (
    <div className="store-mobile-subnav lg:hidden">
      {[
        ["Deposit", "/billing"],
        ["History", "/billing/history"],
        ["Transactions", "/billing/transactions"],
      ].map(([label, href]) => (
        <Link key={href} href={href}>
          <span className={`store-subnav-item ${location === href ? "text-[#6545d4]" : ""}`}>• &nbsp; {label}</span>
        </Link>
      ))}
    </div>
  );
}