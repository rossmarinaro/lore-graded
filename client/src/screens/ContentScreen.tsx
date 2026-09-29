import React from "react";
import { Text, View } from "react-native";
import pageData from "../data/pages.json";
import type { ContentPage } from "../domain/types";
import { ContentRenderer } from "../components/ContentRenderer";
import { styles } from "../components/theme";
import { contentPathForRoute } from "../domain/routes";
export const contentPages = pageData as unknown as Record<string, ContentPage>;
export function ContentScreen({ route }: { route: string }) {
  const path = contentPathForRoute(route);
  const page = contentPages[path];
  if (!page)
    return (
      <Text style={styles.body}>
        This route is not present in the supplied source export.
      </Text>
    );
  return (
    <View style={{ gap: 18 }}>
      {page.requiresBehaviorMigration && (
        <Text style={styles.muted}>
          Content review: this page’s original scripted interactions have not
          yet been migrated.
        </Text>
      )}
      <ContentRenderer node={page.content} pagePath={path} />
    </View>
  );
}
