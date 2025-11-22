import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  // Notification settings
  emailNotifications = true;
  pushNotifications = false;
  smsNotifications = false;

  // Display settings
  darkMode = false;
  compactView = false;

  // Privacy settings
  profileVisibility = true;
  activityStatus = true;

  saveSettings() {
    // TODO: Implement save settings logic
    console.log('Settings saved:', {
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      smsNotifications: this.smsNotifications,
      darkMode: this.darkMode,
      compactView: this.compactView,
      profileVisibility: this.profileVisibility,
      activityStatus: this.activityStatus
    });
  }
}
