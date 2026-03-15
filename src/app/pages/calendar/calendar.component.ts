import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MotorsportEvent } from '../../models/motorsport.models';
import { CalendarService } from '../../services/calendar.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';

interface GroupedEvents {
  date: string;
  events: MotorsportEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatProgressSpinnerModule, EventCardComponent, SkeletonCardComponent],
  template: `
    <div class="calendar-page page-animate">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">🏁 Motorsport</h1>
        <p class="page-subtitle">{{ currentDate }}</p>
      </div>

      <!-- Pull to Refresh -->
      <div class="refresh-bar" *ngIf="refreshing">
        <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
        <span>Refreshing...</span>
      </div>

      <mat-tab-group animationDuration="200ms" [dynamicHeight]="true"
                     class="calendar-tabs" (selectedIndexChange)="onTabChange($event)">

        <!-- TODAY TAB -->
        <mat-tab label="Today">
          <div class="tab-content">
            <div *ngIf="loading">
              <app-skeleton-card *ngFor="let i of [1,2,3]"></app-skeleton-card>
            </div>
            <div *ngIf="!loading">
              <div *ngIf="todayEvents.length === 0" class="empty-state">
                <div class="empty-icon">🏁</div>
                <div class="empty-title">No events today</div>
                <div class="empty-sub">Check the Upcoming tab for what's coming next</div>
              </div>
              <app-event-card
                *ngFor="let event of todayEvents; let i = index"
                [event]="event"
                [isToday]="true"
                [index]="i"
                class="stagger-item"
                [style.animation-delay]="i * 50 + 'ms'">
              </app-event-card>
            </div>
          </div>
        </mat-tab>

        <!-- UPCOMING TAB -->
        <mat-tab label="Upcoming">
          <div class="tab-content">
            <div *ngIf="loading">
              <app-skeleton-card *ngFor="let i of [1,2,3,4,5]"></app-skeleton-card>
            </div>
            <div *ngIf="!loading">
              <div *ngIf="upcomingGroups.length === 0" class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-title">No upcoming events</div>
                <div class="empty-sub">Enable more series in Settings</div>
              </div>
              <div *ngFor="let group of upcomingGroups" class="date-group">
                <div class="date-header">{{ group.date }}</div>
                <app-event-card
                  *ngFor="let event of group.events; let i = index"
                  [event]="event"
                  [isToday]="false"
                  [index]="i"
                  class="stagger-item"
                  [style.animation-delay]="i * 50 + 'ms'">
                </app-event-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- RESULTS TAB -->
        <mat-tab label="Results">
          <div class="tab-content">
            <div *ngIf="loading">
              <app-skeleton-card *ngFor="let i of [1,2,3,4]"></app-skeleton-card>
            </div>
            <div *ngIf="!loading">
              <div *ngIf="pastEvents.length === 0" class="empty-state">
                <div class="empty-icon">🏆</div>
                <div class="empty-title">No completed events yet</div>
                <div class="empty-sub">Race results will appear here</div>
              </div>
              <app-event-card
                *ngFor="let event of pastEvents; let i = index"
                [event]="event"
                [isToday]="false"
                [index]="i"
                class="stagger-item"
                [style.animation-delay]="i * 50 + 'ms'">
              </app-event-card>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .calendar-page {
      background: #0a0a0a;
    }
    .page-header {
      padding: 24px 16px 8px;
      background: linear-gradient(180deg, #111 0%, transparent 100%);
    }
    .page-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 900;
      color: #fff;
      margin: 0;
      letter-spacing: 1px;
    }
    .page-subtitle {
      font-size: 13px;
      color: #555;
      margin: 4px 0 0;
    }
    .calendar-tabs {
      padding: 0;
      margin-top: 8px;
    }
    .tab-content {
      padding: 16px var(--page-padding, 12px) 120px;
    }
    .date-group { margin-bottom: 24px; }
    .date-header {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 800;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 3px;
      padding: 8px 4px;
      margin-bottom: 12px;
      border-bottom: 2px solid rgba(255,255,255,0.03);
    }
    
    /* CUSTOM GLASS TABS */
    :host ::ng-deep .mat-mdc-tab-header {
      background: rgba(10, 10, 10, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: none;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    :host ::ng-deep .mat-mdc-tab-label-container {
      padding: 0 12px;
    }
    :host ::ng-deep .mat-mdc-tab {
      height: 48px;
      padding: 0 24px;
      min-width: 0;
      opacity: 1;
    }
    :host ::ng-deep .mdc-tab__text-label {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #444 !important;
      transition: all 0.3s ease;
    }
    :host ::ng-deep .mdc-tab--active .mdc-tab__text-label {
      color: #fff !important;
      text-shadow: 0 0 10px rgba(255,255,255,0.3);
    }
    :host ::ng-deep .mat-mdc-tab .mdc-tab-indicator__content--underline {
      border-color: #fff !important;
      border-width: 2px !important;
      border-radius: 4px 4px 0 0;
      opacity: 0;
      transform: scaleX(0.5);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    :host ::ng-deep .mdc-tab--active .mdc-tab-indicator__content--underline {
      opacity: 1;
      transform: scaleX(1);
    }
    
    /* Remove default gray ripple background */
    :host ::ng-deep .mat-mdc-tab .mat-mdc-focus-indicator {
      display: none;
    }

    .tab-content app-event-card {
      display: block;
      margin-bottom: 12px;
    }
    .tab-content app-event-card:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 400px) {
      .page-title { font-size: 20px; }
      :host ::ng-deep .mat-mdc-tab {
        padding: 0 16px;
      }
      :host ::ng-deep .mdc-tab__text-label {
        font-size: 10px;
        letter-spacing: 1px;
      }
      .tab-content { padding: 12px var(--page-padding, 8px) 100px; }
    }
  `]
})
export class CalendarComponent implements OnInit {
  todayEvents: MotorsportEvent[] = [];
  upcomingGroups: GroupedEvents[] = [];
  pastEvents: MotorsportEvent[] = [];
  loading = true;
  refreshing = false;

  get currentDate(): string {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  constructor(private calendarService: CalendarService) {}

  ngOnInit() {
    this.loadData();
    this.setupPullToRefresh();
  }

  onTabChange(idx: number) {}

  loadData() {
    this.loading = true;
    this.calendarService.getTodayEvents().subscribe(events => {
      this.todayEvents = events;
    });
    this.calendarService.getUpcomingEvents().subscribe(events => {
      this.upcomingGroups = this.groupByDate(events);
    });
    this.calendarService.getPastEvents().subscribe(events => {
      this.pastEvents = events;
      this.loading = false;
      this.refreshing = false;
    });
  }

  private groupByDate(events: MotorsportEvent[]): GroupedEvents[] {
    const map = new Map<string, MotorsportEvent[]>();
    for (const evt of events) {
      const s = evt.sessions[0];
      if (!s) continue;
      const key = new Date(s.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    }
    return Array.from(map.entries()).map(([date, evs]) => ({ date, events: evs }));
  }

  private setupPullToRefresh() {
    let startY = 0;
    window.addEventListener('touchstart', e => startY = e.touches[0].clientY);
    window.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 80 && window.scrollY === 0) {
        this.calendarService.invalidateCache();
        this.refreshing = true;
        this.loadData();
      }
    });
  }
}
