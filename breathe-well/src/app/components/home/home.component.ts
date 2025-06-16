import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BreathingService, BreathingMode } from '../../services/breathing.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  modes: BreathingMode[];

  constructor(private breathingService: BreathingService, private router: Router) {
    this.modes = this.breathingService.getModes();
  }

  select(mode: BreathingMode) {
    this.breathingService.selectMode(mode);
    this.router.navigate(['/breathe']);
  }
}