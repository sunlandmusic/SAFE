import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import DockPianoXL from './app/Dock-PianoXL';

export default function App() {
  useEffect(() => {
    // Lock the screen to landscape orientation
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    lockOrientation();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <DockPianoXL />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
