// src/app/core/services/techniques.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, shareReplay, tap } from 'rxjs';

export interface Technique {
  id: string; name: string; aliases: string[];
  level: string | null; how_to: string | null;
  after_feel: string | null; description: string | null;
  categories: string[];
}

@Injectable({ providedIn: 'root' })
export class TechniquesService {
  private http = inject(HttpClient);

  all$ = this.http.get<Technique[]>('/breath_techniques.json') // ⬅ matches what you tested
    .pipe(
      tap(list => console.log('[techniques] loaded:', list?.length, 'items')),
      catchError(err => {
        console.error('[techniques] load failed', err);
        return of([]);
      }),
      shareReplay(1)
    );

  bySlug$(slug: string) {
    return this.all$.pipe(map(list => list.find(t => t.id === slug) ?? null));
  }
}
