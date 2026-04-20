import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nl.buddys.app',
  appName: 'Buddys',

  // De app laadt je live Vercel-deployment in een native WebView.
  // Vervang de URL hieronder met jouw eigen Vercel URL.
  server: {
    url: 'https://sportomgeving.vercel.app',
    cleartext: false,
  },

  ios: {
    contentInset: 'never',
    backgroundColor: '#000000',
    scheme: 'Buddys',
  },

  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F5F0E8',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
