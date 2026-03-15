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
    // Hide the URL immediately on load if it's not the root
    if (window.location.pathname !== '/') {
      this.location.replaceState('/');
    }

    // Listen to route changes
    this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const currentUrl = event.urlAfterRedirects;
      
      if (!this.isBackNavigating) {
        // Prevent duplicate entries (e.g. on initial load or double clicks)
        if (this.history.length > 0 && this.history[this.history.length - 1] === currentUrl) {
          return;
        }

        // Add a virtual history entry to the browser
        if (this.history.length > 0) {
           window.history.pushState({ virtual: true }, '', '/');
        }
        this.history.push(currentUrl);
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
  }

  // Helper to start the service (called in AppComponent)
  init() {
    console.log('[NavigationService] Initialized Virtual History');
  }
}
