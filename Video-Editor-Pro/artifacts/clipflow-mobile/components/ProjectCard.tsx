import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Project } from "@workspace/api-client-react";

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  completed: "#22c55e",
  archived: "#6b7280",
};

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const statusColor = STATUS_COLORS[project.status] ?? colors.mutedForeground;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnail}>
        <Feather name="film" size={28} color={colors.primary} />
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        {project.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {project.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>{formatDuration(project.duration)}</Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <View style={styles.metaItem}>
            <Feather name="layers" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>{project.clipCount} clips</Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{project.resolution}</Text>
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.date}>{formatDate(project.createdAt)}</Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    statusDot: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    info: { flex: 1, gap: 4 },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    description: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    metaText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    metaDot: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    trailing: {
      alignItems: "flex-end",
      gap: 6,
    },
    date: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });
}
