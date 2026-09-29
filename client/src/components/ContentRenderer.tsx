import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import type { ContentChild, ContentNode } from "../domain/types";
import { useNavigation } from "../contexts/NavigationContext";
import { Artwork, Film, DownloadLink } from "./Media";
import { ActionButton, Panel } from "./Controls";
import { styles } from "./theme";
function plainText(node: ContentChild): string {
  return typeof node === "string"
    ? node
    : node.children.map(plainText).join(" ");
}
function Disclosure({
  node,
  pagePath,
}: {
  node: ContentNode;
  pagePath: string;
}) {
  const [expanded, setExpanded] = useState("open" in node.attributes);
  const summary = node.children.find(
    (child) => typeof child !== "string" && child.tag === "summary",
  );
  return (
    <Panel>
      <ActionButton
        secondary
        label={
          (summary ? plainText(summary) : "Details") + (expanded ? " −" : " +")
        }
        onPress={() => setExpanded(!expanded)}
      />
      {expanded &&
        node.children
          .filter((child) => child !== summary)
          .map((child, index) => (
            <ContentRenderer key={index} node={child} pagePath={pagePath} />
          ))}
    </Panel>
  );
}
/** Semantic native components only. Never inject HTML or execute imported scripts. */
export function ContentRenderer({
  node,
  pagePath,
}: {
  node: ContentChild;
  pagePath: string;
}) {
  const { navigateTo } = useNavigation();
  if (typeof node === "string")
    return <Text style={styles.body}>{node.trim()}</Text>;
  const { tag, attributes, children } = node;
  if ("hidden" in attributes) return null;
  if (
    [
      "script",
      "style",
      "noscript",
      "svg",
      "canvas",
      "template",
      "nav",
      "header",
      "footer",
    ].includes(tag)
  )
    return null;
  if (tag === "img") {
    return attributes.src ? (
      <Artwork
        source={attributes.src}
        label={attributes.alt ?? ""}
        pagePath={pagePath}
      />
    ) : null;
  }
  if (tag === "video") {
    const source =
      attributes.src ??
      children.find(
        (child): child is ContentNode =>
          typeof child !== "string" && child.tag === "source",
      )?.attributes.src;
    return source ? <Film source={source} pagePath={pagePath} /> : null;
  }
  if (tag === "audio") {
    const source =
      attributes.src ??
      children.find(
        (child): child is ContentNode =>
          typeof child !== "string" && child.tag === "source",
      )?.attributes.src;
    return source ? (
      <DownloadLink source={source} label="Open audio" pagePath={pagePath} />
    ) : null;
  }
  if (tag === "iframe")
    return (
      <Text style={styles.muted}>
        Embedded experience requires a platform-specific migration.
      </Text>
    );
  if (tag === "details") return <Disclosure node={node} pagePath={pagePath} />;
  if (tag === "a" && attributes.href) {
    const destination = attributes.href;
    return (
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          navigateTo(
            new URL(destination, "https://lore-refactor.invalid" + pagePath)
              .host === "lore-refactor.invalid"
              ? new URL(destination, "https://lore-refactor.invalid" + pagePath)
                  .pathname +
                  new URL(
                    destination,
                    "https://lore-refactor.invalid" + pagePath,
                  ).hash
              : destination,
          )
        }
      >
        <Text style={styles.link}>
          {plainText(node) || attributes["aria-label"] || "Open"}
        </Text>
      </Pressable>
    );
  }
  if (["input", "select", "textarea", "button", "form"].includes(tag))
    return (
      <View style={styles.panel}>
        <Text style={styles.muted}>
          {tag === "form"
            ? "Original form"
            : plainText(node) ||
              attributes.placeholder ||
              attributes["aria-label"] ||
              "Original control"}{" "}
          · Requires dedicated behavior migration. No action submitted.
        </Text>
      </View>
    );
  if (["source", "track", "option", "br", "hr"].includes(tag)) return null;
  if (/^h[1-6]$/.test(tag))
    return (
      <Text
        accessibilityRole="header"
        style={tag === "h1" ? styles.title : styles.heading}
      >
        {plainText(node)}
      </Text>
    );
  if (
    [
      "p",
      "span",
      "strong",
      "em",
      "b",
      "i",
      "label",
      "small",
      "li",
      "td",
      "th",
      "summary",
    ].includes(tag) &&
    !children.some(
      (child) =>
        typeof child !== "string" &&
        ["img", "video", "a", "details", "button", "input"].includes(child.tag),
    )
  )
    return (
      <Text style={tag === "small" ? styles.muted : styles.body}>
        {tag === "li" ? "• " : ""}
        {plainText(node)}
      </Text>
    );
  return (
    <View
      nativeID={attributes.id ?? undefined}
      style={{
        gap: 12,
        marginVertical: ["section", "article"].includes(tag) ? 12 : 0,
      }}
    >
      {children.map((child, index) => (
        <ContentRenderer key={index} node={child} pagePath={pagePath} />
      ))}
    </View>
  );
}
