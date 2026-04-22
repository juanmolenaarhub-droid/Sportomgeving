import { Capacitor } from '@capacitor/core'

// Alleen laden als we in een native app zitten (niet in de browser)
async function getPushPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  const { PushNotifications } = await import('@capacitor/push-notifications')
  return PushNotifications
}

/**
 * Vraag toestemming voor push notificaties en registreer het apparaat.
 * Geeft het FCM/APNs token terug zodat je het in Supabase kunt opslaan.
 */
export async function registerPushNotifications(): Promise<string | null> {
  const Push = await getPushPlugin()
  if (!Push) return null

  const permission = await Push.requestPermissions()
  if (permission.receive !== 'granted') return null

  await Push.register()

  return new Promise((resolve) => {
    Push.addListener('registration', (token) => {
      resolve(token.value)
    })

    Push.addListener('registrationError', (err) => {
      console.error('[Push] Registratiefout:', err)
      resolve(null)
    })
  })
}

/**
 * Luister naar inkomende notificaties terwijl de app open is.
 */
export async function onPushReceived(
  callback: (title: string, body: string, data: Record<string, unknown>) => void
) {
  const Push = await getPushPlugin()
  if (!Push) return

  Push.addListener('pushNotificationReceived', (notification) => {
    callback(
      notification.title ?? '',
      notification.body ?? '',
      (notification.data ?? {}) as Record<string, unknown>
    )
  })
}

/**
 * Luister naar taps op notificaties (app was op de achtergrond).
 */
export async function onPushTapped(
  callback: (data: Record<string, unknown>) => void
) {
  const Push = await getPushPlugin()
  if (!Push) return

  Push.addListener('pushNotificationActionPerformed', (action) => {
    callback((action.notification.data ?? {}) as Record<string, unknown>)
  })
}
