import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, shareReplay, tap } from 'rxjs';
import { Technique } from '../models/technique';

@Injectable({ providedIn: 'root' })
export class TechniquesService {
  private http = inject(HttpClient);

  // Observable<Technique[]> using the *model* type
  readonly all$ = this.http.get<Technique[]>('breath_techniques.json').pipe(
    tap(list => console.log('[techniques] loaded:', list?.length, 'items')),
    catchError(err => {
      console.error('[techniques] load failed', err);
      return of([] as Technique[]); // keep the same Technique[] type on failure
    }),
    shareReplay(1)
  );

  bySlug$(slug: string) {
    return this.all$.pipe(map(list => list.find(t => t.id === slug) ?? null));
  }
}
