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
            <label class="glass-toggle">
              <input type="checkbox" 
                     [checked]="isEnabled(series.id)"
                     (change)="onToggle(series.id, $any($event.target).checked)">
              <span class="toggle-track"></span>
            </label>
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
    .settings-page { background: #080808; padding-bottom: 120px; }
    .page-header { padding: 32px var(--page-padding, 20px) 12px; }
    .page-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px; font-weight: 900; color: #fff; margin: 0;
      letter-spacing: -1px;
    }
    .page-subtitle { font-size: 14px; color: #555; margin: 6px 0 0; font-family: 'Rajdhani', sans-serif; }
    
    .section { padding: 24px var(--page-padding, 20px) 0; }
    .section-label {
      font-family: 'Orbitron', sans-serif;
      font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 3px;
      color: #333; margin-bottom: 12px;
    }
    
    .series-list {
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }
    .series-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      gap: 12px;
    }
    .series-row:last-child { border-bottom: none; }
    .series-info { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
    .series-emoji { font-size: 32px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.1)); }
    .series-text { flex: 1; min-width: 0; }
    .series-name {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 800; font-size: 17px; color: var(--series-color, #ccc);
      line-height: 1.2;
    }
    .series-desc { 
      font-size: 12px; color: #444; margin-top: 3px; 
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-family: 'Rajdhani', sans-serif;
    }

    /* Custom iOS Glass Toggle */
    .glass-toggle {
      position: relative;
      width: 46px;
      height: 26px;
      flex-shrink: 0;
    }
    .glass-toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-track {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 30px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }
    .toggle-track:before {
      content: "";
      position: absolute;
      height: 20px;
      width: 20px;
      left: 2px;
      bottom: 2px;
      background: #fff;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    input:checked + .toggle-track {
      background: var(--series-color, #e10600);
      box-shadow: 0 0 15px -2px var(--series-color, #e10600);
      border-color: transparent;
    }
    input:checked + .toggle-track:before {
      transform: translateX(20px);
    }

    .info-card {
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 18px 20px;
      display: flex; align-items: center; gap: 16px;
    }
    .tz-icon { font-size: 32px; }
    .tz-name { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 16px; color: #eee; }
    .tz-sub { font-size: 12px; color: #444; font-family: 'Rajdhani', sans-serif; }

    .clear-btn {
      width: 100%;
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 18px 20px;
      cursor: pointer;
      text-align: left;
      display: flex; flex-direction: column; gap: 4px;
      color: #e10600;
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px; font-weight: 800;
      transition: all 0.3s ease;
    }
    .clear-btn:hover { background: rgba(225, 6, 0, 0.1); border-color: rgba(225, 6, 0, 0.3); }
    .clear-sub { font-size: 12px; color: #444; font-weight: 500; }
    
    .app-version { text-align: center; padding: 40px; color: #222; font-size: 11px; font-family: 'Orbitron', sans-serif; letter-spacing: 1px; }

    @media (max-width: 400px) {
      .series-emoji { font-size: 24px; }
      .series-name { font-size: 15px; }
      .series-desc { font-size: 11px; }
      .series-row { padding: 14px 16px; }
      .glass-toggle { width: 40px; height: 22px; }
      .toggle-track:before { height: 16px; width: 16px; }
      input:checked + .toggle-track:before { transform: translateX(18px); }
    }
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
