import React, { useState } from "react";
import { Text } from "react-native";
import { Panel, Field, ActionButton } from "../components/Controls";
import { styles } from "../components/theme";
import { useNavigation } from "../contexts/NavigationContext";
const SAMPLE_CERTIFICATION_NUMBER = "LORE-2026-F01-184SP-001";
export function VerificationScreen() {
  const [certificationNumber, setCertificationNumber] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const { navigateTo } = useNavigation();
  function verify(number = certificationNumber) {
    setVerificationMessage(
      !number.trim()
        ? "Enter a certification number."
        : number.trim().toUpperCase() === SAMPLE_CERTIFICATION_NUMBER
          ? "Sample: 1999 Pokémon Base Set Charizard #4/102 · 10 Gold Legendary. Demonstration only; not an authentication result."
          : "No matching sample record. Live certification records are not connected.",
    );
  }
  return (
    <Panel>
      <Text style={styles.title}>Verify a card</Text>
      <Field
        label="Certification number"
        value={certificationNumber}
        onChangeText={(value) => {
          setCertificationNumber(value);
          setVerificationMessage("");
        }}
      />
      <ActionButton label="Check sample registry" onPress={() => verify()} />
      <ActionButton
        secondary
        label="Try sample certificate"
        onPress={() => {
          setCertificationNumber(SAMPLE_CERTIFICATION_NUMBER);
          verify(SAMPLE_CERTIFICATION_NUMBER);
        }}
      />
      <Text accessibilityLiveRegion="polite" style={styles.body}>
        {verificationMessage}
      </Text>
      <ActionButton
        secondary
        label="Open illustrated sample"
        onPress={() => navigateTo("/verify/sample.html")}
      />
    </Panel>
  );
}
