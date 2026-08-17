/** Compact number formatting: >=1M -> "1.2M", >=10k -> "12k", else exact. */
export function formatCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatCurrencyCompact(value) {
  return `$${formatCompact(value)}`;
}

export function formatCurrencyFull(value) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
