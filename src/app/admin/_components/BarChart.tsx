'use client'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type BarData = { label: string; value: number }

export function BarChart({ data, title, color = '#C4F542' }: { data: BarData[]; title?: string; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div>
      {title && (
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-4">{title}</p>
      )}
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full rounded-t-md transition-all relative"
              style={{
                height: `${Math.max((d.value / max) * 100, 4)}%`,
                background: color,
                opacity: d.value === 0 ? 0.15 : 0.85,
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.value}
              </div>
            </div>
            {data.length <= 15 && (
              <span className="text-[9px] text-gray-400 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 24 }}>
                {d.label}
              </span>
            )}
          </div>
        ))}
      </div>
      {data.length > 15 && (
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400">{data[0]?.label}</span>
          <span className="text-[10px] text-gray-400">{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  )
}
