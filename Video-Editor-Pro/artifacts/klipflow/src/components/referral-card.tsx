import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Gift, Copy, Check, Users, Link2, Trophy, Star, Sparkles, Infinity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type MilestoneInfo = { count: number; label: string; reward: string; level: string };
type ReferralData = {
  code: string;
  link: string;
  completedCount: number;
  milestoneLevel: number;
  milestones: MilestoneInfo[];
};

const MILESTONE_ICONS = [Star, Trophy, Infinity];
const MILESTONE_COLORS = [
  "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  "text-orange-400 border-orange-400/30 bg-orange-400/5",
  "text-primary border-primary/30 bg-primary/5",
];

export function ReferralCard() {
  const { isSignedIn } = useAuth();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["referral-code"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const resp = await fetch("/api/referral/code");
      if (!resp.ok) throw new Error("Failed");
      return resp.json() as Promise<ReferralData>;
    },
  });

  const copy = (type: "link" | "code") => {
    const text = type === "link" ? data?.link : data?.code;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      toast({ title: "Copied!", description: type === "link" ? "Referral link copied." : "Code copied." });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (!isSignedIn) return null;

  const count = data?.completedCount ?? 0;
  const milestones = data?.milestones ?? [];
  const currentMilestoneLevel = data?.milestoneLevel ?? 0;

  // Progress to next milestone
  const nextMilestone = milestones.find((m) => count < m.count);
  const prevMilestoneCount = nextMilestone
    ? (milestones.find((m) => m.count < nextMilestone.count)?.count ?? 0)
    : (milestones[milestones.length - 1]?.count ?? 10);
  const progressPct = nextMilestone
    ? Math.min(100, ((count - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100)
    : 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Refer a Friend
        </CardTitle>
        <CardDescription>
          Each friend who subscribes earns you <strong className="text-foreground">1 month free</strong> — hit milestones for bigger rewards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Progress bar + count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {isLoading ? "—" : count} referral{count !== 1 ? "s" : ""} completed
              </span>
            </div>
            {nextMilestone ? (
              <span className="text-xs text-muted-foreground">
                {nextMilestone.count - count} more to <span className="text-foreground font-medium">{nextMilestone.label}</span>
              </span>
            ) : (
              <Badge variant="default" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" /> Legend status
              </Badge>
            )}
          </div>

          {/* Progress track */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${isLoading ? 0 : progressPct}%` }}
            />
          </div>

          {/* Milestone markers */}
          <div className="grid grid-cols-3 gap-2">
            {milestones.map((m, i) => {
              const reached = count >= m.count;
              const Icon = MILESTONE_ICONS[i];
              const colors = MILESTONE_COLORS[i];
              return (
                <div
                  key={m.level}
                  className={cn(
                    "rounded-lg border p-3 space-y-1 transition-all",
                    reached ? colors : "border-border bg-muted/20 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", reached ? colors.split(" ")[0] : "text-muted-foreground")} />
                    <span className={cn("text-xs font-semibold", reached ? colors.split(" ")[0] : "text-muted-foreground")}>
                      {m.label}
                    </span>
                    {reached && currentMilestoneLevel >= Number(m.level) && (
                      <Check className="h-3 w-3 ml-auto text-green-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">{m.count} referrals → {m.reward}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral link */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Your referral link
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={isLoading ? "Loading…" : (data?.link ?? "")}
              className="font-mono text-sm bg-muted/40 text-muted-foreground"
            />
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => copy("link")} disabled={isLoading}>
              {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "link" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Code */}
        <div>
          <p className="text-sm font-medium mb-2">Or share your code directly</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 rounded-lg bg-muted/40 border border-border text-center">
              <span className="font-mono font-bold text-lg tracking-widest text-primary">
                {isLoading ? "——" : (data?.code ?? "")}
              </span>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => copy("code")} disabled={isLoading}>
              {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "code" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Friends use your link or code at sign-up. Rewards are applied to your next billing cycle automatically.
        </p>
      </CardContent>
    </Card>
  );
}
