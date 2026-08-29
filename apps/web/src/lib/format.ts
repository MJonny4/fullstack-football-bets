import { isMarket, MARKET_REGISTRY } from '@fb/shared';
import type { MatchResult, Numeric } from '../types';

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const oddsFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function toNumber(value: Numeric | null | undefined): number {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatCoins(value: Numeric | null | undefined): string {
  return numberFormatter.format(toNumber(value));
}

export function formatOdds(value: Numeric): string {
  return oddsFormatter.format(toNumber(value));
}

export function formatDate(value?: string): string {
  if (!value) return 'Time TBC';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time TBC' : dateFormatter.format(date);
}

export function normalizeMarket(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function marketLabel(value: string): string {
  const normalized = normalizeMarket(value);
  if (isMarket(normalized)) return MARKET_REGISTRY[normalized].label;
  const labels: Record<string, string> = {
    MATCH_RESULT: 'Match result',
    ONE_X_TWO: 'Match result',
    '1X2': 'Match result',
    EXACT_SCORE: 'Exact score',
    FINAL_SCORE: 'Exact score',
    TOTAL_CARDS: 'Total cards',
    CARDS_TOTAL: 'Total cards',
    TOTAL_CORNERS: 'Total corners',
    CORNERS_TOTAL: 'Total corners',
  };
  return labels[normalized] ?? titleCase(value);
}

export function selectionLabel(selection: string): string {
  const normalized = selection.trim().toUpperCase();
  const labels: Record<string, string> = {
    HOME: 'Home',
    '1': 'Home',
    DRAW: 'Draw',
    X: 'Draw',
    AWAY: 'Away',
    '2': 'Away',
    OVER: 'Over',
    UNDER: 'Under',
    OTHER: 'Other score',
  };
  return labels[normalized] ?? selection.replaceAll('_', ' ');
}

export function titleCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function resultScore(result?: MatchResult | null): string | null {
  if (!result) return null;
  const home = result.homeGoals ?? result.homeScore;
  const away = result.awayGoals ?? result.awayScore;
  return typeof home === 'number' && typeof away === 'number' ? `${home} – ${away}` : null;
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
