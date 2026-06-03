import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const PRIVACY_URL = "https://clipflow.app/privacy";
const SUPPORT_EMAIL = "support@clipflow.app";

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive }: SettingsRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, destructive && styles.rowIconWrapDestructive]}>
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={18}
            color={destructive ? colors.destructive : colors.primary}
          />
        </View>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Settings</Text>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Feather name="user" size={32} color={colors.primary} />
        </View>
        <Text style={styles.profileName}>Video Creator</Text>
        <Text style={styles.profileEmail}>Sign in to sync your projects</Text>
        <TouchableOpacity style={styles.signInButton} activeOpacity={0.8}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <SettingsRow icon="credit-card" label="Billing & Plans" onPress={() => {}} />
        <SettingsRow icon="download" label="Export History" onPress={() => {}} />
      </View>

      <Text style={styles.sectionTitle}>App</Text>
      <View style={styles.section}>
        <SettingsRow icon="info" label="Version" value="1.0.0" />
        <SettingsRow
          icon="globe"
          label="Website"
          onPress={() => Linking.openURL("https://clipflow.app")}
        />
        <SettingsRow
          icon="help-circle"
          label="Support"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          onPress={() =>
            Linking.canOpenURL(PRIVACY_URL).then((ok) => {
              if (ok) Linking.openURL(PRIVACY_URL);
              else Alert.alert("Cannot open URL", PRIVACY_URL);
            })
          }
        />
        <SettingsRow
          icon="file-text"
          label="Terms of Service"
          onPress={() => Linking.openURL("https://clipflow.app/terms")}
        />
      </View>

      <Text style={styles.sectionTitle}>Storage</Text>
      <View style={styles.section}>
        <View style={styles.storageSection}>
          <SettingsRow icon="hard-drive" label="Storage Used" value="—" />
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "0%" }]} />
          </View>
          <Text style={styles.storageLabel}>Connect account to track usage</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 24,
    },
    profileSection: {
      alignItems: "center",
      paddingVertical: 24,
      marginBottom: 24,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    profileEmail: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      marginBottom: 16,
    },
    signInButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    signInText: {
      color: colors.primaryForeground,
      fontWeight: "600",
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 24,
      fontFamily: "Inter_600SemiBold",
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    rowIconWrapDestructive: {
      backgroundColor: colors.destructive + "20",
    },
    rowLabel: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    rowLabelDestructive: {
      color: colors.destructive,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rowValue: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    storageSection: {
      padding: 16,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.muted,
      borderRadius: 3,
      marginTop: 12,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    storageLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 8,
      fontFamily: "Inter_400Regular",
    },
  });
}
