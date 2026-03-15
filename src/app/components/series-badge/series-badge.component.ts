import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeriesId } from '../../models/motorsport.models';

@Component({
  selector: 'app-series-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [style.background-color]="color + '22'" [style.color]="color" [style.border-color]="color + '44'">
      <span class="emoji">{{ emoji }}</span>
      <span class="label">{{ label }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1px solid;
      font-family: 'Rajdhani', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .emoji { font-size: 12px; }
  `]
})
export class SeriesBadgeComponent {
  @Input() series!: SeriesId;

  private readonly meta: Record<SeriesId, { color: string; label: string; emoji: string }> = {
    f1: { color: '#e10600', label: 'F1', emoji: '🏎️' },
    motogp: { color: '#f5a623', label: 'MotoGP', emoji: '🏍️' },
    nascar: { color: '#ffd700', label: 'NASCAR', emoji: '🏁' },
    wrc: { color: '#4caf50', label: 'WRC', emoji: '🚗' },
  };

  get color(): string { return this.meta[this.series]?.color ?? '#888'; }
  get label(): string { return this.meta[this.series]?.label ?? this.series; }
  get emoji(): string { return this.meta[this.series]?.emoji ?? '🏁'; }
}
