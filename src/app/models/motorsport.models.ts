export type SeriesId = 'f1' | 'motogp' | 'nascar' | 'wrc';

export interface RaceResult {
  position: number;
  driverName: string;
  team: string;
  points: number;
  gap: string;
  fastestLap?: boolean;
  pole?: boolean;
}

export interface Session {
  type: string;
  dateTime: Date;
  status: 'upcoming' | 'live' | 'completed';
  results?: RaceResult[];
  sessionKey?: number;
}

export interface MotorsportEvent {
  id: string;
  series: SeriesId;
  seriesName: string;
  seriesColor: string;
  seriesLogo: string;
  eventName: string;
  circuit: string;
  country: string;
  countryFlag: string;
  round: number;
  sessions: Session[];
  status: 'upcoming' | 'live' | 'completed';
  thumbnail?: string;
}

export interface DriverStanding {
  position: number;
  driverName: string;
  team: string;
  points: number;
  nationality?: string;
}

export interface ConstructorStanding {
  position: number;
  team: string;
  points: number;
}

export const SERIES_CONFIG: Record<SeriesId, {
  name: string;
  color: string;
  logo: string;
  emoji: string;
}> = {
  f1: {
    name: 'Formula 1',
    color: '#e10600',
    logo: 'assets/logos/f1.svg',
    emoji: '🏎️',
  },
  motogp: {
    name: 'MotoGP',
    color: '#f5a623',
    logo: 'assets/logos/motogp.svg',
    emoji: '🏍️',
  },
  nascar: {
    name: 'NASCAR',
    color: '#ffd700',
    logo: 'assets/logos/nascar.svg',
    emoji: '🏁',
  },
  wrc: {
    name: 'WRC',
    color: '#4caf50',
    logo: 'assets/logos/wrc.svg',
    emoji: '🚗',
  },
};
