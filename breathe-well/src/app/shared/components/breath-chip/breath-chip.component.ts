import { Component, Input } from '@angular/core';

const colorMap: Record<string, string> = {
  'Focus': 'bg-blue-200 text-blue-800',                          
  'Calm Body and Mind': 'bg-violet-200 text-violet-800',        
  'Fall Asleep': 'bg-indigo-200 text-indigo-800',               
  'Energize': 'bg-amber-200 text-amber-900',                
  'Anxiety and Stress': 'bg-rose-200 text-rose-800',        
  'Brain Fog, Memory & ADHD': 'bg-cyan-200 text-cyan-800',      
  'Increase Oxygen': 'bg-emerald-200 text-emerald-800',         
  'Vagus Nerve (Relaxtion)': 'bg-teal-200 text-teal-800',       
  'Neuplasticity': 'bg-fuchsia-200 text-fuchsia-800',            
  'Headache': 'bg-orange-200 text-orange-900',                   
  'Nervous System': 'bg-slate-200 text-slate-800',               
  'Sympathetic & parasympathetic': 'bg-zinc-200 text-zinc-800',  
  'Amygdala': 'bg-pink-200 text-pink-800',                       
  'Prefrontal cortex (executive functions)': 'bg-purple-200 text-purple-800', 
};

@Component({
  selector: 'app-breath-chip',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          [class]="colorMap[label] || 'bg-gray-200 text-gray-800'">
      {{ label }}
    </span>
  `,
})
export class BreathChipComponent {
  @Input() label = '';
  colorMap = colorMap;
}
