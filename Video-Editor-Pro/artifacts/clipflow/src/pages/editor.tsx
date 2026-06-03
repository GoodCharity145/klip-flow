import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetProject, useListClips, useCreateClip, useUpdateClip, useDeleteClip,
  useGenerateCaptions, getGetProjectQueryKey, getListClipsQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Play, Pause, SkipBack, SkipForward, Undo, Redo, Download,
  Type, Image as ImageIcon, Music, Video, Plus,
  Scissors, Trash2, Maximize2, ZoomIn, ZoomOut, MousePointer2,
  Loader2, Sparkles, Upload, FileVideo, FileAudio, FileImage,
  Sliders, Zap, CropIcon, ArrowLeftRight, Sun, Contrast, Droplets,
  Gauge, MonitorSmartphone, Smartphone, Square, Monitor, Copy,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  FlipHorizontal2, FlipVertical2, RotateCw, Mic2, Volume2, VolumeX,
  Thermometer, Eye, Focus, Wand2, Smile, Music2, Layers,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoveHorizontal, Tv2
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FILTER_PRESETS = [
  { id: "vivid",    label: "Vivid",    swatch: "linear-gradient(135deg,#f59e0b,#ef4444)",   preset: { brightness: 110, contrast: 115, saturation: 140 } },
  { id: "fade",     label: "Fade",     swatch: "linear-gradient(135deg,#e2e8f0,#94a3b8)",   preset: { brightness: 112, contrast: 78,  saturation: 65  } },
  { id: "film",     label: "Film",     swatch: "linear-gradient(135deg,#78350f,#44403c)",   preset: { brightness: 95,  contrast: 120, saturation: 85  } },
  { id: "noir",     label: "B&W",      swatch: "linear-gradient(135deg,#18181b,#a1a1aa)",   preset: { brightness: 90,  contrast: 130, saturation: 0   } },
  { id: "warm",     label: "Warm",     swatch: "linear-gradient(135deg,#fb923c,#facc15)",   preset: { brightness: 105, contrast: 100, saturation: 115, temperature: 25 } },
  { id: "cool",     label: "Cool",     swatch: "linear-gradient(135deg,#38bdf8,#818cf8)",   preset: { brightness: 100, contrast: 105, saturation: 90,  temperature: -25 } },
  { id: "dramatic", label: "Dramatic", swatch: "linear-gradient(135deg,#1c1917,#7f1d1d)",   preset: { brightness: 82,  contrast: 145, saturation: 110, vignette: 55 } },
  { id: "vintage",  label: "Vintage",  swatch: "linear-gradient(135deg,#b45309,#d97706)",   preset: { brightness: 100, contrast: 92,  saturation: 68,  temperature: 18 } },
  { id: "dreamy",   label: "Dreamy",   swatch: "linear-gradient(135deg,#f9a8d4,#c084fc)",   preset: { brightness: 118, contrast: 82,  saturation: 78  } },
  { id: "neon",     label: "Neon",     swatch: "linear-gradient(135deg,#10b981,#8b5cf6)",   preset: { brightness: 108, contrast: 125, saturation: 185 } },
  { id: "matte",    label: "Matte",    swatch: "linear-gradient(135deg,#78716c,#57534e)",   preset: { brightness: 112, contrast: 88,  saturation: 88  } },
  { id: "cinema",   label: "Cinema",   swatch: "linear-gradient(135deg,#1e3a5f,#0f172a)",   preset: { brightness: 88,  contrast: 118, saturation: 82,  vignette: 42 } },
];

const TEXT_PRESETS = [
  { label: "Big Title",   style: { fontSize: 72, bold: true,  color: "#ffffff", align: "center", position: "mc", fontFamily: "Impact" } },
  { label: "Subtitle",    style: { fontSize: 42, bold: false, color: "#ffffff", align: "center", position: "bc", fontFamily: "Inter"  } },
  { label: "Caption",     style: { fontSize: 32, bold: true,  color: "#ffffff", align: "center", position: "bc", bgColor: "rgba(0,0,0,0.65)", fontFamily: "Inter" } },
  { label: "Label",       style: { fontSize: 24, bold: true,  color: "#ff3535", align: "left",   position: "tl", fontFamily: "Inter"  } },
  { label: "Neon",        style: { fontSize: 56, bold: true,  color: "#00fff5", align: "center", position: "mc", fontFamily: "Impact", glow: true } },
  { label: "Minimal",     style: { fontSize: 30, bold: false, color: "#e2e8f0", align: "center", position: "bc", fontFamily: "Inter"  } },
  { label: "Cinematic",   style: { fontSize: 38, bold: true,  color: "#ffffff", align: "center", position: "mc", fontFamily: "Georgia", letterSpacing: "0.15em" } },
  { label: "Highlight",   style: { fontSize: 36, bold: true,  color: "#000000", align: "center", position: "bc", bgColor: "#facc15", fontFamily: "Inter" } },
];

const STICKERS = [
  "🔥","💯","🎉","✨","🎯","🚀","⭐","💡",
  "🎵","🎮","💎","🌊","🌟","🏆","🦋","🎨",
  "🔮","💫","🌈","❤️","👑","💪","🎤","🎬",
  "🌙","☀️","⚡","🎭","🦁","🐉","👾","🎪",
  "🍕","😂","🤣","😍","🥳","🤯","😎","🤩",
];

const TRANSITIONS_LIST = [
  { id: "none",       label: "None",       icon: "—"  },
  { id: "fade",       label: "Fade",       icon: "🌫"  },
  { id: "dissolve",   label: "Dissolve",   icon: "💧" },
  { id: "slide-left", label: "Slide ←",   icon: "⬅"  },
  { id: "slide-right",label: "Slide →",   icon: "➡"  },
  { id: "zoom-in",    label: "Zoom In",    icon: "🔍" },
  { id: "zoom-out",   label: "Zoom Out",   icon: "🔎" },
  { id: "wipe",       label: "Wipe",       icon: "🪣" },
  { id: "flash",      label: "Flash",      icon: "⚡" },
];

const TEXT_ANIMATIONS = [
  { id: "none",       label: "None"       },
  { id: "fade",       label: "Fade In"    },
  { id: "slide-up",   label: "Slide Up"   },
  { id: "slide-left", label: "Slide Left" },
  { id: "typewriter", label: "Typewriter" },
  { id: "bounce",     label: "Bounce"     },
  { id: "zoom",       label: "Zoom In"    },
];

const FONT_FAMILIES = [
  "Inter", "Impact", "Georgia", "Arial", "Courier New", "Times New Roman", "Verdana", "Trebuchet MS",
];

const TTS_VOICES = [
  { id: "alloy",   label: "Alloy",   desc: "Neutral"    },
  { id: "echo",    label: "Echo",    desc: "Male"       },
  { id: "fable",   label: "Fable",   desc: "British"    },
  { id: "onyx",    label: "Onyx",    desc: "Deep"       },
  { id: "nova",    label: "Nova",    desc: "Female"     },
  { id: "shimmer", label: "Shimmer", desc: "Soft"       },
];

const ASPECT_RATIO_CSS: Record<string, string> = {
  "16:9": "16/9", "9:16": "9/16", "1:1": "1/1", "4:3": "4/3",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseEffect(effects: string[] | null | undefined, key: string, def: number): number {
  const entry = effects?.find(e => e.startsWith(`${key}:`));
  return entry ? parseFloat(entry.split(":")[1]) : def;
}
function setEffectVal(effects: string[] | null | undefined, key: string, val: number | string): string[] {
  return [...(effects ?? []).filter(e => !e.startsWith(`${key}:`)), `${key}:${val}`];
}
function effectEnabled(effects: string[] | null | undefined, key: string): boolean {
  return (effects ?? []).some(e => e === `${key}:1` || e === `${key}:true`);
}
function clipCssFilter(effects: string[] | null | undefined): string {
  const b = parseEffect(effects, "brightness", 100);
  const c = parseEffect(effects, "contrast", 100);
  const s = parseEffect(effects, "saturation", 100);
  if (b === 100 && c === 100 && s === 100) return "none";
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
}
function clipCssTransform(effects: string[] | null | undefined): string {
  const parts: string[] = [];
  if (effectEnabled(effects, "flip-h")) parts.push("scaleX(-1)");
  if (effectEnabled(effects, "flip-v")) parts.push("scaleY(-1)");
  const rot = parseEffect(effects, "rotate", 0);
  if (rot) parts.push(`rotate(${rot}deg)`);
  return parts.join(" ") || "none";
}
function textPositionStyle(pos: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    tl: { top: "8%",    left: "5%",   transform: "none",             alignItems: "flex-start",  justifyContent: "flex-start" },
    tc: { top: "8%",    left: "50%",  transform: "translateX(-50%)", alignItems: "flex-start",  justifyContent: "center" },
    tr: { top: "8%",    right: "5%",  transform: "none",             alignItems: "flex-start",  justifyContent: "flex-end" },
    ml: { top: "50%",   left: "5%",   transform: "translateY(-50%)", alignItems: "center",      justifyContent: "flex-start" },
    mc: { top: "50%",   left: "50%",  transform: "translate(-50%,-50%)", alignItems: "center", justifyContent: "center" },
    mr: { top: "50%",   right: "5%",  transform: "translateY(-50%)", alignItems: "center",      justifyContent: "flex-end" },
    bl: { bottom: "8%", left: "5%",   transform: "none",             alignItems: "flex-end",    justifyContent: "flex-start" },
    bc: { bottom: "8%", left: "50%",  transform: "translateX(-50%)", alignItems: "flex-end",    justifyContent: "center" },
    br: { bottom: "8%", right: "5%",  transform: "none",             alignItems: "flex-end",    justifyContent: "flex-end" },
  };
  return map[pos] ?? map.bc;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
type UploadedMedia = { id: string; name: string; type: "video"|"audio"|"image"; objectPath: string; size: number };
type ClipSnap = { id: number; name: string; type: string; startTime: number; duration: number; trackIndex: number; sourceUrl?: string|null; volume?: number|null; opacity?: number|null; effects?: string[]|null; textContent?: string|null; textStyle?: unknown; transition?: string|null };
function getMediaType(ct: string): "video"|"audio"|"image" {
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  return "image";
}

export default function Editor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, { query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } });
  const { data: clips, isLoading: clipsLoading } = useListClips(projectId, { query: { enabled: !!projectId, queryKey: getListClipsQueryKey(projectId) } });

  const createClip = useCreateClip();
  const updateClip = useUpdateClip();
  const deleteClip = useDeleteClip();
  const generateCaptions = useGenerateCaptions();

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Trim drag
  const [trimDrag, setTrimDrag] = useState<{ clipId: number; edge: "left"|"right"; startX: number; origStart: number; origDuration: number } | null>(null);
  const [localClipOverrides, setLocalClipOverrides] = useState<Record<number, { startTime?: number; duration?: number }>>({});

  // Clip body drag (move clip left/right in timeline)
  const [clipDrag, setClipDrag] = useState<{ clipId: number; startX: number; origStartTime: number; duration: number; trackIndex: number } | null>(null);
  // Snap indicator — time position of active magnetic snap (null = no snap)
  const [snapIndicatorTime, setSnapIndicatorTime] = useState<number | null>(null);
  // Playhead scrub
  const [playheadDragging, setPlayheadDragging] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Undo / Redo history stacks (full clip snapshots)
  const [undoStack, setUndoStack] = useState<ClipSnap[][]>([]);
  const [redoStack, setRedoStack] = useState<ClipSnap[][]>([]);

  // Media library
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("");
  const [exportStatus, setExportStatus] = useState<"idle"|"running"|"done"|"error">("idle");
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);

  // Upgrade
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // TTS
  const [ttsDialogOpen, setTtsDialogOpen] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("nova");
  const [ttsGenerating, setTtsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 80) + 10);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("POST", "/api/storage/uploads/direct");
        xhr.send(form);
      });
      setUploadProgress(95);
      const result = JSON.parse(xhr.responseText) as { objectPath: string; sourceUrl: string; metadata: { name: string; size: number; contentType: string } };
      const mediaType = getMediaType(result.metadata.contentType);
      setUploadedMedia(prev => [{ id: result.objectPath, name: result.metadata.name, type: mediaType, objectPath: result.objectPath, size: result.metadata.size }, ...prev]);
      setUploadProgress(100);
      toast.success(`"${result.metadata.name}" uploaded — click it below to add to timeline`);
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedClip = useMemo(() => clips?.find(c => c.id === selectedClipId), [clips, selectedClipId]);
  const totalDuration = project?.duration || 60;
  const PPS = 20 * zoomLevel;

  // Memoize track grouping — avoids rebuilding on every currentTime change
  const tracks = useMemo(() => [0, 1, 2, 3, 4, 5].map(i => ({
    id: i,
    name: i === 0 ? "Video 1" : i === 1 ? "Overlay 1" : i === 2 ? "Audio 1" : i === 3 ? "Audio 2" : `Caption ${i - 2}`,
    clips: clips?.filter(c => c.trackIndex === i) || [],
  })), [clips]);

  // All snap points: 0, end, every clip's start+end — precomputed for mouse handler
  const snapPoints = useMemo(() => {
    const pts = new Set<number>([0, totalDuration]);
    (clips ?? []).forEach(c => { pts.add(c.startTime); pts.add(c.startTime + c.duration); });
    return [...pts];
  }, [clips, totalDuration]);

  // Playback loop
  useEffect(() => {
    let id: number;
    let last = performance.now();
    const loop = (t: number) => {
      if (isPlaying) {
        const delta = (t - last) / 1000;
        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= totalDuration) { setIsPlaying(false); return totalDuration; }
          return next;
        });
      }
      last = t;
      id = requestAnimationFrame(loop);
    };
    if (isPlaying) id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, totalDuration]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60), s = Math.floor(t % 60), f = Math.floor((t % 1) * 30);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}:${String(f).padStart(2,"0")}`;
  };

  const applyEffectPreset = (preset: Record<string, number>) => {
    if (!selectedClip) return;
    let efx = [...(selectedClip.effects ?? [])];
    Object.entries(preset).forEach(([k, v]) => { efx = setEffectVal(efx, k, v); });
    handleUpdateSelectedClip({ effects: efx });
  };

  // ─── History helpers ────────────────────────────────────────────────────────
  const snapClips = (): ClipSnap[] => (clips ?? []).map(c => ({
    id: c.id, name: c.name, type: c.type, startTime: c.startTime, duration: c.duration,
    trackIndex: c.trackIndex, sourceUrl: c.sourceUrl, volume: c.volume, opacity: c.opacity,
    effects: c.effects, textContent: c.textContent, textStyle: c.textStyle, transition: c.transition,
  }));

  const pushUndo = () => {
    setUndoStack(prev => [...prev.slice(-30), snapClips()]);
    setRedoStack([]);
  };

  const applySnapshot = async (snap: ClipSnap[]) => {
    const current = clips ?? [];
    const currentMap = new Map(current.map(c => [c.id, c]));
    const snapMap = new Map(snap.map(c => [c.id, c]));
    // Delete clips not in snapshot
    const delOps: Promise<unknown>[] = [];
    for (const c of current) {
      if (!snapMap.has(c.id)) delOps.push(deleteClip.mutateAsync({ id: projectId, clipId: c.id } as any));
    }
    await Promise.all(delOps);
    // Update / recreate clips
    const ops: Promise<unknown>[] = [];
    for (const s of snap) {
      if (currentMap.has(s.id)) {
        ops.push(updateClip.mutateAsync({ id: projectId, clipId: s.id, data: {
          startTime: s.startTime, duration: s.duration, trackIndex: s.trackIndex,
          volume: s.volume ?? 1, opacity: s.opacity ?? 1, effects: s.effects ?? [],
        }} as any));
      } else {
        const { id: _id, ...data } = s;
        ops.push(createClip.mutateAsync({ id: projectId, data } as any));
      }
    }
    await Promise.all(ops);
    await queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) });
  };

  const handleUndo = async () => {
    if (!undoStack.length) { toast("Nothing to undo"); return; }
    const prev = undoStack.at(-1)!;
    setRedoStack(r => [...r.slice(-30), snapClips()]);
    setUndoStack(u => u.slice(0, -1));
    await applySnapshot(prev);
  };

  const handleRedo = async () => {
    if (!redoStack.length) { toast("Nothing to redo"); return; }
    const next = redoStack.at(-1)!;
    setUndoStack(u => [...u.slice(-30), snapClips()]);
    setRedoStack(r => r.slice(0, -1));
    await applySnapshot(next);
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleUpdateSelectedClip = (updates: Record<string, unknown>) => {
    if (!selectedClipId) return;
    updateClip.mutate({ id: projectId, clipId: selectedClipId, data: updates } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }),
    });
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    pushUndo();
    deleteClip.mutate({ id: projectId, clipId: selectedClipId } as any, {
      onSuccess: () => { setSelectedClipId(null); queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }); toast.success("Clip removed"); },
    });
  };

  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    createClip.mutate({ id: projectId, data: {
      name: `${selectedClip.name} (copy)`,
      type: selectedClip.type as any,
      trackIndex: selectedClip.trackIndex,
      startTime: selectedClip.startTime + selectedClip.duration,
      duration: selectedClip.duration,
      sourceUrl: selectedClip.sourceUrl ?? undefined,
      textContent: selectedClip.textContent ?? undefined,
      textStyle: (selectedClip.textStyle && typeof selectedClip.textStyle === "object") ? selectedClip.textStyle as any : {},
      effects: selectedClip.effects ?? [],
      opacity: selectedClip.opacity ?? 1,
      volume: selectedClip.volume ?? 1,
    }} as any, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }); toast.success("Clip duplicated"); },
    });
  };

  const handleSplitAtPlayhead = () => {
    // Prefer the selected clip if the playhead is inside it; otherwise find any clip at playhead
    const allAtPlayhead = (clips ?? []).filter(c =>
      currentTime > c.startTime + 0.05 && currentTime < c.startTime + c.duration - 0.05
    );
    const clip = allAtPlayhead.find(c => c.id === selectedClipId) ?? allAtPlayhead[0];
    if (!clip) { toast.error("Position the playhead inside a clip to split it"); return; }

    const leftDur  = currentTime - clip.startTime;
    const rightDur = clip.duration - leftDur;
    if (leftDur < 0.05 || rightDur < 0.05) { toast.error("Too close to the clip edge to split"); return; }

    pushUndo();
    updateClip.mutate({ id: projectId, clipId: clip.id, data: { duration: leftDur } } as any, {
      onSuccess: () => {
        createClip.mutate({ id: projectId, data: {
          name: clip.name,
          type: clip.type as any,
          trackIndex: clip.trackIndex,
          startTime: currentTime,
          duration: rightDur,
          sourceUrl: clip.sourceUrl ?? undefined,
          textContent: clip.textContent ?? undefined,
          textStyle: (clip.textStyle && typeof clip.textStyle === "object") ? clip.textStyle as any : {},
          effects: clip.effects ?? [],
          opacity: clip.opacity ?? 1,
          volume: clip.volume ?? 1,
        }} as any, {
          onSuccess: (newClip: { id: number }) => {
            queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) });
            setSelectedClipId(newClip.id);  // auto-select the right half
            toast.success("Clip split — right half selected");
          },
        });
      },
    });
  };

  const addClipToTimeline = (data: Record<string, unknown>) => {
    pushUndo();
    createClip.mutate({ id: projectId, data } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }),
    });
  };

  const handleAddTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    const existingMax = clips ? Math.max(-1, ...clips.map(c => c.trackIndex)) : -1;
    addClipToTimeline({
      name: preset.label, type: "text", trackIndex: existingMax + 1,
      startTime: currentTime, duration: 5,
      textContent: preset.label.toUpperCase(), textStyle: preset.style,
      effects: [], opacity: 1, volume: 1,
    });
    toast.success(`Added "${preset.label}" text`);
  };

  const handleAddSticker = (emoji: string) => {
    const existingMax = clips ? Math.max(-1, ...clips.map(c => c.trackIndex)) : -1;
    addClipToTimeline({
      name: `Sticker ${emoji}`, type: "text", trackIndex: existingMax + 1,
      startTime: currentTime, duration: 4,
      textContent: emoji, textStyle: { fontSize: 80, align: "center", position: "mc" },
      effects: [], opacity: 1, volume: 1,
    });
  };

  const handleAddUploadedMedia = (media: UploadedMedia) => {
    const trackOrder = ["video", "image", "audio"];
    const trackIdx = trackOrder.indexOf(media.type);
    const resolved = trackIdx >= 0 ? trackIdx : 0;
    const onTrack = clips?.filter(c => c.trackIndex === resolved) ?? [];
    const startTime = onTrack.length > 0 ? Math.max(...onTrack.map(c => c.startTime + c.duration)) : 0;
    addClipToTimeline({ name: media.name, type: media.type, trackIndex: resolved, startTime, duration: 10, sourceUrl: `/api/storage${media.objectPath}` });
    toast.success(`Added "${media.name}" to timeline`);
  };

  const handleGenerateCaptions = () => {
    if (!project) return;
    generateCaptions.mutate({ data: { projectId: project.id, projectName: project.name, projectDescription: project.description ?? undefined, totalDuration: project.duration || 60, clipSummary: clips?.map(c => `${c.type}: ${c.name}`).join(", ") } }, {
      onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }); toast.success(`Generated ${result.createdClips.length} captions`); },
      onError: (err: unknown) => {
        const msg = (err as any)?.response?.data?.error;
        if (msg?.includes("Creator") || msg?.includes("Pro")) { setUpgradeMessage(msg); setUpgradeDialogOpen(true); }
        else toast.error("Failed to generate captions.");
      },
    });
  };

  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) return;
    setTtsGenerating(true);
    try {
      const resp = await fetch("/api/openai/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ttsText, voice: ttsVoice }) });
      if (resp.status === 402) { const d = await resp.json() as { error?: string }; setTtsGenerating(false); setTtsDialogOpen(false); setUpgradeMessage(d.error ?? "Upgrade required"); setUpgradeDialogOpen(true); return; }
      if (!resp.ok) { const d = await resp.json() as { error?: string }; throw new Error(d.error ?? "TTS failed"); }
      const { objectPath, duration: ttsDur } = await resp.json() as { objectPath: string; duration: number };
      const audioClips = clips?.filter(c => c.type === "audio") ?? [];
      const startTime = audioClips.length > 0 ? Math.max(...audioClips.map(c => c.startTime + c.duration)) : 0;
      addClipToTimeline({ name: `Voiceover (${ttsVoice})`, type: "audio", trackIndex: 2, startTime, duration: ttsDur || 5, sourceUrl: `/api/storage${objectPath}` });
      toast.success("AI voiceover added to timeline");
      setTtsDialogOpen(false); setTtsText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate voiceover");
    } finally { setTtsGenerating(false); }
  };

  const handleTrimMouseDown = (e: React.MouseEvent, clipId: number, edge: "left"|"right", origStart: number, origDuration: number) => {
    e.stopPropagation(); e.preventDefault();
    setTrimDrag({ clipId, edge, startX: e.clientX, origStart, origDuration });
  };

  // RAF throttle ref for mouse move — caps handler at ~60fps regardless of mousemove rate
  const mmRAFRef = useRef<number | null>(null);

  // Unified timeline mouse handlers (trim + clip drag + playhead scrub)
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    // Throttle to one update per animation frame
    if (mmRAFRef.current !== null) return;
    const clientX = e.clientX;
    mmRAFRef.current = requestAnimationFrame(() => { mmRAFRef.current = null; });

    if (trimDrag) {
      const delta = (clientX - trimDrag.startX) / PPS;
      if (trimDrag.edge === "left") {
        const ns = Math.max(0, trimDrag.origStart + delta);
        const nd = Math.max(0.5, trimDrag.origDuration - (ns - trimDrag.origStart));
        setLocalClipOverrides(p => ({ ...p, [trimDrag.clipId]: { startTime: ns, duration: nd } }));
      } else {
        setLocalClipOverrides(p => ({ ...p, [trimDrag.clipId]: { duration: Math.max(0.5, trimDrag.origDuration + delta) } }));
      }
    }
    if (clipDrag) {
      const rawStart = Math.max(0, clipDrag.origStartTime + (clientX - clipDrag.startX) / PPS);
      const dur = clipDrag.duration;
      const GLOBAL_T = 10 / PPS;    // global snap threshold
      const TRACK_T  = 18 / PPS;    // same-track snap gets extra range (magnetic)

      // Build same-track snap points (higher priority, wider magnet)
      const trackPts = (clips ?? [])
        .filter(c => c.trackIndex === clipDrag.trackIndex && c.id !== clipDrag.clipId)
        .flatMap(c => {
          const s = localClipOverrides[c.id]?.startTime ?? c.startTime;
          const d = localClipOverrides[c.id]?.duration  ?? c.duration;
          return [s, s + d];
        });
      trackPts.push(0, currentTime); // also magnetic to playhead & start

      // Try snapping LEFT edge, then RIGHT edge (to fill gaps perfectly)
      let snapTarget: number | null = null;
      let indicatorTime: number | null = null;

      // 1. Same-track left edge
      const tLeft = trackPts.reduce((b, sp) => Math.abs(sp - rawStart) < Math.abs(b - rawStart) ? sp : b, rawStart);
      if (Math.abs(tLeft - rawStart) < TRACK_T) { snapTarget = tLeft; indicatorTime = tLeft; }

      // 2. Same-track right edge → compute where left should land
      if (snapTarget === null) {
        const rawRight = rawStart + dur;
        const tRight = trackPts.reduce((b, sp) => Math.abs(sp - rawRight) < Math.abs(b - rawRight) ? sp : b, rawRight);
        if (Math.abs(tRight - rawRight) < TRACK_T) { snapTarget = Math.max(0, tRight - dur); indicatorTime = tRight; }
      }

      // 3. Global snap points (narrower threshold)
      if (snapTarget === null) {
        const gLeft = snapPoints.find(sp => sp !== clipDrag.origStartTime && Math.abs(sp - rawStart) < GLOBAL_T);
        if (gLeft !== undefined) { snapTarget = gLeft; indicatorTime = gLeft; }
      }
      if (snapTarget === null) {
        const rawRight = rawStart + dur;
        const gRight = snapPoints.find(sp => Math.abs(sp - rawRight) < GLOBAL_T);
        if (gRight !== undefined) { snapTarget = Math.max(0, gRight - dur); indicatorTime = gRight; }
      }

      setSnapIndicatorTime(indicatorTime);
      setLocalClipOverrides(prev => ({ ...prev, [clipDrag.clipId]: { startTime: snapTarget ?? rawStart } }));
    }
    if (playheadDragging && timelineScrollRef.current) {
      const rect = timelineScrollRef.current.getBoundingClientRect();
      const x = clientX - rect.left + timelineScrollRef.current.scrollLeft;
      const rawTime = Math.max(0, Math.min(totalDuration, x / PPS));
      // Snap playhead to clip boundaries within 10px
      const SNAP_T = 10 / PPS;
      const nearest = snapPoints.reduce((best, sp) => Math.abs(sp - rawTime) < Math.abs(best - rawTime) ? sp : best, rawTime);
      setCurrentTime(Math.abs(nearest - rawTime) < SNAP_T ? nearest : rawTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimDrag, clipDrag, playheadDragging, PPS, totalDuration, snapPoints]);

  const handleTimelineMouseUp = useCallback(() => {
    if (trimDrag) {
      const ov = localClipOverrides[trimDrag.clipId];
      if (ov) {
        pushUndo();
        updateClip.mutate({ id: projectId, clipId: trimDrag.clipId, data: {
          ...(ov.startTime != null ? { startTime: ov.startTime } : {}),
          ...(ov.duration != null ? { duration: ov.duration } : {}),
        }} as any, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }),
          onError: () => setLocalClipOverrides(p => { const n = { ...p }; delete n[trimDrag.clipId]; return n; }),
        });
      }
      setTrimDrag(null);
    }
    if (clipDrag) {
      const ov = localClipOverrides[clipDrag.clipId];
      if (ov?.startTime != null && Math.abs(ov.startTime - clipDrag.origStartTime) > 0.05) {
        pushUndo();
        updateClip.mutate({ id: projectId, clipId: clipDrag.clipId, data: { startTime: ov.startTime }} as any, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) }),
        });
      }
      setClipDrag(null);
      setLocalClipOverrides(p => { const n = { ...p }; delete n[clipDrag.clipId]; return n; });
    }
    setPlayheadDragging(false);
    setSnapIndicatorTime(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimDrag, clipDrag, projectId, PPS]);

  const getClipColor = (type: string) => {
    switch (type) {
      case "video":  return "bg-blue-500/80 border-blue-400 text-blue-100";
      case "audio":  return "bg-green-500/80 border-green-400 text-green-100";
      case "text":   return "bg-yellow-500/80 border-yellow-400 text-yellow-100";
      case "image":  return "bg-purple-500/80 border-purple-400 text-purple-100";
      default:       return "bg-gray-500/80 border-gray-400 text-gray-100";
    }
  };

  // Refs so keyboard handler always has latest functions (avoids stale closures)
  const undoRef = useRef(handleUndo); undoRef.current = handleUndo;
  const redoRef = useRef(handleRedo); redoRef.current = handleRedo;
  const deleteClipRef = useRef(handleDeleteClip); deleteClipRef.current = handleDeleteClip;
  const splitRef = useRef(handleSplitAtPlayhead); splitRef.current = handleSplitAtPlayhead;
  const selectedClipIdRef = useRef(selectedClipId); selectedClipIdRef.current = selectedClipId;
  const totalDurationRef = useRef(totalDuration); totalDurationRef.current = totalDuration;

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) return;
      if (e.code === "Space") { e.preventDefault(); setIsPlaying(p => !p); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedClipIdRef.current) { e.preventDefault(); deleteClipRef.current(); }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); void undoRef.current(); }
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); void redoRef.current(); }
      if (e.key === "s" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); splitRef.current(); }
      if (e.key === "Escape") setSelectedClipId(null);
      if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setCurrentTime(t => Math.max(0, t - (e.shiftKey ? 1 : 1 / 30))); }
      if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setCurrentTime(t => Math.min(totalDurationRef.current, t + (e.shiftKey ? 1 : 1 / 30))); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // empty deps — uses refs above

  if (projectLoading || clipsLoading) return <div className="h-screen flex items-center justify-center bg-background"><Skeleton className="w-16 h-16 rounded-full" /></div>;
  if (!project) return <div className="h-screen flex items-center justify-center">Project not found</div>;

  // ---- Text style helpers ----
  const ts = (selectedClip?.textStyle ?? {}) as Record<string, unknown>;
  const setTs = (updates: Record<string, unknown>) => handleUpdateSelectedClip({ textStyle: { ...ts, ...updates } });

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* ── Header ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")}><SkipBack className="h-4 w-4" /></Button>
          <div>
            <span className="font-semibold text-sm">{project.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{project.resolution} · {project.aspectRatio}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" title="Undo (Ctrl+Z)" onClick={() => { void handleUndo(); }} disabled={!undoStack.length}><Undo className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" title="Redo (Ctrl+Y)" onClick={() => { void handleRedo(); }} disabled={!redoStack.length}><Redo className="h-4 w-4" /></Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleSplitAtPlayhead}>
            <Scissors className="h-3.5 w-3.5" /> Split
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleDuplicateClip} disabled={!selectedClipId}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs" onClick={handleGenerateCaptions} disabled={generateCaptions.isPending}>
            {generateCaptions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Captions
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs" onClick={() => setTtsDialogOpen(true)}>
            <Mic2 className="h-3.5 w-3.5" /> AI Voice
          </Button>
          {exportDownloadUrl && exportStatus === "done" ? (
            <a href={exportDownloadUrl} download="klipflow-export.mp4" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs"><Download className="h-3.5 w-3.5" /> Download</Button>
            </a>
          ) : (
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs" disabled={exportStatus === "running"} onClick={async () => {
              setExportDownloadUrl(null); setExportProgress(0); setExportMessage("Starting…"); setExportStatus("running"); setExportDialogOpen(true);
              try {
                const r = await fetch(`/api/projects/${projectId}/export`, { method: "POST", headers: { "Content-Type": "application/json" } });
                if (r.status === 402) { const d = await r.json() as { error?: string }; setExportStatus("idle"); setExportDialogOpen(false); setUpgradeMessage(d.error ?? ""); setUpgradeDialogOpen(true); return; }
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const { jobId } = await r.json() as { jobId: string };
                const es = new EventSource(`/api/projects/${projectId}/export/${jobId}/progress`);
                es.onmessage = (ev) => {
                  const d = JSON.parse(ev.data) as { status: string; progress: number; message: string; downloadUrl?: string; error?: string };
                  setExportProgress(d.progress ?? 0); setExportMessage(d.message ?? "");
                  if (d.status === "done") { setExportStatus("done"); setExportDownloadUrl(d.downloadUrl ?? null); es.close(); }
                  else if (d.status === "error") { setExportStatus("error"); setExportMessage(d.error ?? "Export failed"); es.close(); toast.error(d.error ?? "Export failed"); }
                };
                es.onerror = () => { setExportStatus("error"); setExportMessage("Connection lost."); es.close(); };
              } catch (err) { const m = err instanceof Error ? err.message : "Export failed"; setExportStatus("error"); setExportMessage(m); toast.error(m); }
            }}>
              {exportStatus === "running" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting…</> : <><Download className="h-3.5 w-3.5" /> Export</>}
            </Button>
          )}
        </div>
      </header>

      {/* ── Workspace ── */}
      <main className="flex-1 flex overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="w-72 border-r border-border bg-card flex flex-col shrink-0">
          <Tabs defaultValue="media" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 p-0 grid grid-cols-6">
              {[
                { value: "media", icon: <FileVideo className="h-3.5 w-3.5" />, tip: "Media" },
                { value: "text",  icon: <Type className="h-3.5 w-3.5" />,      tip: "Text"  },
                { value: "stickers", icon: <Smile className="h-3.5 w-3.5" />,  tip: "Stickers" },
                { value: "filters", icon: <Wand2 className="h-3.5 w-3.5" />,   tip: "Filters" },
                { value: "trans", icon: <Layers className="h-3.5 w-3.5" />,    tip: "FX" },
                { value: "audio", icon: <Mic2 className="h-3.5 w-3.5" />,      tip: "Audio" },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value} className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent p-0 flex-col gap-0.5 text-[9px] h-full">
                  {t.icon}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Media Tab */}
            <TabsContent value="media" className="flex-1 m-0 p-0 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border space-y-2">
                <input ref={fileInputRef} type="file" accept="video/*,audio/*,image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ""; await uploadFile(f); }} />
                <Button className="w-full gap-2 text-xs" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {uploadProgress}%</> : <><Upload className="h-3.5 w-3.5" /> Import Media</>}
                </Button>
                {isUploading && <div className="w-full bg-secondary rounded-full h-1"><div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {uploadedMedia.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Files</p>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedMedia.map(m => (
                          <div key={m.id} className="group relative aspect-video bg-secondary rounded-md border border-primary/30 overflow-hidden cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center" onClick={() => handleAddUploadedMedia(m)}>
                            {m.type === "video" && <FileVideo className="h-5 w-5 text-primary mb-1" />}
                            {m.type === "image" && <FileImage className="h-5 w-5 text-primary mb-1" />}
                            {m.type === "audio" && <FileAudio className="h-5 w-5 text-primary mb-1" />}
                            <span className="text-[10px] text-muted-foreground truncate w-full px-1 text-center">{m.name}</span>
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus className="h-5 w-5 text-primary" /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center pt-4">Import video, audio, or image files to get started.</p>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="flex-1 m-0 p-3 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Text Presets</p>
                  {TEXT_PRESETS.map(preset => (
                    <button key={preset.label} onClick={() => handleAddTextPreset(preset)} className="w-full text-left p-3 rounded-lg border border-border bg-secondary/40 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                      <div className="flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        <span className="text-sm font-medium">{preset.label}</span>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Stickers Tab */}
            <TabsContent value="stickers" className="flex-1 m-0 p-3 overflow-hidden">
              <ScrollArea className="h-full">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stickers & Emoji</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STICKERS.map(emoji => (
                    <button key={emoji} onClick={() => handleAddSticker(emoji)} className="aspect-square text-2xl flex items-center justify-center rounded-lg border border-border bg-secondary/40 hover:border-primary/50 hover:bg-primary/5 hover:scale-110 transition-all">
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="flex-1 m-0 p-3 overflow-hidden">
              <ScrollArea className="h-full">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cinematic Filters</p>
                {!selectedClipId && <p className="text-xs text-muted-foreground mb-3">Select a clip to apply a filter</p>}
                <div className="grid grid-cols-3 gap-2">
                  {FILTER_PRESETS.map(f => (
                    <button key={f.id} onClick={() => applyEffectPreset(f.preset)} disabled={!selectedClipId} className="flex flex-col items-center gap-1.5 group disabled:opacity-40 disabled:cursor-not-allowed">
                      <div className="w-full aspect-video rounded-md border border-border group-hover:border-primary transition-colors overflow-hidden" style={{ background: f.swatch }} />
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{f.label}</span>
                    </button>
                  ))}
                </div>
                {selectedClipId && (
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => handleUpdateSelectedClip({ effects: [] })}>Reset Filter</Button>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Transitions Tab */}
            <TabsContent value="trans" className="flex-1 m-0 p-3 overflow-hidden">
              <ScrollArea className="h-full">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transitions</p>
                {!selectedClipId && <p className="text-xs text-muted-foreground mb-3">Select a clip to apply a transition</p>}
                <div className="grid grid-cols-3 gap-2">
                  {TRANSITIONS_LIST.map(t => {
                    const active = selectedClip?.transition === t.id || (!selectedClip?.transition && t.id === "none");
                    return (
                      <button key={t.id} disabled={!selectedClipId} onClick={() => handleUpdateSelectedClip({ transition: t.id })} className={cn("flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 hover:border-primary/50")}>
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio" className="flex-1 m-0 p-3 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Voiceover</p>
                    <Button className="w-full gap-2 text-xs" variant="outline" onClick={() => setTtsDialogOpen(true)}>
                      <Mic2 className="h-3.5 w-3.5 text-purple-400" /> Generate AI Voice
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-2">Type any text → AI reads it aloud in your chosen voice.</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Audio Tools</p>
                    <p className="text-xs text-muted-foreground">Select an audio clip in the timeline, then adjust volume and fades in the Properties panel →</p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── Center Preview ── */}
        <section className="flex-1 flex flex-col bg-background/50 relative">
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
            <div className="relative bg-black shadow-2xl ring-1 ring-border rounded-lg overflow-hidden group"
              style={{ aspectRatio: ASPECT_RATIO_CSS[project?.aspectRatio ?? "16:9"] ?? "16/9", maxHeight: "calc(100% - 0px)", maxWidth: "100%" }}>
              <PreviewCanvas clips={clips ?? []} currentTime={currentTime} isPlaying={isPlaying} />
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10" onClick={() => setIsPlaying(!isPlaying)}>
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg">
                    <Play className="h-7 w-7 ml-1" />
                  </div>
                </div>
              )}
              <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded text-xs font-mono text-white/90 z-10 pointer-events-none">{formatTime(currentTime)}</div>
            </div>
          </div>
          <div className="h-14 border-t border-border flex items-center justify-center gap-3 bg-card px-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)}><SkipBack className="h-4 w-4" /></Button>
            <Button variant={isPlaying ? "secondary" : "default"} size="icon" className="h-10 w-10 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentTime(totalDuration)}><SkipForward className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <div className="text-sm font-mono min-w-[110px] text-center">{formatTime(currentTime)} <span className="text-muted-foreground">/ {formatTime(totalDuration)}</span></div>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="ghost" size="icon"><Maximize2 className="h-4 w-4" /></Button>
          </div>
        </section>

        {/* ── Right Panel — Properties ── */}
        <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0">
          <div className="h-10 border-b border-border flex items-center px-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Properties</div>
          <ScrollArea className="flex-1">
            {selectedClip ? (
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate max-w-[180px]">{selectedClip.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">{selectedClip.type}</Badge>
                </div>

                {/* ── TEXT INSPECTOR ── */}
                {selectedClip.type === "text" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Content</Label>
                      <Textarea rows={3} value={selectedClip.textContent || ""} className="text-sm resize-none" onChange={e => handleUpdateSelectedClip({ textContent: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Font Family</Label>
                      <Select value={(ts.fontFamily as string) || "Inter"} onValueChange={v => setTs({ fontFamily: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{FONT_FAMILIES.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Size</Label><span className="text-xs text-muted-foreground">{(ts.fontSize as number) || 48}px</span></div>
                      <Slider value={[(ts.fontSize as number) || 48]} min={12} max={120} step={2} onValueChange={([v]) => setTs({ fontSize: v })} />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setTs({ bold: !(ts.bold) })} className={cn("flex-1 h-8 rounded border text-xs font-bold transition-colors", ts.bold ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40")}><Bold className="h-3.5 w-3.5 mx-auto" /></button>
                      <button onClick={() => setTs({ italic: !(ts.italic) })} className={cn("flex-1 h-8 rounded border text-xs italic transition-colors", ts.italic ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40")}><Italic className="h-3.5 w-3.5 mx-auto" /></button>
                      <button onClick={() => setTs({ underline: !(ts.underline) })} className={cn("flex-1 h-8 rounded border text-xs transition-colors", ts.underline ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40")}><Underline className="h-3.5 w-3.5 mx-auto" /></button>
                    </div>

                    <div className="flex gap-1.5">
                      {["left","center","right"].map((a, i) => {
                        const Icon = [AlignLeft, AlignCenter, AlignRight][i];
                        return <button key={a} onClick={() => setTs({ align: a })} className={cn("flex-1 h-8 rounded border transition-colors", ts.align === a ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40")}><Icon className="h-3.5 w-3.5 mx-auto" /></button>;
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={(ts.color as string) || "#ffffff"} onChange={e => setTs({ color: e.target.value })} className="h-8 w-10 rounded cursor-pointer bg-transparent border border-border" />
                          <span className="text-xs font-mono text-muted-foreground">{(ts.color as string) || "#ffffff"}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Background</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={(ts.bgColor as string)?.slice(0,7) || "#000000"} onChange={e => setTs({ bgColor: e.target.value + "aa" })} className="h-8 w-10 rounded cursor-pointer bg-transparent border border-border" />
                          <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={() => setTs({ bgColor: undefined })}>Clear</Button>
                        </div>
                      </div>
                    </div>

                    {/* Position grid */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Position</Label>
                      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                        {["tl","tc","tr","ml","mc","mr","bl","bc","br"].map(pos => (
                          <button key={pos} onClick={() => setTs({ position: pos })} className={cn("w-9 h-9 rounded border transition-colors text-[10px]", ts.position === pos ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>
                            {pos === "tl" && <ChevronUp className="h-3 w-3 mx-auto rotate-[-45deg]" />}
                            {pos === "tc" && <ChevronUp className="h-3 w-3 mx-auto" />}
                            {pos === "tr" && <ChevronUp className="h-3 w-3 mx-auto rotate-45" />}
                            {pos === "ml" && <ChevronLeft className="h-3 w-3 mx-auto" />}
                            {pos === "mc" && <div className="w-2 h-2 rounded-full bg-current mx-auto" />}
                            {pos === "mr" && <ChevronRight className="h-3 w-3 mx-auto" />}
                            {pos === "bl" && <ChevronDown className="h-3 w-3 mx-auto rotate-45" />}
                            {pos === "bc" && <ChevronDown className="h-3 w-3 mx-auto" />}
                            {pos === "br" && <ChevronDown className="h-3 w-3 mx-auto rotate-[-45deg]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Animation */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Animation</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TEXT_ANIMATIONS.map(a => (
                          <button key={a.id} onClick={() => setTs({ animation: a.id })} className={cn("text-xs py-1.5 px-2 rounded border transition-colors", ts.animation === a.id || (!ts.animation && a.id === "none") ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>{a.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIDEO / IMAGE INSPECTOR ── */}
                {["video","image"].includes(selectedClip.type) && (
                  <div className="space-y-4">
                    {/* Speed presets */}
                    {selectedClip.type === "video" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Speed</Label>
                        <div className="grid grid-cols-4 gap-1">
                          {[25,50,100,150,200,400].map(s => {
                            const active = parseEffect(selectedClip.effects, "speed", 100) === s;
                            return <button key={s} onClick={() => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects, "speed", s) })} className={cn("text-[10px] py-1 rounded border", active ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>{s/100}x</button>;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Flip & Rotate */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transform</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: "Flip H", icon: <FlipHorizontal2 className="h-3.5 w-3.5" />, key: "flip-h" },
                          { label: "Flip V", icon: <FlipVertical2 className="h-3.5 w-3.5" />,   key: "flip-v" },
                          { label: "90°",   icon: <RotateCw className="h-3.5 w-3.5" />,          key: "r90" },
                          { label: "180°",  icon: <RotateCw className="h-3.5 w-3.5 opacity-60" />, key: "r180" },
                        ].map(t => {
                          const active = t.key === "r90" ? parseEffect(selectedClip.effects,"rotate",0) === 90 :
                                         t.key === "r180" ? parseEffect(selectedClip.effects,"rotate",0) === 180 :
                                         effectEnabled(selectedClip.effects, t.key);
                          return (
                            <button key={t.key} onClick={() => {
                              if (t.key === "r90") handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects, "rotate", active ? 0 : 90) });
                              else if (t.key === "r180") handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects, "rotate", active ? 0 : 180) });
                              else handleUpdateSelectedClip({ effects: active ? (selectedClip.effects ?? []).filter(e => !e.startsWith(`${t.key}:`)) : setEffectVal(selectedClip.effects,"flip-h"===t.key?"flip-h":"flip-v",1) });
                            }} className={cn("flex flex-col items-center gap-1 py-2 rounded border text-[10px]", active ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>
                              {t.icon}{t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Color grading */}
                    <div className="space-y-3">
                      <Label className="text-xs">Color Grading</Label>
                      {[
                        { key: "brightness", label: "Brightness", icon: Sun, min: 0, max: 200, def: 100, unit: "%" },
                        { key: "contrast",   label: "Contrast",   icon: Contrast, min: 0, max: 200, def: 100, unit: "%" },
                        { key: "saturation", label: "Saturation", icon: Droplets, min: 0, max: 200, def: 100, unit: "%" },
                        { key: "temperature",label: "Temp",       icon: Thermometer, min: -100, max: 100, def: 0, unit: "" },
                        { key: "vignette",   label: "Vignette",   icon: Eye, min: 0, max: 100, def: 0, unit: "" },
                        { key: "sharpen",    label: "Sharpen",    icon: Focus, min: 0, max: 100, def: 0, unit: "" },
                      ].map(({ key, label, icon: Icon, min, max, def, unit }) => {
                        const val = parseEffect(selectedClip.effects, key, def);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1.5"><Icon className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{label}</span></div>
                              <span className="text-xs font-mono text-muted-foreground">{val}{unit}</span>
                            </div>
                            <Slider value={[val]} min={min} max={max} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects, key, v) })} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Background blur */}
                    <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/40">
                      <span className="text-xs">Background Blur</span>
                      <button onClick={() => {
                        const on = effectEnabled(selectedClip.effects, "bg-blur");
                        handleUpdateSelectedClip({ effects: on ? (selectedClip.effects ?? []).filter(e => !e.startsWith("bg-blur:")) : setEffectVal(selectedClip.effects,"bg-blur",1) });
                      }} className={cn("w-10 h-5 rounded-full border transition-colors relative", effectEnabled(selectedClip.effects,"bg-blur") ? "border-primary bg-primary" : "border-border bg-secondary")}>
                        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", effectEnabled(selectedClip.effects,"bg-blur") ? "left-5" : "left-0.5")} />
                      </button>
                    </div>

                    {/* Crop */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5"><CropIcon className="h-3.5 w-3.5 text-muted-foreground" /><Label className="text-xs">Crop</Label></div>
                      <div className="grid grid-cols-3 gap-1">
                        {[{id:"original",label:"Original"},{id:"16:9",label:"16:9"},{id:"9:16",label:"9:16"},{id:"1:1",label:"1:1"},{id:"4:5",label:"4:5"},{id:"4:3",label:"4:3"}].map(({ id, label }) => {
                          const active = ((selectedClip.textStyle as any)?.crop ?? "original") === id;
                          return <button key={id} onClick={() => handleUpdateSelectedClip({ textStyle: { ...(selectedClip.textStyle as object ?? {}), crop: id } })} className={cn("text-[10px] py-1 rounded border", active ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>{label}</button>;
                        })}
                      </div>
                    </div>

                    {/* Image-specific: Fit + Scale + Offset */}
                    {selectedClip.type === "image" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Fit Mode</Label>
                          <div className="grid grid-cols-2 gap-1">
                            {[{id:"contain",label:"Fit (Contain)"},{id:"cover",label:"Fill (Cover)"}].map(({ id, label }) => {
                              const active = (parseEffect(selectedClip.effects,"fit-mode",0) === 1 ? "cover" : "contain") === id;
                              return <button key={id} onClick={() => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"fit-mode", id === "cover" ? 1 : 0) })} className={cn("text-[10px] py-1.5 rounded border", active ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>{label}</button>;
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs">Scale</Label><span className="text-xs font-mono text-muted-foreground">{(parseEffect(selectedClip.effects,"img-scale",100)/100).toFixed(2)}x</span></div>
                          <Slider value={[parseEffect(selectedClip.effects,"img-scale",100)]} min={25} max={400} step={5} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"img-scale",v) })} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs">Position X</Label><span className="text-xs font-mono text-muted-foreground">{parseEffect(selectedClip.effects,"img-x",0)}%</span></div>
                          <Slider value={[parseEffect(selectedClip.effects,"img-x",0)]} min={-100} max={100} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"img-x",v) })} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs">Position Y</Label><span className="text-xs font-mono text-muted-foreground">{parseEffect(selectedClip.effects,"img-y",0)}%</span></div>
                          <Slider value={[parseEffect(selectedClip.effects,"img-y",0)]} min={-100} max={100} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"img-y",v) })} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs">Corner Radius</Label><span className="text-xs font-mono text-muted-foreground">{parseEffect(selectedClip.effects,"radius",0)}%</span></div>
                          <Slider value={[parseEffect(selectedClip.effects,"radius",0)]} min={0} max={50} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"radius",v) })} />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Ken Burns Effect</Label>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 0, label: "None" },
                              { id: 1, label: "Zoom In" },
                              { id: 2, label: "Zoom Out" },
                              { id: 3, label: "Pan Left" },
                              { id: 4, label: "Pan Right" },
                              { id: 5, label: "Zoom+Pan" },
                            ].map(({ id, label }) => {
                              const active = parseEffect(selectedClip.effects,"kb",0) === id;
                              return <button key={id} onClick={() => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"kb",id) })} className={cn("text-[10px] py-1 rounded border", active ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 hover:border-primary/40")}>{label}</button>;
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── AUDIO INSPECTOR ── */}
                {selectedClip.type === "audio" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Volume</Label><span className="text-xs text-muted-foreground">{Math.round((selectedClip.volume ?? 1) * 100)}%</span></div>
                      <Slider value={[(selectedClip.volume ?? 1) * 100]} min={0} max={200} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ volume: v / 100 })} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Fade In</Label><span className="text-xs text-muted-foreground">{parseEffect(selectedClip.effects,"fade-in",0).toFixed(1)}s</span></div>
                      <Slider value={[parseEffect(selectedClip.effects,"fade-in",0)]} min={0} max={5} step={0.1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"fade-in",v) })} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Fade Out</Label><span className="text-xs text-muted-foreground">{parseEffect(selectedClip.effects,"fade-out",0).toFixed(1)}s</span></div>
                      <Slider value={[parseEffect(selectedClip.effects,"fade-out",0)]} min={0} max={5} step={0.1} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"fade-out",v) })} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Speed</Label><span className="text-xs text-muted-foreground">{(parseEffect(selectedClip.effects,"speed",100)/100).toFixed(1)}x</span></div>
                      <Slider value={[parseEffect(selectedClip.effects,"speed",100)]} min={25} max={400} step={5} onValueChange={([v]) => handleUpdateSelectedClip({ effects: setEffectVal(selectedClip.effects,"speed",v) })} />
                    </div>
                  </div>
                )}

                <Separator />

                {/* ── SHARED PROPERTIES ── */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><Label className="text-xs">Opacity</Label><span className="text-xs text-muted-foreground">{Math.round((selectedClip.opacity ?? 1) * 100)}%</span></div>
                    <Slider value={[(selectedClip.opacity ?? 1) * 100]} min={0} max={100} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ opacity: v / 100 })} />
                  </div>

                  {selectedClip.type === "video" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label className="text-xs">Volume</Label><span className="text-xs text-muted-foreground">{Math.round((selectedClip.volume ?? 1) * 100)}%</span></div>
                      <Slider value={[(selectedClip.volume ?? 1) * 100]} min={0} max={200} step={1} onValueChange={([v]) => handleUpdateSelectedClip({ volume: v / 100 })} />
                    </div>
                  )}

                  {/* Clip info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Start: {formatTime(selectedClip.startTime)}</div>
                    <div>Dur: {selectedClip.duration.toFixed(1)}s</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDuplicateClip}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={handleDeleteClip}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center gap-3">
                <MousePointer2 className="h-8 w-8 opacity-40" />
                <span className="text-sm">Select a clip to edit its properties</span>
              </div>
            )}
          </ScrollArea>
        </aside>
      </main>

      {/* ── Timeline ── */}
      <section className="h-72 border-t border-border bg-card flex flex-col shrink-0 select-none">
        <div className="h-10 border-b border-border flex items-center px-4 justify-between bg-background">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7"><MousePointer2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Split at playhead" onClick={handleSplitAtPlayhead}><Scissors className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate" onClick={handleDuplicateClip} disabled={!selectedClipId}><Copy className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={handleDeleteClip} disabled={!selectedClipId}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.5))}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <Slider value={[zoomLevel]} min={0.5} max={5} step={0.5} onValueChange={([v]) => setZoomLevel(v)} className="w-20" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomLevel(z => Math.min(5, z + 0.5))}><ZoomIn className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative bg-black/40">
          {/* Track headers */}
          <div className="w-44 bg-card border-r border-border shrink-0 z-20 flex flex-col">
            <div className="h-6 border-b border-border bg-muted/50" />
            {tracks.map(track => (
              <div key={track.id} className="h-16 border-b border-border/50 flex items-center px-3 bg-card/80">
                <span className="text-[10px] font-medium text-muted-foreground">{track.name}</span>
              </div>
            ))}
          </div>

          {/* Scrolling tracks — plain div so we can read scrollLeft for playhead */}
          <div ref={timelineScrollRef} className="flex-1 overflow-auto relative"
            style={{ cursor: trimDrag || clipDrag ? "ew-resize" : playheadDragging ? "col-resize" : undefined }}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={handleTimelineMouseUp}
            onMouseLeave={handleTimelineMouseUp}>
            <div className="min-h-full relative" style={{ width: `${Math.max(1000, totalDuration * PPS + 200)}px` }}
              onClick={e => { if (e.target === e.currentTarget) setSelectedClipId(null); }}>

              {/* Ruler — click / drag to scrub playhead */}
              <div className="h-6 border-b border-border bg-muted/50 sticky top-0 z-10 overflow-hidden cursor-col-resize select-none"
                onMouseDown={e => {
                  e.preventDefault();
                  setIsPlaying(false);
                  setPlayheadDragging(true);
                  const rect = timelineScrollRef.current!.getBoundingClientRect();
                  const x = e.clientX - rect.left + (timelineScrollRef.current?.scrollLeft ?? 0);
                  setCurrentTime(Math.max(0, Math.min(totalDuration, x / PPS)));
                }}>
                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                  <div key={i} className="absolute h-full border-l border-border/50 text-[9px] text-muted-foreground pl-1 pt-1" style={{ left: `${i * PPS}px` }}>
                    {i % 5 === 0 ? formatTime(i) : ""}
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-primary z-30 pointer-events-none" style={{ left: `${currentTime * PPS}px` }}>
                <div className="absolute top-0 -translate-x-1/2 w-3 h-4 bg-primary rounded-sm" />
              </div>

              {/* Split guide — scissors line when playhead is inside a clip */}
              {(() => {
                const clipAtPlayhead = (clips ?? []).find(c =>
                  currentTime > c.startTime + 0.05 && currentTime < c.startTime + c.duration - 0.05
                );
                if (!clipAtPlayhead) return null;
                return (
                  <div className="absolute top-0 bottom-0 z-35 pointer-events-none" style={{ left: `${currentTime * PPS}px` }}>
                    <div className="absolute inset-y-0 w-px border-l border-dashed border-white/40" />
                    <div className="absolute top-7 -translate-x-1/2 text-white/50 text-[9px] select-none">✂</div>
                  </div>
                );
              })()}

              {/* Magnetic snap indicator — glowing line at snap target */}
              {snapIndicatorTime !== null && (
                <div className="absolute top-0 bottom-0 z-40 pointer-events-none" style={{ left: `${snapIndicatorTime * PPS}px` }}>
                  <div className="absolute inset-y-0 w-0.5 bg-yellow-400/90" style={{ boxShadow: "0 0 6px 2px rgba(250,204,21,0.6)" }} />
                  <div className="absolute top-6 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap">
                    ⌁ {snapIndicatorTime.toFixed(2)}s
                  </div>
                </div>
              )}

              {/* Track clips */}
              <div className="flex flex-col mt-2">
                {tracks.map(track => (
                  <div key={track.id} className="h-16 border-b border-border/20 relative group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                    {track.clips.map(clip => {
                      const isSelected = selectedClipId === clip.id;
                      const ov = localClipOverrides[clip.id] || {};
                      const ds = ov.startTime ?? clip.startTime;
                      const dd = ov.duration ?? clip.duration;
                      const isDragging = clipDrag?.clipId === clip.id;
                      return (
                        <div key={clip.id}
                          onMouseDown={e => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            // Don't start body drag if clicking a trim handle (they stopPropagation themselves)
                            setClipDrag({ clipId: clip.id, startX: e.clientX, origStartTime: clip.startTime, duration: clip.duration, trackIndex: clip.trackIndex });
                          }}
                          className={`absolute top-2 bottom-2 rounded-md border text-[10px] px-2 py-1 shadow-sm flex items-center gap-1.5 overflow-hidden ${getClipColor(clip.type)} ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background z-20 brightness-110" : "z-10 hover:brightness-110"} ${isDragging ? "opacity-80 cursor-grabbing" : "cursor-grab"}`}
                          style={{ left: `${ds * PPS}px`, width: `${dd * PPS}px`, transition: isDragging || trimDrag?.clipId === clip.id ? "none" : undefined }}>
                          {clip.type === "audio" && clip.sourceUrl && (
                            <WaveformCanvas src={clip.sourceUrl} className="absolute inset-0 w-full h-full pointer-events-none" />
                          )}
                          {clip.type === "video" && clip.sourceUrl && (
                            <VideoThumbnailStrip src={clip.sourceUrl} className="absolute inset-0 h-full flex opacity-40 pointer-events-none overflow-hidden" />
                          )}
                          <span className="relative z-10 flex items-center gap-1.5 min-w-0">
                          {clip.type === "video" && <Video className="h-3 w-3 shrink-0 opacity-70" />}
                          {clip.type === "audio" && <Music className="h-3 w-3 shrink-0 opacity-70" />}
                          {clip.type === "text"  && <Type className="h-3 w-3 shrink-0 opacity-70" />}
                          {clip.type === "image" && <ImageIcon className="h-3 w-3 shrink-0 opacity-70" />}
                          <span className="truncate">{clip.name}</span>
                          </span>
                          {isSelected && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center hover:bg-black/30 rounded-l-md"
                                onMouseDown={e => { e.stopPropagation(); handleTrimMouseDown(e, clip.id, "left", clip.startTime, clip.duration); setClipDrag(null); }}>
                                <div className="w-0.5 h-5 bg-white/70 rounded-full" />
                              </div>
                              <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center hover:bg-black/30 rounded-r-md"
                                onMouseDown={e => { e.stopPropagation(); handleTrimMouseDown(e, clip.id, "right", clip.startTime, clip.duration); setClipDrag(null); }}>
                                <div className="w-0.5 h-5 bg-white/70 rounded-full" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TTS Dialog ── */}
      <Dialog open={ttsDialogOpen} onOpenChange={v => { if (!ttsGenerating) setTtsDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mic2 className="h-5 w-5 text-purple-400" /> AI Voiceover</DialogTitle>
            <DialogDescription>Type your script and choose a voice — KlipFlow will generate professional narration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Voice</Label>
              <div className="grid grid-cols-3 gap-2">
                {TTS_VOICES.map(v => (
                  <button key={v.id} onClick={() => setTtsVoice(v.id)} className={cn("p-2.5 rounded-lg border text-left transition-colors", ttsVoice === v.id ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border bg-secondary/40 hover:border-purple-500/40")}>
                    <p className="text-xs font-semibold">{v.label}</p>
                    <p className="text-[10px] text-muted-foreground">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Script</Label>
              <Textarea rows={5} placeholder="Enter your script here..." value={ttsText} onChange={e => setTtsText(e.target.value)} className="resize-none" />
              <p className="text-xs text-muted-foreground">{ttsText.length} characters · ~{Math.ceil(ttsText.split(" ").filter(Boolean).length / 2.5)}s of audio</p>
            </div>
            <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white" disabled={!ttsText.trim() || ttsGenerating} onClick={handleGenerateTTS}>
              {ttsGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Mic2 className="h-4 w-4" /> Generate Voiceover</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Export Dialog ── */}
      <Dialog open={exportDialogOpen} onOpenChange={open => { if (!open && exportStatus !== "running") setExportDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{exportStatus === "done" ? "Export Complete" : exportStatus === "error" ? "Export Failed" : "Exporting Video"}</DialogTitle>
            <DialogDescription>{exportStatus === "done" ? "Your video is ready to download." : exportStatus === "error" ? exportMessage : "Please wait while your video is rendered…"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {exportStatus !== "error" && <><Progress value={exportProgress} className="h-3" /><p className="text-sm text-muted-foreground text-center">{exportMessage} ({exportProgress}%)</p></>}
            {exportStatus === "done" && exportDownloadUrl && <a href={exportDownloadUrl} download="klipflow-export.mp4" target="_blank" rel="noopener noreferrer" className="block"><Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"><Download className="h-4 w-4" /> Download Video</Button></a>}
            {(exportStatus === "done" || exportStatus === "error") && <Button variant="outline" className="w-full" onClick={() => setExportDialogOpen(false)}>Close</Button>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Upgrade Dialog ── */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Upgrade Required</DialogTitle>
            <DialogDescription>{upgradeMessage || "This feature requires a paid plan."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <a href="/pricing" className="block"><Button className="w-full gap-2"><Sparkles className="h-4 w-4" /> View Plans & Upgrade</Button></a>
            <Button variant="outline" className="w-full" onClick={() => setUpgradeDialogOpen(false)}>Maybe Later</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VideoThumbnailStrip — extracts frames from a video and tiles them
// ---------------------------------------------------------------------------
const videoThumbnailCache = new Map<string, string[]>();

function VideoThumbnailStrip({ src, className }: { src: string; className?: string }) {
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    if (!src) return;
    if (videoThumbnailCache.has(src)) { setFrames(videoThumbnailCache.get(src)!); return; }
    let cancelled = false;
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.src = src;
    const canvas = document.createElement("canvas");
    canvas.width = 80; canvas.height = 45;
    const ctx = canvas.getContext("2d")!;
    const NUM = 6;
    const captured: string[] = [];
    let idx = 0;
    const captureNext = () => {
      if (cancelled) return;
      try { ctx.drawImage(video, 0, 0, 80, 45); captured.push(canvas.toDataURL("image/jpeg", 0.4)); } catch { /* CORS */ }
      idx++;
      if (idx < NUM && video.duration) { video.currentTime = (video.duration / NUM) * idx; }
      else { if (!cancelled) { videoThumbnailCache.set(src, captured); setFrames([...captured]); } video.src = ""; }
    };
    video.onloadedmetadata = () => { if (!cancelled) video.currentTime = 0; };
    video.onseeked = captureNext;
    video.onerror = () => { video.src = ""; };
    return () => { cancelled = true; video.src = ""; };
  }, [src]);

  if (!frames.length) return null;
  return (
    <div className={className}>
      {Array.from({ length: 20 }).map((_, i) => (
        <img key={i} src={frames[i % frames.length]} alt="" className="h-full shrink-0 object-cover" style={{ aspectRatio: "16/9" }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WaveformCanvas — decodes audio and draws amplitude peaks on a canvas
// ---------------------------------------------------------------------------
const waveformCache = new Map<string, Float32Array>();

function WaveformCanvas({ src, className }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    let cancelled = false;

    const drawWaveform = (samples: Float32Array) => {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < w; i++) {
        const sampleIdx = Math.floor((i / w) * samples.length);
        const amp = samples[sampleIdx] ?? 0;
        const barH = Math.max(1, amp * h * 0.9);
        ctx.fillStyle = `rgba(134,239,172,${0.35 + amp * 0.45})`;
        ctx.fillRect(i, (h - barH) / 2, 1, barH);
      }
    };

    if (waveformCache.has(src)) {
      drawWaveform(waveformCache.get(src)!);
      return;
    }

    const process = async () => {
      try {
        const resp = await fetch(src);
        if (cancelled) return;
        const buf = await resp.arrayBuffer();
        if (cancelled) return;
        const audioCtx = new AudioContext();
        const audioBuf = await audioCtx.decodeAudioData(buf);
        await audioCtx.close();
        if (cancelled) return;
        const data = audioBuf.getChannelData(0);
        const NUM = 400;
        const step = Math.ceil(data.length / NUM);
        const samples = new Float32Array(NUM);
        for (let i = 0; i < NUM; i++) {
          let max = 0;
          for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            if (idx < data.length) max = Math.max(max, Math.abs(data[idx]));
          }
          samples[i] = max;
        }
        waveformCache.set(src, samples);
        drawWaveform(samples);
      } catch {
        // audio unavailable or can't be decoded — no waveform shown
      }
    };

    process();
    return () => { cancelled = true; };
  }, [src]);

  return <canvas ref={canvasRef} width={400} height={48} className={className} />;
}

// ---------------------------------------------------------------------------
// PreviewCanvas
// ---------------------------------------------------------------------------
type PreviewClip = {
  id: number; startTime: number; duration: number; type: string;
  sourceUrl: string | null; textContent: string | null;
  effects: string[] | null; opacity: number | null; volume: number | null;
  trackIndex: number; textStyle: unknown;
};

const PreviewCanvas = memo(function PreviewCanvas({ clips, currentTime, isPlaying }: { clips: PreviewClip[]; currentTime: number; isPlaying: boolean }) {
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  const isActive = (c: PreviewClip) => c.startTime <= currentTime && currentTime < c.startTime + c.duration;

  const allVideoClips = clips.filter(c => c.type === "video");
  const allAudioClips = clips.filter(c => c.type === "audio");
  const activeImageClips = clips.filter(c => c.type === "image" && isActive(c));
  const activeTextClips  = clips.filter(c => c.type === "text"  && isActive(c));

  // Sync all video elements every render — keeps paused frame visible when scrubbing
  useEffect(() => {
    videoRefs.current.forEach((el, id) => {
      const clip = allVideoClips.find(c => c.id === id);
      if (!clip) return;
      const active = isActive(clip);
      const t = Math.max(0, currentTime - clip.startTime);
      // Always seek so the frame is visible even when clip is hidden
      if (Math.abs(el.currentTime - t) > 0.15) el.currentTime = t;
      if (active && isPlaying && el.paused)  el.play().catch(() => {});
      else if ((!active || !isPlaying) && !el.paused) el.pause();
    });
    audioRefs.current.forEach((el, id) => {
      const clip = allAudioClips.find(c => c.id === id);
      if (!clip) return;
      const active = isActive(clip);
      const t = Math.max(0, currentTime - clip.startTime);
      if (Math.abs(el.currentTime - t) > 0.3) el.currentTime = t;
      if (active && isPlaying && el.paused)  el.play().catch(() => {});
      else if ((!active || !isPlaying) && !el.paused) el.pause();
    });
  });

  const hasVisible = allVideoClips.some(isActive) || activeImageClips.length > 0 || activeTextClips.length > 0;

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* Pre-render ALL video clips — hidden when inactive so they stay loaded/preloaded */}
      {allVideoClips.map(clip => {
        const active = isActive(clip);
        return (
          <video key={clip.id}
            ref={el => { if (el) videoRefs.current.set(clip.id, el); else videoRefs.current.delete(clip.id); }}
            src={clip.sourceUrl ?? undefined}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              visibility: active ? "visible" : "hidden",
              filter: clipCssFilter(clip.effects),
              opacity: clip.opacity ?? 1,
              transform: clipCssTransform(clip.effects),
            }}
            muted
            playsInline
            preload="auto" />
        );
      })}

      {/* Pre-render ALL audio clips */}
      {allAudioClips.map(clip => (
        <audio key={clip.id}
          ref={el => { if (el) audioRefs.current.set(clip.id, el); else audioRefs.current.delete(clip.id); }}
          src={clip.sourceUrl ?? undefined}
          style={{ display: "none" }}
          preload="auto" />
      ))}

      {/* Images — only render when active */}
      {activeImageClips.map(clip => {
        const isCover = parseEffect(clip.effects, "fit-mode", 0) === 1;
        const scale = parseEffect(clip.effects, "img-scale", 100) / 100;
        const imgX = parseEffect(clip.effects, "img-x", 0);
        const imgY = parseEffect(clip.effects, "img-y", 0);
        const radius = parseEffect(clip.effects, "radius", 0);
        const baseTransform = clipCssTransform(clip.effects);
        // Ken Burns: interpolate transform based on playback progress through the clip
        const kb = parseEffect(clip.effects, "kb", 0);
        const progress = clip.duration > 0 ? Math.max(0, Math.min(1, (currentTime - clip.startTime) / clip.duration)) : 0;
        let kbTransform = "";
        if (kb === 1) kbTransform = `scale(${1 + 0.12 * progress})`;
        else if (kb === 2) kbTransform = `scale(${1.12 - 0.12 * progress})`;
        else if (kb === 3) kbTransform = `scale(1.08) translateX(${3 - 6 * progress}%)`;
        else if (kb === 4) kbTransform = `scale(1.08) translateX(${-3 + 6 * progress}%)`;
        else if (kb === 5) kbTransform = `scale(${1 + 0.10 * progress}) translateX(${2 - 4 * progress}%)`;
        const parts = [baseTransform !== "none" ? baseTransform : "", `scale(${scale})`, imgX || imgY ? `translate(${imgX}%, ${imgY}%)` : "", kbTransform].filter(Boolean);
        const fullTransform = parts.join(" ").trim() || "none";
        return (
          <img key={clip.id} src={clip.sourceUrl ?? undefined} alt=""
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: isCover ? "cover" : "contain",
              filter: clipCssFilter(clip.effects),
              opacity: clip.opacity ?? 1,
              transform: fullTransform,
              borderRadius: radius > 0 ? `${radius}%` : undefined,
            }} />
        );
      })}

      {/* Text / Stickers */}
      {activeTextClips.filter(c => c.textContent).map(clip => {
        const ts2 = (clip.textStyle ?? {}) as Record<string, unknown>;
        const fontSize  = (ts2.fontSize  as number)  ?? 48;
        const color     = (ts2.color     as string)  ?? "#ffffff";
        const bold      = (ts2.bold      as boolean) ?? true;
        const italic    =  ts2.italic    as boolean;
        const underline =  ts2.underline as boolean;
        const align     = (ts2.align     as string)  ?? "center";
        const bgColor   =  ts2.bgColor   as string | undefined;
        const position  = (ts2.position  as string)  ?? "bc";
        const fontFamily= (ts2.fontFamily as string) ?? "Inter";
        const glow      =  ts2.glow      as boolean;
        const posStyle  = textPositionStyle(position);
        return (
          <div key={clip.id} className="absolute" style={{ ...posStyle, opacity: clip.opacity ?? 1 }}>
            <p style={{
              fontSize: `${fontSize}px`, color, fontFamily,
              fontWeight: bold ? 700 : 400,
              fontStyle: italic ? "italic" : "normal",
              textDecoration: underline ? "underline" : "none",
              textAlign: align as any,
              textShadow: glow ? `0 0 20px ${color}, 0 0 40px ${color}` : "0 2px 8px rgba(0,0,0,0.9)",
              backgroundColor: bgColor || undefined,
              padding: bgColor ? "4px 12px" : undefined,
              borderRadius: bgColor ? "4px" : undefined,
              maxWidth: "90vw", wordBreak: "break-word",
            }}>
              {clip.textContent}
            </p>
          </div>
        );
      })}

      {!hasVisible && <div className="absolute inset-0 flex items-center justify-center"><span className="text-white/15 font-mono text-3xl font-bold tracking-widest select-none">PREVIEW</span></div>}
    </div>
  );
});
