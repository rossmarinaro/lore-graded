import React, { useState, type PropsWithChildren } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  Modal,
  ScrollView,
} from "react-native";
import { styles } from "./theme";
export function ActionButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Panel({ children }: PropsWithChildren) {
  return <View style={styles.panel}>{children}</View>;
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.body}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#929cb0"
        keyboardType={keyboardType}
      />
    </View>
  );
}
export function ChoicePicker({
  label,
  value,
  options,
  onSelect,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.body}>{label}</Text>
      <ActionButton
        label={
          options.find((option) => option.value === value)?.label ?? "Choose…"
        }
        onPress={() => setOpen(true)}
        disabled={disabled}
        secondary
      />
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000b",
            padding: 24,
            justifyContent: "center",
          }}
        >
          <View style={[styles.panel, { maxHeight: "85%" }]}>
            <Text style={styles.heading}>{label}</Text>
            <Field
              label="Filter choices"
              value={query}
              onChangeText={setQuery}
            />
            <ScrollView>
              <View style={{ gap: 8 }}>
                {visible.slice(0, 100).map((option) => (
                  <ActionButton
                    key={option.value}
                    label={option.label}
                    secondary
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  />
                ))}
                {visible.length > 100 && (
                  <Text style={styles.muted}>
                    Type more to narrow these choices.
                  </Text>
                )}
              </View>
            </ScrollView>
            <ActionButton label="Close" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
