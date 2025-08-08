import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  template: `
    <section [id]="id" class="py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ng-content />
      </div>
    </section>
  `,
})
export class SectionComponent { @Input() id?: string; }