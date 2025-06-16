import { Injectable } from '@angular/core';

export interface BreathingMode {
  name: string;
  description: string;
  inhale: number;
  holdAfterInhale: number;
  exhale: number;
  holdAfterExhale: number;
}

@Injectable({
  providedIn: 'root'
})
export class BreathingService {
  private modes: BreathingMode[] = [
    {
      name: 'Box Breathing',
      description: '4-4-4-4 pattern to calm and focus.',
      inhale: 4, holdAfterInhale: 4, exhale: 4, holdAfterExhale: 4
    },
    {
      name: '4-7-8 Breathing',
      description: 'Great for anxiety and sleep.',
      inhale: 4, holdAfterInhale: 7, exhale: 8, holdAfterExhale: 0
    },
    {
      name: 'Coherent Breathing',
      description: 'Balance breath with 5s inhale/exhale.',
      inhale: 5, holdAfterInhale: 0, exhale: 5, holdAfterExhale: 0
    },
    {
      name: 'Resonant Breathing',
      description: 'Slow 6-6 pattern to reset nervous system.',
      inhale: 6, holdAfterInhale: 0, exhale: 6, holdAfterExhale: 0
    },
    {
      name: 'Tactical Breathing',
      description: 'Military-tested 4-4-4-4 cycle.',
      inhale: 4, holdAfterInhale: 4, exhale: 4, holdAfterExhale: 4
    }
  ];

  private selectedMode: BreathingMode | null = null;

  getModes(): BreathingMode[] {
    return this.modes;
  }

  selectMode(mode: BreathingMode) {
    this.selectedMode = mode;
  }

  getSelectedMode(): BreathingMode | null {
    return this.selectedMode;
  }
}
