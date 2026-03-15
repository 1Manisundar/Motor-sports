import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { MotorsportEvent, Session, SeriesId } from '../models/motorsport.models';

// ---- TheSportsDB v1 response shapes (verified from docs) ----

export interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  strSeason: string;
  dateEvent: string;          // "YYYY-MM-DD"
  strTime: string | null;     // "HH:MM:SS+00:00" or null
  strTimeLocal: string | null;
  strVenue: string | null;
  strCity: string | null;
  strCountry: string | null;
  strCountryCode?: string | null; // ISO 2-char, not always present
  strStatus: string | null;
  intRound: string | null;
  strHomeTeam: string | null;
  strAwayTeam: string | null;
  strThumb: string | null;
  strBanner: string | null;
  strFanart1: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
}

export interface SportsDBEventsResponse {
  events: SportsDBEvent[] | null;
}

export interface SportsDBEventResult {
  idResult: string;
  idEvent: string;
  isHomeTeam: string;
  strTeam: string;
  strResult: string;
  strDetail: string;
}

export interface SportsDBResultsResponse {
  results: SportsDBEventResult[] | null;
}

// ---- Series metadata ----

const SERIES_META: Record<string, {
  series: SeriesId;
  seriesName: string;
  seriesColor: string;
  seriesLogo: string;
  leagueId: string;
}> = {
  motogp:  { series: 'motogp',  seriesName: 'MotoGP',  seriesColor: '#f5a623', seriesLogo: 'assets/logos/motogp.svg',  leagueId: '4407' },
  nascar:  { series: 'nascar',  seriesName: 'NASCAR',   seriesColor: '#ffd700', seriesLogo: 'assets/logos/nascar.svg',  leagueId: '4370' },
  wrc:     { series: 'wrc',     seriesName: 'WRC',      seriesColor: '#4caf50', seriesLogo: 'assets/logos/wrc.svg',     leagueId: '4469' },
};

/**
 * Converts a country name to a flagcdn.com URL using the ISO-3166-1 alpha-2 code.
 * flagcdn.com provides free country flag images: https://flagcdn.com/{code}.svg
 * We maintain a small lookup of the motorsport-relevant countries only.
 */
function countryToFlagUrl(country: string | null): string {
  if (!country) return '';
  const code = COUNTRY_NAME_TO_ISO2[country.trim()] ?? '';
  if (!code) return '';
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

/** ISO 3166-1 alpha-2 codes for motorsport-relevant countries */
const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  'Argentina': 'AR', 'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ',
  'Bahrain': 'BH', 'Belgium': 'BE', 'Brazil': 'BR', 'Canada': 'CA',
  'China': 'CN', 'Croatia': 'HR', 'Czech Republic': 'CZ', 'Estonia': 'EE',
  'Finland': 'FI', 'France': 'FR', 'Germany': 'DE', 'Greece': 'GR',
  'Hungary': 'HU', 'India': 'IN', 'Indonesia': 'ID', 'Italy': 'IT',
  'Japan': 'JP', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Latvia': 'LV',
  'Malaysia': 'MY', 'Mexico': 'MX', 'Monaco': 'MC', 'Morocco': 'MA',
  'Netherlands': 'NL', 'New Zealand': 'NZ', 'Poland': 'PL', 'Portugal': 'PT',
  'Qatar': 'QA', 'Romania': 'RO', 'Saudi Arabia': 'SA', 'Singapore': 'SG',
  'Spain': 'ES', 'Sweden': 'SE', 'Switzerland': 'CH', 'Thailand': 'TH',
  'Turkey': 'TR', 'United Arab Emirates': 'AE', 'UAE': 'AE',
  'United Kingdom': 'GB', 'USA': 'US', 'United States': 'US',
  'Uruguay': 'UY', 'USA/Mexico': 'US',
};

@Injectable({ providedIn: 'root' })
export class TheSportsDBService {
  /**
   * TheSportsDB v1 free public API key is "3".
   * Base URL: https://www.thesportsdb.com/api/v1/json/3
   */
  readonly BASE = 'https://www.thesportsdb.com/api/v1/json/3';
  private TTL = 3600000; // 1 hour

  constructor(private http: HttpClient) {}

  // ---- Generic cache helper ----
  private getCached<T>(cacheKey: string, req: Observable<T>): Observable<T> {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < this.TTL) return of(parsed.data as T);
      }
    } catch {}
    return req.pipe(
      map(data => {
        try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
        return data;
      }),
      catchError(() => of(null as any))
    );
  }

  /**
   * Get all events for a league season.
   * Endpoint: GET /eventsseason.php?id={leagueId}&s={season}
   * Season format for motorsport single-year series: "2026"
   */
  getSeasonEvents(leagueId: string, season: string): Observable<SportsDBEvent[]> {
    return this.getCached(
      `tsdb_events_${leagueId}_${season}`,
      this.http.get<SportsDBEventsResponse>(
        `${this.BASE}/eventsseason.php?id=${leagueId}&s=${season}`
      ).pipe(map(r => {
        console.log(`[TSDB API] League ID ${leagueId} (Season ${season}) Raw Response:`, r);
        console.log(`[TSDB API] ${leagueId} parsed ${r?.events?.length || 0} events.`);
        return r?.events ?? [];
      }))
    ).pipe(
      map(v => v ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Get results for a specific event.
   * Endpoint: GET /eventresults.php?id={eventId}
   */
  getEventResults(eventId: string): Observable<SportsDBEventResult[]> {
    return this.getCached(
      `tsdb_results_${eventId}`,
      this.http.get<SportsDBResultsResponse>(
        `${this.BASE}/eventresults.php?id=${eventId}`
      ).pipe(map(r => r?.results ?? []))
    ).pipe(
      map(v => v ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Look up a single event by ID.
   * Endpoint: GET /lookupevent.php?id={eventId}
   */
  lookupEvent(eventId: string): Observable<SportsDBEvent | null> {
    return this.getCached(
      `tsdb_event_${eventId}`,
      this.http.get<{ events: SportsDBEvent[] | null }>(
        `${this.BASE}/lookupevent.php?id=${eventId}`
      ).pipe(map(r => r?.events?.[0] ?? null))
    ).pipe(catchError(() => of(null)));
  }

  /**
   * Look up league info.
   * Endpoint: GET /lookupleague.php?id={leagueId}
   */
  getLeagueInfo(leagueId: string): Observable<any> {
    return this.getCached(
      `tsdb_league_${leagueId}`,
      this.http.get<any>(`${this.BASE}/lookupleague.php?id=${leagueId}`)
    ).pipe(catchError(() => of(null)));
  }

  /**
   * Parse raw SportsDB events into the app's MotorsportEvent model.
   * countryFlag is derived from flagcdn.com using the strCountry field.
   */
  parseEvents(events: SportsDBEvent[], seriesKey: string): MotorsportEvent[] {
    const meta = SERIES_META[seriesKey];
    if (!meta || !events?.length) return [];
    const now = new Date();

    return events.map(e => {
      // Build a UTC datetime from dateEvent + strTime
      // strTime can be null or "HH:MM:SS+00:00"
      const timeStr = e.strTime ? e.strTime.substring(0, 8) : '12:00:00';
      const dtStr = `${e.dateEvent}T${timeStr}Z`;
      const dt = new Date(dtStr);
      const end = new Date(dt.getTime() + 2 * 3600_000);

      let status: 'upcoming' | 'live' | 'completed' = 'upcoming';
      if (now >= dt && now <= end) status = 'live';
      else if (now > end) status = 'completed';

      // Derive flag URL from country name via flagcdn.com
      const flagUrl = countryToFlagUrl(e.strCountry);

      const session: Session = {
        type: 'Race',
        dateTime: dt,
        status,
      };

      return {
        id: `${meta.series}-${e.idEvent}`,
        series: meta.series,
        seriesName: meta.seriesName,
        seriesColor: meta.seriesColor,
        seriesLogo: meta.seriesLogo,
        eventName: e.strEvent,
        circuit: e.strVenue ?? e.strCity ?? 'TBC',
        country: e.strCountry ?? '',
        countryFlag: flagUrl,
        round: parseInt(e.intRound ?? '0', 10) || 0,
        sessions: [session],
        status,
        thumbnail: e.strThumb ?? e.strBanner ?? undefined,
      } as MotorsportEvent;
    });
  }
}
