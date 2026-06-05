import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Trophy, Gift, Users, Zap, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicReferralData = {
  referrerName: string;
  completedCount: number;
  milestoneLevel: number;
  milestones: { count: number; label: string; reward: string; level: string }[];
};

const MILESTONE_ICONS = [Star, Trophy, Zap];
const MILESTONE_COLORS = ["text-yellow-400", "text-orange-400", "text-primary"];

export default function ReferralShare() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const code = params.code?.toUpperCase();

  const { data, isLoading, isError } = useQuery<PublicReferralData>({
    queryKey: ["referral-public", code],
    enabled: !!code,
    queryFn: async () => {
      const resp = await fetch(`/api/referral/public/${code}`);
      if (!resp.ok) throw new Error("Not found");
      return resp.json() as Promise<PublicReferralData>;
    },
  });

  const handleSignUp = () => {
    setLocation(`/sign-up?ref=${code}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-black text-sm">KF</span>
        </div>
        <span className="text-2xl font-bold tracking-tight">KlipFlow</span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {isError && (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Referral Link</h1>
          <p className="text-muted-foreground">This referral code doesn't exist or has expired.</p>
          <Button onClick={() => setLocation("/sign-up")}>Sign up without a code</Button>
        </div>
      )}

      {data && (
        <div className="w-full max-w-lg space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-2">
              <Gift className="h-4 w-4" />
              You've been invited!
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Professional<br />Video Editing,<br /><span className="text-primary">Free for a Month</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Your friend <strong className="text-foreground">{data.referrerName}</strong> is inviting you to KlipFlow — the browser-based video editor built for creators.
            </p>
          </div>

          {/* Referrer stats */}
          <Card className="p-5 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{data.referrerName}'s Referral Journey</p>
                <p className="text-xs text-muted-foreground">{data.completedCount} successful referral{data.completedCount !== 1 ? "s" : ""} so far</p>
              </div>
              {data.milestoneLevel > 0 && (
                <Badge className="ml-auto">{data.milestones.find(m => m.level === String(data.milestoneLevel))?.label ?? "Member"}</Badge>
              )}
            </div>

            {/* Milestone progress */}
            <div className="grid grid-cols-3 gap-2">
              {data.milestones.map((m, i) => {
                const reached = data.completedCount >= m.count;
                const Icon = MILESTONE_ICONS[i];
                return (
                  <div key={m.level} className={cn("p-2.5 rounded-lg border text-center transition-all", reached ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20 opacity-50")}>
                    <Icon className={cn("h-4 w-4 mx-auto mb-1", reached ? MILESTONE_COLORS[i] : "text-muted-foreground")} />
                    <p className={cn("text-xs font-semibold", reached ? MILESTONE_COLORS[i] : "text-muted-foreground")}>{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.reward}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* What you get */}
          <Card className="p-5 space-y-3">
            <p className="font-semibold text-sm">What you get when you sign up:</p>
            <ul className="space-y-2">
              {[
                "Full access to the KlipFlow video editor",
                "Import and edit video, audio, and images",
                "AI-powered auto-captions",
                "Export in HD up to 1080p",
                "Your first month of Creator free",
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* CTA */}
          <Button className="w-full h-14 text-lg font-bold gap-2 bg-primary hover:bg-primary/90" onClick={handleSignUp}>
            Claim Your Free Month
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No credit card required for free trial. Cancel anytime.
          </p>

          {/* Code display */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Using referral code</p>
            <span className="font-mono font-bold text-primary tracking-widest">{code}</span>
          </div>
        </div>
      )}
    </div>
  );
}
