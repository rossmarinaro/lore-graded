import React from "react";
import { Text } from "react-native";
import { Panel, ActionButton } from "../components/Controls";
import { styles } from "../components/theme";
import { useQueueStatus } from "../contexts/QueueStatusContext";
import { useNavigation } from "../contexts/NavigationContext";
export function QueueScreen() {
  const queue = useQueueStatus();
  const { navigateTo } = useNavigation();
  return (
    <Panel>
      <Text style={styles.title}>The Sunday Drop</Text>
      <Text style={styles.heading}>{queue.countdownLabel}</Text>
      <Text style={styles.body}>
        Public launch: November 15, 2026 at 8 PM Eastern. Each Sunday after
        launch: 500 cards, up to 10 per collector.
      </Text>
      <Text style={styles.body}>
        1. Draft your cards.{"\n"}2. Join the queue at 8 PM Eastern.{"\n"}3. Pay
        within 15 minutes once a slot is allocated and checkout is available.
      </Text>
      <Text style={styles.muted}>
        This review build displays the schedule only. It cannot allocate queue
        places or accept payments.
      </Text>
      <ActionButton
        label="Prepare a local draft"
        onPress={() => navigateTo("/account/")}
      />
    </Panel>
  );
}
