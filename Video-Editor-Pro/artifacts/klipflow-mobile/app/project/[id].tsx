import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Animated, Dimensions,
  Alert, Modal, PanResponder,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  useGetProject, useListClips, useCreateClip, useUpdateClip, useDeleteClip,
  getListClipsQueryKey,
} from "@workspace/api-client-react";
import type { Clip } from "@workspace/api-client-react";

const { width: SCREEN_W } = Dimensions.get("window");
const PPS = 60; // pixels-per-second on timeline
const TRACK_H = 52;
const HANDLE_W = 14;
const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

const CLIP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  video:   { bg: "#1d4ed8", border: "#3b82f6", text: "#bfdbfe" },
  audio:   { bg: "#065f46", border: "#10b981", text: "#a7f3d0" },
  image:   { bg: "#7c3aed", border: "#8b5cf6", text: "#ddd6fe" },
  text:    { bg: "#b45309", border: "#f59e0b", text: "#fef3c7" },
  sticker: { bg: "#be185d", border: "#ec4899", text: "#fce7f3" },
};

const CLIP_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  video: "film", audio: "music", image: "image", text: "type", sticker: "smile",
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

type BottomTab = "add" | "text" | "audio" | "speed" | "effects";

export default function MobileEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: project, isLoading: projLoading } = useGetProject(projectId);
  const { data: rawClips, isLoading: clipsLoading } = useListClips(projectId);
  const clips = (rawClips ?? []) as Clip[];
  const totalDuration = Math.max(project?.duration ?? 60, clips.reduce((m, c) => Math.max(m, c.startTime + c.duration), 10));

  const createClip = useCreateClip();
  const updateClip = useUpdateClip();
  const deleteClip = useDeleteClip();
  const inv = () => qc.invalidateQueries({ queryKey: getListClipsQueryKey(projectId) });

  // ── Playback ──
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<Video | null>(null);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setCurrentTime(t => {
          const next = t + 0.05 * playSpeed;
          if (next >= totalDuration) { setIsPlaying(false); return 0; }
          return next;
        });
      }, 50);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying, totalDuration, playSpeed]);

  // ── Timeline scroll (center-fixed playhead) ──
  const timelineRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);
  const isScrubbing = useRef(false);

  // Auto-scroll timeline to keep playhead centered
  useEffect(() => {
    if (!isScrubbing.current) {
      isProgrammaticScroll.current = true;
      timelineRef.current?.scrollTo({
        x: Math.max(0, currentTime * PPS - SCREEN_W / 2 + HANDLE_W),
        animated: false,
      });
      setTimeout(() => { isProgrammaticScroll.current = false; }, 30);
    }
  }, [currentTime]);

  const onTimelineScroll = useCallback((e: any) => {
    if (isProgrammaticScroll.current) return;
    isScrubbing.current = true;
    const x = e.nativeEvent.contentOffset.x;
    const t = Math.max(0, Math.min(totalDuration, (x + SCREEN_W / 2 - HANDLE_W) / PPS));
    setCurrentTime(t);
    setIsPlaying(false);
    if (playRef.current) clearInterval(playRef.current);
    setTimeout(() => { isScrubbing.current = false; }, 200);
  }, [totalDuration]);

  // ── Selection & trim ──
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const selectedClip = clips.find(c => c.id === selectedClipId) ?? null;
  const [isTrimming, setIsTrimming] = useState(false);

  const selectClip = useCallback((clip: Clip) => {
    if (selectedClipId === clip.id) { setSelectedClipId(null); setIsTrimming(false); return; }
    setSelectedClipId(clip.id);
    setIsTrimming(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedClipId]);

  // ── Trim pan responders ──
  const trimDelta = useRef(0);

  const makeTrimPan = (side: "left" | "right", clip: Clip) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { trimDelta.current = 0; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
      onPanResponderMove: (_, gs) => {
        const delta = gs.dx / PPS;
        trimDelta.current = delta;
      },
      onPanResponderRelease: (_, gs) => {
        const delta = gs.dx / PPS;
        if (side === "left") {
          const newStart = Math.max(0, Math.min(clip.startTime + delta, clip.startTime + clip.duration - 0.5));
          const newDur = clip.duration - (newStart - clip.startTime);
          updateClip.mutate({ id: projectId, clipId: clip.id, data: { startTime: newStart, duration: newDur } } as any, { onSuccess: inv });
        } else {
          const newDur = Math.max(0.5, clip.duration + delta);
          updateClip.mutate({ id: projectId, clipId: clip.id, data: { duration: newDur } } as any, { onSuccess: inv });
        }
      },
    });

  // ── Split at playhead ──
  const handleSplit = useCallback(() => {
    if (!selectedClip) return;
    const splitAt = currentTime - selectedClip.startTime;
    if (splitAt <= 0.2 || splitAt >= selectedClip.duration - 0.2) {
      Alert.alert("Can't split", "Move the playhead inside the clip to split it."); return;
    }
    const firstDur = splitAt;
    const secondStart = selectedClip.startTime + splitAt;
    const secondDur = selectedClip.duration - splitAt;
    updateClip.mutate({ id: projectId, clipId: selectedClip.id, data: { duration: firstDur } } as any, {
      onSuccess: () => {
        createClip.mutate({ id: projectId, data: {
          name: selectedClip.name, type: selectedClip.type as any,
          trackIndex: selectedClip.trackIndex, startTime: secondStart, duration: secondDur,
          sourceUrl: selectedClip.sourceUrl, textContent: selectedClip.textContent,
          textStyle: typeof selectedClip.textStyle === "object" && selectedClip.textStyle ? selectedClip.textStyle : {},
          effects: Array.isArray(selectedClip.effects) ? selectedClip.effects : [],
          opacity: selectedClip.opacity ?? 1, volume: selectedClip.volume ?? 1,
        } } as any, { onSuccess: inv });
      },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedClipId(null);
  }, [selectedClip, currentTime, projectId]);

  // ── Duplicate ──
  const handleDuplicate = useCallback(() => {
    if (!selectedClip) return;
    createClip.mutate({ id: projectId, data: {
      name: selectedClip.name + " (copy)", type: selectedClip.type as any,
      trackIndex: selectedClip.trackIndex, startTime: selectedClip.startTime + selectedClip.duration,
      duration: selectedClip.duration, sourceUrl: selectedClip.sourceUrl,
      textContent: selectedClip.textContent,
      textStyle: typeof selectedClip.textStyle === "object" && selectedClip.textStyle ? selectedClip.textStyle : {},
      effects: Array.isArray(selectedClip.effects) ? selectedClip.effects : [],
      opacity: selectedClip.opacity ?? 1, volume: selectedClip.volume ?? 1,
    } } as any, { onSuccess: () => { inv(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } });
  }, [selectedClip, projectId]);

  // ── Delete ──
  const handleDelete = useCallback(() => {
    if (!selectedClip) return;
    Alert.alert("Delete", `Delete "${selectedClip.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        deleteClip.mutate({ id: projectId, clipId: selectedClip.id } as any, {
          onSuccess: () => { inv(); setSelectedClipId(null); },
        });
      }},
    ]);
  }, [selectedClip, projectId]);

  // ── Upload ──
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const uploadMedia = async (uri: string, mimeType: string, name: string) => {
    setUploading(true); setUploadPct(5);
    try {
      const formData = new FormData();
      formData.append("file", { uri, type: mimeType, name } as any);
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadPct(5 + Math.round((e.loaded / e.total) * 85)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error"));
        const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
        xhr.open("POST", `https://${domain}/api/storage/uploads/direct`);
        xhr.send(formData);
      });
      setUploadPct(95);
      const res = JSON.parse(xhr.responseText) as { sourceUrl: string; metadata: { name: string; contentType: string } };
      const mediaType = res.metadata.contentType.startsWith("video") ? "video"
        : res.metadata.contentType.startsWith("audio") ? "audio" : "image";
      createClip.mutate({ id: projectId, data: {
        name: res.metadata.name, type: mediaType as any,
        trackIndex: mediaType === "audio" ? 2 : 0,
        startTime: currentTimeRef.current, duration: 5,
        sourceUrl: res.sourceUrl, textStyle: {}, effects: [], opacity: 1, volume: 1,
      } } as any, { onSuccess: () => { inv(); setUploadPct(100); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } });
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Unknown");
    } finally { setTimeout(() => { setUploading(false); setUploadPct(0); }, 600); }
  };

  const pickVideo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1 });
    if (!r.canceled && r.assets[0]) { const a = r.assets[0]; await uploadMedia(a.uri, a.mimeType ?? "video/mp4", a.fileName ?? "video.mp4"); }
  };
  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (!r.canceled && r.assets[0]) { const a = r.assets[0]; const ext = a.uri.split(".").pop() ?? "jpg"; await uploadMedia(a.uri, a.mimeType ?? `image/${ext}`, a.fileName ?? `image.${ext}`); }
  };

  // ── Text editing modal ──
  const [textModalClipId, setTextModalClipId] = useState<number | null>(null);
  const textModalClip = clips.find(c => c.id === textModalClipId) ?? null;
  const [textContent, setTextContent] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");

  const openTextModal = (clip: Clip) => {
    setTextModalClipId(clip.id);
    setTextContent(clip.textContent ?? "");
    setTextColor((clip.textStyle as any)?.color ?? "#ffffff");
  };

  const addTextClip = () => {
    const nextTrack = clips.length > 0 ? Math.max(...clips.map(c => c.trackIndex)) + 1 : 1;
    createClip.mutate({ id: projectId, data: {
      name: "Text", type: "text" as any, trackIndex: nextTrack,
      startTime: currentTimeRef.current, duration: 3,
      textContent: "Edit me", textStyle: { fontSize: 48, color: "#ffffff", textAlign: "center" },
      effects: [], opacity: 1, volume: 1,
    } } as any, { onSuccess: (data: any) => { inv(); if (data?.id) { openTextModal(data); } } });
  };

  const saveTextModal = () => {
    if (!textModalClip) return;
    updateClip.mutate({ id: projectId, clipId: textModalClip.id, data: {
      textContent,
      textStyle: { ...(typeof textModalClip.textStyle === "object" && textModalClip.textStyle ? textModalClip.textStyle : {}), color: textColor },
    } } as any, { onSuccess: () => { inv(); setTextModalClipId(null); } });
  };

  // ── Clip volume/opacity quick update ──
  const handleVolumeChange = useCallback((clip: Clip, val: number) => {
    updateClip.mutate({ id: projectId, clipId: clip.id, data: { volume: val } } as any, { onSuccess: inv });
  }, [projectId]);

  // ── Bottom tab ──
  const [activeTab, setActiveTab] = useState<BottomTab>("add");

  // ── Styles ──
  const styles = makeStyles(colors, insets);
  const isLoading = projLoading || clipsLoading;

  if (isLoading) return (
    <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
  if (!project) return (
    <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ color: colors.foreground }}>Project not found</Text>
    </View>
  );

  const activeVideoClip = clips.find(c => c.type === "video" && c.sourceUrl && currentTime >= c.startTime && currentTime < c.startTime + c.duration);
  const activeImageClip = clips.find(c => c.type === "image" && c.sourceUrl && currentTime >= c.startTime && currentTime < c.startTime + c.duration);
  const activeTextClips  = clips.filter(c => c.type === "text" && currentTime >= c.startTime && currentTime < c.startTime + c.duration);
  const hasContent = !!(activeVideoClip || activeImageClip || activeTextClips.length);

  // Timeline content width
  const timelineW = Math.max(SCREEN_W * 2, totalDuration * PPS + SCREEN_W);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.hBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.hTitle} numberOfLines={1}>{project.name}</Text>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}
          onPress={() => Alert.alert("Export", "Export is available in the web editor for full quality rendering.")}>
          <Feather name="share-2" size={14} color="#fff" />
          <Text style={styles.exportBtnTxt}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* ── PREVIEW ── */}
      <View style={styles.preview}>
        {/* Base layer: video or image */}
        {activeVideoClip?.sourceUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: activeVideoClip.sourceUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            rate={playSpeed}
            volume={activeVideoClip.volume ?? 1}
            positionMillis={Math.max(0, currentTime - activeVideoClip.startTime) * 1000}
            onPlaybackStatusUpdate={(s: AVPlaybackStatus) => { if (s.isLoaded && s.didJustFinish) setIsPlaying(false); }}
          />
        ) : activeImageClip?.sourceUrl ? (
          <ExpoImage source={{ uri: activeImageClip.sourceUrl }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : !hasContent ? (
          <View style={styles.previewEmpty}>
            <Feather name="film" size={36} color={colors.border} />
            <Text style={styles.previewEmptyTxt}>{clips.length === 0 ? "Add clips to get started" : "No clip at this time"}</Text>
          </View>
        ) : null}

        {/* Text overlays */}
        {activeTextClips.map(c => (
          <View key={c.id} style={[StyleSheet.absoluteFill, styles.textOverlay]}>
            <TouchableOpacity onPress={() => openTextModal(c)} activeOpacity={0.8}>
              <Text style={[styles.previewText, { color: (c.textStyle as any)?.color ?? "#fff", fontSize: Math.min(24, ((c.textStyle as any)?.fontSize ?? 48) / 2) }]}>
                {c.textContent ?? ""}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Time badge */}
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeTxt}>{fmt(currentTime)} / {fmt(totalDuration)}</Text>
        </View>

        {/* Speed badge */}
        {playSpeed !== 1 && (
          <View style={[styles.timeBadge, { left: 8, right: undefined }]}>
            <Text style={styles.timeBadgeTxt}>{playSpeed}×</Text>
          </View>
        )}
      </View>

      {/* ── PLAYBACK CONTROLS ── */}
      <View style={styles.playbackRow}>
        <TouchableOpacity onPress={() => { setCurrentTime(0); setIsPlaying(false); }} style={styles.pBtn}>
          <Feather name="skip-back" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTime(t => Math.max(0, t - 3))} style={styles.pBtn}>
          <Feather name="rewind" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPlaying(p => !p); }}
          style={styles.playPause}
        >
          <Feather name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTime(t => Math.min(totalDuration, t + 3))} style={styles.pBtn}>
          <Feather name="fast-forward" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setCurrentTime(totalDuration); setIsPlaying(false); }} style={styles.pBtn}>
          <Feather name="skip-forward" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ── TIMELINE ── */}
      <View style={styles.timelineWrap}>
        {/* Center playhead indicator (fixed) */}
        <View style={[styles.playheadFixed, { pointerEvents: "none" }]}>
          <View style={styles.playheadFixedHead} />
          <View style={styles.playheadFixedLine} />
        </View>

        <ScrollView
          ref={timelineRef}
          horizontal
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          onScroll={onTimelineScroll}
          contentContainerStyle={{ width: timelineW }}
        >
          {/* Left padding so t=0 is centered */}
          <View style={{ width: timelineW }}>

            {/* Time ruler */}
            <View style={styles.ruler}>
              {Array.from({ length: Math.ceil(totalDuration) + 2 }).map((_, i) => (
                <View key={i} style={[styles.rulerTick, { left: SCREEN_W / 2 + i * PPS }]}>
                  {i % 5 === 0 && <Text style={styles.rulerLbl}>{fmt(i)}</Text>}
                </View>
              ))}
            </View>

            {/* Tracks */}
            {[0, 1, 2, 3, 4].map(trackIdx => {
              const tClips = clips.filter(c => c.trackIndex === trackIdx);
              if (tClips.length === 0) return null;
              return (
                <View key={trackIdx} style={styles.track}>
                  {tClips.map(clip => {
                    const col = CLIP_COLORS[clip.type] ?? CLIP_COLORS.video;
                    const isSel = selectedClipId === clip.id;
                    const clipLeft = SCREEN_W / 2 + clip.startTime * PPS;
                    const clipW = Math.max(HANDLE_W * 2 + 10, clip.duration * PPS);
                    const trimL = isSel ? makeTrimPan("left", clip) : null;
                    const trimR = isSel ? makeTrimPan("right", clip) : null;
                    return (
                      <View key={clip.id} style={[styles.clipOuter, { left: clipLeft, width: clipW }]}>
                        {/* Left trim handle */}
                        {isSel && (
                          <View {...trimL!.panHandlers} style={[styles.trimHandle, styles.trimHandleL, { backgroundColor: col.border }]}>
                            <View style={styles.trimGrip} />
                          </View>
                        )}

                        {/* Clip body */}
                        <TouchableOpacity
                          onPress={() => selectClip(clip)}
                          onLongPress={() => { selectClip(clip); setIsTrimming(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                          activeOpacity={0.85}
                          style={[styles.clipBody, {
                            backgroundColor: col.bg,
                            borderColor: isSel ? "#fff" : col.border,
                            borderWidth: isSel ? 2 : 1,
                          }]}
                        >
                          {clip.type === "image" && clip.sourceUrl ? (
                            <ExpoImage source={{ uri: clip.sourceUrl }} style={styles.clipThumb} contentFit="cover" />
                          ) : null}
                          <Feather name={CLIP_ICONS[clip.type] ?? "film"} size={10} color={col.text} />
                          <Text style={[styles.clipTxt, { color: col.text }]} numberOfLines={1}>
                            {clip.name.replace(/\.[^.]+$/, "")}
                          </Text>
                          <Text style={[styles.clipDurTxt, { color: col.text }]}>{fmt(clip.duration)}</Text>
                        </TouchableOpacity>

                        {/* Right trim handle */}
                        {isSel && (
                          <View {...trimR!.panHandlers} style={[styles.trimHandle, styles.trimHandleR, { backgroundColor: col.border }]}>
                            <View style={styles.trimGrip} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {/* Empty state */}
            {clips.length === 0 && (
              <View style={styles.tlEmpty}>
                <Text style={styles.tlEmptyTxt}>Tap Add below to start</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ── CLIP QUICK ACTIONS (shows when clip selected) ── */}
      {selectedClip && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qaBtn} onPress={handleSplit}>
            <Feather name="scissors" size={16} color={colors.foreground} />
            <Text style={styles.qaLbl}>Split</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} onPress={handleDuplicate}>
            <Feather name="copy" size={16} color={colors.foreground} />
            <Text style={styles.qaLbl}>Duplicate</Text>
          </TouchableOpacity>
          {selectedClip.type === "text" && (
            <TouchableOpacity style={styles.qaBtn} onPress={() => openTextModal(selectedClip)}>
              <Feather name="edit-3" size={16} color={colors.foreground} />
              <Text style={styles.qaLbl}>Edit Text</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.qaBtn]} onPress={handleDelete}>
            <Feather name="trash-2" size={16} color="#ef4444" />
            <Text style={[styles.qaLbl, { color: "#ef4444" }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn} onPress={() => setSelectedClipId(null)}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
            <Text style={[styles.qaLbl, { color: colors.mutedForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── UPLOAD PROGRESS ── */}
      {uploading && (
        <View style={styles.uploadBar}>
          <Feather name="upload-cloud" size={12} color="#fff" />
          <View style={styles.uploadTrack}>
            <View style={[styles.uploadFill, { width: `${uploadPct}%` as any }]} />
          </View>
          <Text style={styles.uploadPctTxt}>{uploadPct}%</Text>
        </View>
      )}

      {/* ── BOTTOM TOOLBAR ── */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 6 }]}>
        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {(["add", "text", "audio", "speed", "effects"] as BottomTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Feather
                name={tab === "add" ? "plus-circle" : tab === "text" ? "type" : tab === "audio" ? "music" : tab === "speed" ? "zap" : "sliders"}
                size={18}
                color={activeTab === tab ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.tabLbl, activeTab === tab && { color: colors.primary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === "add" && (
            <View style={styles.addRow}>
              <TouchableOpacity style={styles.addBtn} onPress={pickVideo} disabled={uploading}>
                <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.video.bg }]}>
                  <Feather name="film" size={20} color={CLIP_COLORS.video.text} />
                </View>
                <Text style={styles.addLbl}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={pickImage} disabled={uploading}>
                <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.image.bg }]}>
                  <Feather name="image" size={20} color={CLIP_COLORS.image.text} />
                </View>
                <Text style={styles.addLbl}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={addTextClip}>
                <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.text.bg }]}>
                  <Feather name="type" size={20} color={CLIP_COLORS.text.text} />
                </View>
                <Text style={styles.addLbl}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Audio", "Pick audio from library — coming soon.")}>
                <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.audio.bg }]}>
                  <Feather name="music" size={20} color={CLIP_COLORS.audio.text} />
                </View>
                <Text style={styles.addLbl}>Audio</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "text" && (
            <View style={styles.addRow}>
              {["Title", "Subtitle", "Caption", "Label"].map(style => (
                <TouchableOpacity key={style} style={styles.addBtn} onPress={() => {
                  const nextTrack = clips.length > 0 ? Math.max(...clips.map(c => c.trackIndex)) + 1 : 1;
                  const fontSize = style === "Title" ? 64 : style === "Subtitle" ? 48 : style === "Caption" ? 36 : 28;
                  createClip.mutate({ id: projectId, data: {
                    name: style, type: "text" as any, trackIndex: nextTrack,
                    startTime: currentTimeRef.current, duration: 3,
                    textContent: style, textStyle: { fontSize, color: "#ffffff", textAlign: "center" },
                    effects: [], opacity: 1, volume: 1,
                  } } as any, { onSuccess: inv });
                }}>
                  <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.text.bg }]}>
                    <Feather name="type" size={20} color={CLIP_COLORS.text.text} />
                  </View>
                  <Text style={styles.addLbl}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "audio" && (
            <View style={styles.addRow}>
              {["Music", "Sound FX", "Voiceover", "Record"].map(opt => (
                <TouchableOpacity key={opt} style={styles.addBtn} onPress={() => Alert.alert(opt, "Coming soon in the next update.")}>
                  <View style={[styles.addIcon, { backgroundColor: CLIP_COLORS.audio.bg }]}>
                    <Feather name={opt === "Record" ? "mic" : opt === "Music" ? "music" : opt === "Voiceover" ? "volume-2" : "headphones"} size={20} color={CLIP_COLORS.audio.text} />
                  </View>
                  <Text style={styles.addLbl}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "speed" && (
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>Playback Speed</Text>
              <View style={styles.speedChips}>
                {SPEEDS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.speedChip, playSpeed === s && styles.speedChipActive]}
                    onPress={() => { setPlaySpeed(s); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[styles.speedChipTxt, playSpeed === s && styles.speedChipTxtActive]}>{s}×</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedClip && (selectedClip.type === "video" || selectedClip.type === "audio") && (
                <View style={styles.volRow}>
                  <Text style={styles.volLabel}>Clip Volume</Text>
                  <View style={styles.volSliderRow}>
                    <Feather name="volume" size={14} color={colors.mutedForeground} />
                    <TouchableOpacity style={styles.volTrack} onPress={(e) => {
                      const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / (SCREEN_W - 80)));
                      handleVolumeChange(selectedClip, pct);
                    }}>
                      <View style={[styles.volFill, { width: `${(selectedClip.volume ?? 1) * 100}%` as any }]} />
                      <View style={[styles.volThumb, { left: `${(selectedClip.volume ?? 1) * 100}%` as any }]} />
                    </TouchableOpacity>
                    <Feather name="volume-2" size={14} color={colors.mutedForeground} />
                    <Text style={styles.volPct}>{Math.round((selectedClip.volume ?? 1) * 100)}%</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === "effects" && (
            <View style={styles.addRow}>
              {["Blur", "B&W", "Warm", "Cool", "Vivid"].map(fx => (
                <TouchableOpacity key={fx} style={styles.addBtn}
                  onPress={() => Alert.alert(fx, "Video filters apply on export — coming soon.")}>
                  <View style={[styles.addIcon, { backgroundColor: "#2d2d3d" }]}>
                    <Feather name="sliders" size={20} color="#a78bfa" />
                  </View>
                  <Text style={styles.addLbl}>{fx}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── TEXT EDIT MODAL ── */}
      <Modal visible={!!textModalClipId} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTextModalClipId(null)}>
        <View style={styles.textModal}>
          <View style={styles.textModalHeader}>
            <TouchableOpacity onPress={() => setTextModalClipId(null)}>
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.textModalTitle}>Edit Text</Text>
            <TouchableOpacity onPress={saveTextModal}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[styles.textModalPreview, { backgroundColor: "#0a0a12" }]}>
            <Text style={{ color: textColor, fontSize: 28, textAlign: "center", fontWeight: "700" }}>{textContent || "Your text"}</Text>
          </View>

          {/* Input */}
          <TextInput
            style={styles.textModalInput}
            value={textContent}
            onChangeText={setTextContent}
            placeholder="Type your text..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            autoFocus
            selectionColor={colors.primary}
          />

          {/* Color swatches */}
          <Text style={styles.textModalSection}>Color</Text>
          <View style={styles.colorSwatches}>
            {["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f97316"].map(c => (
              <TouchableOpacity key={c} onPress={() => setTextColor(c)}
                style={[styles.swatch, { backgroundColor: c }, textColor === c && styles.swatchActive]} />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0d0d14" },

    // Header
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    hBtn: { padding: 6 },
    hTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    exportBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
    exportBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

    // Preview
    preview: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", position: "relative" },
    previewEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    previewEmptyTxt: { fontSize: 13, color: colors.border, fontFamily: "Inter_400Regular" },
    textOverlay: { alignItems: "center", justifyContent: "center" },
    previewText: { textAlign: "center", paddingHorizontal: 12, fontFamily: "Inter_700Bold" },
    timeBadge: { position: "absolute", bottom: 7, right: 8, backgroundColor: "#00000099", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
    timeBadgeTxt: { fontSize: 11, color: "#fff", fontFamily: "Inter_500Medium" },

    // Playback
    playbackRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    pBtn: { padding: 10, opacity: 0.85 },
    playPause: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },

    // Timeline
    timelineWrap: { flex: 1, position: "relative", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    ruler: { height: 22, position: "relative", width: "100%" },
    rulerTick: { position: "absolute", top: 2, width: 1, height: 8, backgroundColor: colors.border },
    rulerLbl: { position: "absolute", top: 10, fontSize: 8, color: colors.mutedForeground, fontFamily: "Inter_400Regular", left: 2 },
    track: { height: TRACK_H + 4, position: "relative", width: "100%" },
    clipOuter: { position: "absolute", top: 4, height: TRACK_H - 4, flexDirection: "row", alignItems: "stretch" },
    clipBody: { flex: 1, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, overflow: "hidden", borderWidth: 1 },
    clipThumb: { width: 28, height: 28, borderRadius: 4, marginRight: 2 },
    clipTxt: { fontSize: 9, fontFamily: "Inter_600SemiBold", flex: 1 },
    clipDurTxt: { fontSize: 8, fontFamily: "Inter_400Regular", opacity: 0.7 },
    trimHandle: { width: HANDLE_W, borderRadius: 4, alignItems: "center", justifyContent: "center" },
    trimHandleL: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
    trimHandleR: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    trimGrip: { width: 2, height: 20, backgroundColor: "#ffffff88", borderRadius: 1 },
    playheadFixed: { position: "absolute", top: 0, bottom: 0, left: SCREEN_W / 2 - 1, width: 2, zIndex: 30, pointerEvents: "none" as any },
    playheadFixedHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginLeft: -5 },
    playheadFixedLine: { flex: 1, width: 2, backgroundColor: colors.primary },
    tlEmpty: { paddingTop: 16, alignItems: "center" },
    tlEmptyTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },

    // Quick actions
    quickActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 8, paddingHorizontal: 4, backgroundColor: "#16161f", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    qaBtn: { alignItems: "center", gap: 3, paddingHorizontal: 8 },
    qaLbl: { fontSize: 10, color: colors.foreground, fontFamily: "Inter_500Medium" },

    // Upload
    uploadBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.primary },
    uploadTrack: { flex: 1, height: 4, backgroundColor: "#ffffff44", borderRadius: 2, overflow: "hidden" },
    uploadFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
    uploadPctTxt: { fontSize: 11, color: "#fff", fontFamily: "Inter_600SemiBold", width: 30 },

    // Bottom toolbar
    toolbar: { backgroundColor: "#12121a", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    tabStrip: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    tab: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 2 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabLbl: { fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    tabContent: { paddingVertical: 10 },
    addRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 8 },
    addBtn: { alignItems: "center", gap: 5 },
    addIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    addLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },

    // Speed tab
    speedRow: { paddingHorizontal: 16, gap: 10 },
    speedLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6, textTransform: "uppercase" },
    speedChips: { flexDirection: "row", gap: 8 },
    speedChip: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#1e1e2e", borderWidth: 1, borderColor: colors.border },
    speedChipActive: { backgroundColor: colors.primary + "22", borderColor: colors.primary },
    speedChipTxt: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" },
    speedChipTxtActive: { color: colors.primary },
    volRow: { gap: 6, marginTop: 4 },
    volLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6, textTransform: "uppercase" },
    volSliderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    volTrack: { flex: 1, height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "visible", justifyContent: "center" },
    volFill: { position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3, backgroundColor: colors.primary },
    volThumb: { position: "absolute", width: 18, height: 18, borderRadius: 9, marginLeft: -9, top: -6, backgroundColor: colors.primary },
    volPct: { fontSize: 11, color: colors.foreground, fontFamily: "Inter_600SemiBold", width: 36 },

    // Text modal
    textModal: { flex: 1, backgroundColor: "#0d0d14", paddingTop: 16 },
    textModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    textModalTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    textModalPreview: { margin: 16, borderRadius: 12, height: 100, alignItems: "center", justifyContent: "center" },
    textModalInput: { marginHorizontal: 16, padding: 14, backgroundColor: "#1e1e2e", borderRadius: 12, fontSize: 16, color: colors.foreground, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border },
    textModalSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
    colorSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
    swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent" },
    swatchActive: { borderColor: colors.primary },
  });
}
