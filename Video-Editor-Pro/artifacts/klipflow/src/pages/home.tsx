import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Video, HardDrive, Clock, Film } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: projects, isLoading: projectsLoading } = useListProjects({ limit: 4 });

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back. Here's what's happening with your projects.</p>
            </div>
            <Button onClick={() => setLocation("/projects?new=true")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={stats?.totalProjects}
              icon={Film}
              isLoading={statsLoading}
            />
            <StatsCard
              title="Total Clips"
              value={stats?.totalClips}
              icon={Video}
              isLoading={statsLoading}
            />
            <StatsCard
              title="Editing Hours"
              value={stats?.totalEditingHours}
              icon={Clock}
              isLoading={statsLoading}
            />
            <StatsCard
              title="Storage Used"
              value={stats ? `${stats.storageUsedGb}GB / ${stats.storageCapacityGb}GB` : undefined}
              icon={HardDrive}
              isLoading={statsLoading}
              progress={stats ? (stats.storageUsedGb / stats.storageCapacityGb) * 100 : 0}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
              <Button variant="outline" onClick={() => setLocation("/projects")}>View All</Button>
            </div>

            {projectsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {projects.slice(0, 4).map((project) => (
                  <Link key={project.id} href={`/editor/${project.id}`}>
                    <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
                      <div className="aspect-video bg-muted relative">
                        {project.thumbnailUrl ? (
                          <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <Film className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary">Open Editor</Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{project.description || 'No description'}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-secondary px-2 py-1 rounded-md">{project.resolution}</span>
                          <span>•</span>
                          <span>{project.clipCount} clips</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first video project to get started.</p>
                <Button onClick={() => setLocation("/projects?new=true")}>Create Project</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatsCard({ title, value, icon: Icon, isLoading, progress }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {progress !== undefined && !isLoading && (
          <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
