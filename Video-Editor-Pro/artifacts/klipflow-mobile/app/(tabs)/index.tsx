import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useListProjects, useGetDashboardStats } from "@workspace/api-client-react";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@workspace/api-client-react";

export default function ProjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const {
    data: projects,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useListProjects();

  const { data: stats } = useGetDashboardStats();

  const handleNewProject = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/new-project");
  }, []);

  const handleProjectPress = useCallback((id: number) => {
    router.push(`/project/${id}`);
  }, []);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalProjects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.draftProjects}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedProjects}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      )}
      <Text style={styles.sectionLabel}>All Projects</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="film" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first video project to get started
      </Text>
      <TouchableOpacity
        style={styles.emptyCreateBtn}
        onPress={handleNewProject}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={styles.emptyCreateText}>New Project</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "web" ? 67 : insets.top + 16,
          },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>KlipFlow</Text>
          <Text style={styles.headerSubtitle}>Your video projects</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNewProject}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.errorState}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={styles.errorTitle}>Couldn't load projects</Text>
          <Text style={styles.errorSubtitle}>Check your connection</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects as Project[]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => handleProjectPress(item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            !projects?.length && styles.listContentEmpty,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 100 : 80),
            },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    errorState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    errorSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    retryText: {
      color: colors.primaryForeground,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
    },
    listContent: {
      padding: 16,
      gap: 10,
    },
    listContentEmpty: {
      flex: 1,
    },
    separator: {
      height: 10,
    },
    listHeader: {
      marginBottom: 16,
      gap: 16,
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: "Inter_600SemiBold",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
    emptyCreateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      backgroundColor: colors.primary,
      borderRadius: 14,
    },
    emptyCreateText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
