import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, useClerk, useAuth } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import Editor from "@/pages/editor";
import Pricing from "@/pages/pricing";
import Settings from "@/pages/settings";
import Account from "@/pages/account";
import Privacy from "@/pages/privacy";
import { OnboardingModal } from "@/components/onboarding-modal";
import Terms from "@/pages/terms";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ReferralShare from "@/pages/referral-share";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// Always route Clerk requests through our local proxy so auth works in every
// environment (localhost screenshot tool, Replit preview, production).
// The proxy middleware on the API server forwards to the real Clerk FAPI URL.
const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  `${window.location.origin}/api/__clerk`;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#E53535",
    colorForeground: "#fafafa",
    colorMutedForeground: "#9d9db5",
    colorDanger: "#ef4444",
    colorBackground: "#0d0d17",
    colorInput: "#1a1a2e",
    colorInputForeground: "#fafafa",
    colorNeutral: "#1a1a2e",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0d0d17] border border-[#1a1a2e] rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#fafafa]",
    headerSubtitle: "text-[#9d9db5]",
    socialButtonsBlockButtonText: "text-[#fafafa]",
    formFieldLabel: "text-[#9d9db5]",
    footerActionLink: "text-[#E53535]",
    footerActionText: "text-[#9d9db5]",
    dividerText: "text-[#9d9db5]",
    identityPreviewEditButton: "text-[#E53535]",
    formFieldSuccessText: "text-[#E53535]",
    alertText: "text-[#fafafa]",
    logoBox: "flex justify-center",
    logoImage: "h-8",
    socialButtonsBlockButton: "border-[#1a1a2e] bg-[#1a1a2e] hover:bg-[#252540]",
    formButtonPrimary: "bg-[#E53535] hover:bg-[#cc2a2a] text-white",
    formFieldInput: "bg-[#1a1a2e] border-[#252540] text-[#fafafa]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#1a1a2e]",
    alert: "bg-[#1a1a2e]",
    otpCodeFieldInput: "bg-[#1a1a2e] border-[#252540] text-[#fafafa]",
    formFieldRow: "",
    main: "",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects">
        <ProtectedRoute component={Projects} />
      </Route>
      <Route path="/editor/:id">
        <ProtectedRoute component={Editor} />
      </Route>
      <Route path="/pricing" component={Pricing} />
      <Route path="/account" component={Account} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/settings" component={Settings} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/r/:code" component={ReferralShare} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to KlipFlow",
            subtitle: "Sign in to your account to continue editing",
          },
        },
        signUp: {
          start: {
            title: "Start creating with KlipFlow",
            subtitle: "Create an account to begin your first project",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <div className="dark">
            <Router />
            <OnboardingModal />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
