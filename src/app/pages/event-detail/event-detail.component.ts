import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MotorsportEvent, Session, RaceResult } from '../../models/motorsport.models';
import { CalendarService } from '../../services/calendar.service';
import { F1Service } from '../../services/f1.service';
import { SeriesBadgeComponent } from '../../components/series-badge/series-badge.component';
import { CountdownComponent } from '../../components/countdown/countdown.component';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatProgressSpinnerModule, MatChipsModule,
            SeriesBadgeComponent, CountdownComponent, SkeletonCardComponent],
  template: `
    <div class="event-detail page-animate" *ngIf="!loading && event">
      <!-- Hero -->
      <div class="hero" [style.--series-color]="event.seriesColor">
        <div class="hero-bg" [style.background]="'linear-gradient(135deg, ' + event.seriesColor + '22 0%, #0a0a0a 100%)'"></div>
        <div class="hero-content">
          <div class="hero-logo">
            <img [src]="event.seriesLogo" [alt]="event.seriesName"
                 (error)="onLogoError($event)" class="hero-logo-img" />
          </div>
          <div class="hero-info">
            <app-series-badge [series]="event.series"></app-series-badge>
            <h1 class="hero-title">{{ event.eventName }}</h1>
            <p class="hero-sub">
              <img *ngIf="event.countryFlag" [src]="event.countryFlag" [alt]="event.country" class="country-flag-hero" />
              {{ event.country }} &bull; Round {{ event.round }}
            </p>
            <p class="hero-circuit">🏟️ {{ event.circuit }}</p>
          </div>
          <div class="hero-status" [class]="event.status">
            {{ event.status | uppercase }}
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group class="event-tabs" [(selectedIndex)]="selectedTabIndex" animationDuration="200ms">

        <!-- Sessions -->
        <mat-tab label="Sessions">
          <ng-template matTabContent>
            <div class="tab-pad">
              <div *ngFor="let session of event.sessions; let i = index" class="session-row hover-glow stagger-item"
                   [class.live]="session.status === 'live'"
                   [class.completed]="session.status === 'completed'"
                   [class.clickable]="session.status === 'completed'"
                   (click)="onSessionClick(session)"
                   [style.--series-color]="event.seriesColor"
                   [style.animation-delay]="i * 50 + 'ms'">
                <div class="session-left">
                  <div class="session-type">{{ session.type }}</div>
                  <div class="session-time">{{ formatDateTime(session.dateTime) }}</div>
                </div>
                <div class="session-right">
                  <span class="session-status" [class]="session.status">
                    {{ getStatusLabel(session) }}
                  </span>
                  <app-countdown *ngIf="session.status === 'upcoming'"
                                 [targetDate]="session.dateTime">
                  </app-countdown>
                </div>
              </div>
              <div *ngIf="!event.sessions.length" class="empty-sessions">
                No session data available
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Results -->
        <mat-tab label="Results">
          <ng-template matTabContent>
            <div class="tab-pad">
              <div *ngFor="let session of completedSessions">
                <div class="results-header">{{ session.type }} Results</div>
                <div *ngIf="session.results?.length; else noResults">
                  <div *ngFor="let r of session.results" class="result-row"
                       [class.p1]="r.position === 1"
                       [class.p2]="r.position === 2"
                       [class.p3]="r.position === 3">
                    <div class="result-pos">
                      <span *ngIf="r.position === 1">🥇</span>
                      <span *ngIf="r.position === 2">🥈</span>
                      <span *ngIf="r.position === 3">🥉</span>
                      <span *ngIf="r.position > 3" class="pos-num">{{ r.position }}</span>
                    </div>
                    <div class="result-body">
                      <div class="driver-name">{{ r.driverName }}</div>
                      <div class="team-name">{{ r.team }}</div>
                    </div>
                    <div class="result-right">
                      <div class="result-pts" *ngIf="r.points > 0">{{ r.points }} pts</div>
                      <div class="result-gap">{{ r.gap }}</div>
                      <span class="fastest-lap" *ngIf="r.fastestLap">⚡</span>
                      <span class="pole-marker" *ngIf="r.pole">P</span>
                    </div>
                  </div>
                </div>
                <ng-template #noResults>
                  <div class="no-results">Results not yet available</div>
                </ng-template>
              </div>
              <div *ngIf="!completedSessions.length" class="no-results" style="padding:40px 0;text-align:center">
                <div class="empty-icon">🏆</div>
                <p>No results yet — check back after the event</p>
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Info -->
        <mat-tab label="Info">
          <ng-template matTabContent>
            <div class="tab-pad info-tab">
              <div class="info-row">
                <span class="info-label">Series</span>
                <span class="info-value">{{ event.seriesName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Round</span>
                <span class="info-value">{{ event.round }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Circuit</span>
                <span class="info-value">{{ event.circuit }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Country</span>
                <span class="info-value">
                  <img *ngIf="event.countryFlag" [src]="event.countryFlag" [alt]="event.country" class="country-flag-mini" />
                  {{ event.country }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value">{{ event.status }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Sessions</span>
                <span class="info-value">{{ event.sessions.length }}</span>
              </div>
            </div>
          </ng-template>
        </mat-tab>

      </mat-tab-group>
    </div>

    <!-- Loading Skeleton -->
    <div *ngIf="loading" class="loading-container">
      <div class="hero-skeleton">
        <div class="sk sk-line" style="width:60%;height:28px;margin-bottom:12px"></div>
        <div class="sk sk-line" style="width:40%;height:16px"></div>
      </div>
      <app-skeleton-card *ngFor="let i of [1,2,3]"></app-skeleton-card>
    </div>
  `,
  styles: [`
    .event-detail { min-height: 100vh; background: #0a0a0a; }
    .hero { position: relative; padding: 24px 16px; overflow: hidden; }
    .hero-bg {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .hero-content { position: relative; z-index: 1; }
    .hero-logo-img { width: 56px; height: 56px; object-fit: contain; margin-bottom: 12px; }
    .hero-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px; font-weight: 900; color: #fff;
      margin: 8px 0 4px; line-height: 1.2;
    }
    .hero-sub { font-size: 13px; color: #888; margin: 0 0 4px; }
    .hero-circuit { font-size: 13px; color: #aaa; margin: 0; }
    .hero-status {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      border-radius: 6px;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .hero-status.upcoming { background:#1e2a1e; color:#4caf50; border:1px solid #4caf5044; }
    .hero-status.live { background:#2a1e1e; color:#e10600; border:1px solid #e1060044; animation:glowPulse 2s infinite; }
    .hero-status.completed { background:#1e1e1e; color:#666; border:1px solid #333; }
    @keyframes glowPulse { 0%,100%{box-shadow:0 0 8px #e1060088} 50%{box-shadow:0 0 16px #e10600} }

    .session-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #1a1a1a;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid transparent;
    }
    .session-row.clickable {
      cursor: pointer;
    }
    .session-row.clickable:hover {
      background: #222;
      transform: translateX(4px);
    }
    .session-row.live { border-color: var(--series-color); box-shadow: 0 0 12px -4px var(--series-color); }
    .session-row.completed { opacity: 0.65; }
    .session-type { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 15px; color: #f0f0f0; }
    .session-time { font-size: 12px; color: #666; margin-top: 2px; }
    .session-status {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; display: inline-block;
    }
    .session-status.upcoming { background:#1e2a1e; color:#4caf50; }
    .session-status.live { background:#2a1e1e; color:#e10600; animation:glowPulse 2s infinite; }
    .session-status.completed { background:#1e1e1e; color:#555; }
    .session-right { text-align: right; }
    .empty-sessions { text-align: center; padding: 40px; color: #555; }

    .results-header {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px;
      color: #666; margin: 16px 0 8px;
    }
    .result-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: #141414;
      border-radius: 10px; border: 1px solid #1e1e1e; margin-bottom: 6px;
      transition: transform 0.2s;
    }
    .result-row:hover { transform: translateX(4px); }
    .result-row.p1 { background: linear-gradient(135deg, #2a2200 0%, #141414 100%); border-color: #ffd70044; }
    .result-row.p2 { background: linear-gradient(135deg, #1e2022 0%, #141414 100%); border-color: #c0c0c044; }
    .result-row.p3 { background: linear-gradient(135deg, #221a10 0%, #141414 100%); border-color: #cd7f3244; }
    .result-pos { font-size: 22px; width: 32px; text-align: center; }
    .pos-num { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; color: #888; }
    .result-body { flex: 1; }
    .driver-name { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 15px; color: #f0f0f0; }
    .team-name { font-size: 12px; color: #666; }
    .result-right { text-align: right; }
    .result-pts { font-family: 'Orbitron', sans-serif; font-size: 12px; color: #aaa; }
    .result-gap { font-size: 11px; color: #555; }
    .fastest-lap { color: #ab47bc; font-size: 14px; display: block; }
    .pole-marker {
      background:#1a237e; color:#7986cb;
      font-size:9px; font-weight:700;
      padding:1px 5px; border-radius:3px;
      display: inline-block;
    }
    .no-results { color: #555; font-size: 14px; }
    .empty-icon { font-size: 40px; margin: 20px 0 8px; }

    .info-tab { display: flex; flex-direction: column; gap: 0; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 0; border-bottom: 1px solid #1e1e1e;
    }
    .info-label { font-size: 13px; color: #666; }
    .info-value { font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 15px; color: #ccc; }

    .loading-container { padding: 16px; }
    .hero-skeleton { padding: 24px 0; }
    .sk {
      background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    :host ::ng-deep .mat-mdc-tab-header {
      background: #0a0a0a;
      border-bottom: 1px solid #1e1e1e;
    }
    :host ::ng-deep .mdc-tab__text-label {
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px; font-weight: 600;
      color: #ccc !important; /* Even brighter inactive color */
    }
    :host ::ng-deep .mdc-tab--active .mdc-tab__text-label {
      color: #fff !important; /* White for active tab */
    }

    .country-flag-mini {
      width: 20px; height: 14px; object-fit: cover; border-radius: 2px;
      margin-right: 6px; vertical-align: middle; border: 1px solid #333;
    }
    .country-flag-hero {
      width: 24px; height: 16px; object-fit: cover; border-radius: 2px;
      margin-right: 6px; vertical-align: middle; border: 1px solid #444;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: MotorsportEvent | undefined;
  loading = true;
  selectedTabIndex = 0;

  get completedSessions(): Session[] {
    return this.event?.sessions.filter(s => s.status === 'completed') ?? [];
  }

  constructor(
    private route: ActivatedRoute,
    private calendarService: CalendarService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const series = this.route.snapshot.paramMap.get('series') || '';

    // The id from the card already includes the series prefix (e.g., "f1-1280")
    // If it doesn't, we add it. If it does, we use it as is.
    const eventId = id.startsWith(series + '-') ? id : `${series}-${id}`;
    console.log('[EventDetailComponent] Parameter id:', id, 'series:', series, 'computed eventId:', eventId);

    this.calendarService.getEventWithResults(eventId).subscribe(event => {
      console.log('[EventDetailComponent] Loaded event with results:', event);
      if (event) {
        console.log('[EventDetailComponent] Sessions count:', event.sessions.length);
        console.log('[EventDetailComponent] Sessions:', event.sessions);
      }
      this.event = event;
      this.loading = false;
    });
  }

  onSessionClick(session: Session) {
    if (session.status === 'completed') {
      console.log('[EventDetailComponent] Completed session clicked, switching to Results tab:', session.type);
      this.selectedTabIndex = 1; // Index of "Results" tab
      
      // Wait for tab animation/content to render then scroll to the header
      setTimeout(() => {
        const headers = document.querySelectorAll('.results-header');
        for (let i = 0; i < headers.length; i++) {
          if (headers[i].textContent?.toLowerCase().includes(session.type.toLowerCase())) {
            headers[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
          }
        }
      }, 150);
    }
  }


  formatDateTime(dt: Date | string): string {
    return new Date(dt).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusLabel(session: Session): string {
    if (session.status === 'live') return 'LIVE';
    if (session.status === 'completed') return 'DONE';
    return 'UPCOMING';
  }

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
