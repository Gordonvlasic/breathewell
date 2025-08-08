import { Component, Input } from '@angular/core';

const colorMap: Record<string, string> = {
  'Focus': 'bg-blue-100 text-blue-700',
  'Calm Body and Mind': 'bg-violet-100 text-violet-700',
  'Fall Asleep': 'bg-indigo-100 text-indigo-700',
  'Energize': 'bg-amber-100 text-amber-800',
  'Anxiety and Stress': 'bg-rose-100 text-rose-700',
  'Brain Fog, Memory & ADHD': 'bg-cyan-100 text-cyan-700',
  'Increase Oxygen': 'bg-emerald-100 text-emerald-700',
  'Vagus Nerve (Relaxtion)': 'bg-teal-100 text-teal-700',
  'Neuplasticity': 'bg-fuchsia-100 text-fuchsia-700',
  'Headache': 'bg-orange-100 text-orange-800',
  'Nervous System': 'bg-slate-100 text-slate-700',
  'Sympathetic & parasympathetic': 'bg-zinc-100 text-zinc-700',
  'Amygdala': 'bg-pink-100 text-pink-700',
  'Prefrontal cortex (executive functions)': 'bg-purple-100 text-purple-700',
};

@Component({
  selector: 'app-breath-chip',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          [class]="colorMap[label] || 'bg-gray-100 text-gray-700'">
      {{ label }}
    </span>
  `,
})
export class BreathChipComponent {
  @Input() label = '';
  colorMap = colorMap;
}