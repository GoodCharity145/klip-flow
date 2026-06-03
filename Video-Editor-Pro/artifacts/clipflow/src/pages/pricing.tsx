import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { useListPlans } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import type { Plan } from "@workspace/api-client-react";

export default function Pricing() {
  const { data: plans, isLoading } = useListPlans();
  const { isSignedIn, userId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.price === 0) {
      window.location.href = "/sign-up";
      return;
    }

    if (!isSignedIn) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: plan.name }),
      });

      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Unable to start checkout. Please try again.");
      }
    } catch {
      alert("Unable to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto">
        <div className="py-20 px-8 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8">
            <span className="font-semibold">Other Pro editors charge $7.99/mo or more.</span>
            <span className="mx-2">—</span>
            <span>We start at $2.99/mo.</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Pro editing power.<br />Without the pro price tag.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
            Choose the plan that fits your creative workflow. No hidden fees, cancel anytime.
          </p>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />
              ))}
            </div>
          ) : plans ? (
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline text-4xl font-bold">
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                      {plan.price > 0 && <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-primary shrink-0 mr-3" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {!plan.hasAIFeatures && (
                        <li className="flex items-start text-muted-foreground/50">
                          <X className="h-5 w-5 shrink-0 mr-3" />
                          <span>Advanced AI Tools</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      disabled={loadingPlan === plan.id}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : plan.price === 0 ? (
                        "Get Started Free"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div>Failed to load plans</div>
          )}

          <p className="text-sm text-muted-foreground mt-12">
            Payments powered by Stripe. Cancel anytime from your billing portal.
            {isSignedIn && (
              <button
                className="ml-2 underline hover:text-foreground transition-colors"
                onClick={async () => {
                  const resp = await fetch("/api/stripe/portal", { method: "POST" });
                  const data = await resp.json();
                  if (data.url) window.location.href = data.url;
                }}
              >
                Manage billing
              </button>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
}
