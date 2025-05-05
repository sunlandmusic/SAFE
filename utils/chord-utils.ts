import { NoteName, MusicMode, ChordType, Chord } from '../types/music';

const NOTE_VALUES: Record<NoteName, number> = {
  'C': 0,
  'C#': 1,
  'Db': 1,
  'D': 2,
  'D#': 3,
  'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'Gb': 6,
  'G': 7,
  'G#': 8,
  'Ab': 8,
  'A': 9,
  'A#': 10,
  'Bb': 10,
  'B': 11
};

const SCALE_PATTERNS: Record<MusicMode, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'free': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const CHORD_PATTERNS: Record<ChordType, number[]> = {
  // Basic triads
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'dim': [0, 3, 6],
  'augmented': [0, 4, 8],
  '5': [0, 7],
  
  // 7th chords
  'major7': [0, 4, 7, 11],
  'minor7': [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  'dim7': [0, 3, 6, 9],
  'm7b5': [0, 3, 6, 10],
  'φ7': [0, 3, 6, 10],
  'minorMajor7': [0, 3, 7, 11],
  
  // 9th chords
  'major9': [0, 4, 7, 11, 14],
  'minor9': [0, 3, 7, 10, 14],
  '9': [0, 4, 7, 10, 14],
  'add9': [0, 4, 7, 14],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  'dim9': [0, 3, 6, 9, 14],
  'aug9': [0, 4, 8, 10, 14],
  
  // 11th & 13th chords
  '11': [0, 4, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],
  'major11': [0, 4, 7, 11, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  '13sus': [0, 5, 7, 10, 14, 21],
  '13b9': [0, 4, 7, 10, 13, 21],
  'm11b5': [0, 3, 6, 10, 14, 17],
  
  // Sus chords
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '7sus': [0, 5, 7, 10],
  '7sus4': [0, 5, 7, 10],
  '9sus': [0, 5, 7, 10, 14],
  '7sus2b9': [0, 2, 7, 10, 13],
  
  // 6th chords
  '6': [0, 4, 7, 9],
  'minor6': [0, 3, 7, 9],
  '69': [0, 4, 7, 9, 14],
  'm69': [0, 3, 7, 9, 14],
  
  // Altered/special chords
  '7#11': [0, 4, 7, 10, 18],
  '7b13': [0, 4, 7, 10, 20],
  'maj9#11': [0, 4, 7, 11, 14, 18],
  'm9b5': [0, 3, 6, 10, 14],
  '9#11': [0, 4, 7, 10, 14, 18],
  'maj7#5': [0, 4, 8, 11],
  '7alt': [0, 4, 8, 10, 15],
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  'augmented7': [0, 4, 8, 10],
  'augmentedMajor7': [0, 4, 8, 11]
};

export function getScaleNotes(root: NoteName, mode: MusicMode): NoteName[] {
  const rootValue = NOTE_VALUES[root];
  const pattern = SCALE_PATTERNS[mode];
  const notes: NoteName[] = [];
  
  for (const interval of pattern) {
    const noteValue = (rootValue + interval) % 12;
    const note = Object.entries(NOTE_VALUES).find(([note, value]) => 
      value === noteValue && !note.includes('b')
    )?.[0] as NoteName;
    if (note) notes.push(note);
  }
  
  return notes;
}

export function createChord(root: NoteName, type: ChordType): Chord | null {
  const rootValue = NOTE_VALUES[root];
  const pattern = CHORD_PATTERNS[type];
  
  if (!pattern) return null;
  
  const notes = pattern.map(interval => rootValue + interval + 60); // Start from middle C (60)
  
  return {
    root,
    type,
    notes,
    name: `${root}${type}`
  };
} 