import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SharedModule, HeaderComponent, SidebarComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'School Management System';
  isAuthenticated = false;
  isLoading = false;
  sidenavOpened = true;
  
  // Routes that should not show the main layout (header + sidebar)
  publicRoutes = ['/auth/login', '/auth/register', '/unauthorized', '/404'];

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Subscribe to loading state and update UI
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
      
      // Optional: Add a small delay to prevent flickering for fast requests
      if (!loading) {
        setTimeout(() => {
          this.isLoading = loading;
        }, 100);
      }
    });

    // Check if current route is public and handle mobile navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Auto-close sidenav on mobile after navigation
      if (this.isMobile()) {
        this.sidenavOpened = false;
      }
    });

    // Set initial sidenav state based on screen size
    this.sidenavOpened = !this.isMobile();
  }

  isPublicRoute(): boolean {
    return this.publicRoutes.some(route => this.router.url.startsWith(route));
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenav() {
    if (this.isMobile()) {
      this.sidenavOpened = false;
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}