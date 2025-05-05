export type NoteName = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export type MusicMode = 'free' | 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';

export type InstrumentType = 'balafon' | 'piano' | 'rhodes' | 'steel_drum' | 'pluck' | 'pad';

export type ChordType = 
  // Basic triads
  'major' | 'minor' | 'dim' | 'augmented' | '5' |
  // 7th chords
  'major7' | 'minor7' | '7' | 'dim7' | 'm7b5' | 'φ7' | 'minorMajor7' |
  // 9th chords
  'major9' | 'minor9' | '9' | 'add9' | '7b9' | '7#9' | 'dim9' | 'aug9' |
  // 11th & 13th chords
  '11' | 'm11' | 'major11' | '13' | '13sus' | '13b9' | 'm11b5' |
  // Sus chords
  'sus2' | 'sus4' | '7sus' | '7sus4' | '9sus' | '7sus2b9' |
  // 6th chords
  '6' | 'minor6' | '69' | 'm69' |
  // Altered/special chords
  '7#11' | '7b13' | 'maj9#11' | 'm9b5' | '9#11' |
  'maj7#5' | '7alt' | '7b5' | '7#5' |
  'augmented7' | 'augmentedMajor7';

export interface Chord {
  root: NoteName;
  type: ChordType;
  notes: number[];
  name: string;
}

export const sharpToFlatMap: Record<NoteName, NoteName> = {
  'C': 'C',
  'C#': 'Db',
  'Db': 'Db',
  'D': 'D',
  'D#': 'Eb',
  'Eb': 'Eb',
  'E': 'E',
  'F': 'F',
  'F#': 'Gb',
  'Gb': 'Gb',
  'G': 'G',
  'G#': 'Ab',
  'Ab': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'Bb': 'Bb',
  'B': 'B'
} as const; 