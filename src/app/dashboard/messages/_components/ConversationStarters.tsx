'use client'

import { Zap } from 'lucide-react'

const SPORT_STARTERS: Record<string, string[]> = {
  Voetbal:    ['Wanneer speel jij normaal?', 'Welk niveau speel jij?', 'Heb je een vaste locatie?', '11v11 of kleiner?'],
  Tennis:     ['Op welk niveau speel jij?', 'Lid van een tennisclub?', 'Zin in een potje spelen?', 'Enkel of dubbel?'],
  Padel:      ['Op welk niveau speel jij?', 'Heb je al een club?', 'Hoe lang speel je padel?', 'Wanneer ben je vrij?'],
  Fitness:    ['Welke gym ben je lid van?', 'Wanneer ga jij trainen?', 'Wat zijn je doelen?', 'Doe je cardio of kracht?'],
  Hardlopen:  ['Wat is je gebruikelijk tempo?', 'Hoe ver loop je normaal?', 'Loop je buiten of indoor?', 'Oefen je voor een race?'],
  Wielrennen: ['Hoeveel km doe je normaal?', 'Race- of mountainbike?', 'Doe je aan klimmen?', 'Vaste route of ontdekken?'],
  Zwemmen:    ['Welke slag doe jij het liefst?', 'In bad of open water?', 'Hoe ver zwem je normaal?', 'Train je voor een wedstrijd?'],
  Basketbal:  ['Ik zoek een 1v1!', 'Welk veld gebruik jij?', 'Meedoen aan een team?', 'Shooting guard of point?'],
  Volleybal:  ['Indoor of beach?', 'Heb je al een team?', 'Welk niveau speel jij?', 'Zin in een potje?'],
  Yoga:       ['Welke stijl doe jij?', 'Studio of thuis?', 'Al lang bezig met yoga?', 'Wat is jouw favoriete pose?'],
  Boksen:     ['Sparring of techniek?', 'Welke gym train jij bij?', 'Hoe lang doe je al aan boksen?', 'Welk gewichtsklasse?'],
  CrossFit:   ['Welke box ben je lid van?', 'Wat is je favoriete WOD?', 'Doe je aan competitie?', 'Hoe lang CrossFit al?'],
}

const DEFAULT_STARTERS = [
  'Wanneer ben jij beschikbaar?',
  'Hoe lang doe je dit sport al?',
  'Zin om samen te trainen?',
  'Waar train jij normaal?',
]

type Props = {
  sport: string | null
  onSelect: (text: string) => void
}

export function ConversationStarters({ sport, onSelect }: Props) {
  const starters = (sport && SPORT_STARTERS[sport]) ? SPORT_STARTERS[sport] : DEFAULT_STARTERS

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap className="w-3 h-3 text-[#E87722]" />
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Gespreksopeners
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {starters.map(starter => (
          <button
            key={starter}
            type="button"
            onClick={() => onSelect(starter)}
            className="text-xs font-medium text-gray-700 bg-white border border-black/10 rounded-full px-3 py-1.5 hover:border-[#E87722] hover:text-[#E87722] transition-colors"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  )
}
