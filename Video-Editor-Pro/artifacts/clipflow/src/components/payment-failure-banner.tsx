import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { AlertTriangle, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

type SubscriptionStatus = string | null;

function useSubscriptionStatus(): SubscriptionStatus {
  const { isSignedIn } = useUser();
  const { data } = useQuery({
    queryKey: ["stripe-subscription"],
    enabled: !!isSignedIn,
    staleTime: 60_000,
    queryFn: async () => {
      const resp = await fetch("/api/stripe/subscription");
      if (!resp.ok) return null;
      const json = await resp.json() as { subscription?: { status?: string } | null };
      return json.subscription?.status ?? null;
    },
  });
  return data ?? null;
}

export function PaymentFailureBanner() {
  const { isSignedIn } = useUser();
  const status = useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);

  const isPastDue = status === "past_due" || status === "unpaid";

  if (!isSignedIn || !isPastDue || dismissed) return null;

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2.5 flex items-center gap-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <p className="flex-1 text-destructive font-medium">
        Your last payment failed.{" "}
        <Link
          href="/account"
          className="underline underline-offset-2 hover:text-destructive/80 transition-colors"
        >
          Update your payment method
        </Link>{" "}
        to keep your subscription active.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
