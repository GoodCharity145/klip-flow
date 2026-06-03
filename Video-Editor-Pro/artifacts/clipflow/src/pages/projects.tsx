import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useListProjects, useCreateProject, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Film, MoreVertical, Edit, Trash2, Copy, Archive, Youtube, Instagram, Music2, Monitor, Smartphone, Tv2, Square, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
type Resolution = "720p" | "1080p" | "4K";

interface PlatformPreset {
  id: string;
  label: string;
  sub: string;
  platform: string;
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  activeBg: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  badge: string;
  hint: string;
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "youtube",
    label: "YouTube",
    sub: "Standard video",
    platform: "YouTube",
    icon: Youtube,
    iconColor: "text-red-500",
    bg: "bg-red-500/5 border-red-500/20",
    activeBg: "bg-red-500/15 border-red-500",
    aspectRatio: "16:9",
    resolution: "1080p",
    badge: "16:9 · 1080p",
    hint: "Best for YouTube, Twitch, Facebook",
  },
  {
    id: "shorts",
    label: "YouTube Shorts",
    sub: "Vertical short video",
    platform: "YouTube",
    icon: Smartphone,
    iconColor: "text-red-400",
    bg: "bg-red-500/5 border-red-500/20",
    activeBg: "bg-red-500/15 border-red-500",
    aspectRatio: "9:16",
    resolution: "1080p",
    badge: "9:16 · 1080p",
    hint: "YouTube Shorts, under 60 seconds",
  },
  {
    id: "instagram-feed",
    label: "Instagram Feed",
    sub: "Square post",
    platform: "Instagram",
    icon: Instagram,
    iconColor: "text-pink-500",
    bg: "bg-pink-500/5 border-pink-500/20",
    activeBg: "bg-pink-500/15 border-pink-500",
    aspectRatio: "1:1",
    resolution: "1080p",
    badge: "1:1 · 1080p",
    hint: "Square posts perform best on IG feed",
  },
  {
    id: "instagram-reels",
    label: "Instagram Reels",
    sub: "Vertical short video",
    platform: "Instagram",
    icon: Tv2,
    iconColor: "text-purple-500",
    bg: "bg-purple-500/5 border-purple-500/20",
    activeBg: "bg-purple-500/15 border-purple-500",
    aspectRatio: "9:16",
    resolution: "1080p",
    badge: "9:16 · 1080p",
    hint: "Reels, Stories, Vertical feed",
  },
  {
    id: "tiktok",
    label: "TikTok",
    sub: "Vertical full-screen",
    platform: "TikTok",
    icon: Music2,
    iconColor: "text-cyan-400",
    bg: "bg-cyan-500/5 border-cyan-500/20",
    activeBg: "bg-cyan-500/15 border-cyan-500",
    aspectRatio: "9:16",
    resolution: "1080p",
    badge: "9:16 · 1080p",
    hint: "TikTok, Snapchat Spotlight",
  },
  {
    id: "square",
    label: "Square",
    sub: "Universal social format",
    platform: "Multi",
    icon: Square,
    iconColor: "text-muted-foreground",
    bg: "bg-muted/20 border-border",
    activeBg: "bg-primary/10 border-primary",
    aspectRatio: "1:1",
    resolution: "1080p",
    badge: "1:1 · 1080p",
    hint: "Works on all platforms",
  },
  {
    id: "landscape-hd",
    label: "Widescreen HD",
    sub: "16:9 landscape standard",
    platform: "Multi",
    icon: Monitor,
    iconColor: "text-muted-foreground",
    bg: "bg-muted/20 border-border",
    activeBg: "bg-primary/10 border-primary",
    aspectRatio: "16:9",
    resolution: "1080p",
    badge: "16:9 · 1080p",
    hint: "Universal widescreen format",
  },
  {
    id: "landscape-4k",
    label: "4K Widescreen",
    sub: "Ultra HD quality",
    platform: "Pro",
    icon: Tv2,
    iconColor: "text-primary",
    bg: "bg-primary/5 border-primary/20",
    activeBg: "bg-primary/15 border-primary",
    aspectRatio: "16:9",
    resolution: "4K",
    badge: "16:9 · 4K",
    hint: "Cinema-grade output, Pro plan",
  },
];

export default function Projects() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useListProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredProjects = projects?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
            <p className="text-muted-foreground">Manage all your video projects.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 max-w-md bg-card"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[240px] w-full rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No projects found</h3>
            {search ? (
              <p className="text-muted-foreground">Try adjusting your search query.</p>
            ) : (
              <p className="text-muted-foreground mb-6">You don't have any projects yet.</p>
            )}
            {!search && (
              <Button onClick={() => setIsCreateOpen(true)}>Create your first project</Button>
            )}
          </div>
        )}

        <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </Layout>
  );
}

function ProjectCard({ project }: { project: any }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    deleteProject.mutate({ id: project.id }, {
      onSuccess: () => {
        toast.success("Project deleted");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    });
  };

  const platformIcon = getPlatformIcon(project.aspectRatio);

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
      <div className={cn("relative overflow-hidden bg-secondary", project.aspectRatio === "9:16" ? "aspect-[9/16] max-h-48" : project.aspectRatio === "1:1" ? "aspect-square max-h-48" : "aspect-video")}>
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary gap-2">
            <Film className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 font-mono">
            {platformIcon}
            {project.aspectRatio}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-white border-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation(`/editor/${project.id}`)}>
                <Edit className="h-4 w-4 mr-2" /> Open Editor
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" onClick={() => setLocation(`/editor/${project.id}`)}>Open Editor</Button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg truncate mb-1">{project.name}</h3>
        <p className="text-sm text-muted-foreground truncate mb-4">{project.description || 'No description'}</p>
        <div className="mt-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="bg-secondary px-2 py-1 rounded-md">{project.resolution}</span>
          </div>
          <span className="text-muted-foreground">
            {project.status === 'draft' ? (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Draft</span>
            ) : project.status === 'completed' ? (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Done</span>
            ) : (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Archived</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function getPlatformIcon(aspectRatio: string) {
  if (aspectRatio === "9:16") return <Smartphone className="h-3 w-3" />;
  if (aspectRatio === "1:1") return <Square className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PlatformPreset>(PLATFORM_PRESETS[0]);
  const [resolution, setResolution] = useState<Resolution>("1080p");

  const createProject = useCreateProject();
  const [, setLocation] = useLocation();

  const handlePresetSelect = (preset: PlatformPreset) => {
    setSelectedPreset(preset);
    setResolution(preset.resolution);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({
      data: {
        name,
        aspectRatio: selectedPreset.aspectRatio,
        resolution,
      }
    }, {
      onSuccess: (data) => {
        toast.success("Project created");
        onOpenChange(false);
        setLocation(`/editor/${data.id}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Choose a platform preset — it sets the right format automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Platform preset grid */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Platform Preset</Label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORM_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "relative text-left p-3 rounded-lg border-2 transition-all",
                        isActive ? preset.activeBg : preset.bg + " hover:brightness-110"
                      )}
                    >
                      {isActive && (
                        <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
                      )}
                      <Icon className={cn("h-5 w-5 mb-1.5", preset.iconColor)} />
                      <div className="font-semibold text-xs leading-tight">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{preset.sub}</div>
                      <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 py-0">{preset.badge}</Badge>
                    </button>
                  );
                })}
              </div>
              {selectedPreset && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <span className="text-primary">→</span> {selectedPreset.hint}
                </p>
              )}
            </div>

            {/* Project name + resolution override */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Video"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select value={resolution} onValueChange={(v: Resolution) => setResolution(v)}>
                  <SelectTrigger id="resolution">
                    <SelectValue placeholder="Resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="4K">4K Ultra HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !name}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
