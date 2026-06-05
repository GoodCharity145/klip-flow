import { Layout } from "@/components/layout";
import { ReferralCard } from "@/components/referral-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard, Crown, Zap, CheckCircle, ExternalLink, AlertCircle,
  Webhook, CheckCircle2, XCircle, Copy, Shield, FileText,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

type SubscriptionData = {
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    items: {
      data: {
        price: {
          unit_amount: number;
          product: { name: string; description: string | null };
        };
      }[];
    };
  } | null;
};

function useBillingPortal() {
  return async () => {
    const resp = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await resp.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
  };
}

function getPlanDisplay(sub: SubscriptionData["subscription"]) {
  if (!sub) return { name: "Free", tier: "free", color: "secondary" as const };
  const name = sub.items.data[0]?.price?.product?.name ?? "Paid";
  const lower = name.toLowerCase();
  if (lower.includes("pro")) return { name, tier: "pro", color: "default" as const };
  return { name, tier: "creator", color: "default" as const };
}

export default function Account() {
  const { isSignedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ["stripe-subscription"],
    queryFn: async () => {
      const resp = await fetch("/api/stripe/subscription");
      if (!resp.ok) throw new Error("Failed to fetch subscription");
      return resp.json() as Promise<SubscriptionData>;
    },
    enabled: !!isSignedIn,
  });

  const { data: webhookStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["webhook-status"],
    queryFn: async () => {
      const resp = await fetch("/api/stripe/webhook-status");
      return resp.json() as Promise<{ configured: boolean }>;
    },
  });

  const openBillingPortal = useBillingPortal();
  const plan = getPlanDisplay(data?.subscription ?? null);
  const sub = data?.subscription;

  const renewalDate = sub?.current_period_end
    ? new Date(sub.current_period_end * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const webhookUrl = `${window.location.origin}/api/stripe/webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Plan</h1>
        <p className="text-muted-foreground mb-8">Manage your subscription and billing details.</p>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {plan.tier === "pro" ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : plan.tier === "creator" ? (
                <Zap className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
              Current Plan
            </CardTitle>
            <CardDescription>Your active KlipFlow subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSignedIn ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>Sign in to view your plan.</span>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>Could not load subscription info.</span>
              </div>
            ) : (
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold">{plan.name}</span>
                    <Badge variant={sub ? "default" : "secondary"}>
                      {sub ? sub.status : "Free tier"}
                    </Badge>
                  </div>
                  {renewalDate && (
                    <p className="text-sm text-muted-foreground">Renews on {renewalDate}</p>
                  )}
                  {!sub && (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to unlock AI captions, 4K export, and more.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sub ? (
                    <Button variant="outline" className="gap-2" onClick={openBillingPortal}>
                      <ExternalLink className="h-4 w-4" />
                      Manage Billing
                    </Button>
                  ) : (
                    <Link href="/pricing">
                      <Button className="gap-2">
                        <Zap className="h-4 w-4" />
                        Upgrade Plan
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature access */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
            <CardDescription>What your plan includes</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                { label: "Timeline editor & project management", tiers: ["free", "creator", "pro"] },
                { label: "Media import (video, audio, image)", tiers: ["free", "creator", "pro"] },
                { label: "720p & 1080p export", tiers: ["free", "creator", "pro"] },
                { label: "AI auto-captions", tiers: ["creator", "pro"] },
                { label: "4K export", tiers: ["pro"] },
                { label: "Priority processing", tiers: ["pro"] },
              ].map((feature) => {
                const hasAccess = feature.tiers.includes(plan.tier);
                return (
                  <li key={feature.label} className="flex items-center gap-3">
                    <CheckCircle
                      className={`h-4 w-4 shrink-0 ${hasAccess ? "text-primary" : "text-muted-foreground/30"}`}
                    />
                    <span className={hasAccess ? "text-foreground" : "text-muted-foreground/50"}>
                      {feature.label}
                    </span>
                    {!hasAccess && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {feature.tiers.includes("creator") ? "Creator+" : "Pro"}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>

            {plan.tier !== "pro" && (
              <div className="mt-6 pt-6 border-t border-border">
                <Link href="/pricing">
                  <Button variant="outline" className="w-full gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    View all plans
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refer a Friend */}
        <ReferralCard />

        {/* Webhook Setup Guide */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Stripe Webhook Setup
            </CardTitle>
            <CardDescription>
              Required for subscriptions to activate automatically after payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {webhookStatus?.configured ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Webhook secret configured</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">
                    Webhook secret not yet set — subscriptions won't auto-activate
                  </span>
                </>
              )}
            </div>

            {!webhookStatus?.configured && (
              <Alert className="border-yellow-500/30 bg-yellow-500/5">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  Without webhooks, you must manually sync subscriptions. Follow the steps below to
                  finish setup.
                </AlertDescription>
              </Alert>
            )}

            {/* Webhook URL */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Your Webhook Endpoint URL</p>
              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border font-mono text-sm break-all">
                <span className="flex-1 text-muted-foreground">{webhookUrl}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 gap-1.5"
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Step-by-step */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Setup Steps</p>
              <ol className="space-y-3">
                {[
                  <>
                    Go to{" "}
                    <a
                      href="https://dashboard.stripe.com/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center gap-1"
                    >
                      Stripe Dashboard → Developers → Webhooks
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>,
                  <>Click <strong>"Add endpoint"</strong> and paste the URL above.</>,
                  <>
                    Under <strong>"Select events"</strong>, add these events:
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        "customer.subscription.created",
                        "customer.subscription.updated",
                        "customer.subscription.deleted",
                        "invoice.payment_succeeded",
                        "invoice.payment_failed",
                      ].map((e) => (
                        <Badge key={e} variant="secondary" className="font-mono text-xs">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </>,
                  <>
                    After saving, click <strong>"Reveal signing secret"</strong> and copy it.
                  </>,
                  <>
                    Add it as the <code className="bg-muted px-1 py-0.5 rounded text-xs">STRIPE_WEBHOOK_SECRET</code>{" "}
                    environment variable in your Replit project Secrets tab.
                  </>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="flex items-center gap-1.5 underline hover:text-foreground transition-colors">
            <Shield className="h-3.5 w-3.5" />
            Privacy Policy
          </Link>
          <span className="text-border">·</span>
          <Link href="/terms" className="flex items-center gap-1.5 underline hover:text-foreground transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </Link>
        </div>
      </div>
    </Layout>
  );
}
