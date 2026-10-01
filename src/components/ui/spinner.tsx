/* Stand-in for the paid @kobra/spinner StatusBadge: a ring that spins while
 * pending and settles into a drawn check when done. */
export function StatusBadge({ state }: { state: 'loading' | 'done' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      style={{ width: 'var(--check-size, 16px)', height: 'var(--check-size, 16px)' }}
      aria-hidden
    >
      {state === 'loading' ? (
        <g className="status-spin">
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.8" />
          <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ) : (
        <>
          <circle cx="8" cy="8" r="7" fill="var(--inr)" />
          <path
            className="status-check"
            d="M5 8.2 7.1 10.2 11 6"
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  )
}
