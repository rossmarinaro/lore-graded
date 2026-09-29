import React from "react";
import { Text } from "react-native";
import { Panel, ActionButton } from "../components/Controls";
import { styles } from "../components/theme";
import { useSubmissionDrafts } from "../contexts/SubmissionDraftContext";
import { useNavigation } from "../contexts/NavigationContext";
export function OrdersScreen() {
  const { selectedDraft } = useSubmissionDrafts();
  const { navigateTo } = useNavigation();
  const rates = { standard: 50, express: 75, founders: 125 };
  return (
    <Panel>
      <Text style={styles.title}>Review your draft</Text>
      {selectedDraft ? (
        <>
          <Text style={styles.heading}>{selectedDraft.title}</Text>
          <Text style={styles.body}>
            {selectedDraft.cards.length} cards · {selectedDraft.serviceLevel}
          </Text>
          <Text style={styles.title}>
            ${selectedDraft.cards.length * rates[selectedDraft.serviceLevel]}{" "}
            grading estimate
          </Text>
          <Text style={styles.body}>
            Shipping, handling, coverage and taxes are separate. Founder pricing
            requires verified membership.
          </Text>
        </>
      ) : (
        <Text style={styles.body}>
          Create and select a draft to review its grading estimate.
        </Text>
      )}
      <Text style={styles.muted}>
        The original backend owns quotes, order requests, queue allocation and
        checkout. Those actions are not connected in this isolated refactor.
      </Text>
      <ActionButton
        label="Return to drafts"
        onPress={() => navigateTo("/account/")}
      />
    </Panel>
  );
}
