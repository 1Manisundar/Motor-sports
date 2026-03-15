import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { StandingsService } from '../../services/standings.service';
import { DriverStanding, ConstructorStanding, SeriesId } from '../../models/motorsport.models';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="standings-page page-animate">
      <div class="page-header">
        <h1 class="page-title">🏆 Standings</h1>
        <p class="page-subtitle">2026 Championship Tables</p>
      </div>

      <!-- Series Selector -->
      <div class="selector-wrap">
        <mat-form-field appearance="outline" class="series-select">
          <mat-select [(ngModel)]="selectedSeries" (ngModelChange)="onSeriesChange($event)">
            <mat-option value="f1">🏎️ Formula 1</mat-option>
            <mat-option value="motogp">🏍️  MotoGP</mat-option>
            <mat-option value="nascar">🏁 NASCAR</mat-option>
            <mat-option value="wrc">🚗 WRC</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-wrap">
        <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        <p>Loading standings...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading" class="standings-content">

        <!-- Drivers -->
        <div class="standings-section">
          <div class="section-header">
            <span>{{ getDriverLabel() }}</span>
            <span class="year-badge">2026</span>
          </div>
          <div *ngIf="driverStandings.length === 0" class="no-data">
            Standings data not available yet
          </div>
          <div *ngFor="let driver of driverStandings; let i = index"
               class="standing-row hover-glow stagger-item"
               [class.p1]="driver.position === 1"
               [class.p2]="driver.position === 2"
               [class.p3]="driver.position === 3"
               [style.animation-delay]="i * 40 + 'ms'">
            <div class="standing-pos">
              <span *ngIf="driver.position === 1">🥇</span>
              <span *ngIf="driver.position === 2">🥈</span>
              <span *ngIf="driver.position === 3">🥉</span>
              <span *ngIf="driver.position > 3" class="pos-num">{{ driver.position }}</span>
            </div>
            <div class="standing-body">
              <div class="driver-name">{{ driver.driverName }}</div>
              <div class="team-sub" *ngIf="driver.team && driver.team !== driver.driverName">{{ driver.team }}</div>
            </div>
            <div class="standing-pts">
              <span class="pts">{{ driver.points }}</span>
              <span class="pts-label">pts</span>
            </div>
          </div>
        </div>

        <!-- Constructors (F1 only) -->
        <div class="standings-section" *ngIf="selectedSeries === 'f1' && constructorStandings.length">
          <div class="section-header">
            <span>Constructor Championship</span>
            <span class="year-badge">2026</span>
          </div>
          <div *ngFor="let team of constructorStandings; let i = index"
               class="standing-row hover-glow stagger-item"
               [class.p1]="team.position === 1"
               [class.p2]="team.position === 2"
               [class.p3]="team.position === 3"
               [style.animation-delay]="i * 40 + 'ms'">
            <div class="standing-pos">
              <span *ngIf="team.position === 1">🥇</span>
              <span *ngIf="team.position === 2">🥈</span>
              <span *ngIf="team.position === 3">🥉</span>
              <span *ngIf="team.position > 3" class="pos-num">{{ team.position }}</span>
            </div>
            <div class="standing-body">
              <div class="driver-name">{{ team.team }}</div>
            </div>
            <div class="standing-pts">
              <span class="pts">{{ team.points }}</span>
              <span class="pts-label">pts</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .standings-page { min-height: 100vh; background: #0a0a0a; padding-bottom: 100px; }
    .page-header { padding: 24px 16px 8px; }
    .page-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px; font-weight: 900; color: #fff; margin: 0;
    }
    .page-subtitle { font-size: 13px; color: #555; margin: 4px 0 0; }
    .selector-wrap { padding: 16px 16px 0; }
    .series-select { width: 100%; }
    .loading-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 60px; gap: 16px; color: #666;
    }
    .standings-content { padding: 8px 16px; }
    .standings-section { margin-bottom: 24px; }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      font-family: 'Orbitron', sans-serif;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px;
      color: #555; margin: 16px 0 8px;
    }
    .year-badge {
      background: #1e1e1e; color: #666;
      font-size: 10px; padding: 2px 8px; border-radius: 6px;
    }
    .standing-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: #141414;
      border-radius: 10px; border: 1px solid #1e1e1e; margin-bottom: 6px;
    }
    .standing-row:hover { transform: translateX(4px); }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .standing-row.p1 { background: linear-gradient(135deg, #2a2200 0%, #141414 100%); border-color: #ffd70044; }
    .standing-row.p2 { background: linear-gradient(135deg, #1e2022 0%, #141414 100%); border-color: #c0c0c044; }
    .standing-row.p3 { background: linear-gradient(135deg, #221a10 0%, #141414 100%); border-color: #cd7f3244; }
    .standing-pos { font-size: 22px; width: 32px; text-align: center; flex-shrink: 0; }
    .pos-num { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; color: #888; }
    .standing-body { flex: 1; }
    .driver-name { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 15px; color: #f0f0f0; }
    .team-sub { font-size: 12px; color: #666; }
    .standing-pts { text-align: right; }
    .pts { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 700; color: #ccc; }
    .pts-label { font-size: 10px; color: #555; margin-left: 2px; }
    .no-data { text-align: center; padding: 40px; color: #555; font-size: 14px; }
    :host ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: #1e1e1e;
      --mdc-outlined-text-field-hover-outline-color: #333;
      --mdc-outlined-text-field-focus-outline-color: #e10600;
      --mdc-outlined-text-field-label-text-color: #888;
    }
    :host ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    :host ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    :host ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: #1e1e1e !important;
    }
    :host ::ng-deep .mdc-select__anchor { background: #141414 !important; }
  `]
})
export class StandingsComponent implements OnInit {
  selectedSeries: SeriesId = 'f1';
  driverStandings: DriverStanding[] = [];
  constructorStandings: ConstructorStanding[] = [];
  loading = true;

  constructor(private standingsService: StandingsService) {}

  ngOnInit() {
    this.load();
  }

  onSeriesChange(series: SeriesId) {
    this.loading = true;
    this.load();
  }

  private load() {
    this.standingsService.getStandings(this.selectedSeries).subscribe(data => {
      this.driverStandings = data.drivers;
      this.constructorStandings = data.constructors;
      this.loading = false;
    });
  }

  getDriverLabel(): string {
    const labels: Record<SeriesId, string> = {
      f1: 'Driver Championship',
      motogp: 'Rider Championship',
      nascar: 'NASCAR Cup Standings',
      wrc: 'Driver Championship',
    };
    return labels[this.selectedSeries];
  }
}
