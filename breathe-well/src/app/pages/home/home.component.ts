import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TechniquesService } from '../../core/services/techniques.service';
import { Technique } from '../../core/models/technique';
import { BreathChipComponent } from '../../shared/components/breath-chip/breath-chip.component';
import { SectionComponent } from '../../shared/components/section/section.component';

type CategoryChip = {
  label: string;   // shown in the hero
  terms: string[]; // underlying category names in the data
  idleClass: string;
  activeClass: string;
};

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink, BreathChipComponent, SectionComponent, FormsModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private svc = inject(TechniquesService);
  techniques$ = this.svc.all$;

  q = signal('');
  filterCategory = signal<string | null>(null); // chip label or null for "All"
  readonly year = new Date().getFullYear();

  // High-contrast colored chips
  categoryChips: CategoryChip[] = [
    {
      label: 'Focus',
      terms: ['Focus'],
      idleClass: 'bg-sky-500 text-white hover:brightness-110 shadow-sm',
      activeClass: 'bg-white text-sky-700 shadow-md',
    },
    {
      label: 'Calm',
      terms: ['Calm Body and Mind'],
      idleClass: 'bg-emerald-500 text-white hover:brightness-110 shadow-sm',
      activeClass: 'bg-white text-emerald-700 shadow-md',
    },
    {
      label: 'Sleep',
      terms: ['Fall Asleep'],
      idleClass: 'bg-violet-500 text-white hover:brightness-110 shadow-sm',
      activeClass: 'bg-white text-violet-700 shadow-md',
    },
    {
      label: 'Energize',
      terms: ['Energize'],
      idleClass: 'bg-amber-500 text-white hover:brightness-110 shadow-sm',
      activeClass: 'bg-white text-amber-700 shadow-md',
    },
  ];

  // UI helpers
  isActive(label: string) {
    return this.filterCategory()?.toLowerCase() === label.toLowerCase();
  }
  isAllActive() {
    return this.filterCategory() === null;
  }
  toggleFilter(label: string) {
    this.filterCategory.set(this.isActive(label) ? null : label);
  }
  clearFilter() {
    this.filterCategory.set(null);
  }

  // Search + mapped category filter
  filtered(list: Technique[]) {
    const q = this.q().toLowerCase().trim();
    const activeLabel = this.filterCategory();

    const activeTerms =
      activeLabel
        ? (this.categoryChips.find(c => c.label === activeLabel)?.terms ?? [])
        : [];

    return list.filter(t => {
      const matchesQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.aliases || []).some(a => a.toLowerCase().includes(q)) ||
        (t.categories || []).some(c => c.toLowerCase().includes(q));

      const matchesCat =
        !activeLabel ||
        (t.categories || []).some(c =>
          activeTerms.some(term => c.toLowerCase() === term.toLowerCase())
        );

      return matchesQ && matchesCat;
    });
  }
}
