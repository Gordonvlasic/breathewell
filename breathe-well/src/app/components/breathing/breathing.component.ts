import { Component, OnInit } from '@angular/core';
import { BreathingService, BreathingMode } from '../../services/breathing.service';
import { interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'
@Component({
  selector: 'app-breathing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breathing.component.html',
  styleUrls: ['./breathing.component.css']
})
export class BreathingComponent implements OnInit {
  mode!: BreathingMode;
  phase = '';
  size = 150;
  private phases: { name: string; duration: number; action: () => void }[] = [];

  constructor(private breathingService: BreathingService, private router:Router) {}

  ngOnInit(): void {
    const mode = this.breathingService.getSelectedMode();
    if (!mode) return;

    this.mode = mode;
    this.phases = [
      { name: 'Inhale', duration: mode.inhale, action: () => this.size = 200 },
      { name: 'Hold', duration: mode.holdAfterInhale, action: () => {} },
      { name: 'Exhale', duration: mode.exhale, action: () => this.size = 100 },
      { name: 'Hold', duration: mode.holdAfterExhale, action: () => {} }
    ].filter(p => p.duration > 0);

    this.runCycle();
  }

  transitionDuration = 1;
  scale = 1;

runCycle(index = 0) {
  const current = this.phases[index];
  this.phase = current.name;
  this.transitionDuration = current.duration;

  if (current.name === 'Inhale') this.scale = 1.3;
  else if (current.name === 'Exhale') this.scale = 1.0;

  setTimeout(() => {
    this.runCycle((index + 1) % this.phases.length);
  }, current.duration * 1000);
}

  goBack(){
    this.router.navigate(['/']);
  }

  
}