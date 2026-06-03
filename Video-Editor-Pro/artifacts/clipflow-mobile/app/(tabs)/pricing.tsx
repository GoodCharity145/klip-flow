import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useListPlans } from "@workspace/api-client-react";
import type { Plan } from "@workspace/api-client-react";

export default function PricingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: plans, isLoading, isError, refetch } = useListPlans();

  const styles = makeStyles(colors, insets);

  const renderPlan = ({ item }: { item: Plan }) => {
    const isPopular = item.popular;
    const isFree = item.price === 0;

    return (
      <View style={[styles.planCard, isPopular && styles.planCardPopular]}>
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>
              {isFree ? "Free" : `$${item.price}`}
            </Text>
            {!isFree && <Text style={styles.pricePeriod}>/mo</Text>}
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {item.features.map((f: string, i: number) => (
            <View key={i} style={styles.featureRow}>
              <Feather
                name="check"
                size={16}
                color={colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          {!item.hasAIFeatures && (
            <View style={styles.featureRow}>
              <Feather
                name="x"
                size={16}
                color={colors.mutedForeground}
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, styles.featureMuted]}>
                Advanced AI Tools
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, isPopular && styles.ctaButtonPrimary]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaButtonText,
              isPopular && styles.ctaButtonTextPrimary,
            ]}
          >
            {isFree ? "Get Started Free" : "Upgrade"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Plans</Text>
        <Text style={styles.headerSubtitle}>
          Pro editing power. Without the pro price tag.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={styles.errorText}>Unable to load plans</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPlan}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
          ]}
          showsVerticalScrollIndicator={false}
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
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
      fontFamily: "Inter_400Regular",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    errorText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
    },
    listContent: {
      padding: 16,
      gap: 16,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    planCardPopular: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    popularBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 12,
    },
    popularText: {
      color: colors.primaryForeground,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
      fontFamily: "Inter_700Bold",
    },
    planHeader: {
      marginBottom: 16,
    },
    planName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 2,
    },
    priceAmount: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    pricePeriod: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    featuresContainer: {
      gap: 10,
      marginBottom: 20,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    featureIcon: {
      marginRight: 10,
      width: 20,
    },
    featureText: {
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
      fontFamily: "Inter_400Regular",
    },
    featureMuted: {
      color: colors.mutedForeground,
    },
    ctaButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    ctaButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    ctaButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    ctaButtonTextPrimary: {
      color: colors.primaryForeground,
    },
  });
}
