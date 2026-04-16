export interface Sport {
  id: string
  label: string
  emoji: string
  category: SportCategory
  popular: boolean
}

export type SportCategory =
  | 'hardlopen_fietsen'
  | 'zwemmen_watersport'
  | 'teamsporten'
  | 'racketsporten'
  | 'vechtsporten'
  | 'fitness_gym'
  | 'outdoor_natuur'
  | 'paardensport'
  | 'wintersport'
  | 'precisie_schieten'
  | 'avontuur_lucht'
  | 'overig'

export const SPORTS: Sport[] = [
  // ── HARDLOPEN & FIETSEN ──────────────────────────────────────────────────
  { id: 'hardlopen',         label: 'Hardlopen',              emoji: '🏃',  category: 'hardlopen_fietsen',   popular: true  },
  { id: 'trailrunning',      label: 'Trailrunning',            emoji: '⛰️',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'ultramarathon',     label: 'Ultramarathon',           emoji: '🏃',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'hindernislopen',    label: 'Hindernislopen / OCR',    emoji: '🚧',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'racewalking',       label: 'Snelwandelen',            emoji: '🚶',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'atletiek',          label: 'Atletiek',                emoji: '🏟️',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'fietsen',           label: 'Fietsen',                 emoji: '🚴',  category: 'hardlopen_fietsen',   popular: true  },
  { id: 'wielrennen',        label: 'Wielrennen',              emoji: '🚴',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'mountainbiken',     label: 'Mountainbiken',           emoji: '🚵',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'gravel_fietsen',    label: 'Gravel Fietsen',          emoji: '🚵',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'cyclocross',        label: 'Cyclocross',              emoji: '🚵',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'bmx',               label: 'BMX',                     emoji: '🚲',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'triathlon',         label: 'Triathlon',               emoji: '🏅',  category: 'hardlopen_fietsen',   popular: true  },
  { id: 'duathlon',          label: 'Duathlon',                emoji: '🏅',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'wandelen',          label: 'Wandelen',                emoji: '🚶',  category: 'hardlopen_fietsen',   popular: true  },
  { id: 'nordic_walking',    label: 'Nordic Walking',          emoji: '🚶',  category: 'hardlopen_fietsen',   popular: false },
  { id: 'orientatielopen',   label: 'Oriëntatielopen',         emoji: '🗺️',  category: 'hardlopen_fietsen',   popular: false },

  // ── ZWEMMEN & WATERSPORT ─────────────────────────────────────────────────
  { id: 'zwemmen',           label: 'Zwemmen',                 emoji: '🏊',  category: 'zwemmen_watersport',  popular: true  },
  { id: 'openwaterzwemmen',  label: 'Openwaterzwemmen',        emoji: '🌊',  category: 'zwemmen_watersport',  popular: false },
  { id: 'waterpolo',         label: 'Waterpolo',               emoji: '🤽',  category: 'zwemmen_watersport',  popular: false },
  { id: 'roeien',            label: 'Roeien',                  emoji: '🚣',  category: 'zwemmen_watersport',  popular: false },
  { id: 'kanoën',            label: 'Kanoën',                  emoji: '🛶',  category: 'zwemmen_watersport',  popular: false },
  { id: 'kayak',             label: 'Kayak',                   emoji: '🛶',  category: 'zwemmen_watersport',  popular: false },
  { id: 'drakenboten',       label: 'Drakenboten',             emoji: '🐉',  category: 'zwemmen_watersport',  popular: false },
  { id: 'surfen',            label: 'Surfen',                  emoji: '🏄',  category: 'zwemmen_watersport',  popular: false },
  { id: 'windsurfen',        label: 'Windsurfen',              emoji: '🏄',  category: 'zwemmen_watersport',  popular: false },
  { id: 'kitesurfen',        label: 'Kitesurfen',              emoji: '🪁',  category: 'zwemmen_watersport',  popular: false },
  { id: 'sup',               label: 'SUP / Paddleboarden',     emoji: '🏄',  category: 'zwemmen_watersport',  popular: false },
  { id: 'wakeboarden',       label: 'Wakeboarden',             emoji: '🏄',  category: 'zwemmen_watersport',  popular: false },
  { id: 'waterski',          label: 'Waterski',                emoji: '🎿',  category: 'zwemmen_watersport',  popular: false },
  { id: 'zeilen',            label: 'Zeilen',                  emoji: '⛵',  category: 'zwemmen_watersport',  popular: false },
  { id: 'duiken',            label: 'Duiken',                  emoji: '🤿',  category: 'zwemmen_watersport',  popular: false },
  { id: 'freediving',        label: 'Freediving',              emoji: '🤿',  category: 'zwemmen_watersport',  popular: false },
  { id: 'snorkelen',         label: 'Snorkelen',               emoji: '🤿',  category: 'zwemmen_watersport',  popular: false },
  { id: 'hengelen',          label: 'Hengelen / Vissen',       emoji: '🎣',  category: 'zwemmen_watersport',  popular: false },
  { id: 'vliegvissen',       label: 'Vliegvissen',             emoji: '🎣',  category: 'zwemmen_watersport',  popular: false },

  // ── TEAMSPORTEN ──────────────────────────────────────────────────────────
  { id: 'voetbal',           label: 'Voetbal',                 emoji: '⚽',  category: 'teamsporten',         popular: true  },
  { id: 'futsal',            label: 'Futsal',                  emoji: '⚽',  category: 'teamsporten',         popular: false },
  { id: 'basketbal',         label: 'Basketbal',               emoji: '🏀',  category: 'teamsporten',         popular: true  },
  { id: 'volleybal',         label: 'Volleybal',               emoji: '🏐',  category: 'teamsporten',         popular: true  },
  { id: 'beachvolleybal',    label: 'Beachvolleybal',          emoji: '🏐',  category: 'teamsporten',         popular: false },
  { id: 'handbal',           label: 'Handbal',                 emoji: '🤾',  category: 'teamsporten',         popular: true  },
  { id: 'hockey',            label: 'Hockey',                  emoji: '🏑',  category: 'teamsporten',         popular: true  },
  { id: 'ijshockey',         label: 'IJshockey',               emoji: '🏒',  category: 'teamsporten',         popular: false },
  { id: 'rugby',             label: 'Rugby',                   emoji: '🏉',  category: 'teamsporten',         popular: false },
  { id: 'american_football', label: 'American Football',       emoji: '🏈',  category: 'teamsporten',         popular: false },
  { id: 'korfbal',           label: 'Korfbal',                 emoji: '🏐',  category: 'teamsporten',         popular: true  },
  { id: 'floorball',         label: 'Floorball',               emoji: '🏒',  category: 'teamsporten',         popular: false },
  { id: 'ultimate_frisbee',  label: 'Ultimate Frisbee',        emoji: '🥏',  category: 'teamsporten',         popular: false },
  { id: 'honkbal',           label: 'Honkbal / Softbal',       emoji: '⚾',  category: 'teamsporten',         popular: false },
  { id: 'cricket',           label: 'Cricket',                 emoji: '🏏',  category: 'teamsporten',         popular: false },
  { id: 'lacrosse',          label: 'Lacrosse',                emoji: '🥍',  category: 'teamsporten',         popular: false },
  { id: 'gaelic_football',   label: 'Gaelic Football',         emoji: '⚽',  category: 'teamsporten',         popular: false },
  { id: 'kabaddi',           label: 'Kabaddi',                 emoji: '🤼',  category: 'teamsporten',         popular: false },

  // ── RACKETSPORTEN ────────────────────────────────────────────────────────
  { id: 'tennis',            label: 'Tennis',                  emoji: '🎾',  category: 'racketsporten',       popular: true  },
  { id: 'padel',             label: 'Padel',                   emoji: '🎾',  category: 'racketsporten',       popular: true  },
  { id: 'squash',            label: 'Squash',                  emoji: '🎾',  category: 'racketsporten',       popular: false },
  { id: 'badminton',         label: 'Badminton',               emoji: '🏸',  category: 'racketsporten',       popular: true  },
  { id: 'tafeltennis',       label: 'Tafeltennis',             emoji: '🏓',  category: 'racketsporten',       popular: false },
  { id: 'pickleball',        label: 'Pickleball',              emoji: '🎾',  category: 'racketsporten',       popular: false },
  { id: 'racquetball',       label: 'Racquetball',             emoji: '🎾',  category: 'racketsporten',       popular: false },

  // ── VECHTSPORTEN ─────────────────────────────────────────────────────────
  { id: 'boksen',            label: 'Boksen',                  emoji: '🥊',  category: 'vechtsporten',        popular: true  },
  { id: 'kickboksen',        label: 'Kickboksen',              emoji: '🥊',  category: 'vechtsporten',        popular: false },
  { id: 'muay_thai',         label: 'Muay Thai',               emoji: '🥊',  category: 'vechtsporten',        popular: false },
  { id: 'mma',               label: 'MMA',                     emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'judo',              label: 'Judo',                    emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'karate',            label: 'Karate',                  emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'taekwondo',         label: 'Taekwondo',               emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'bjj',               label: 'Brazilian Jiu-Jitsu',     emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'jiujitsu',          label: 'Jiu-Jitsu',               emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'worstelen',         label: 'Worstelen',               emoji: '🤼',  category: 'vechtsporten',        popular: false },
  { id: 'aikido',            label: 'Aikido',                  emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'hapkido',           label: 'Hapkido',                 emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'kendo',             label: 'Kendo',                   emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'capoeira',          label: 'Capoeira',                emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'kungfu',            label: 'Kungfu / Wushu',          emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'sambo',             label: 'Sambo',                   emoji: '🥋',  category: 'vechtsporten',        popular: false },
  { id: 'savate',            label: 'Savate',                  emoji: '🥊',  category: 'vechtsporten',        popular: false },
  { id: 'sumo',              label: 'Sumo',                    emoji: '🤼',  category: 'vechtsporten',        popular: false },
  { id: 'ninjutsu',          label: 'Ninjutsu',                emoji: '🥷',  category: 'vechtsporten',        popular: false },

  // ── FITNESS & GYM ────────────────────────────────────────────────────────
  { id: 'fitness',           label: 'Fitness / Gym',           emoji: '💪',  category: 'fitness_gym',         popular: true  },
  { id: 'crossfit',          label: 'CrossFit',                emoji: '🏋️',  category: 'fitness_gym',         popular: false },
  { id: 'powerlifting',      label: 'Powerlifting',            emoji: '🏋️',  category: 'fitness_gym',         popular: false },
  { id: 'weightlifting',     label: 'Gewichtheffen',           emoji: '🏋️',  category: 'fitness_gym',         popular: false },
  { id: 'calisthenics',      label: 'Calisthenics',            emoji: '💪',  category: 'fitness_gym',         popular: false },
  { id: 'kettlebell',        label: 'Kettlebell Training',     emoji: '💪',  category: 'fitness_gym',         popular: false },
  { id: 'bootcamp',          label: 'Bootcamp',                emoji: '🏃',  category: 'fitness_gym',         popular: false },
  { id: 'hiit',              label: 'HIIT',                    emoji: '🔥',  category: 'fitness_gym',         popular: false },
  { id: 'spinning',          label: 'Spinning / Indoor Cycling',emoji: '🚴', category: 'fitness_gym',         popular: false },
  { id: 'yoga',              label: 'Yoga',                    emoji: '🧘',  category: 'fitness_gym',         popular: true  },
  { id: 'pilates',           label: 'Pilates',                 emoji: '🧘',  category: 'fitness_gym',         popular: false },
  { id: 'zumba',             label: 'Zumba',                   emoji: '💃',  category: 'fitness_gym',         popular: false },
  { id: 'aerobics',          label: 'Aerobics',                emoji: '🏃',  category: 'fitness_gym',         popular: false },
  { id: 'aquarobics',        label: 'Aquarobics',              emoji: '🏊',  category: 'fitness_gym',         popular: false },
  { id: 'dans',              label: 'Dans / Dansen',           emoji: '💃',  category: 'fitness_gym',         popular: false },
  { id: 'breakdance',        label: 'Breakdance',              emoji: '🕺',  category: 'fitness_gym',         popular: false },
  { id: 'salsa',             label: 'Salsa / Latijns dansen',  emoji: '💃',  category: 'fitness_gym',         popular: false },
  { id: 'turnen',            label: 'Turnen / Gymnastiek',     emoji: '🤸',  category: 'fitness_gym',         popular: false },
  { id: 'ritmische_gym',     label: 'Ritmische Gymnastiek',    emoji: '🤸',  category: 'fitness_gym',         popular: false },
  { id: 'trampolinespringen',label: 'Trampolinespringen',      emoji: '🤸',  category: 'fitness_gym',         popular: false },
  { id: 'cheerleading',      label: 'Cheerleading',            emoji: '📣',  category: 'fitness_gym',         popular: false },
  { id: 'touwspringen',      label: 'Touwspringen',            emoji: '🪢',  category: 'fitness_gym',         popular: false },
  { id: 'stretching',        label: 'Stretching / Mobiliteit', emoji: '🧘',  category: 'fitness_gym',         popular: false },
  { id: 'functional_fitness',label: 'Functional Fitness',      emoji: '💪',  category: 'fitness_gym',         popular: false },

  // ── OUTDOOR & NATUUR ─────────────────────────────────────────────────────
  { id: 'klimmen',           label: 'Klimmen',                 emoji: '🧗',  category: 'outdoor_natuur',      popular: true  },
  { id: 'boulderen',         label: 'Boulderen',               emoji: '🧗',  category: 'outdoor_natuur',      popular: false },
  { id: 'golf',              label: 'Golf',                    emoji: '⛳',  category: 'outdoor_natuur',      popular: false },
  { id: 'skateboarden',      label: 'Skateboarden',            emoji: '🛹',  category: 'outdoor_natuur',      popular: false },
  { id: 'longboarden',       label: 'Longboarden',             emoji: '🛹',  category: 'outdoor_natuur',      popular: false },
  { id: 'skeeleren',         label: 'Skeeleren / Inline Skating',emoji: '⛸️',category: 'outdoor_natuur',      popular: false },
  { id: 'rolschaatsen',      label: 'Rolschaatsen',            emoji: '⛸️',  category: 'outdoor_natuur',      popular: false },
  { id: 'parkour',           label: 'Parkour / Freerunning',   emoji: '🏃',  category: 'outdoor_natuur',      popular: false },
  { id: 'petanque',          label: 'Pétanque / Jeu de Boules',emoji: '🎯',  category: 'outdoor_natuur',      popular: false },
  { id: 'paintball',         label: 'Paintball',               emoji: '🎯',  category: 'outdoor_natuur',      popular: false },
  { id: 'survivaltocht',     label: 'Survivaltocht',           emoji: '🌲',  category: 'outdoor_natuur',      popular: false },
  { id: 'bowlen',            label: 'Bowlen',                  emoji: '🎳',  category: 'outdoor_natuur',      popular: false },

  // ── PAARDENSPORT ─────────────────────────────────────────────────────────
  { id: 'paardrijden',       label: 'Paardrijden',             emoji: '🏇',  category: 'paardensport',        popular: false },
  { id: 'dressuur',          label: 'Dressuur',                emoji: '🐴',  category: 'paardensport',        popular: false },
  { id: 'springriden',       label: 'Springrijden',            emoji: '🐴',  category: 'paardensport',        popular: false },
  { id: 'endurance_rijden',  label: 'Endurance Rijden',        emoji: '🐴',  category: 'paardensport',        popular: false },
  { id: 'polo',              label: 'Polo',                    emoji: '🏇',  category: 'paardensport',        popular: false },
  { id: 'western_rijden',    label: 'Western Rijden',          emoji: '🤠',  category: 'paardensport',        popular: false },

  // ── WINTERSPORT ──────────────────────────────────────────────────────────
  { id: 'skiën',             label: 'Skiën (piste)',           emoji: '⛷️',  category: 'wintersport',         popular: true  },
  { id: 'langlaufen',        label: 'Langlaufen',              emoji: '⛷️',  category: 'wintersport',         popular: false },
  { id: 'freestyle_skien',   label: 'Freestyle Skiën',         emoji: '⛷️',  category: 'wintersport',         popular: false },
  { id: 'snowboarden',       label: 'Snowboarden',             emoji: '🏂',  category: 'wintersport',         popular: false },
  { id: 'schaatsen',         label: 'Schaatsen',               emoji: '⛸️',  category: 'wintersport',         popular: true  },
  { id: 'curling',           label: 'Curling',                 emoji: '🥌',  category: 'wintersport',         popular: false },
  { id: 'biathlon',          label: 'Biathlon',                emoji: '⛷️',  category: 'wintersport',         popular: false },
  { id: 'skispringen',       label: 'Skispringen',             emoji: '⛷️',  category: 'wintersport',         popular: false },
  { id: 'snowkiten',         label: 'Snowkiten',               emoji: '🪁',  category: 'wintersport',         popular: false },
  { id: 'bobsleeën',         label: 'Bobsleeën',               emoji: '🛷',  category: 'wintersport',         popular: false },

  // ── PRECISIE & SCHIETEN ──────────────────────────────────────────────────
  { id: 'boogschieten',      label: 'Boogschieten',            emoji: '🏹',  category: 'precisie_schieten',   popular: false },
  { id: 'kruisboogschieten', label: 'Kruisboogschieten',       emoji: '🏹',  category: 'precisie_schieten',   popular: false },
  { id: 'schieten',          label: 'Schieten',                emoji: '🎯',  category: 'precisie_schieten',   popular: false },
  { id: 'schermen',          label: 'Schermen',                emoji: '🤺',  category: 'precisie_schieten',   popular: false },
  { id: 'darts',             label: 'Darts',                   emoji: '🎯',  category: 'precisie_schieten',   popular: false },
  { id: 'biljarten',         label: 'Biljarten / Snooker',     emoji: '🎱',  category: 'precisie_schieten',   popular: false },

  // ── AVONTUUR & LUCHT ─────────────────────────────────────────────────────
  { id: 'paragliding',       label: 'Paragliding',             emoji: '🪂',  category: 'avontuur_lucht',      popular: false },
  { id: 'skydiven',          label: 'Skydiven',                emoji: '🪂',  category: 'avontuur_lucht',      popular: false },
  { id: 'zweefvliegen',      label: 'Zweefvliegen',            emoji: '✈️',  category: 'avontuur_lucht',      popular: false },
  { id: 'hanggliden',        label: 'Hanggliden',              emoji: '🪂',  category: 'avontuur_lucht',      popular: false },
  { id: 'motorsport',        label: 'Motorsport / Karting',    emoji: '🏎️',  category: 'avontuur_lucht',      popular: false },
  { id: 'motorcross',        label: 'Motorcross',              emoji: '🏍️',  category: 'avontuur_lucht',      popular: false },
  { id: 'mountaineering',    label: 'Alpinisme / Bergbeklimmen',emoji: '⛰️', category: 'avontuur_lucht',      popular: false },

  // ── OVERIG ───────────────────────────────────────────────────────────────
  { id: 'overig',            label: 'Overig',                  emoji: '🏅',  category: 'overig',              popular: false },
]

export const POPULAR_SPORTS = SPORTS.filter(s => s.popular)
export const getSportById = (id: string): Sport | undefined => SPORTS.find(s => s.id === id)

/** Convert a display name (e.g. 'Hardlopen') back to its slug ID */
export const getSportByLabel = (label: string): Sport | undefined =>
  SPORTS.find(s => s.label.toLowerCase() === label.toLowerCase())

export const getSportsByCategory = (cat: SportCategory): Sport[] => SPORTS.filter(s => s.category === cat)

export const CATEGORY_LABELS: Record<SportCategory, string> = {
  hardlopen_fietsen:  'Hardlopen & Fietsen',
  zwemmen_watersport: 'Zwemmen & Watersport',
  teamsporten:        'Teamsporten',
  racketsporten:      'Racketsporten',
  vechtsporten:       'Vechtsporten',
  fitness_gym:        'Fitness & Gym',
  outdoor_natuur:     'Outdoor & Natuur',
  paardensport:       'Paardensport',
  wintersport:        'Wintersport',
  precisie_schieten:  'Precisie & Schieten',
  avontuur_lucht:     'Avontuur & Lucht',
  overig:             'Overig',
}
