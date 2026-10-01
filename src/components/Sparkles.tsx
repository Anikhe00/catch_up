const SMALL = [
  [-46, -38], [40, -44], [-58, 6], [56, 10], [-20, -56], [24, 40],
]
const BIG = [
  [-120, -70], [110, -80], [-140, 10], [130, 20], [-60, -120], [70, -118],
  [-100, 80], [100, 90], [0, -140], [-30, 110], [40, 120], [-150, -30],
]

/** A burst of stars. `big` is the full celebration, the small one sits on the done card. */
export function Sparkles({ big = false }: { big?: boolean }) {
  const bits = big ? BIG : SMALL
  return (
    <span aria-hidden="true" className={`sparkles pointer-events-none absolute ${big ? 'left-1/2 top-24' : 'left-9 top-1/2'}`}>
      {bits.map(([x, y], i) => (
        <svg
          key={i}
          className="spark absolute"
          style={{ ['--dx' as string]: `${x}px`, ['--dy' as string]: `${y}px`, animationDelay: `${i * 40}ms` }}
          width={big ? 18 : 14}
          height={big ? 18 : 14}
          viewBox="0 0 14 14"
          fill="var(--accent)"
        >
          {i % 3 === 2 ? <circle cx="7" cy="7" r="4" /> : <path d="M7 0l1.8 5.2L14 7l-5.2 1.8L7 14l-1.8-5.2L0 7l5.2-1.8Z" />}
        </svg>
      ))}
    </span>
  )
}
