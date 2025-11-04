import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  
  currentUser: User | null = null;
  notificationCount = 3; // Mock notification count

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onToggleSidenav() {
    this.toggleSidenav.emit();
  }

  onProfile() {
    this.router.navigate(['/profile']);
  }

  onSettings() {
    this.router.navigate(['/settings']);
  }

  onLogout() {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'User';
  }

  getUserRole(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
  }
}