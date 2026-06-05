import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Youtube, Instagram, Music2, Monitor, Clock, Zap, CheckCircle2, ArrowRight, Film,
} from "lucide-react";

const STORAGE_KEY = "clipflow_onboarded";
const PLATFORM_KEY = "clipflow_platform";
const CONTENT_TYPE_KEY = "clipflow_content_type";

export type OnboardingPlatform = "youtube" | "instagram" | "tiktok" | "multiple";
export type OnboardingContentType = "short" | "long";

export function useOnboardingPrefs() {
  return {
    platform: (localStorage.getItem(PLATFORM_KEY) ?? "multiple") as OnboardingPlatform,
    contentType: (localStorage.getItem(CONTENT_TYPE_KEY) ?? "short") as OnboardingContentType,
  };
}

const PLATFORMS = [
  {
    id: "youtube" as const,
    label: "YouTube",
    sub: "Videos, Shorts, Podcasts",
    icon: Youtube,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
    activeBg: "bg-red-500/20 border-red-500",
    defaultRatio: "16:9",
    defaultLength: "long" as const,
    badge: "16:9",
  },
  {
    id: "instagram" as const,
    label: "Instagram",
    sub: "Feed, Reels, Stories",
    icon: Instagram,
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/30",
    activeBg: "bg-pink-500/20 border-pink-500",
    defaultRatio: "9:16",
    defaultLength: "short" as const,
    badge: "1:1 / 9:16",
  },
  {
    id: "tiktok" as const,
    label: "TikTok",
    sub: "Vertical short-form video",
    icon: Music2,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    activeBg: "bg-cyan-500/20 border-cyan-500",
    defaultRatio: "9:16",
    defaultLength: "short" as const,
    badge: "9:16",
  },
  {
    id: "multiple" as const,
    label: "Multiple Platforms",
    sub: "I create for several platforms",
    icon: Monitor,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    activeBg: "bg-primary/20 border-primary",
    defaultRatio: "16:9",
    defaultLength: "long" as const,
    badge: "All",
  },
];

const CONTENT_TYPES = [
  {
    id: "short" as const,
    label: "Short-form",
    sub: "Reels, Shorts, TikToks under 3 minutes",
    icon: Zap,
    tips: ["9:16 vertical", "Punchy cuts", "Auto-captions"],
  },
  {
    id: "long" as const,
    label: "Long-form",
    sub: "YouTube videos, vlogs, podcasts",
    icon: Clock,
    tips: ["16:9 widescreen", "Multiple tracks", "Chapter markers"],
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<OnboardingPlatform>("youtube");
  const [contentType, setContentType] = useState<OnboardingContentType>("short");

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)!;

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(PLATFORM_KEY, platform);
    localStorage.setItem(CONTENT_TYPE_KEY, contentType);
    setOpen(false);
  };

  const handlePlatformNext = () => {
    setContentType(selectedPlatform.defaultLength);
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleFinish(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Welcome to KlipFlow</DialogTitle>
        <DialogDescription className="sr-only">Set up your platform preferences to get started.</DialogDescription>
        {/* Step indicator */}
        <div className="flex">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 transition-colors",
                s <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Step 1 of 3</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Where do you publish?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We'll set up the right format and defaults for your workflow.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "relative text-left p-4 rounded-xl border-2 transition-all",
                      isActive ? p.activeBg : p.bg + " hover:brightness-110"
                    )}
                  >
                    {isActive && (
                      <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                    )}
                    <Icon className={cn("h-6 w-6 mb-2", p.color)} />
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.sub}</div>
                    <Badge variant="secondary" className="mt-2 text-xs">{p.badge}</Badge>
                  </button>
                );
              })}
            </div>
            <Button className="w-full gap-2" onClick={handlePlatformNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Step 2 of 3</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Content length?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This helps us set smarter timeline defaults for your projects.
            </p>
            <div className="space-y-3 mb-6">
              {CONTENT_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isActive = contentType === ct.id;
                return (
                  <button
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start",
                      isActive
                        ? "bg-primary/15 border-primary"
                        : "bg-muted/30 border-border hover:border-primary/40"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg mt-0.5", isActive ? "bg-primary/20" : "bg-muted")}>
                      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{ct.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ct.sub}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {ct.tips.map(t => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              KlipFlow is configured for{" "}
              <strong className="text-foreground">{selectedPlatform.label}</strong>{" "}
              {contentType === "short" ? "short-form" : "long-form"} content. Your new projects will use the right format automatically.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6 text-left">
              {[
                { label: "Platform", value: selectedPlatform.label },
                { label: "Format", value: contentType === "short" ? "9:16 vertical" : "16:9 wide" },
                { label: "Style", value: contentType === "short" ? "Short-form" : "Long-form" },
              ].map(item => (
                <div key={item.label} className="bg-muted/40 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-semibold text-sm mt-1">{item.value}</div>
                </div>
              ))}
            </div>

            <Button className="w-full gap-2" onClick={handleFinish}>
              <Film className="h-4 w-4" />
              Start Editing
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              You can change these anytime in Settings.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
