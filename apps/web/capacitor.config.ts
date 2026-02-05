import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neonoasis.app',
  appName: 'Neon Oasis',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: { launchShowDuration: 0 },
  },
};

export default config;
