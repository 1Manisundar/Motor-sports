import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = [];
  private isBackNavigating = false;

  constructor(private router: Router, private location: Location) {
    // Listen to route changes
    this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (!this.isBackNavigating) {
        // If it's a new navigation, add a virtual history entry
        // We push current state to history to enable back button
        if (this.history.length > 0) {
           window.history.pushState({ virtual: true }, '', '/');
        }
        this.history.push(event.urlAfterRedirects);
      }
      this.isBackNavigating = false;
    });

    // Handle Browser Back / Swipe Back
    window.addEventListener('popstate', (event) => {
      if (this.history.length > 1) {
        this.isBackNavigating = true;
        this.history.pop(); // Remove current
        const previousPath = this.history[this.history.length - 1];
        
        this.router.navigateByUrl(previousPath, { skipLocationChange: true });
      }
    });
    
    // Initial entry
    this.history.push(this.router.url);
  }

  // Helper to start the service (called in AppComponent)
  init() {
    console.log('[NavigationService] Initialized Virtual History');
  }
}
