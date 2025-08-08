import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, computed, signal, ViewChild, ElementRef } from '@angular/core';

export type Phase = { label: string; seconds: number };

@Component({
  selector: 'app-breathing-player',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .wrap { display:flex; align-items:center; gap:2.5rem; }
    .dial {
      position: relative;
      height: 14rem; width: 14rem;
      border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid rgba(99,102,241,.25);
      background: white;
      overflow: hidden;
      flex: 0 0 auto;
    }
    .dial-ring { position:absolute; inset:0; border-radius:9999px; border:2px solid rgba(99,102,241,.12); pointer-events:none; }
    .bubble {
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      height: 12rem; width: 12rem;
      border-radius: 9999px;
      background: rgba(99,102,241,.08);
      border: 2px solid rgba(99,102,241,.35);
      will-change: transform, opacity;
    }

    .meta { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:1rem; }
    .step {
      border-radius: .75rem; border:1px solid #e5e7eb; padding:1rem;
      transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease, transform .2s ease;
      background: #fff;
    }
    .step-title { font-weight:600; color:#0f172a; }
    .step-sub   { margin-top:.25rem; color:#475569; font-size:.875rem; }
    .step--active {
      border-color: #818cf8;
      background: rgba(99,102,241,.06);
      box-shadow: 0 6px 16px rgba(99,102,241,.15);
      transform: translateY(-1px);
      position: relative;
    }
    .bar { height: .25rem; border-radius: 9999px; background: rgba(99,102,241,.25); overflow: hidden; margin-top:.5rem; }
    .bar>i { display:block; height:100%; background:#6366f1; width:0%; transition: width .15s linear; }

    @media (max-width: 640px) {
      .wrap { flex-direction: column; align-items: stretch; gap:1.25rem; }
      .dial { height: 11.5rem; width: 11.5rem; margin: 0 auto; }
      .bubble { height: 9.8rem; width: 9.8rem; }
      .meta { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
  `],
  template: `
    <div class="flex items-end gap-6">
      <button (click)="toggle()" class="rounded-xl bg-black/90 text-white px-4 py-2 text-sm font-semibold hover:bg-black">
        {{ running() ? 'Pause' : 'Start' }}
      </button>
      <div class="text-sm text-gray-600" *ngIf="totalSeconds()">Cycle: {{ totalSeconds() }}s</div>
    </div>

    <div class="mt-8 wrap">
      <div class="dial">
        <div class="bubble"
             #bubbleEl
             [style.transform]="bubbleTransform()"
             [style.transition]="bubbleTransition()"></div>

        <div class="text-center select-none">
          <div class="text-xs uppercase tracking-wide text-gray-500">
            {{ currentPhase()?.label || 'Ready' }}
          </div>
          <div class="text-4xl font-bold tabular-nums" aria-live="polite">
            {{ remaining() }}
          </div>
        </div>

        <div class="dial-ring"></div>
      </div>

      <ol class="meta text-sm">
        <li *ngFor="let p of phases; let i=index"
            class="step"
            [class.step--active]="i===idx()"
            [attr.aria-current]="i===idx() ? 'step' : null">
          <div class="step-title">{{ p.label }}</div>
          <div class="step-sub">{{ p.seconds }}s</div>
          <div class="bar" *ngIf="i===idx()">
            <i [style.width.%]="progressPct()"></i>
          </div>
        </li>
      </ol>
    </div>
  `,
})
export class BreathingPlayerComponent implements OnDestroy {
  @Input() phases: Phase[] = [];
  @ViewChild('bubbleEl', { static: false }) bubbleRef?: ElementRef<HTMLDivElement>;

  // Base bubble is 12rem, dial is 14rem -> reach rim at ~1.167
  private readonly minScale = 0.65;
  private readonly maxScale = 1.16;
  private readonly transitionCurve = 'ease-in-out';

  idx = signal(0);
  remaining = signal(0);
  running = signal(false);

  private tick?: number;

  private phaseStartMs = 0;
  private phaseEndMs = 0;
  private phaseTotalMs = 0;

  // for precise pause/resume
  private fromScale = this.minScale;
  private toScale = this.minScale;

  totalSeconds = computed(() => this.phases.reduce((s, p) => s + p.seconds, 0));
  currentPhase = computed<Phase | null>(() => this.phases[this.idx()] ?? null);

  private bubbleScale = signal(this.minScale);
  private bubbleDuration = signal<string>('0s');
  bubbleTransform = computed(() => `translate(-50%, -50%) scale(${this.bubbleScale()})`);
  bubbleTransition = computed(() => `transform ${this.bubbleDuration()} ${this.transitionCurve}`);

  progressPct = signal(0);

  toggle() { this.running() ? this.pause() : this.start(); }

  start() {
    if (!this.phases.length || this.running()) return;

    if (this.remaining() <= 0) {
      // fresh start
      this.idx.set(0);
      this.setupPhase(true);
    } else {
      // resume current phase from frozen scale with remaining time
      const msLeft = Math.max(0, this.phaseEndMs - Date.now());
      const label = this.currentPhase()?.label ?? '';
      this.fromScale = this.readCurrentScale() ?? this.bubbleScale();
      this.toScale = this.targetScaleFor(label);
      this.bubbleDuration.set(this.isHold(label) ? '0s' : `${msLeft / 1000}s`);
      requestAnimationFrame(() => this.bubbleScale.set(this.toScale));
    }

    this.running.set(true);
    this.loop();
  }

  pause() {
    if (!this.running()) return;

    // stop loop first so time doesn't advance
    if (this.tick) cancelAnimationFrame(this.tick);

    // remove transition and flush so it's applied immediately
    this.bubbleDuration.set('0s');
    this.flushStyles();

    // read the actual current transform scale; fallback to time interpolation
    const current = this.readCurrentScale() ?? this.computeScaleByTime();

    // lock the bubble in place
    this.bubbleScale.set(current);
    this.fromScale = current;
    this.toScale = current;

    this.running.set(false);
  }

  ngOnDestroy() {
    if (this.tick) cancelAnimationFrame(this.tick);
  }

  private loop = () => {
    if (!this.running()) return;

    const now = Date.now();
    const msLeft = Math.max(0, this.phaseEndMs - now);
    const secLeft = Math.ceil(msLeft / 1000);

    if (secLeft !== this.remaining()) this.remaining.set(secLeft);

    const done = this.phaseTotalMs ? Math.min(1, Math.max(0, 1 - msLeft / this.phaseTotalMs)) : 0;
    const pct = Math.round(done * 100);
    if (pct !== this.progressPct()) this.progressPct.set(pct);

    if (msLeft <= 0) {
      const next = (this.idx() + 1) % this.phases.length;
      this.idx.set(next);
      this.setupPhase(false);
    }

    this.tick = requestAnimationFrame(this.loop);
  };

  private setupPhase(isInitial: boolean) {
    const phase = this.currentPhase();
    if (!phase) return;

    this.phaseTotalMs = phase.seconds * 1000;
    this.phaseStartMs = Date.now();
    this.phaseEndMs = this.phaseStartMs + this.phaseTotalMs;
    this.remaining.set(phase.seconds);
    this.progressPct.set(0);

    const label = phase.label;
    const target = this.targetScaleFor(label);

    // pick starting scale
    let seedFrom = this.readCurrentScale() ?? this.bubbleScale();
    if (isInitial) {
      if (this.isInhale(label)) seedFrom = this.minScale;
      else if (this.isExhale(label)) seedFrom = this.maxScale;
    }

    this.fromScale = seedFrom;
    this.toScale = target;

    // seed without transition (prevents rim flash), flush, then animate
    this.bubbleDuration.set('0s');
    this.bubbleScale.set(this.fromScale);
    this.flushStyles();

    const duration = this.isHold(label) ? '0s' : `${phase.seconds}s`;
    requestAnimationFrame(() => {
      if (!this.running()) return;
      this.bubbleDuration.set(duration);
      this.bubbleScale.set(this.toScale);
    });
  }

  private isInhale(label: string) { return /^inhale/i.test(label); }
  private isExhale(label: string) { return /^exhale/i.test(label); }
  private isHold(label: string)   { return /^hold/i.test(label); }

  private targetScaleFor(label: string): number {
    if (this.isInhale(label)) return this.maxScale;
    if (this.isExhale(label)) return this.minScale;
    return this.bubbleScale();
  }

  /** Force a layout read so style changes (like transition:0s) apply immediately */
  private flushStyles() {
    const el = this.bubbleRef?.nativeElement;
    if (el) void el.offsetHeight; // layout read to flush changes
  }

  /** Read the live scale from computed transform; returns null if unavailable */
  private readCurrentScale(): number | null {
    const el = this.bubbleRef?.nativeElement;
    if (!el) return null;
    const tr = getComputedStyle(el).transform;
    if (!tr || tr === 'none') return null;

    // matrix(a,b,c,d,tx,ty) | matrix3d(...)
    const nums = tr.startsWith('matrix3d')
      ? tr.match(/matrix3d\(([^)]+)\)/)?.[1]?.split(',').map(Number)
      : tr.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(Number);

    if (!nums || !nums.length) return null;
    // uniform scale → use a (m11)
    const sx = Math.abs(nums[0]);
    return sx || null;
    // (translate(-50%, -50%) is unaffected)
  }

  /** Fallback: compute current scale via elapsed time ratio */
  private computeScaleByTime(): number {
    const now = Date.now();
    const msLeft = Math.max(0, this.phaseEndMs - now);
    const elapsed = this.phaseTotalMs - msLeft;
    const ratio = this.phaseTotalMs ? Math.min(1, Math.max(0, elapsed / this.phaseTotalMs)) : 0;
    return this.fromScale + (this.toScale - this.fromScale) * ratio;
  }
}
