import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function AppScreen() 
{
    const injectedCSS = `
        const style = document.createElement('style');
        style.innerHTML = 'html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background-color: #0a0f1d !important; }';
        document.head.appendChild(style);
        true;
  `;

    const websiteUrl = 'https://loregraded.com';

    if (Platform.OS === 'web') {
      return (
        <iframe 
          src={websiteUrl} 
          style={styles.webview} 
          title="WebView Alternative for Web"
        />
      );
    }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView 
        source={{ uri: websiteUrl }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        injectedJavaScript={injectedCSS}
        backgroundColor="transparent" // Discards white native skeletons
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d', // Your dark site background color
  },
  webviewContainer: {
    backgroundColor: '#0a0f1d',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
});




