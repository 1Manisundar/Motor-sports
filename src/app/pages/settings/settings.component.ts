import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { PreferencesService } from '../../services/preferences.service';
import { CalendarService } from '../../services/calendar.service';
import { SeriesId, SERIES_CONFIG } from '../../models/motorsport.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatDividerModule],
  template: `
    <div class="settings-page page-animate">
      <div class="page-header">
        <h1 class="page-title">⚙️ Settings</h1>
        <p class="page-subtitle">Customize your motorsport calendar</p>
      </div>

      <div class="section">
        <div class="section-label">Series</div>
        <div class="series-list">
          <div *ngFor="let series of seriesList; let i = index" class="series-row hover-glow stagger-item"
               [style.--series-color]="series.color"
               [style.animation-delay]="i * 50 + 'ms'">
            <div class="series-info">
              <div class="series-emoji">{{ series.emoji }}</div>
              <div class="series-text">
                <div class="series-name">{{ series.name }}</div>
                <div class="series-desc">{{ series.desc }}</div>
              </div>
            </div>
            <mat-slide-toggle
              [checked]="isEnabled(series.id)"
              (change)="onToggle(series.id, $event.checked)"
              [color]="'accent'">
            </mat-slide-toggle>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Timezone</div>
        <div class="info-card hover-glow stagger-item" style="animation-delay: 250ms">
          <div class="tz-icon">🌍</div>
          <div>
            <div class="tz-name">{{ timezone }}</div>
            <div class="tz-sub">Auto-detected from your browser</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Cache</div>
        <button class="clear-btn hover-glow stagger-item" style="animation-delay: 300ms" (click)="clearCache()">
          <span>🗑️ Clear API Cache</span>
          <span class="clear-sub">Forces fresh data on next load</span>
        </button>
      </div>

      <div class="app-version">Motorsport Calendar · v1.0.0</div>
    </div>
  `,
  styles: [`
    .settings-page { min-height: 100vh; background: #0a0a0a; padding-bottom: 100px; }
    .page-header { padding: 24px 16px 8px; }
    .page-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px; font-weight: 900; color: #fff; margin: 0;
    }
    .page-subtitle { font-size: 13px; color: #555; margin: 4px 0 0; }
    .section { padding: 20px 16px 0; }
    .section-label {
      font-family: 'Orbitron', sans-serif;
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px;
      color: #555; margin-bottom: 10px;
    }
    .series-list {
      background: #141414;
      border-radius: 12px;
      border: 1px solid #1e1e1e;
      overflow: hidden;
    }
    .series-row:last-child { border-bottom: none; }
    .series-info { display: flex; align-items: center; gap: 14px; }
    .series-emoji { font-size: 28px; }
    .series-name {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700; font-size: 16px; color: var(--series-color, #ccc);
    }
    .series-desc { font-size: 12px; color: #555; margin-top: 2px; }
    .info-card {
      background: #141414;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 16px;
      display: flex; align-items: center; gap: 12px;
    }
    .tz-icon { font-size: 28px; }
    .tz-name { font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 15px; color: #ccc; }
    .tz-sub { font-size: 12px; color: #555; }
    .clear-btn:hover { background: #1a1414; border-color: #e10600; }
    .clear-sub { font-size: 12px; color: #555; font-weight: 400; }
    .app-version { text-align: center; padding: 30px; color: #333; font-size: 12px; }
    :host ::ng-deep .mdc-switch__track { background-color: #333 !important; }
  `]
})
export class SettingsComponent implements OnInit {
  timezone = '';

  seriesList = [
    { id: 'f1' as SeriesId, name: 'Formula 1', emoji: '🏎️', color: '#e10600', desc: 'FIA Formula One World Championship' },
    { id: 'motogp' as SeriesId, name: 'MotoGP', emoji: '🏍️', color: '#f5a623', desc: 'FIM MotoGP World Championship' },
    { id: 'nascar' as SeriesId, name: 'NASCAR', emoji: '🏁', color: '#ffd700', desc: 'NASCAR Cup Series' },
    { id: 'wrc' as SeriesId, name: 'WRC', emoji: '🚗', color: '#4caf50', desc: 'FIA World Rally Championship' },
  ];

  constructor(
    private prefs: PreferencesService,
    private calendarService: CalendarService,
  ) {}

  ngOnInit() {
    this.timezone = this.prefs.getTimezone();
  }

  isEnabled(series: SeriesId): boolean {
    return this.prefs.isSeriesEnabled(series);
  }

  onToggle(series: SeriesId, enabled: boolean) {
    this.prefs.toggleSeries(series, enabled);
    this.calendarService.invalidateCache();
  }

  clearCache() {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('f1_') || k.startsWith('tsdb_') || k.startsWith('standings_'));
    keys.forEach(k => localStorage.removeItem(k));
    this.calendarService.invalidateCache();
    alert('Cache cleared — refreshing data on next navigation.');
  }
}
