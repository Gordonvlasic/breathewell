import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  computed,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export type Phase = { label: string; seconds: number };

@Component({
  selector: 'app-breathing-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .wrap { display:flex; align-items:center; gap:2rem; }
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
    .bar>i { display:block; height:100%; background:#6366f1; width:0%; transition: width .12s linear; }

    .chip { border-radius: 9999px; border:1px solid rgba(99,102,241,.25); padding:.35rem .7rem; font-size:.85rem; font-weight:600; }
    .chip--on { background:#eef2ff; color:#3730a3; border-color:#c7d2fe; }

    .modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
    .modal-card { background:#fff; border-radius:1rem; border:1px solid #e5e7eb; width:100%; max-width:26rem; padding:1.25rem; box-shadow:0 20px 40px rgba(0,0,0,.18); }

    /* ----- Mobile polish ----- */
    @media (max-width: 640px) {
      .wrap { flex-direction: column; align-items: stretch; gap:1rem; }
      .dial { height: 12.25rem; width: 12.25rem; margin: 0 auto; }
      .bubble { height: 10.5rem; width: 10.5rem; }
      .meta { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .top-controls { gap:.5rem; }
      .top-controls__left { width:100%; display:flex; gap:.5rem; align-items:center; }
      .top-controls__right { width:100%; display:flex; align-items:center; gap:.5rem; justify-content:space-between; }
      .duration-row { gap:.5rem; }
      .duration-row .w-40 { width: 100%; max-width: 16rem; }
      .chip { padding:.4rem .75rem; }
    }
  `],
  template: `
    <!-- Top controls -->
    <div class="top-controls flex flex-wrap items-center gap-3">
      <div class="top-controls__left">
        <button
          (click)="toggle()"
          class="rounded-xl bg-black/90 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
          [attr.aria-pressed]="running()"
        >
          {{ running() ? 'Pause' : (started() ? 'Resume' : 'Start') }}
        </button>

        <div class="text-sm text-gray-600" *ngIf="cycleSeconds()">
          Cycle: {{ cycleSeconds() }}s
          <span class="mx-2 hidden sm:inline">&middot;</span>
          <div class="inline sm:inline text-gray-700">
            <ng-container *ngIf="targetCycles() > 0">
              {{ completedCycles() + 1 }} / {{ targetCycles() }}
            </ng-container>
            <ng-container *ngIf="targetCycles() === 0">
              {{ completedCycles() + 1 }}
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Sound controls -->
      <div class="top-controls__right ml-auto flex items-center gap-2 text-sm">
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" [(ngModel)]="soundOn" />
          <span class="text-gray-800">Sound</span>
        </label>
        <input type="range" min="0" max="1" step="0.05" class="w-28" [(ngModel)]="volume" />
        <span class="text-xs text-gray-500">{{ (volume * 100) | number:'1.0-0' }}%</span>
      </div>
    </div>

    <!-- Duration picker -->
    <div class="duration-row mt-4 flex flex-wrap items-center gap-3 text-sm">
      <div class="font-medium text-gray-800">Duration:</div>
      <button
        *ngFor="let m of presetMinutes"
        type="button"
        class="chip"
        [class.chip--on]="durationMinutes() === m"
        (click)="setDuration(m)"
        [attr.aria-pressed]="durationMinutes() === m"
      >{{ m }}m</button>

      <div class="ml-2 flex items-center gap-2 grow sm:grow-0">
        <input
          type="range"
          min="1" max="30" step="1"
          class="w-40"
          [(ngModel)]="sliderMinutes"
          (change)="setDuration(sliderMinutes)" />
        <span class="text-xs text-gray-600">{{ sliderMinutes }}m</span>
      </div>

      <button
        type="button"
        class="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        (click)="resetAll()"
        [disabled]="!started() && completedCycles()===0"
        [attr.aria-disabled]="!started() && completedCycles()===0"
      >
        Reset
      </button>
    </div>

    <div class="mt-8 wrap">
      <!-- Dial -->
      <div class="dial">
        <div
          class="bubble"
          #bubbleEl
          [style.transform]="bubbleTransform()"
        ></div>

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

      <!-- Steps -->
      <ol class="meta text-sm">
        <li
          *ngFor="let p of phases; let i=index"
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

    <!-- Done Modal -->
    <div class="modal-backdrop" *ngIf="showDone()">
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Session complete">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">✓</div>
          <div class="text-lg font-semibold text-slate-900">Nice work</div>
        </div>
        <p class="mt-2 text-sm text-slate-600">
          You completed {{ completedCycles() }} {{ completedCycles() === 1 ? 'cycle' : 'cycles' }}
          in {{ durationMinutes() }} minute{{ durationMinutes() === 1 ? '' : 's' }}.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            (click)="restart()">
            Restart
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            (click)="addMore( durationMinutes() )">
            +{{ durationMinutes() }}m more
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            (click)="closeModal()">
            Close
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BreathingPlayerComponent implements OnDestroy {
  @Input() phases: Phase[] = [];
  @ViewChild('bubbleEl', { static: false }) bubbleRef?: ElementRef<HTMLDivElement>;

  @Output() activeChange = new EventEmitter<boolean>();

  private readonly minScale = 0.65;
  private readonly maxScale = 1.16;

  idx = signal(0);
  remaining = signal(0);
  running = signal(false);
  started = signal(false);

  durationMinutes = signal<number>(3);
  sliderMinutes = 3;
  presetMinutes = [1, 2, 3, 5, 10];

  soundOn = true;
  volume = 0.5;
  private audioCtx: AudioContext | null = null;
  private lastBeepAt = 0;

  private tick?: number;

  private phaseStartMs = 0;
  private phaseEndMs = 0;
  private phaseTotalMs = 0;

  private sessionStartMs = 0;
  private elapsedMsTotal = 0;
  private lastLoopStamp = 0;

  private fromScale = this.minScale;
  private toScale = this.minScale;

  private pausedPhaseMsLeft = 0;     // freeze exact phase time left
  private isPaused = false;          // track paused state explicitly

  showDone = signal(false);

  totalSeconds = computed(() => this.phases.reduce((s, p) => s + p.seconds, 0));
  cycleSeconds = computed(() => this.totalSeconds());
  targetDurationMs = computed(() => this.durationMinutes() * 60 * 1000);
  targetCycles = computed(() => {
    const c = this.cycleSeconds();
    return c > 0 ? Math.max(1, Math.floor(this.targetDurationMs() / (c * 1000))) : 0;
  });

  currentPhase = computed<Phase | null>(() => this.phases[this.idx()] ?? null);

  private bubbleScale = signal(this.minScale);

  bubbleTransform = computed(
    () => `translate(-50%, -50%) scale(${this.bubbleScale()})`
  );

  progressPct = signal(0);
  completedCycles = signal(0);

  setDuration(mins: number) {
    this.durationMinutes.set(mins);
    this.sliderMinutes = mins;
  }

  resetAll() {
    this.stopRAF();
    this.idx.set(0);
    this.remaining.set(0);
    this.progressPct.set(0);
    this.started.set(false);
    this.lastLoopStamp = 0;
    this.elapsedMsTotal = 0;
    this.sessionStartMs = 0;
    this.completedCycles.set(0);
    this.showDone.set(false);

    this.pausedPhaseMsLeft = 0;
    this.isPaused = false;

    this.bubbleScale.set(this.minScale);

    this.running.set(false);
    this.activeChange.emit(false);
  }

  toggle() { this.running() ? this.pause() : this.start(); }

  async start() {
    if (!this.phases.length || this.running()) return;
    await this.ensureAudio();

    if (!this.started()) {
      await this.freshStartInternal();
      return;
    }

    // RESUME: continue from the exact remaining ms captured on pause
    const label = this.currentPhase()?.label ?? '';
    const msLeft = this.isPaused
      ? this.pausedPhaseMsLeft
      : Math.max(0, this.phaseEndMs - Date.now());

    // reset session accumulator edge so paused gap isn't added
    this.lastLoopStamp = Date.now();

    // restart the phase clock from now
    this.phaseStartMs = Date.now();
    this.phaseEndMs = this.phaseStartMs + msLeft;

    // animation: continue from current scale to the same target over the leftover time
    this.fromScale = this.bubbleScale();
    this.toScale = this.targetScaleFor(label);

    this.isPaused = false;
    this.pausedPhaseMsLeft = 0;

    this.running.set(true);
    this.activeChange.emit(true);
    this.loop();
  }

  pause() {
    if (!this.running()) return;

    // Stop RAF immediately
    this.stopRAF();

    // Freeze at exact current scale
    const current = this.computeScaleByTime();
    this.bubbleScale.set(current);
    this.fromScale = current;
    this.toScale = current;

    // Capture exact remaining ms in this phase to resume accurately later
    const now = Date.now();
    this.pausedPhaseMsLeft = Math.max(0, this.phaseEndMs - now);
    this.isPaused = true;

    // Prevent session elapsed from counting paused time
    this.lastLoopStamp = 0;

    this.running.set(false);
    this.activeChange.emit(false);
  }

  ngOnDestroy() {
    this.stopRAF();
  }

  private async freshStartInternal() {
    await this.ensureAudio();

    this.stopRAF();

    this.started.set(true);
    this.running.set(false);
    this.showDone.set(false);

    this.sessionStartMs = Date.now();
    this.elapsedMsTotal = 0;
    this.lastLoopStamp = 0;
    this.completedCycles.set(0);

    this.pausedPhaseMsLeft = 0;
    this.isPaused = false;

    this.idx.set(0);
    this.progressPct.set(0);
    this.remaining.set(0);

    this.bubbleScale.set(this.minScale);

    this.setupPhase(true);
    this.cueForLabel(this.currentPhase()?.label ?? '');

    this.running.set(true);
    this.activeChange.emit(true);
    this.loop();
  }

  restart() {
    this.freshStartInternal();
  }

  addMore(mins: number) {
    const extra = Math.max(1, Math.floor(mins));
    const newTotal = this.durationMinutes() + extra;
    this.durationMinutes.set(newTotal);
    this.sliderMinutes = newTotal;

    this.freshStartInternal();
  }

  closeModal() {
    this.showDone.set(false);
  }

  private loop = () => {
    if (!this.running()) return;

    const now = Date.now();

    // Advance session elapsed ONLY while running
    if (this.lastLoopStamp === 0) {
      this.lastLoopStamp = now;
    } else {
      this.elapsedMsTotal += (now - this.lastLoopStamp);
      this.lastLoopStamp = now;
    }

    const msLeft = Math.max(0, this.phaseEndMs - now);
    const secLeft = Math.ceil(msLeft / 1000);
    if (secLeft !== this.remaining()) this.remaining.set(secLeft);

    const done = this.phaseTotalMs ? Math.min(1, Math.max(0, 1 - msLeft / this.phaseTotalMs)) : 0;
    const pct = Math.round(done * 100);
    if (pct !== this.progressPct()) this.progressPct.set(pct);

    // ---- VISUAL: Drive bubble scale from SAME CLOCK ----
    const lbl = this.currentPhase()?.label ?? '';
    if (!this.isHold(lbl)) {
      const s = this.computeScaleByTime();
      if (s !== this.bubbleScale()) this.bubbleScale.set(s);
    } else {
      // Hold keeps constant scale (no drift)
      if (this.bubbleScale() !== this.fromScale) this.bubbleScale.set(this.fromScale);
    }
    // ----------------------------------------------------

    if (msLeft <= 0) {
      const next = (this.idx() + 1) % this.phases.length;
      const wrapped = next === 0;
      this.idx.set(next);

      this.cueForLabel(this.currentPhase()?.label ?? '');
      this.setupPhase(false);

      if (wrapped) {
        if (this.isSessionComplete()) {
          this.finishSession();
          return;
        }
      }
    }

    this.tick = requestAnimationFrame(this.loop);
  };

  private stopRAF() {
    if (this.tick) cancelAnimationFrame(this.tick);
    this.tick = undefined;
  }

  private isSessionComplete(): boolean {
    const cSec = this.cycleSeconds();
    if (cSec <= 0) return false;

    const cyclesByTime = Math.floor(this.elapsedMsTotal / (cSec * 1000));
    if (cyclesByTime !== this.completedCycles()) this.completedCycles.set(cyclesByTime);

    if (this.targetCycles() > 0) {
      return this.completedCycles() >= this.targetCycles();
    }
    return false;
  }

  private finishSession() {
    this.stopRAF();
    this.running.set(false);
    this.activeChange.emit(false);

    const current = this.computeScaleByTime();
    this.bubbleScale.set(current);
    this.fromScale = current;
    this.toScale = current;

    this.showDone.set(true);
  }

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

    let seedFrom = this.bubbleScale();
    if (isInitial) {
      if (this.isInhale(label)) seedFrom = this.minScale;
      else if (this.isExhale(label)) seedFrom = this.maxScale;
    }

    this.fromScale = seedFrom;
    this.toScale = target;

    // Immediately snap to starting scale for this phase
    this.bubbleScale.set(this.fromScale);
  }

  private isInhale(label: string) { return /^inhale/i.test(label); }
  private isExhale(label: string) { return /^exhale/i.test(label); }
  private isHold(label: string)   { return /^hold/i.test(label); }

  private targetScaleFor(label: string): number {
    if (this.isInhale(label)) return this.maxScale;
    if (this.isExhale(label)) return this.minScale;
    return this.bubbleScale();
  }

  private computeScaleByTime(): number {
    const now = Date.now();
    const msLeft = Math.max(0, this.phaseEndMs - now);
    const elapsed = this.phaseTotalMs - msLeft;
    const ratio = this.phaseTotalMs ? Math.min(1, Math.max(0, elapsed / this.phaseTotalMs)) : 0;
    return this.fromScale + (this.toScale - this.fromScale) * ratio;
  }

  // audio
  private async ensureAudio() {
    if (!this.soundOn) return;
    try {
      if (!this.audioCtx) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        this.audioCtx = new Ctx();
      }
      if (this.audioCtx?.state === 'suspended') {
        await this.audioCtx.resume();
      }
    } catch {}
  }

  private cueForLabel(label: string) {
    if (!this.soundOn) return;
    const now = performance.now();
    if (now - this.lastBeepAt < 50) return;
    this.lastBeepAt = now;

    if (this.isInhale(label)) this.beep(580, 90);
    else if (this.isHold(label)) this.beep(800, 70);
    else if (this.isExhale(label)) this.beep(420, 90);
    else this.beep(500, 70);
  }

  private beep(freq: number, ms: number) {
    if (!this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + ms / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + ms / 1000 + 0.02);
    } catch {}
  }
}
