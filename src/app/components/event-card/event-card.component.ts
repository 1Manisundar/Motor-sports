import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MotorsportEvent } from '../../models/motorsport.models';
import { SeriesBadgeComponent } from '../series-badge/series-badge.component';
import { CountdownComponent } from '../countdown/countdown.component';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterModule, SeriesBadgeComponent, CountdownComponent],
  template: `
    <div class="event-card hover-glow"
         [class.is-today]="isToday"
         [class.is-live]="event.status === 'live'"
         [style.--series-color]="event.seriesColor"
         [attr.data-index]="index"
         [routerLink]="['/event', event.series, event.id]">

      <!-- Logo -->
      <div class="card-logo">
        <img [src]="event.seriesLogo" [alt]="event.seriesName"
             (error)="onLogoError($event)" class="series-logo" />
      </div>

      <!-- Body -->
      <div class="card-body">
        <div class="event-name">{{ event.eventName }}</div>
        <div class="circuit">
          <img *ngIf="event.countryFlag" [src]="event.countryFlag" [alt]="event.country" class="country-flag-mini" />
          {{ event.circuit }}
        </div>
        <div class="session-info" *ngIf="nextSession">
          <span class="session-type">{{ nextSession.type }}</span>
        </div>
      </div>

      <!-- Right -->
      <div class="card-right">
        <ng-container *ngIf="isToday && nextSession">
          <app-countdown [targetDate]="nextSession.dateTime"></app-countdown>
        </ng-container>
        <ng-container *ngIf="!isToday">
          <div class="event-date">{{ getEventDate() }}</div>
        </ng-container>
        <app-series-badge [series]="event.series"></app-series-badge>
      </div>

      <!-- Status Glow for live -->
      <div class="status-indicator" *ngIf="event.status === 'live'">LIVE</div>
    </div>
  `,
  styles: [`
    .event-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #141414;
      border-radius: 12px;
      border: 1px solid #1e1e1e;
      cursor: pointer;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .event-card:hover {
      background: #1a1a1a;
      border-color: var(--series-color, #333);
    }
    .event-card.is-today {
      border-color: var(--series-color, #333);
      box-shadow: 0 0 16px -4px var(--series-color, transparent),
                  inset 0 0 40px rgba(255,255,255,0.02);
    }
    .event-card.is-live {
      border-color: var(--series-color, #4caf50);
      box-shadow: 0 0 24px -4px var(--series-color, #4caf50);
      animation: glowPulse 2s infinite, fadeSlideIn 0.4s ease both;
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 16px -4px var(--series-color); }
      50% { box-shadow: 0 0 32px -2px var(--series-color); }
    }
    .series-logo {
      width: 40px; height: 40px;
      object-fit: contain;
      border-radius: 6px;
    }
    .logo-fallback {
      width: 40px; height: 40px;
      border-radius: 8px;
      background: var(--series-color, #333);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #000;
    }
    .card-body { flex: 1; min-width: 0; }
    .event-name {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 15px;
      color: #f0f0f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .circuit {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    .session-type {
      font-size: 11px;
      color: var(--series-color, #888);
      font-weight: 600;
      margin-top: 2px;
      display: block;
    }
    .card-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      flex-shrink: 0;
    }
    .event-date {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      color: #888;
      white-space: nowrap;
    }
    .status-indicator {
      position: absolute;
      top: 8px; right: 8px;
      background: var(--series-color, #4caf50);
      color: #000;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 1px;
      animation: blink 1s infinite;
    }
    @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
    .country-flag-mini {
      width: 18px; height: 12px; object-fit: cover; border-radius: 2px;
      margin-right: 4px; vertical-align: middle; border: 1px solid #333;
    }
  `]
})
export class EventCardComponent {
  @Input() event!: MotorsportEvent;
  @Input() isToday = false;
  @Input() index = 0;

  get nextSession() {
    const now = new Date();
    const upcoming = this.event.sessions.filter(s => s.status !== 'completed');
    return upcoming[0] ?? this.event.sessions[this.event.sessions.length - 1];
  }

  getEventDate(): string {
    const s = this.event.sessions[0];
    if (!s) return '';
    return new Date(s.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement!;
    parent.innerHTML = `<div class="logo-fallback" style="background:${this.event.seriesColor}">${this.event.series.toUpperCase()}</div>`;
  }
}
