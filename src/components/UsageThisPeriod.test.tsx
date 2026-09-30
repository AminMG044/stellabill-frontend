import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import UsageThisPeriod from './UsageThisPeriod';

type Props = ComponentProps<typeof UsageThisPeriod>;

function renderUsage(props: Partial<Props> = {}) {
  return render(<UsageThisPeriod {...props} />);
}

// ===========================================================================
// Structure & header
// ===========================================================================

describe('UsageThisPeriod — structure', () => {
  it('renders the "Usage this period" heading as a level-2 heading', () => {
    renderUsage();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Usage this period' }),
    ).toBeInTheDocument();
  });

  it('omits the "View full usage" control when there is no data', () => {
    renderUsage();
    expect(screen.queryByRole('button', { name: /view full usage/i })).not.toBeInTheDocument();
  });

  it('does not render metric panel labels when there is no data', () => {
    renderUsage();
    expect(screen.queryByText('Billing period')).not.toBeInTheDocument();
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
    expect(screen.queryByText('Estimated charge')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Full data — success path
// ===========================================================================

describe('UsageThisPeriod — full data (success path)', () => {
  const fullData: Props = {
    billingPeriod: 'Aug 1 – Aug 31, 2025',
    usage: '128 GB',
    estimatedCharge: '$42.50',
  };

  it('renders all three metric values', () => {
    renderUsage(fullData);
    expect(screen.getByText('Aug 1 – Aug 31, 2025')).toBeInTheDocument();
    expect(screen.getByText('128 GB')).toBeInTheDocument();
    expect(screen.getByText('$42.50')).toBeInTheDocument();
  });

  it('renders the three metric labels', () => {
    renderUsage(fullData);
    expect(screen.getByText('Billing period')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Estimated charge')).toBeInTheDocument();
  });

  it('exposes the view-full-usage control with an accessible name', () => {
    renderUsage(fullData);
    expect(
      screen.getByRole('button', { name: 'View full usage details' }),
    ).toBeInTheDocument();
  });

  it('invokes onViewFullUsage when the control is clicked', async () => {
    const user = userEvent.setup();
    const onViewFullUsage = vi.fn();
    renderUsage({ ...fullData, onViewFullUsage });

    await user.click(screen.getByRole('button', { name: /view full usage/i }));
    expect(onViewFullUsage).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without an onViewFullUsage handler', async () => {
    const user = userEvent.setup();
    renderUsage(fullData);
    await expect(
      user.click(screen.getByRole('button', { name: /view full usage/i })),
    ).resolves.toBeUndefined();
  });
});

// ===========================================================================
// Partial data — deterministic "—" fallbacks
// ===========================================================================

describe('UsageThisPeriod — partial data fallbacks', () => {
  it('falls back to "—" for usage and charge when only billingPeriod is provided', () => {
    renderUsage({ billingPeriod: 'Sep 1 – Sep 30, 2025' });
    expect(screen.getByText('Sep 1 – Sep 30, 2025')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('falls back to "—" for period and charge when only usage is provided', () => {
    renderUsage({ usage: '10 GB' });
    expect(screen.getByText('10 GB')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('falls back to "—" for period and usage when only estimatedCharge is provided', () => {
    renderUsage({ estimatedCharge: '$9.99' });
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('still shows the view control when only one field is present', () => {
    renderUsage({ usage: '1 GB' });
    expect(screen.getByRole('button', { name: /view full usage/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// Zero usage
// ===========================================================================

describe('UsageThisPeriod — zero usage', () => {
  it('renders a textual "0" usage value rather than the fallback', () => {
    renderUsage({ usage: '0' });
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('No usage this period')).not.toBeInTheDocument();
  });

  it('renders a "0 GB" usage value', () => {
    renderUsage({ usage: '0 GB' });
    expect(screen.getByText('0 GB')).toBeInTheDocument();
  });

  it('renders numeric zero usage as "0" instead of treating it as missing', () => {
    renderUsage({ usage: 0 as unknown as string });
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Billing period')).toBeInTheDocument();
  });

  it('shows panels and the view control for zero usage', () => {
    renderUsage({ billingPeriod: 'Oct 2025', usage: '0 GB', estimatedCharge: '$0.00' });
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view full usage/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// Period boundary rollover
// ===========================================================================

describe('UsageThisPeriod — period boundary rollover', () => {
  it('renders the current billing period', () => {
    renderUsage({ billingPeriod: 'Aug 1 – Aug 31, 2025', usage: '5 GB' });
    expect(screen.getByText('Aug 1 – Aug 31, 2025')).toBeInTheDocument();
  });

  it('updates the displayed period when the cycle rolls over on re-render', () => {
    const { rerender } = renderUsage({
      billingPeriod: 'Aug 1 – Aug 31, 2025',
      usage: '95 GB',
      estimatedCharge: '$31.00',
    });
    expect(screen.getByText('Aug 1 – Aug 31, 2025')).toBeInTheDocument();

    rerender(
      <UsageThisPeriod
        billingPeriod="Sep 1 – Sep 30, 2025"
        usage="0 GB"
        estimatedCharge="$0.00"
      />,
    );

    expect(screen.queryByText('Aug 1 – Aug 31, 2025')).not.toBeInTheDocument();
    expect(screen.getByText('Sep 1 – Sep 30, 2025')).toBeInTheDocument();
    expect(screen.getByText('0 GB')).toBeInTheDocument();
  });
});

// ===========================================================================
// Overage display
// ===========================================================================

describe('UsageThisPeriod — overage display', () => {
  it('renders an overage charge exactly as provided', () => {
    renderUsage({
      billingPeriod: 'Aug 2025',
      usage: '150 GB / 100 GB',
      estimatedCharge: '$42.50 (overage)',
    });
    expect(screen.getByText('$42.50 (overage)')).toBeInTheDocument();
  });

  it('renders over-quota usage text verbatim', () => {
    renderUsage({ usage: '120% of quota' });
    expect(screen.getByText('120% of quota')).toBeInTheDocument();
  });
});

// ===========================================================================
// Empty state
// ===========================================================================

describe('UsageThisPeriod — empty state', () => {
  it('shows the empty message when no props are provided', () => {
    renderUsage();
    expect(screen.getByText('No usage this period')).toBeInTheDocument();
  });

  it('shows the empty message when all values are null', () => {
    renderUsage({ billingPeriod: null, usage: null, estimatedCharge: null });
    expect(screen.getByText('No usage this period')).toBeInTheDocument();
  });

  it('shows the empty message when all values are empty strings (invalid)', () => {
    renderUsage({ billingPeriod: '', usage: '', estimatedCharge: '' });
    expect(screen.getByText('No usage this period')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view full usage/i })).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('UsageThisPeriod — loading state', () => {
  it('announces a polite loading status', () => {
    renderUsage({ isLoading: true });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/loading usage/i);
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('hides panels, the empty message and the view control while loading', () => {
    renderUsage({ isLoading: true });
    expect(screen.queryByText('No usage this period')).not.toBeInTheDocument();
    expect(screen.queryByText('Billing period')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view full usage/i })).not.toBeInTheDocument();
  });

  it('prefers the loading state over provided data', () => {
    renderUsage({
      isLoading: true,
      billingPeriod: 'Aug 2025',
      usage: '10 GB',
      estimatedCharge: '$5.00',
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('10 GB')).not.toBeInTheDocument();
    expect(screen.queryByText('$5.00')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Error state
// ===========================================================================

describe('UsageThisPeriod — error state', () => {
  it('announces the error message as an alert', () => {
    renderUsage({ error: 'Could not load usage' });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load usage');
  });

  it('hides panels and the view control when errored', () => {
    renderUsage({ error: 'Could not load usage', usage: '10 GB' });
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view full usage/i })).not.toBeInTheDocument();
  });

  it('prefers the error state over provided data', () => {
    renderUsage({ error: 'Service unavailable', usage: '10 GB', estimatedCharge: '$5.00' });
    expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable');
    expect(screen.queryByText('10 GB')).not.toBeInTheDocument();
  });

  it('treats a blank error string as no error', () => {
    renderUsage({ error: '   ', usage: '10 GB' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('10 GB')).toBeInTheDocument();
  });

  it('prefers the loading state over the error state', () => {
    renderUsage({ isLoading: true, error: 'Service unavailable' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Representative invalid inputs
// ===========================================================================

describe('UsageThisPeriod — invalid inputs', () => {
  it('treats a whitespace-only string as missing and renders "—"', () => {
    renderUsage({ billingPeriod: 'Aug 2025', usage: '   ' });
    expect(screen.getByText('Aug 2025')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('renders "—" for an object value without crashing', () => {
    renderUsage({ billingPeriod: 'Aug 2025', estimatedCharge: {} as unknown as string });
    expect(screen.getByText('Aug 2025')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('renders "—" for a boolean value without crashing', () => {
    renderUsage({ billingPeriod: 'Aug 2025', usage: false as unknown as string });
    expect(screen.getByText('Aug 2025')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('treats non-finite numbers as missing', () => {
    renderUsage({ billingPeriod: 'Aug 2025', usage: NaN as unknown as string });
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('falls back to the empty state when every value is invalid', () => {
    renderUsage({
      billingPeriod: '' as unknown as string,
      usage: undefined,
      estimatedCharge: {} as unknown as string,
    });
    expect(screen.getByText('No usage this period')).toBeInTheDocument();
  });
});
