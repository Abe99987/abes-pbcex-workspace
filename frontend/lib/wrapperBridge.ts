/*
 * Minimal wrapper bridge for Capacitor/native contexts.
 * - openExternal(url): uses Capacitor Browser when available, else window.open
 * - logToFile(message): appends to mobile-log.txt via Capacitor Filesystem; no-op on web
 */
import type { CapacitorGlobal } from '@capacitor/core';

let cap: CapacitorGlobal | undefined;
// Access global safely (SSR guard)
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  cap = (window as any).Capacitor as CapacitorGlobal;
}

async function isNative(): Promise<boolean> {
  try {
    if (!cap) return false;
    const platform = cap.getPlatform?.();
    return platform === 'ios' || platform === 'android';
  } catch {
    return false;
  }
}

export async function openExternal(url: string): Promise<void> {
  if (await isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url, presentationStyle: 'popover' });
      return;
    } catch {
      // fallthrough
    }
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function logToFile(message: string): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const filename = 'mobile-log.txt';
    try {
      await Filesystem.appendFile({
        path: filename,
        data: `${new Date().toISOString()} ${message}\n`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    } catch {
      await Filesystem.writeFile({
        path: filename,
        data: `${new Date().toISOString()} ${message}\n`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    }
  } catch {
    // noop on web or if module unavailable
  }
}


