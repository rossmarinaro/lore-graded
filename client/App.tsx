import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StatusBar,
} from "react-native";
import {
  NavigationProvider,
  useNavigation,
} from "./src/contexts/NavigationContext";
import { SubmissionDraftProvider } from "./src/contexts/SubmissionDraftContext";
import {
  QueueStatusProvider,
  useQueueStatus,
} from "./src/contexts/QueueStatusContext";
import { ActionButton } from "./src/components/Controls";
import { styles } from "./src/components/theme";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SubmissionScreen } from "./src/screens/SubmissionScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { QueueScreen } from "./src/screens/QueueScreen";
import { VerificationScreen } from "./src/screens/VerificationScreen";
import { ContentScreen } from "./src/screens/ContentScreen";
import { RouteDirectoryScreen } from "./src/screens/RouteDirectoryScreen";
import {
  resolveAssetUri,
  assetConfigurationWarning,
} from "./src/services/assetResolver";
function CountdownBanner() {
  const { countdownLabel, isBeforeLaunch } = useQueueStatus();
  return (
    <Text style={styles.muted}>
      {isBeforeLaunch ? "Public launch" : "Next Sunday drop"} · {countdownLabel}{" "}
      · 8 PM Eastern
    </Text>
  );
}
function Screen() {
  const { currentRoute } = useNavigation();
  const path = currentRoute.split(/[?#]/)[0];
  if (path === "/") return <HomeScreen />;
  if (path === "/account/" || path === "/account/index.html")
    return <SubmissionScreen />;
  if (path === "/account/orders.html") return <OrdersScreen />;
  if (path === "/weekly-queue") return <QueueScreen />;
  if (path === "/verify") return <VerificationScreen />;
  if (path === "/directory") return <RouteDirectoryScreen />;
  return <ContentScreen route={currentRoute} />;
}
function ClientShell() {
  const { navigateTo, currentRoute } = useNavigation();
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Image
            source={{
              uri: resolveAssetUri("/assets/lore/lore-approved-gold-logo.png"),
            }}
            accessibilityLabel="LORE"
            style={{ width: 160, height: 72 }}
            resizeMode="contain"
          />
          <Image
            source={{
              uri: resolveAssetUri("/assets/lore/tcg-grading-gold-198.png"),
            }}
            accessibilityLabel="TCG Grading"
            style={{ width: 200, height: 65 }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.muted}>
          REFACTOR REVIEW · Separate from the live website
        </Text>
        <CountdownBanner />
        <View style={styles.row}>
          {[
            { label: "Home", path: "/" },
            { label: "Submit", path: "/account/" },
            { label: "Verify", path: "/verify" },
            { label: "Weekly queue", path: "/weekly-queue" },
            { label: "Gold lounge", path: "/gold-club/" },
            { label: "All pages", path: "/directory" },
          ].map((item) => (
            <ActionButton
              key={item.path}
              label={item.label}
              secondary={currentRoute !== item.path}
              onPress={() => navigateTo(item.path)}
            />
          ))}
        </View>
        {assetConfigurationWarning() && (
          <Text style={styles.error}>{assetConfigurationWarning()}</Text>
        )}
        <View key={currentRoute} style={{ gap: 20 }}>
          <Screen />
        </View>
        <Text style={styles.muted}>LORE · Your cards. Your realm.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <NavigationProvider>
      <SubmissionDraftProvider>
        <QueueStatusProvider>
          <ClientShell />
        </QueueStatusProvider>
      </SubmissionDraftProvider>
    </NavigationProvider>
  );
}
