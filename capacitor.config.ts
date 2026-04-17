import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nl.buddys.app',
  appName: 'Buddys',

  // De app laadt je live Vercel-deployment in een native WebView.
  // Vervang de URL hieronder met jouw eigen Vercel URL.
  server: {
    url: 'https://JOUW-VERCEL-URL.vercel.app',
    cleartext: false,
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#F5F0E8',
    scheme: 'Buddys',
  },

  android: {
    backgroundColor: '#F5F0E8',
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
