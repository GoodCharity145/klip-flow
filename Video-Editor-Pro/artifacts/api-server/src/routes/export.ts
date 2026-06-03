import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { clipsTable, projectsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { spawn } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir, rm } from "fs/promises";
import { ObjectStorageService } from "../lib/objectStorage";
import { createJob, updateJob, getJob } from "../lib/exportJobs";
import { getUserPlanTier, requirePlan } from "../lib/planCheck";

const router = Router();
const objectStorage = new ObjectStorageService();

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  "720p":  { width: 1280, height: 720  },
  "1080p": { width: 1920, height: 1080 },
  "4K":    { width: 3840, height: 2160 },
};

function sourceUrlToObjectPath(sourceUrl: string): string | null {
  const prefix = "/api/storage";
  return sourceUrl.startsWith(prefix) ? sourceUrl.slice(prefix.length) : null;
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function parseExportEffect(effects: string[] | null | undefined, key: string, def: number): number {
  const entry = effects?.find((e: string) => e.startsWith(`${key}:`));
  return entry ? parseFloat(entry.split(":")[1]) : def;
}

function effectEnabled(effects: string[] | null | undefined, key: string): boolean {
  return (effects ?? []).some(e => e === `${key}:1` || e === `${key}:true`);
}

function buildEqFilter(effects: string[] | null | undefined, opacity: number | null | undefined): string {
  const brightness = parseExportEffect(effects, "brightness", 100);
  const contrast   = parseExportEffect(effects, "contrast",   100);
  const saturation = parseExportEffect(effects, "saturation", 100);
  const op = opacity ?? 1;

  const parts: string[] = [];
  if (brightness !== 100) parts.push(`brightness=${((brightness - 100) / 100).toFixed(3)}`);
  if (contrast   !== 100) parts.push(`contrast=${(contrast   / 100).toFixed(3)}`);
  if (saturation !== 100) parts.push(`saturation=${(saturation / 100).toFixed(3)}`);

  let filter = parts.length > 0 ? `eq=${parts.join(":")}` : "";
  if (op < 0.99) {
    if (filter) filter += ",";
    filter += `colorchannelmixer=rr=${op.toFixed(3)}:gg=${op.toFixed(3)}:bb=${op.toFixed(3)}`;
  }
  return filter;
}

function buildColorbalanceFilter(effects: string[] | null | undefined): string {
  const temp = parseExportEffect(effects, "temperature", 0);
  const tint  = parseExportEffect(effects, "tint", 0);
  if (temp === 0 && tint === 0) return "";
  // temperature: positive = warm (more red/less blue), negative = cool (more blue/less red)
  const rs = (temp / 100 * 0.3).toFixed(3);
  const bs = (-temp / 100 * 0.3).toFixed(3);
  const gs = (tint / 100 * 0.2).toFixed(3);
  return `colorbalance=rs=${rs}:gs=${gs}:bs=${bs}:rm=${rs}:gm=${gs}:bm=${bs}:rh=${rs}:gh=${gs}:bh=${bs}`;
}

function buildSharpenFilter(effects: string[] | null | undefined): string {
  const sharpen = parseExportEffect(effects, "sharpen", 0);
  if (sharpen <= 0) return "";
  const amount = (sharpen / 100 * 3.0).toFixed(2);
  return `unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount=${amount}`;
}

function buildVignetteFilter(effects: string[] | null | undefined): string {
  const v = parseExportEffect(effects, "vignette", 0);
  if (v <= 0) return "";
  const angle = (v / 100 * Math.PI / 4).toFixed(4);
  return `vignette=angle=${angle}`;
}

function buildFlipFilter(effects: string[] | null | undefined): string {
  const flipH = effectEnabled(effects, "flip-h");
  const flipV = effectEnabled(effects, "flip-v");
  if (flipH && flipV) return "hflip,vflip";
  if (flipH) return "hflip";
  if (flipV) return "vflip";
  return "";
}

function buildRotateFilter(effects: string[] | null | undefined): string {
  const rot = parseExportEffect(effects, "rotate", 0);
  if (rot === 90)  return "transpose=1";
  if (rot === 180) return "hflip,vflip";
  if (rot === 270) return "transpose=2";
  return "";
}

function buildCropFilter(textStyle: unknown): string {
  const crop = (textStyle as Record<string, string> | null)?.crop;
  if (!crop || crop === "original") return "";
  const dims: Record<string, string> = {
    "16:9": "min(iw\\,ih*16/9):min(ih\\,iw*9/16)",
    "9:16": "min(iw\\,ih*9/16):min(ih\\,iw*16/9)",
    "1:1":  "min(iw\\,ih):min(iw\\,ih)",
    "4:5":  "min(iw\\,ih*4/5):min(ih\\,iw*5/4)",
    "4:3":  "min(iw\\,ih*4/3):min(ih\\,iw*3/4)",
  };
  return dims[crop] ? `crop=${dims[crop]}` : "";
}

function buildVideoSpeedFilter(effects: string[] | null | undefined): { filter: string; factor: number } {
  const speed = parseExportEffect(effects, "speed", 100);
  const factor = Math.max(0.25, Math.min(4.0, speed / 100));
  if (Math.abs(factor - 1.0) < 0.01) return { filter: "", factor: 1.0 };
  return { filter: `setpts=PTS/${factor.toFixed(3)}`, factor };
}

function buildAudioTempoFilter(effects: string[] | null | undefined): string {
  const speed = parseExportEffect(effects, "speed", 100);
  const factor = Math.max(0.25, Math.min(4.0, speed / 100));
  if (Math.abs(factor - 1.0) < 0.01) return "";
  if (factor < 0.5) return `atempo=0.5,atempo=${(factor / 0.5).toFixed(3)}`;
  if (factor > 2.0) return `atempo=2.0,atempo=${(factor / 2.0).toFixed(3)}`;
  return `atempo=${factor.toFixed(3)}`;
}

function buildAudioFadeFilter(effects: string[] | null | undefined, duration: number): string {
  const fadeIn  = parseExportEffect(effects, "fade-in",  0);
  const fadeOut = parseExportEffect(effects, "fade-out", 0);
  const parts: string[] = [];
  if (fadeIn > 0)  parts.push(`afade=t=in:st=0:d=${fadeIn.toFixed(2)}`);
  if (fadeOut > 0) {
    const outStart = Math.max(0, duration - fadeOut);
    parts.push(`afade=t=out:st=${outStart.toFixed(2)}:d=${fadeOut.toFixed(2)}`);
  }
  return parts.join(",");
}

function buildBgBlurFilter(width: number, height: number): string {
  // Creates a blurred background that fills the frame, then overlays the original content centered
  return `split[bg][fg];[bg]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=20:20[blurred];[blurred][fg]overlay=(W-w)/2:(H-h)/2`;
}

function transitionFadeDuration(transition: string | null | undefined): number {
  if (!transition || transition === "none") return 0;
  if (transition === "flash") return 0.15;
  if (transition === "dissolve") return 0.8;
  return 0.5;
}

function buildTextDrawfilter(clip: { textContent: string | null; textStyle: unknown; startTime: number; duration: number }): string {
  const ts = (clip.textStyle ?? {}) as Record<string, unknown>;
  const text = escapeDrawtext(clip.textContent || "");
  const S = clip.startTime;
  const E = S + clip.duration;
  const fontSize = (ts.fontSize as number) ?? 48;
  const color = ((ts.color as string) ?? "#ffffff").replace("#", "0x");
  const bold = (ts.bold as boolean) ?? true;
  const fontFamily = (ts.fontFamily as string) ?? "Inter";

  // Position mapping
  const pos = (ts.position as string) ?? "bc";
  const xMap: Record<string, string> = {
    tl: "40", tc: "(w-text_w)/2", tr: "w-text_w-40",
    ml: "40", mc: "(w-text_w)/2", mr: "w-text_w-40",
    bl: "40", bc: "(w-text_w)/2", br: "w-text_w-40",
  };
  const yMap: Record<string, string> = {
    tl: "60",               tc: "60",               tr: "60",
    ml: "(h-text_h)/2",     mc: "(h-text_h)/2",     mr: "(h-text_h)/2",
    bl: "h-text_h-60",      bc: "h-text_h-60",      br: "h-text_h-60",
  };
  const x = xMap[pos] ?? "(w-text_w)/2";
  const y = yMap[pos] ?? "h-text_h-80";

  const fontWeight = bold ? ":bold=1" : "";
  return `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${color}:borderw=3:bordercolor=black@0.8:x=${x}:y=${y}:enable='between(t\\,${S}\\,${E})'`;
}

function parseFFmpegProgress(raw: string, totalDuration: number): number {
  const m = raw.match(/out_time_ms=(\d+)/);
  if (!m) return -1;
  return Math.min(99, Math.round((parseInt(m[1], 10) / 1_000_000 / totalDuration) * 100));
}

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
router.post("/projects/:id/export", async (req, res) => {
  const projectId = Number(req.params.id);

  const [project] = await db.select({ resolution: projectsTable.resolution }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (project?.resolution === "4K") {
    const clerkId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
    const tier = await getUserPlanTier(clerkId);
    if (!requirePlan(tier, "pro")) {
      res.status(402).json({ error: "4K export requires a Pro plan.", upgradeUrl: "/pricing" });
      return;
    }
  }

  const jobId = randomUUID();
  createJob(jobId);
  res.json({ jobId });

  runExport(jobId, projectId, req.log).catch(err => {
    req.log.error({ err, jobId }, "Unhandled export error");
    updateJob(jobId, { status: "error", error: String(err), progress: 0 });
  });
});

router.get("/projects/:id/export/:jobId/progress", (req, res) => {
  const { jobId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const job = getJob(jobId);
  if (!job) { send({ status: "error", error: "Job not found" }); res.end(); return; }
  if (job.status === "done" || job.status === "error") { send(job); res.end(); return; }

  const interval = setInterval(() => {
    const cur = getJob(jobId);
    if (!cur) { send({ status: "error", error: "Job not found" }); clearInterval(interval); res.end(); return; }
    send(cur);
    if (cur.status === "done" || cur.status === "error") { clearInterval(interval); res.end(); }
  }, 500);

  req.on("close", () => clearInterval(interval));
});

async function runExport(jobId: string, projectId: number, log: any) {
  const workDir = join(tmpdir(), `klipflow-export-${jobId}`);
  try {
    updateJob(jobId, { status: "running", progress: 2, message: "Loading project…" });

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) { updateJob(jobId, { status: "error", error: "Project not found" }); return; }

    const clips = await db.select().from(clipsTable).where(eq(clipsTable.projectId, projectId)).orderBy(asc(clipsTable.trackIndex), asc(clipsTable.startTime));
    const mediaClips = clips.filter(c => c.sourceUrl && ["video", "audio", "image"].includes(c.type));
    const textClips  = clips.filter(c => c.type === "text" && c.textContent);

    if (mediaClips.length === 0 && textClips.length === 0) {
      updateJob(jobId, { status: "error", error: "No processable clips found. Import media first." });
      return;
    }

    await mkdir(workDir, { recursive: true });
    updateJob(jobId, { progress: 5, message: "Downloading clips…" });

    const { width, height } = RESOLUTION_MAP[project.resolution ?? "1080p"] ?? RESOLUTION_MAP["1080p"];
    const totalDuration = project.duration || 60;
    const fps = 30;

    type DL = { clip: (typeof clips)[number]; localPath: string; inputIndex: number };
    const downloaded: DL[] = [];

    for (let i = 0; i < mediaClips.length; i++) {
      const clip = mediaClips[i];
      const objectPath = sourceUrlToObjectPath(clip.sourceUrl!);
      if (!objectPath) continue;
      try {
        const file = await objectStorage.getObjectEntityFile(objectPath);
        const ext = clip.type === "audio" ? ".mp3" : ".mp4";
        const localPath = join(workDir, `input_${i}${ext}`);
        await file.download({ destination: localPath });
        downloaded.push({ clip, localPath, inputIndex: downloaded.length });
      } catch (err) {
        log.warn({ err, clipId: clip.id }, "Skipping clip — download failed");
      }
    }

    if (downloaded.length === 0 && textClips.length === 0) {
      updateJob(jobId, { status: "error", error: "Could not download any clip files from storage." });
      return;
    }

    updateJob(jobId, { progress: 15, message: "Building filter graph…" });

    const videoInputClips = downloaded.filter(d => d.clip.type === "video" || d.clip.type === "image");
    const audioInputClips = downloaded.filter(d => d.clip.type === "audio");

    const ffmpegArgs: string[] = ["-y"];
    for (const { localPath } of downloaded) ffmpegArgs.push("-i", localPath);

    const filterParts: string[] = [];
    filterParts.push(`color=black:s=${width}x${height}:d=${totalDuration}:r=${fps}[base]`);

    let currentVideoLabel = "base";

    for (let i = 0; i < videoInputClips.length; i++) {
      const { clip, inputIndex } = videoInputClips[i];
      const S = clip.startTime;
      const D = clip.duration;
      const vLabel = `vs${i}`;
      const padLabel = `vp${i}`;
      const transLabel = `vt${i}`;
      const isLast = i === videoInputClips.length - 1;
      const nextLabel = isLast && textClips.length === 0 ? "vout" : `vtmp${i}`;

      const { filter: speedFilter } = buildVideoSpeedFilter(clip.effects);
      const cropFilter = buildCropFilter(clip.textStyle);
      const eqFilter   = buildEqFilter(clip.effects, clip.opacity);
      const cbFilter   = buildColorbalanceFilter(clip.effects);
      const sharpFilter = buildSharpenFilter(clip.effects);
      const vigFilter  = buildVignetteFilter(clip.effects);
      const flipFilter = buildFlipFilter(clip.effects);
      const rotFilter  = buildRotateFilter(clip.effects);
      const bgBlur     = effectEnabled(clip.effects, "bg-blur");

      const chain: string[] = [];

      if (clip.type === "image") {
        chain.push(`loop=loop=-1:size=1:start=0`, `trim=duration=${D}`, `setpts=PTS-STARTPTS`);
      } else {
        if (speedFilter) chain.push(speedFilter);
        chain.push(`trim=0:${D}`, `setpts=PTS-STARTPTS`);
      }

      if (cropFilter) chain.push(cropFilter);

      if (bgBlur) {
        // Blur background approach: scale down to fit, blur-fill background, overlay
        chain.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
        chain.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);
        chain.push(`setsar=1`);
        // Apply bg blur as a split/overlay in separate parts
        filterParts.push(`[${inputIndex}:v]${chain.join(",")}[${vLabel}_pre]`);
        filterParts.push(
          `[${vLabel}_pre]split[${vLabel}_bg][${vLabel}_fg];` +
          `[${vLabel}_bg]boxblur=20:20[${vLabel}_blurred];` +
          `[${vLabel}_blurred][${vLabel}_fg]overlay=(W-w)/2:(H-h)/2[${vLabel}]`
        );
        chain.length = 0; // already pushed
      } else {
        chain.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
        chain.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);
        chain.push(`setsar=1`);
      }

      if (!bgBlur) {
        if (flipFilter) chain.push(flipFilter);
        if (rotFilter)  chain.push(rotFilter);
        if (eqFilter)   chain.push(eqFilter);
        if (cbFilter)   chain.push(cbFilter);
        if (sharpFilter) chain.push(sharpFilter);
        if (vigFilter)  chain.push(vigFilter);
        if (chain.length > 0) filterParts.push(`[${inputIndex}:v]${chain.join(",")}[${vLabel}]`);
      } else {
        // Add remaining effects after bg-blur composite
        const postChain: string[] = [];
        if (flipFilter) postChain.push(flipFilter);
        if (rotFilter)  postChain.push(rotFilter);
        if (eqFilter)   postChain.push(eqFilter);
        if (cbFilter)   postChain.push(cbFilter);
        if (sharpFilter) postChain.push(sharpFilter);
        if (vigFilter)  postChain.push(vigFilter);
        if (postChain.length > 0) {
          filterParts.push(`[${vLabel}]${postChain.join(",")}[${vLabel}_fx]`);
          // Rename for consistency
          filterParts.push(`[${vLabel}_fx]null[${vLabel}_final]`);
        }
      }

      const finalVLabel = bgBlur && (flipFilter || rotFilter || eqFilter || cbFilter || sharpFilter || vigFilter)
        ? `${vLabel}_final`
        : bgBlur ? vLabel : vLabel;

      const fadeDur = transitionFadeDuration(clip.transition);
      if (fadeDur > 0) {
        filterParts.push(`[${finalVLabel}]fade=t=in:st=0:d=${fadeDur}[${transLabel}]`);
        filterParts.push(`[${transLabel}]tpad=start_duration=${S}[${padLabel}]`);
      } else {
        filterParts.push(`[${finalVLabel}]tpad=start_duration=${S}[${padLabel}]`);
      }

      filterParts.push(`[${currentVideoLabel}][${padLabel}]overlay=eof_action=pass:shortest=0[${nextLabel}]`);
      currentVideoLabel = nextLabel;
    }

    if (videoInputClips.length === 0) {
      const nullLabel = textClips.length > 0 ? "vnull" : "vout";
      filterParts.push(`[base]null[${nullLabel}]`);
      currentVideoLabel = nullLabel;
    }

    for (let i = 0; i < textClips.length; i++) {
      const clip = textClips[i];
      const isLast = i === textClips.length - 1;
      const nextLabel = isLast ? "vout" : `vtxt${i}`;
      const dtFilter = buildTextDrawfilter(clip);
      filterParts.push(`[${currentVideoLabel}]${dtFilter}[${nextLabel}]`);
      currentVideoLabel = nextLabel;
    }

    const hasAudio = audioInputClips.length > 0;
    if (hasAudio) {
      const aLabels: string[] = [];
      for (let i = 0; i < audioInputClips.length; i++) {
        const { clip, inputIndex } = audioInputClips[i];
        const S = clip.startTime;
        const D = clip.duration;
        const delayMs = Math.round(S * 1000);
        const aLabel = `ao${i}`;

        const tempoFilter = buildAudioTempoFilter(clip.effects);
        const fadeFilter  = buildAudioFadeFilter(clip.effects, D);
        const volFilter   = clip.volume && Math.abs(clip.volume - 1) > 0.01 ? `volume=${clip.volume.toFixed(3)}` : "";

        const aChain = [`atrim=0:${D}`, `asetpts=PTS-STARTPTS`];
        if (tempoFilter) aChain.push(tempoFilter);
        if (fadeFilter)  aChain.push(fadeFilter);
        if (volFilter)   aChain.push(volFilter);
        aChain.push(`adelay=${delayMs}|${delayMs}`, `apad=pad_dur=${totalDuration}`);

        filterParts.push(`[${inputIndex}:a]${aChain.join(",")}[${aLabel}]`);
        aLabels.push(`[${aLabel}]`);
      }
      filterParts.push(`${aLabels.join("")}amix=inputs=${audioInputClips.length}:normalize=0:duration=longest[aout]`);
    }

    const filterStr = filterParts.join(";");
    const outputPath = join(workDir, "output.mp4");

    ffmpegArgs.push("-filter_complex", filterStr);
    ffmpegArgs.push("-map", "[vout]");
    if (hasAudio) {
      ffmpegArgs.push("-map", "[aout]");
      ffmpegArgs.push("-c:a", "aac", "-b:a", "128k");
    } else {
      ffmpegArgs.push("-an");
    }
    ffmpegArgs.push(
      "-c:v", "libx264", "-preset", "fast", "-crf", "23",
      "-t", String(totalDuration), "-movflags", "+faststart",
      "-progress", "pipe:2", "-nostats", outputPath
    );

    updateJob(jobId, { progress: 18, message: "Encoding video…" });
    log.info({ jobId, projectId }, "Starting FFmpeg");

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "ignore", "pipe"] });
      let buf = "";
      ffmpeg.stderr.on("data", (chunk: Buffer) => {
        buf += chunk.toString();
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        const pct = parseFFmpegProgress(lines.join("\n"), totalDuration);
        if (pct >= 0) updateJob(jobId, { progress: 18 + Math.round(pct * 0.72), message: `Encoding… ${pct}%` });
      });
      ffmpeg.on("close", code => { if (code === 0) resolve(); else reject(new Error(`FFmpeg exited with code ${code}`)); });
      ffmpeg.on("error", reject);
    });

    updateJob(jobId, { progress: 90, message: "Uploading to storage…" });

    const { downloadUrl } = await objectStorage.uploadFileToStorage(outputPath, "video/mp4", "exports");
    updateJob(jobId, { status: "done", progress: 100, message: "Export complete!", downloadUrl });
    log.info({ jobId }, "Export complete");
  } catch (err: unknown) {
    log.error({ err, jobId }, "Export failed");
    updateJob(jobId, { status: "error", error: `Export failed: ${String(err instanceof Error ? err.message : err).slice(0, 300)}` });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export default router;
