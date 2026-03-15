import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, combineLatest, map, catchError } from 'rxjs';
import { MotorsportEvent, Session, RaceResult } from '../models/motorsport.models';

// ---- OpenF1 response shapes (verified from docs) ----

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  circuit_key: number;
  circuit_short_name: string;
  circuit_image?: string;
  country_code: string;       // e.g. "SGP"
  country_key: number;
  country_name: string;
  country_flag: string;       // full URL to flag image from F1 CDN
  date_start: string;         // ISO 8601
  date_end: string;
  gmt_offset: string;
  location: string;
  year: number;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  country_flag: string;       // full URL to flag image
  gmt_offset: string;
  location: string;
  year: number;
}

export interface OpenF1SessionResult {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  position: number;
  gap_to_leader: number;
  number_of_laps: number;
  duration: number;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  name_acronym: string;
  headshot_url?: string;
  team_name: string;
  team_colour: string;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1ChampionshipDriver {
  driver_number: number;
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
}

@Injectable({ providedIn: 'root' })
export class F1Service {
  readonly BASE = 'https://api.openf1.org/v1';
  private TTL = 3600000; // 1 hour

  constructor(private http: HttpClient) {}

  // ---- Generic cache helper ----
  getCached<T>(cacheKey: string, req: Observable<T>): Observable<T> {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < this.TTL) {
          return of(parsed.data as T);
        }
      }
    } catch {}
    return req.pipe(
      map(data => {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
        } catch {}
        return data;
      }),
      catchError(() => of([] as any))
    );
  }

  // ---- Meetings (Grand Prix weekends) ----
  getMeetings(year: number): Observable<OpenF1Meeting[]> {
    return this.getCached(
      `f1_meetings_${year}`,
      this.http.get<OpenF1Meeting[]>(`${this.BASE}/meetings?year=${year}`)
    );
  }

  // ---- Sessions (FP1, Qualifying, Race, …) ----
  getSessions(year: number): Observable<OpenF1Session[]> {
    return this.getCached(
      `f1_sessions_${year}`,
      this.http.get<OpenF1Session[]>(`${this.BASE}/sessions?year=${year}`)
    );
  }

  // ---- Drivers for a specific session ----
  getDrivers(sessionKey: number): Observable<OpenF1Driver[]> {
    return this.getCached(
      `f1_drivers_${sessionKey}`,
      this.http.get<OpenF1Driver[]>(`${this.BASE}/drivers?session_key=${sessionKey}`)
    );
  }

  // ---- Session results (final standings per session) ----
  getSessionResult(sessionKey: number): Observable<OpenF1SessionResult[]> {
    return this.getCached(
      `f1_result_${sessionKey}`,
      this.http.get<OpenF1SessionResult[]>(`${this.BASE}/session_result?session_key=${sessionKey}`)
    );
  }

  // ---- Championship standings (beta) — requires a completed race session_key ----
  getChampionshipDrivers(sessionKey: number): Observable<OpenF1ChampionshipDriver[]> {
    return this.getCached(
      `f1_champ_${sessionKey}`,
      this.http.get<OpenF1ChampionshipDriver[]>(`${this.BASE}/championship_drivers?session_key=${sessionKey}`)
    );
  }

  // ---- Parse meetings + sessions into MotorsportEvent[] ----
  parseEvents(meetings: OpenF1Meeting[], sessions: OpenF1Session[]): MotorsportEvent[] {
    const now = new Date();

    return meetings.map((m, idx) => {
      const meetingSessions = sessions
        .filter(s => s.meeting_key === m.meeting_key)
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

      const sessionList: Session[] = meetingSessions.map(s => {
        const start = new Date(s.date_start);
        const end = s.date_end ? new Date(s.date_end) : new Date(start.getTime() + 2 * 3600_000);
        return {
          type: s.session_name,
          dateTime: start,
          status: this.deriveStatus(start, end, now),
          sessionKey: s.session_key,
        };
      });

      const allDone = sessionList.length > 0 && sessionList.every(s => s.status === 'completed');
      const anyLive = sessionList.some(s => s.status === 'live');

      return {
        id: `f1-${m.meeting_key}`,
        series: 'f1',
        seriesName: 'Formula 1',
        seriesColor: '#e10600',
        seriesLogo: 'assets/logos/f1.svg',
        eventName: m.meeting_name,
        circuit: m.circuit_short_name,
        country: m.country_name,
        // Use the URL provided by the OpenF1 API directly — no hardcoded emoji
        countryFlag: m.country_flag || '',
        round: idx + 1,
        sessions: sessionList,
        status: anyLive ? 'live' : allDone ? 'completed' : 'upcoming',
        // circuit image also available from API
        thumbnail: m.circuit_image,
      } as MotorsportEvent;
    });
  }

  private deriveStatus(
    start: Date,
    end: Date,
    now: Date
  ): 'upcoming' | 'live' | 'completed' {
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'completed';
    return 'upcoming';
  }
}
