import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="countdown" [class.pulse]="isPulse" [class.live]="isLive">
      <span *ngIf="isLive" class="live-dot"></span>
      <span *ngIf="isLive" class="live-text">LIVE</span>
      <ng-container *ngIf="!isLive && !isPast">
        <span class="part" *ngIf="days > 0">{{ days }}<small>d</small></span>
        <span class="part">{{ hours }}<small>h</small></span>
        <span class="part">{{ minutes }}<small>m</small></span>
        <span class="part" *ngIf="days === 0">{{ seconds }}<small>s</small></span>
      </ng-container>
      <span *ngIf="isPast" class="past-text">Completed</span>
    </div>
  `,
  styles: [`
    .countdown {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'Orbitron', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #ccc;
    }
    .part { display: flex; align-items: baseline; gap: 1px; }
    small { font-size: 9px; color: #666; margin-left: 1px; }
    .live-dot {
      width: 8px; height: 8px;
      background: #4caf50;
      border-radius: 50%;
      animation: blink 1s infinite;
    }
    .live-text { color: #4caf50; font-size: 12px; letter-spacing: 1px; }
    .past-text { color: #555; font-size: 12px; }
    .pulse .part { animation: countPulse 1s infinite; color: #e10600; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    @keyframes countPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  `]
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input() targetDate!: Date;

  days = 0; hours = 0; minutes = 0; seconds = 0;
  isLive = false; isPast = false; isPulse = false;
  private sub?: Subscription;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.update();
    this.sub = interval(1000).subscribe(() => { this.update(); this.cdr.markForCheck(); });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private update() {
    const now = Date.now();
    const target = new Date(this.targetDate).getTime();
    const diff = target - now;
    if (diff <= 0 && diff > -7200000) { this.isLive = true; this.isPast = false; return; }
    if (diff <= -7200000) { this.isPast = true; this.isLive = false; return; }
    this.isLive = false; this.isPast = false;
    this.days = Math.floor(diff / 86400000);
    this.hours = Math.floor((diff % 86400000) / 3600000);
    this.minutes = Math.floor((diff % 3600000) / 60000);
    this.seconds = Math.floor((diff % 60000) / 1000);
    this.isPulse = diff < 3600000;
  }
}
