import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syedumar.microledger',
  appName: 'MicroLedger',
  webDir: 'dist',
  android: { backgroundColor: '#FFF8EE' },
  plugins: { SystemBars: { insetsHandling: 'native' } }
};

export default config;
