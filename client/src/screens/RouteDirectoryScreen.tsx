import React, { useState } from "react";
import { Text, View } from "react-native";
import { contentPages } from "./ContentScreen";
import { Field, ActionButton } from "../components/Controls";
import { styles } from "../components/theme";
import { useNavigation } from "../contexts/NavigationContext";
export function RouteDirectoryScreen() {
  const [query, setQuery] = useState("");
  const { navigateTo } = useNavigation();
  const pages = Object.values(contentPages).filter((page) =>
    `${page.path} ${page.title}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>Source page directory</Text>
      <Text style={styles.body}>
        All 181 original HTML routes have extracted content. Pages outside the
        dedicated collector flows are content previews; their original
        JavaScript behavior is inventoried separately.
      </Text>
      <Field label="Search pages" value={query} onChangeText={setQuery} />
      {pages.map((page) => (
        <ActionButton
          secondary
          key={page.path}
          label={`${page.title} · ${page.path}`}
          onPress={() => navigateTo(page.path)}
        />
      ))}
    </View>
  );
}
