import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-card">
      <div class="skeleton-left">
        <div class="sk sk-circle"></div>
      </div>
      <div class="skeleton-body">
        <div class="sk sk-line wide"></div>
        <div class="sk sk-line medium"></div>
        <div class="sk sk-line narrow"></div>
      </div>
      <div class="skeleton-right">
        <div class="sk sk-line narrow"></div>
        <div class="sk sk-pill"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #141414;
      border-radius: 12px;
      border: 1px solid #1e1e1e;
      margin-bottom: 8px;
    }
    .skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton-right { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
    .sk {
      background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .sk-circle { width: 40px; height: 40px; border-radius: 50%; }
    .sk-pill { width: 60px; height: 20px; border-radius: 12px; }
    .sk-line.wide { height: 14px; width: 80%; }
    .sk-line.medium { height: 12px; width: 60%; }
    .sk-line.narrow { height: 11px; width: 40%; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonCardComponent {}
