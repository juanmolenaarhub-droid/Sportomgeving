export type MediaItem = {
  url: string
  type: 'video' | 'image'
  thumbnail_url?: string | null
}

export type PlayPost = {
  id: string
  user_id: string
  content: string
  sport_tags: string[]
  media_items: MediaItem[]
  /** primary media type (derived from first media_item) */
  primary_type: 'video' | 'image'
  likes_count: number
  comments_count: number
  view_count: number
  created_at: string
  // profile info (fetched separately and merged)
  displayName: string
  username: string
  avatar_url: string | null
  region: string | null
}

/** Normalise a raw Supabase posts row into a PlayPost */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePost(row: any, profile?: any): PlayPost {
  // Build media_items array
  let mediaItems: MediaItem[] = []

  if (Array.isArray(row.media_items) && row.media_items.length > 0) {
    mediaItems = row.media_items as MediaItem[]
  } else if (row.media_url) {
    mediaItems = [{
      url:           row.media_url,
      type:          (row.media_type === 'video' ? 'video' : 'image') as 'video' | 'image',
      thumbnail_url: row.thumbnail_url ?? null,
    }]
  }

  const prof = profile ?? (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)
  const displayName = prof?.full_name ?? prof?.username ?? 'Gebruiker'
  const username    = prof?.username ?? displayName.toLowerCase().replace(/\s+/g, '_')

  return {
    id:            row.id,
    user_id:       row.user_id,
    content:       row.content ?? '',
    sport_tags:    Array.isArray(row.sport_tags) && row.sport_tags.length > 0
                     ? row.sport_tags
                     : row.sport_tag ? [row.sport_tag] : [],
    media_items:   mediaItems,
    primary_type:  mediaItems[0]?.type === 'video' ? 'video' : 'image',
    likes_count:   row.likes_count ?? 0,
    comments_count: row.comments_count ?? 0,
    view_count:    row.view_count ?? 0,
    created_at:    row.created_at,
    displayName,
    username,
    avatar_url:    prof?.avatar_url ?? null,
    region:        prof?.region ?? null,
  }
}
