import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCreateProject, useListProjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3"] as const;
const RESOLUTIONS = ["720p", "1080p", "4K"] as const;

type AspectRatio = (typeof ASPECT_RATIOS)[number];
type Resolution = (typeof RESOLUTIONS)[number];

export default function NewProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("1080p");

  const { mutateAsync: createProject, isPending } = useCreateProject();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Project Name Required", "Please enter a name for your project.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createProject({
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          aspectRatio,
          resolution,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["listProjects"] });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Project</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isPending || !name.trim()}
          style={[
            styles.createBtn,
            (!name.trim() || isPending) && styles.createBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.createText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My Awesome Video"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this project about?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Aspect Ratio</Text>
          <View style={styles.chipRow}>
            {ASPECT_RATIOS.map((ar) => (
              <TouchableOpacity
                key={ar}
                style={[styles.chip, aspectRatio === ar && styles.chipActive]}
                onPress={() => setAspectRatio(ar)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    aspectRatio === ar && styles.chipTextActive,
                  ]}
                >
                  {ar}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Resolution</Text>
          <View style={styles.chipRow}>
            {RESOLUTIONS.map((res) => (
              <TouchableOpacity
                key={res}
                style={[styles.chip, resolution === res && styles.chipActive]}
                onPress={() => setResolution(res)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    resolution === res && styles.chipTextActive,
                  ]}
                >
                  {res}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            After creating, open the full editor on the web to add clips and
            start editing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cancelBtn: { width: 70 },
    cancelText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    navTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    createBtn: {
      width: 70,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    createBtnDisabled: { opacity: 0.4 },
    createText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    content: { padding: 20, gap: 24 },
    field: { gap: 8 },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontFamily: "Inter_600SemiBold",
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    textArea: {
      height: 80,
      paddingTop: 14,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    chipTextActive: {
      color: colors.primaryForeground,
    },
    infoCard: {
      flexDirection: "row",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 14,
      alignItems: "flex-start",
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
  });
}
