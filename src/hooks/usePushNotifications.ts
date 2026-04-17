'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  registerPushNotifications,
  onPushReceived,
  onPushTapped,
} from '@/lib/push-notifications'

/**
 * Gebruik deze hook in je root layout (dashboard).
 * Vraagt toestemming, registreert het apparaat en slaat het token op in Supabase.
 */
export function usePushNotifications(userId: string | null) {
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    async function setup() {
      const token = await registerPushNotifications()

      // Sla het token op in Supabase zodat je via Edge Functions kunt pushen
      if (token) {
        await supabase
          .from('push_tokens')
          .upsert({ user_id: userId, token, platform: getPlatform() }, { onConflict: 'user_id' })
      }

      // Notificatie ontvangen terwijl app open is
      await onPushReceived((title, body) => {
        console.log('[Push ontvangen]', title, body)
        // Hier kun je een in-app toast tonen
      })

      // Gebruiker tikt op notificatie
      await onPushTapped((data) => {
        console.log('[Push getapt]', data)
        // Bijv. navigeer naar het juiste scherm op basis van data.type
        if (data.type === 'match') {
          window.location.href = '/dashboard/matches'
        } else if (data.type === 'message') {
          window.location.href = `/dashboard/berichten/${data.matchId}`
        }
      })
    }

    setup()
  }, [userId])
}

function getPlatform(): string {
  if (typeof window === 'undefined') return 'web'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'web'
}
