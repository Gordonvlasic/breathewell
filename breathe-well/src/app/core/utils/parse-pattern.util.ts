export type Phase = { label: string; seconds: number };

export function parseBreathPattern(raw?: string | null): Phase[] {
  if (!raw) return [];
  const s = raw.trim();

  if (/^\d+(?:-\d+)+$/.test(s)) {
    const parts = s.split('-').map(n => Number(n));
    const labels = ['Inhale', 'Hold', 'Exhale', 'Hold'];
    return parts.map((v, i) => ({ label: labels[i] || `Phase ${i+1}`, seconds: v }));
  }

  const out: Phase[] = [];
  const regex = /(inhale|exhale|hold)[^0-9]*?(\d+)\s*s?/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(s))) {
    const label = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    const seconds = Number(m[2]);
    out.push({ label, seconds });
  }
  return out;
}