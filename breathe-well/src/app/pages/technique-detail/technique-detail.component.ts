import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, switchMap } from 'rxjs';
import { TechniquesService } from '../../core/services/techniques.service';
import { BreathChipComponent } from '../../shared/components/breath-chip/breath-chip.component';
import { parseBreathPattern } from '../../core/utils/parse-pattern.util';
import { BreathingPlayerComponent } from '../../shared/components/breathing-player/breathing-player.component';
import { IconsModule } from '../../shared/icons.module';
import { provideAnimations } from '@angular/platform-browser/animations';

type Benefit = { title: string; note: string };
type IconSpec = { name: string; ring: string; fg: string; bg: string };

const DEFAULT_BENEFITS: Benefit[] = [
  { title: 'Lower stress response', note: 'Down-shift sympathetic arousal.' },
  { title: 'Increase focus',        note: 'Engage prefrontal control.' },
  { title: 'Activate vagal tone',   note: 'Stronger relaxation signal.' },
  { title: 'Better sleep',          note: 'Ease into parasympathetic.' },
];

const tone = {
  indigo:  { ring: 'ring-indigo-200',   fg: 'text-indigo-600',   bg: 'bg-indigo-50' },
  emerald: { ring: 'ring-emerald-200',  fg: 'text-emerald-600',  bg: 'bg-emerald-50' },
  violet:  { ring: 'ring-violet-200',   fg: 'text-violet-600',   bg: 'bg-violet-50' },
  amber:   { ring: 'ring-amber-200',    fg: 'text-amber-600',    bg: 'bg-amber-50' },
  teal:    { ring: 'ring-teal-200',     fg: 'text-teal-600',     bg: 'bg-teal-50' },
  sky:     { ring: 'ring-sky-200',      fg: 'text-sky-600',      bg: 'bg-sky-50' },
  rose:    { ring: 'ring-rose-200',     fg: 'text-rose-600',     bg: 'bg-rose-50' },
  fuchsia: { ring: 'ring-fuchsia-200',  fg: 'text-fuchsia-600',  bg: 'bg-fuchsia-50' },
  slate:   { ring: 'ring-slate-200',    fg: 'text-slate-700',    bg: 'bg-slate-100' },
};

function iconFor(title: string, note?: string): IconSpec {
  switch (title) {
    case 'Down-shift stress fast':   return { name: 'Leaf',      ...tone.emerald };
    case 'Sharper focus':            return { name: 'Target',    ...tone.indigo  };
    case 'Vagal engagement':         return { name: 'Heart',     ...tone.rose    };
    case 'Composure on demand':      return { name: 'RefreshCw', ...tone.indigo  };

    case 'Nervous system balance':   return { name: 'Waves',     ...tone.sky     };
    case 'Calm clarity':             return { name: 'Leaf',      ...tone.emerald };
    case 'Better sleep & recovery':  return { name: 'Moon',      ...tone.violet  };
    case 'Attention support':        return { name: 'Target',    ...tone.indigo  };

    case 'Rapid relaxation':         return { name: 'Leaf',      ...tone.emerald };
    case 'Sleep onset help':         return { name: 'Moon',      ...tone.violet  };
    case 'Emotion regulation':       return { name: 'Heart',     ...tone.rose    };
    case 'Anytime reset':            return { name: 'RefreshCw', ...tone.indigo  };

    case 'Efficient breathing':      return { name: 'Activity',  ...tone.sky     };
    case 'Stress relief':            return { name: 'Leaf',      ...tone.emerald };
    case 'Better oxygenation':       return { name: 'Waves',     ...tone.sky     };
    case 'Body awareness':           return { name: 'Eye',       ...tone.indigo  };

    case 'Calm balance':             return { name: 'Leaf',      ...tone.emerald };
    case 'Mental clarity':           return { name: 'Brain',     ...tone.fuchsia };
    case 'Stress reduction':         return { name: 'Leaf',      ...tone.emerald };
    case 'Breath control':           return { name: 'Gauge',     ...tone.indigo  };

    case 'Steady calm':              return { name: 'Leaf',      ...tone.emerald };
    case 'Focus anchor':             return { name: 'Target',    ...tone.indigo  };
    case 'Sleep-friendly':           return { name: 'Moon',      ...tone.violet  };
    case 'Beginner-proof':           return { name: 'CheckCircle2', ...tone.emerald };

    case 'Jaw/face release':         return { name: 'Smile',     ...tone.rose    };
    case 'Energy lift':              return { name: 'Zap',       ...tone.amber   };
    case 'Vocal ease':               return { name: 'Mic',       ...tone.fuchsia };
    case 'Mood shift':               return { name: 'Sparkles',  ...tone.amber   };

    case 'Less breathlessness':      return { name: 'Wind',      ...tone.teal    };
    case 'Calmer pace':              return { name: 'Waves',     ...tone.sky     };
    case 'Everyday utility':         return { name: 'Smartphone',...tone.slate   };
    case 'CO₂ balance':              return { name: 'Gauge',     ...tone.indigo  };

    case 'Quick reset':              return { name: 'RefreshCw', ...tone.indigo  };
    case 'Attention anchor':         return { name: 'Target',    ...tone.indigo  };
    case 'Gentle control':           return { name: 'Feather',   ...tone.teal    };
    case 'Portable tool':            return { name: 'Smartphone',...tone.slate   };

    case 'Instant calm':             return { name: 'Leaf',      ...tone.emerald };
    case 'Focus aid':                return { name: 'Target',    ...tone.indigo  };
    case 'Sinus relief':             return { name: 'Wind',      ...tone.teal    };
    case 'Mood lift':                return { name: 'Sun',       ...tone.amber   };

    case 'Reduced hyperventilation': return { name: 'Activity',  ...tone.sky     };
    case 'Anxiety relief':           return { name: 'Heart',     ...tone.rose    };
    case 'Better sleep hygiene':     return { name: 'Moon',      ...tone.violet  };
    case 'Breath awareness':         return { name: 'Eye',       ...tone.indigo  };

    case 'Energy boost':             return { name: 'Zap',       ...tone.amber   };
    case 'Airway clearing':          return { name: 'Wind',      ...tone.teal    };
    case 'Core engagement':          return { name: 'Activity',  ...tone.fuchsia };
    case 'Mental brightness':        return { name: 'Sun',       ...tone.amber   };

    case 'Meta-awareness':           return { name: 'Eye',       ...tone.indigo  };
    case 'Stress buffering':         return { name: 'Leaf',      ...tone.emerald };
    case 'Cognitive clarity':        return { name: 'Brain',     ...tone.fuchsia };
    case 'Neuroplastic support':     return { name: 'Brain',     ...tone.fuchsia };

    case 'Fuller lung use':          return { name: 'Expand',    ...tone.sky     };
    case 'Relaxation response':      return { name: 'Waves',     ...tone.sky     };
    case 'Posture awareness':        return { name: 'Layers',    ...tone.slate   };
    case 'Foundational skill':       return { name: 'Layers',    ...tone.slate   };

    case 'Focused alertness':        return { name: 'Target',    ...tone.indigo  };
    case 'Cognitive refresh':        return { name: 'Brain',     ...tone.fuchsia };
    case 'Versatile timing':         return { name: 'Timer',     ...tone.indigo  };
  }

  const t = (title + ' ' + (note || '')).toLowerCase();
  if (/(focus|clarity|attention)/.test(t)) return { name: 'Target', ...tone.indigo };
  if (/(sleep|insomnia|bed)/.test(t))     return { name: 'Moon',   ...tone.violet };
  if (/(calm|relax|stress)/.test(t))      return { name: 'Leaf',   ...tone.emerald };
  if (/(energy|boost|alert)/.test(t))     return { name: 'Zap',    ...tone.amber };
  if (/(sinus|nasal|airflow|wind)/.test(t)) return { name: 'Wind', ...tone.teal  };
  if (/(oxygen|co2|ventilation)/.test(t)) return { name: 'Waves',  ...tone.sky   };
  if (/(heart|vagal|hrv)/.test(t))        return { name: 'Heart',  ...tone.rose  };
  if (/(brain|cognitive|neuro)/.test(t))  return { name: 'Brain',  ...tone.fuchsia };
  return { name: 'Activity', ...tone.slate };
}
@Component({
  standalone: true,
  selector: 'app-technique-detail',
  imports: [
    CommonModule,
    BreathChipComponent,
    BreathingPlayerComponent,
    IconsModule,
    RouterModule, // needed for [routerLink]
  ],
  templateUrl: './technique-detail.component.html',
})
export class TechniqueDetailComponent {

  constructor(private router: Router){}

  private route = inject(ActivatedRoute);
  private svc = inject(TechniquesService);
  private location = inject(Location);

  // when true -> focus mode (hide header/quick-how-to/benefits)
  isActive = signal(false);

  parse = parseBreathPattern;

  // --- helpers: safely get a slug string from a Technique ---
  private slugify(name: string): string {
    return (name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  /** Prefer existing fields; otherwise derive from name */
  private getSlug = (t: any): string =>
    String(
      (t && (t.slug || t.id || t.path)) ??
      this.slugify(t?.name ?? '')
    );

  vm$ = this.route.paramMap.pipe(
    switchMap(params => this.svc.bySlug$(params.get('slug') || '')),
    map(t => t ? ({
      ...t,
      _phases: this.parse(t.how_to),
      _quick: this.buildQuickHowTo(t),
      _benefits: (t as any).benefits?.length ? (t as any).benefits as Benefit[] : DEFAULT_BENEFITS
    }) : t)
  );

  /**
   * Next technique slug (wraps cyclically).
   * Works even if Technique has no `slug` field; falls back to id/path/name-kebab.
   */
  nextSlug$ = combineLatest([
    this.svc.all$,                             // Array<Technique>
    this.route.paramMap.pipe(map(pm => pm.get('slug') || '')),
  ]).pipe(
    map(([all, current]) => {
      const slugs = (all ?? []).map(this.getSlug).filter(Boolean);
      if (slugs.length <= 1) return current;

      let idx = slugs.indexOf(current);
      if (idx === -1) {
        // If route param was derived differently, try matching a kebab of current
        idx = slugs.indexOf(this.slugify(current));
      }
      if (idx === -1) {
        // If still not found, just start at the first
        return slugs[0];
      }
      return slugs[(idx + 1) % slugs.length];
    }),
    distinctUntilChanged()
  );

  back() { this.router.navigate(['/']); }

  iconForBenefit(title: string, note?: string): IconSpec {
    return iconFor(title, note);
  }

  private buildQuickHowTo(t: any): string[] {
    if (Array.isArray(t?.quick_how_to) && t.quick_how_to.length) return t.quick_how_to;
    const phases = this.parse(t?.how_to);
    const inhale = phases?.[0]?.seconds;
    const hold1  = phases?.[1]?.seconds;
    const exhale = phases?.[2]?.seconds ?? inhale;
    const hold2  = phases?.[3]?.seconds;

    const lines: (string | undefined)[] = [
      'Sit tall. Relax jaw, shoulders, and belly. Breathe through the nose.',
      inhale ? `Inhale ${inhale}s.` : undefined,
      hold1  ? `Hold ${hold1}s (gentle, no strain).` : undefined,
      exhale ? `Exhale ${exhale}s` + (hold2 ? '.' : ' (slow and quiet).') : undefined,
      hold2  ? `Hold ${hold2}s.` : undefined,
      'Repeat 4–8 cycles. Stop if dizzy or strained.'
    ];
    return lines.filter(Boolean) as string[];
  }

  // --- class helpers for colored chips (unchanged) ---
  applyRing(spec: { ring: string }) {
    return {
      'ring-indigo-200':  spec.ring === 'ring-indigo-200',
      'ring-emerald-200': spec.ring === 'ring-emerald-200',
      'ring-violet-200':  spec.ring === 'ring-violet-200',
      'ring-amber-200':   spec.ring === 'ring-amber-200',
      'ring-teal-200':    spec.ring === 'ring-teal-200',
      'ring-sky-200':     spec.ring === 'ring-sky-200',
      'ring-rose-200':    spec.ring === 'ring-rose-200',
      'ring-fuchsia-200': spec.ring === 'ring-fuchsia-200',
      'ring-slate-200':   spec.ring === 'ring-slate-200',
    };
  }
  applyBg(spec: { bg: string }) {
    return {
      'bg-indigo-50':   spec.bg === 'bg-indigo-50',
      'bg-emerald-50':  spec.bg === 'bg-emerald-50',
      'bg-violet-50':   spec.bg === 'bg-violet-50',
      'bg-amber-50':    spec.bg === 'bg-amber-50',
      'bg-teal-50':     spec.bg === 'bg-teal-50',
      'bg-sky-50':      spec.bg === 'bg-sky-50',
      'bg-rose-50':     spec.bg === 'bg-rose-50',
      'bg-fuchsia-50':  spec.bg === 'bg-fuchsia-50',
      'bg-slate-100':   spec.bg === 'bg-slate-100',
    };
  }
  applyFg(spec: { fg: string }) {
    return {
      'text-indigo-600':   spec.fg === 'text-indigo-600',
      'text-emerald-600':  spec.fg === 'text-emerald-600',
      'text-violet-600':   spec.fg === 'text-violet-600',
      'text-amber-600':    spec.fg === 'text-amber-600',
      'text-teal-600':     spec.fg === 'text-teal-600',
      'text-sky-600':      spec.fg === 'text-sky-600',
      'text-rose-600':     spec.fg === 'text-rose-600',
      'text-fuchsia-600':  spec.fg === 'text-fuchsia-600',
      'text-slate-700':    spec.fg === 'text-slate-700',
    };
  }
  chipClasses(spec: IconSpec) {
    return { ...this.applyRing(spec), ...this.applyBg(spec) };
  }
  hoverRingClasses(spec: { ring: string }) {
    return {
      'hover:ring-indigo-200':  spec.ring === 'ring-indigo-200',
      'hover:ring-emerald-200': spec.ring === 'ring-emerald-200',
      'hover:ring-violet-200':  spec.ring === 'ring-violet-200',
      'hover:ring-amber-200':   spec.ring === 'ring-amber-200',
      'hover:ring-teal-200':    spec.ring === 'ring-teal-200',
      'hover:ring-sky-200':     spec.ring === 'ring-sky-200',
      'hover:ring-rose-200':    spec.ring === 'ring-rose-200',
      'hover:ring-fuchsia-200': spec.ring === 'ring-fuchsia-200',
      'hover:ring-slate-200':   spec.ring === 'ring-slate-200',
    };
  }
}
