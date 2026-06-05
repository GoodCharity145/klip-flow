import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account details and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription & Storage</CardTitle>
              <CardDescription>Manage your current plan and storage usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : stats ? (
                <>
                  <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-lg">
                    <div>
                      <div className="font-semibold mb-1">Current Plan: {stats.currentPlan}</div>
                      <div className="text-sm text-muted-foreground">You are currently on the {stats.currentPlan} tier.</div>
                    </div>
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Storage Used</span>
                      <span className="font-medium">{stats.storageUsedGb}GB of {stats.storageCapacityGb}GB</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min((stats.storageUsedGb / stats.storageCapacityGb) * 100, 100)}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats.storageCapacityGb - stats.storageUsedGb}GB remaining. Upgrade your plan for more storage.
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
