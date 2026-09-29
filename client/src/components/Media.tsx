import React from "react";
import { Image, Linking, Text, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { resolveAssetUri } from "../services/assetResolver";
import { styles } from "./theme";
import { ActionButton } from "./Controls";
export function Artwork({
  source,
  label,
  pagePath = "/",
  height = 300,
}: {
  source: string;
  label: string;
  pagePath?: string;
  height?: number;
}) {
  return (
    <Image
      accessibilityLabel={label}
      source={{ uri: resolveAssetUri(source, pagePath) }}
      style={{ width: "100%", height }}
      resizeMode="contain"
    />
  );
}
export function Film({
  source,
  pagePath = "/",
}: {
  source: string;
  pagePath?: string;
}) {
  const player = useVideoPlayer(resolveAssetUri(source, pagePath));
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={{ width: "100%", height: 320 }}
    />
  );
}
export function DownloadLink({
  source,
  label,
  pagePath = "/",
}: {
  source: string;
  label: string;
  pagePath?: string;
}) {
  return (
    <ActionButton
      secondary
      label={label}
      onPress={() => {
        void Linking.openURL(resolveAssetUri(source, pagePath));
      }}
    />
  );
}
