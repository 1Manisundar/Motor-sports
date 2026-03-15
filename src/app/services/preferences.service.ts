import { Injectable } from '@angular/core';
import { SeriesId } from '../models/motorsport.models';

export interface UserPreferences {
  enabledSeries: Record<SeriesId, boolean>;
  timezone: string;
}

const DEFAULT_PREFS: UserPreferences = {
  enabledSeries: {
    f1: true,
    motogp: true,
    nascar: true,
    wrc: true,
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

const STORAGE_KEY = 'motorsport_prefs';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private prefs: UserPreferences;

  constructor() {
    this.prefs = this.load();
  }

  private load(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      }
    } catch {}
    return { ...DEFAULT_PREFS };
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
  }

  get(): UserPreferences {
    return this.prefs;
  }

  isSeriesEnabled(series: SeriesId): boolean {
    return this.prefs.enabledSeries[series] ?? true;
  }

  toggleSeries(series: SeriesId, enabled: boolean): void {
    this.prefs.enabledSeries[series] = enabled;
    this.save();
  }

  getTimezone(): string {
    return this.prefs.timezone;
  }
}
