import React from "react";
import { Text, View } from "react-native";
import { Panel, ActionButton } from "../components/Controls";
import { styles } from "../components/theme";
import { Artwork } from "../components/Media";
import { useNavigation } from "../contexts/NavigationContext";
export function HomeScreen() {
  const { navigateTo } = useNavigation();
  return (
    <View style={{ gap: 24 }}>
      <Panel>
        <Text style={styles.muted}>
          TCG GRADING · BUILT FOR TRADING CARD GAMES
        </Text>
        <Text style={styles.title}>FAST TURNAROUND. GUARANTEED.</Text>
        <Text style={styles.body}>
          We care about TCG. LORE grades trading card game cards only. No sports
          cards.
        </Text>
        <View style={styles.row}>
          <ActionButton
            label="Prepare your submission"
            onPress={() => navigateTo("/account/")}
          />
          <ActionButton
            secondary
            label="How the Sunday Drop works"
            onPress={() => navigateTo("/weekly-queue")}
          />
        </View>
      </Panel>
      <View style={styles.row}>
        {[
          { name: "Standard", price: 50, days: "14 business days" },
          { name: "Express", price: 75, days: "5 business days" },
          { name: "Gold Founders", price: 125, days: "2–4 business days" },
        ].map((service) => (
          <View key={service.name} style={{ flexGrow: 1, minWidth: 230 }}>
            <Panel>
              <Text style={styles.heading}>{service.name}</Text>
              <Text style={styles.title}>${service.price}</Text>
              <Text style={styles.body}>{service.days} · Guaranteed</Text>
              <Text style={styles.muted}>
                {service.name === "Gold Founders"
                  ? "Membership required. "
                  : ""}
                Shipping and handling separate.
              </Text>
            </Panel>
          </View>
        ))}
      </View>
      <Panel>
        <Text style={styles.heading}>500 cards total. Each week.</Text>
        <Text style={styles.body}>
          Prepare up to 10 cards. Each Sunday after launch, join the queue at 8
          PM Eastern. A draft does not reserve a place.
        </Text>
      </Panel>
      <Panel>
        <Text style={styles.heading}>Security details. Up close.</Text>
        <Text style={styles.body}>
          Black-light signature · Fingerprint identification · QR record access
          · Unique serial number
        </Text>
        <ActionButton
          label="Explore verification"
          onPress={() => navigateTo("/verify")}
        />
      </Panel>
      <Artwork
        source="/assets/lore/packaging/ship-to-display.webp"
        label="LORE premium packaging"
      />
      <ActionButton
        secondary
        label="Review all original homepage content"
        onPress={() => navigateTo("/index.html")}
      />
    </View>
  );
}
