import { InstrumentType } from '../types/music';

// These are placeholder functions that would normally be implemented with a proper audio library
export function playChord(notes: number[], instrument: InstrumentType) {
  console.log(`Playing chord with notes: ${notes} using ${instrument}`);
}

export function stopChord() {
  console.log('Stopping chord');
}

export function playBassNote(note: number) {
  console.log(`Playing bass note: ${note}`);
} 