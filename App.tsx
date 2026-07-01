import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ProgressRing } from './src/components/ProgressRing';
import { useFocusTimer } from './src/hooks/useFocusTimer';
import { LiveActivity } from './src/native/LiveActivity';

const DURATIONS = [15, 25, 45, 60];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'running':
      return 'Focusing';
    case 'paused':
      return 'Paused';
    case 'finished':
      return 'Complete';
    default:
      return 'Ready';
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FocusScreen />
    </SafeAreaProvider>
  );
}

function FocusScreen() {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const { status, remainingSeconds, totalSeconds, start, pause, resume, reset } =
    useFocusTimer(durationMinutes);

  const progress = 1 - remainingSeconds / totalSeconds;
  const canPickDuration = status === 'idle' || status === 'finished';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>FocusPulse</Text>
        <Text style={styles.subtitle}>
          Lock your phone during a session to see the countdown live in the
          Dynamic Island.
        </Text>

        <View style={styles.durationRow}>
          {DURATIONS.map(minutes => (
            <Pressable
              key={minutes}
              disabled={!canPickDuration}
              onPress={() => setDurationMinutes(minutes)}
              style={[
                styles.chip,
                durationMinutes === minutes && styles.chipActive,
                !canPickDuration && styles.chipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  durationMinutes === minutes && styles.chipTextActive,
                ]}
              >
                {minutes}m
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.ringWrapper}>
          <ProgressRing
            progress={Math.min(1, Math.max(0, progress))}
            label={formatTime(remainingSeconds)}
            sublabel={statusLabel(status)}
          />
        </View>

        <View style={styles.actionsRow}>
          {status === 'idle' || status === 'finished' ? (
            <Pressable style={styles.primaryButton} onPress={start}>
              <Text style={styles.primaryButtonText}>Start Focus Session</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.secondaryButton}
                onPress={status === 'running' ? pause : resume}
              >
                <Text style={styles.secondaryButtonText}>
                  {status === 'running' ? 'Pause' : 'Resume'}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={reset}>
                <Text style={styles.secondaryButtonText}>End</Text>
              </Pressable>
            </>
          )}
        </View>

        {Platform.OS === 'ios' && !LiveActivity.isSupported && (
          <Text style={styles.warning}>
            Live Activities need iOS 16.2+ and a physical device or simulator
            with Dynamic Island support.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 36 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  chipActive: { backgroundColor: '#FF8A00', borderColor: '#FF8A00' },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: '#fff', fontWeight: '600' },
  chipTextActive: { color: '#000' },
  ringWrapper: { marginVertical: 12 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 40 },
  primaryButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
  },
  primaryButtonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3A3A3C',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
  },
  secondaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  warning: {
    color: '#FF453A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
