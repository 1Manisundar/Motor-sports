import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, switchMap, catchError } from 'rxjs';
import { DriverStanding, ConstructorStanding, SeriesId } from '../models/motorsport.models';
import { F1Service } from './f1.service';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private tsdbBase = 'https://www.thesportsdb.com/api/v1/json/3';
  private TTL = 3600000;

  constructor(private http: HttpClient, private f1: F1Service) {}

  private getCached<T>(key: string, req: Observable<T>): Observable<T> {
    try {
      const stored = localStorage.getItem('stnd_' + key);
      if (stored) {
        const p = JSON.parse(stored);
        if (Date.now() - p.ts < this.TTL) return of(p.data as T);
      }
    } catch {}
    return req.pipe(
      map(d => {
        try { localStorage.setItem('stnd_' + key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
        return d;
      }),
      catchError(() => of(null as any))
    );
  }

  /**
   * F1 standings: fetch the latest completed race session, then
   * call /championship_drivers?session_key=... and join with /drivers for names.
   */
  getF1Standings(): Observable<{ drivers: DriverStanding[]; constructors: ConstructorStanding[] }> {
    // 1. Get sessions for the current year (already cached in F1Service)
    return this.f1.getSessions(2026).pipe(
      switchMap(sessions => {
        // Find the most recent completed race session
        const now = Date.now();
        const raceSession = sessions
          .filter(s => s.session_name === 'Race' && new Date(s.date_end ?? s.date_start).getTime() < now)
          .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

        if (!raceSession) return of({ drivers: [], constructors: [] });

        const sk = raceSession.session_key;
        return forkJoin([
          this.f1.getChampionshipDrivers(sk),
          this.f1.getDrivers(sk),
        ]).pipe(
          map(([championship, drivers]) => {
            const driverMap = new Map(drivers.map(d => [d.driver_number, d]));
            const standings: DriverStanding[] = championship
              .map(c => {
                const d = driverMap.get(c.driver_number);
                return {
                  position: c.position_current,
                  driverName: d?.full_name ?? `#${c.driver_number}`,
                  team: d?.team_name ?? '',
                  points: c.points_current,
                };
              })
              .sort((a, b) => b.points - a.points || (a.position - b.position));

            // Re-assign positions based on sorted points to ensure UI consistency
            standings.forEach((s, idx) => s.position = idx + 1);
            
            return { drivers: standings, constructors: [] };
          }),
          catchError(() => of({ drivers: [], constructors: [] }))
        );
      }),
      catchError(() => of({ drivers: [], constructors: [] }))
    );
  }

  /**
   * TheSportsDB standings via lookuptable endpoint.
   * Endpoint: GET /lookuptable.php?l={leagueId}&s={season}
   */
  getTheSportsDBStandings(
    leagueId: string,
    season: string
  ): Observable<{ drivers: DriverStanding[]; constructors: ConstructorStanding[] }> {
    return this.getCached(
      `tsdb_table_${leagueId}_${season}`,
      this.http.get<any>(`${this.tsdbBase}/lookuptable.php?l=${leagueId}&s=${season}`).pipe(
        map(r => {
          const table: any[] = r?.table ?? [];
          const drivers: DriverStanding[] = table
            .map(t => ({
              position: parseInt(t.intRank, 10) || 0,
              driverName: t.strTeam ?? t.strPlayer ?? '',
              team: t.strTeam ?? '',
              points: parseInt(t.intPoints, 10) || 0,
            }))
            .sort((a, b) => b.points - a.points || (a.position - b.position));

          // Re-assign positions based on sorted points
          drivers.forEach((d, idx) => d.position = idx + 1);

          return { drivers, constructors: [] as ConstructorStanding[] };
        })
      )
    ).pipe(
      map(v => v ?? { drivers: [], constructors: [] }),
      catchError(() => of({ drivers: [] as DriverStanding[], constructors: [] as ConstructorStanding[] }))
    );
  }

  getStandings(
    series: SeriesId
  ): Observable<{ drivers: DriverStanding[]; constructors: ConstructorStanding[] }> {
    if (series === 'f1') return this.getF1Standings();

    const leagueMap: Record<string, string> = {
      motogp: '4407',
      nascar: '4370',
      wrc:    '4469',
    };
    return this.getTheSportsDBStandings(leagueMap[series], '2026');
  }
}
