import { NativeModules, Platform } from 'react-native';

type StartOptions = {
  sessionName: string;
  durationSeconds: number;
};

type UpdateOptions = {
  isPaused: boolean;
  remainingSeconds: number;
};

interface LiveActivityNativeModule {
  startActivity(options: StartOptions): Promise<string>;
  updateActivity(options: UpdateOptions): Promise<null>;
  endActivity(): Promise<null>;
}

const NativeLiveActivity: LiveActivityNativeModule | undefined =
  NativeModules.LiveActivityModule;

const isSupported = Platform.OS === 'ios' && NativeLiveActivity != null;

export const LiveActivity = {
  isSupported,

  async start(options: StartOptions): Promise<string | null> {
    if (!isSupported) return null;
    try {
      return await NativeLiveActivity!.startActivity(options);
    } catch (error) {
      console.warn('[LiveActivity] failed to start', error);
      return null;
    }
  },

  async update(options: UpdateOptions): Promise<void> {
    if (!isSupported) return;
    try {
      await NativeLiveActivity!.updateActivity(options);
    } catch (error) {
      console.warn('[LiveActivity] failed to update', error);
    }
  },

  async end(): Promise<void> {
    if (!isSupported) return;
    try {
      await NativeLiveActivity!.endActivity();
    } catch (error) {
      console.warn('[LiveActivity] failed to end', error);
    }
  },
};
