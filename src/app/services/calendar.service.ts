import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, forkJoin, of, map, catchError, shareReplay, switchMap } from 'rxjs';
import { F1Service } from './f1.service';
import { TheSportsDBService } from './the-sports-db.service';
import { PreferencesService } from './preferences.service';
import { MotorsportEvent } from '../models/motorsport.models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private events$: Observable<MotorsportEvent[]> | null = null;

  constructor(
    private f1: F1Service,
    private tsdb: TheSportsDBService,
    private prefs: PreferencesService,
  ) {}

  getAllEvents(year = 2026): Observable<MotorsportEvent[]> {
    console.log(`[CalendarService] getAllEvents called for year: ${year}`);
    if (this.events$) {
      console.log('[CalendarService] Returning cached events');
      return this.events$;
    }

    const f1Events$ = combineLatest([
      this.f1.getMeetings(year),
      this.f1.getSessions(year),
    ]).pipe(
      map(([meetings, sessions]) => {
        const evts = this.f1.parseEvents(meetings, sessions);
        console.log(`[CalendarService] Fetched ${evts.length} F1 events`);
        return evts;
      }),
      catchError(err => {
        console.error('[CalendarService] Error fetching F1 events:', err);
        return of([]);
      })
    );

    const motogpEvents$ = this.tsdb.getSeasonEvents('4407', String(year)).pipe(
      map(evts => {
        const parsed = this.tsdb.parseEvents(evts, 'motogp');
        console.log(`[CalendarService] Fetched ${parsed.length} MotoGP events`);
        return parsed;
      }),
      catchError(err => {
        console.error('[CalendarService] Error fetching MotoGP events:', err);
        return of([]);
      })
    );

    const nascarEvents$ = this.tsdb.getSeasonEvents('4370', String(year)).pipe(
      map(evts => {
        const parsed = this.tsdb.parseEvents(evts, 'nascar');
        console.log(`[CalendarService] Fetched ${parsed.length} NASCAR events`);
        return parsed;
      }),
      catchError(err => {
        console.error('[CalendarService] Error fetching NASCAR events:', err);
        return of([]);
      })
    );

    const wrcEvents$ = this.tsdb.getSeasonEvents('4469', String(year)).pipe(
      map(evts => {
        const parsed = this.tsdb.parseEvents(evts, 'wrc');
        console.log(`[CalendarService] Fetched ${parsed.length} WRC events`);
        return parsed;
      }),
      catchError(err => {
        console.error('[CalendarService] Error fetching WRC events:', err);
        return of([]);
      })
    );

    this.events$ = forkJoin([f1Events$, motogpEvents$, nascarEvents$, wrcEvents$]).pipe(
      map(([f1, moto, nascar, wrc]) => {
        const all = [...f1, ...moto, ...nascar, ...wrc];
        console.log(`[CalendarService] All combined events: ${all.length}`, {
          f1: f1.length, moto: moto.length, nascar: nascar.length, wrc: wrc.length
        });
        return all.sort((a, b) => {
          const timeA = this.getFirstSession(a);
          const timeB = this.getFirstSession(b);
          if (timeA === timeB) return 0;
          if (timeA === Infinity) return 1;
          if (timeB === Infinity) return -1;
          return timeA - timeB;
        });
      }),
      shareReplay(1)
    );

    return this.events$;
  }

  getFilteredEvents(year = 2026): Observable<MotorsportEvent[]> {
    console.log(`[CalendarService] getFilteredEvents called for year: ${year}`);
    return this.getAllEvents(year).pipe(
      map(events => {
        const filtered = events.filter(e => this.prefs.isSeriesEnabled(e.series));
        console.log(`[CalendarService] Filtered events count: ${filtered.length}`);
        return filtered;
      })
    );
  }

  getTodayEvents(year = 2026): Observable<MotorsportEvent[]> {
    console.log(`[CalendarService] getTodayEvents called`);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return this.getFilteredEvents(year).pipe(
      map(events => {
        const todayEvts = events.filter(evt =>
          evt.sessions.some(s => {
            const dt = new Date(s.dateTime);
            return dt >= startOfDay && dt < endOfDay;
          })
        );
        console.log(`[CalendarService] Today events count: ${todayEvts.length}`, todayEvts);
        return todayEvts;
      })
    );
  }

  getUpcomingEvents(year = 2026): Observable<MotorsportEvent[]> {
    console.log(`[CalendarService] getUpcomingEvents called`);
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return this.getFilteredEvents(year).pipe(
      map(events => {
        const upcoming = events.filter(evt => {
          if (evt.status === 'completed') return false;
          const firstSessionTime = this.getFirstSession(evt);
          if (firstSessionTime === Infinity) {
            console.log(`[CalendarService] Event ${evt.id} has no valid sessions, treating as upcoming`);
            return true;
          }
          return new Date(firstSessionTime) >= endOfToday;
        });
        console.log(`[CalendarService] Upcoming events count: ${upcoming.length}`);
        return upcoming;
      })
    );
  }

  getPastEvents(year = 2026): Observable<MotorsportEvent[]> {
    console.log(`[CalendarService] getPastEvents called`);
    return this.getFilteredEvents(year).pipe(
      map(events => {
        const past = events.filter(evt => evt.status === 'completed').reverse();
        console.log(`[CalendarService] Past events count: ${past.length}`);
        return past;
      })
    );
  }

  getEventById(id: string, year = 2026): Observable<MotorsportEvent | undefined> {
    return this.getAllEvents(year).pipe(
      map(events => {
        const ev = events.find(e => e.id === id);
        console.log('[CalendarService] getEventById returned:', ev);
        return ev;
      })
    );
  }

  getEventWithResults(id: string, year = 2026): Observable<MotorsportEvent | undefined> {
    return this.getEventById(id, year).pipe(
      switchMap(event => {
        if (!event) return of(undefined);
        const completed = event.sessions.filter(s => s.status === 'completed');
        if (!completed.length) return of(event);

        console.log('[CalendarService] Fetching results for completed sessions:', completed);

        if (event.series === 'f1') {
          const reqs = completed.map(s => {
             if (!s.sessionKey) return of(s);
             return forkJoin([
               this.f1.getSessionResult(s.sessionKey),
               this.f1.getDrivers(s.sessionKey)
             ]).pipe(
               map(([results, drivers]) => {
                  console.log(`[CalendarService] Raw F1 Results for session ${s.sessionKey}:`, results);
                  const dMap = new Map(drivers.map(d => [d.driver_number, d]));
                  s.results = results
                    .sort((a, b) => {
                      const posA = (a.position && a.position > 0) ? a.position : 999;
                      const posB = (b.position && b.position > 0) ? b.position : 999;
                      return posA - posB;
                    })
                    .map(r => {
                      const pos = r.position || 0;
                      let gapStr = '';
                      
                      const rawGap: any = r.gap_to_leader;
                      if (rawGap === 0 || rawGap === '0') {
                        gapStr = 'Leader';
                      } else if (Array.isArray(rawGap)) {
                        const validGaps = rawGap.filter(g => g !== null && g !== undefined);
                        gapStr = validGaps.length ? `+${validGaps[validGaps.length - 1]}s` : '';
                      } else if (typeof rawGap === 'number') {
                        gapStr = `+${rawGap.toFixed(3)}s`;
                      } else if (rawGap) {
                        const sGap = String(rawGap);
                        gapStr = sGap.startsWith('+') ? sGap : `+${sGap}s`;
                      }

                      // Status handling
                      let statusSuffix = '';
                      if (r.dnf) statusSuffix = ' (DNF)';
                      else if (r.dns) statusSuffix = ' (DNS)';

                      const drv = dMap.get(r.driver_number);
                      return {
                        position: pos,
                        driverName: (drv?.full_name || `#${r.driver_number}`) + statusSuffix,
                        team: drv?.team_name || '',
                        points: this.calculatePoints(pos, s.type, 'f1'),
                        gap: gapStr,
                        fastestLap: false,
                        pole: pos === 1 && s.type.toLowerCase().includes('qual')
                      };
                    });
                  console.log(`[CalendarService] Processed results for session ${s.type}:`, s.results);
                  return s;
               }),
               catchError(err => {
                 console.error('[CalendarService] F1 Result fetch error:', err);
                 return of(s);
               })
             );
          });
          return forkJoin(reqs).pipe(map(() => event));
        } else {
          // TheSportsDB
          const realId = id.split('-')[1];
          return this.tsdb.getEventResults(realId).pipe(
            map(res => {
              console.log('[CalendarService] SportsDB Results:', res);
              if (res && res.length) {
                // Populate the single race session
                const s = completed[0];
                s.results = res.map((r, i) => {
                  const pos = i + 1;
                  // Try to parse points from strResult if it's a number like "25 pts" or just "25"
                  let pts = 0;
                  const ptsMatch = r.strResult?.match(/(\d+)/);
                  if (ptsMatch) pts = parseInt(ptsMatch[1], 10);
                  else pts = this.calculatePoints(pos, s.type, event.series);

                  return {
                    position: pos,
                    driverName: r.strTeam || r.strDetail || 'Unknown',
                    team: r.strResult || '',
                    points: pts,
                    gap: ''
                  };
                }).sort((a, b) => a.position - b.position);
              }
              return event;
            }),
            catchError(err => {
              console.error('[CalendarService] TSDB Result fetch error:', err);
              return of(event);
            })
          );
        }
      })
    );
  }

  invalidateCache(): void {
    this.events$ = null;
  }

  private calculatePoints(position: number, sessionType: string, series: string): number {
    const sType = sessionType.toLowerCase();
    // console.log(`[CalendarService] Calculating points for series:${series}, type:${sType}, pos:${position}`);
    
    if (series === 'f1') {
      if (sType.includes('race')) {
        const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
        return points[position - 1] || 0;
      }
      if (sType.includes('sprint')) {
        const points = [8, 7, 6, 5, 4, 3, 2, 1];
        return points[position - 1] || 0;
      }
    } else if (series === 'motogp') {
      if (sType.includes('race')) {
        const points = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        return points[position - 1] || 0;
      }
    }
    return 0;
  }

  private getFirstSession(evt: MotorsportEvent): number {
    if (!evt.sessions?.length) return Infinity;
    const times = evt.sessions
      .map(s => new Date(s.dateTime).getTime())
      .filter(t => !isNaN(t));
    return times.length ? Math.min(...times) : Infinity;
  }
}
