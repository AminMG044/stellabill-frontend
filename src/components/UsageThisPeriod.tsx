interface UsageThisPeriodProps {
  billingPeriod?: string | null
  usage?: string | null
  estimatedCharge?: string | null
  onViewFullUsage?: () => void
  isLoading?: boolean
  error?: string | null
}

/**
 * Coerce a loose prop value into a displayable string.
 * Invalid/blank inputs (null, undefined, empty/whitespace strings, NaN,
 * objects, booleans) resolve to `null` so the UI can render a deterministic
 * "—" fallback instead of crashing.
 */
function normalizeValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() === '' ? null : value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

export default function UsageThisPeriod({
  billingPeriod,
  usage,
  estimatedCharge,
  onViewFullUsage,
  isLoading = false,
  error = null
}: UsageThisPeriodProps) {
  const period = normalizeValue(billingPeriod)
  const usageText = normalizeValue(usage)
  const charge = normalizeValue(estimatedCharge)

  const hasUsageData = Boolean(period || usageText || charge)
  const hasError = typeof error === 'string' && error.trim() !== ''
  const hasBody = isLoading || hasError || hasUsageData

  return (
    <div style={{
      background: 'transparent',
      borderRadius: 12,
      border: '1px solid #FFFFFF1A',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hasBody ? '1.5rem' : '0',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
          <h2 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            Usage this period
          </h2>
        </div>
        
        {hasUsageData && !isLoading && !hasError && (
          <button
            onClick={onViewFullUsage}
            style={{
              background: 'none',
              border: 'none',
              color: '#22d3ee',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: 0,
              fontFamily: 'inherit'
            }}
            aria-label="View full usage details"
          >
            View full usage
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14L21 3" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading, Error, Empty State or Metric Panels */}
      {isLoading ? (
        <p
          role="status"
          aria-live="polite"
          style={{
            color: '#64748b',
            margin: '1rem 0 0',
            textAlign: 'center'
          }}
        >
          Loading usage for this period…
        </p>
      ) : hasError ? (
        <p
          role="alert"
          style={{
            color: '#f87171',
            margin: '1rem 0 0',
            textAlign: 'center'
          }}
        >
          {error}
        </p>
      ) : !hasUsageData ? (
        <p style={{ 
          color: '#64748b', 
          margin: '1rem 0 0', 
          textAlign: 'center' 
        }}>
          No usage this period
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {/* Billing Period Panel */}
          <div style={{
            background: '#0f0f0f',
            borderRadius: 8,
            border: '1px solid #2a2a2a',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Billing period
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff'
            }}>
              {period || '—'}
            </div>
          </div>

          {/* Usage Panel */}
          <div style={{
            background: '#0f0f0f',
            borderRadius: 8,
            border: '1px solid #2a2a2a',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Usage
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff'
            }}>
              {usageText || '—'}
            </div>
          </div>

          {/* Estimated Charge Panel */}
          <div style={{
            background: '#0f0f0f',
            borderRadius: 8,
            border: '1px solid #2a2a2a',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Estimated charge
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff'
            }}>
              {charge || '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
