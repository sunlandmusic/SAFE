import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../constants/colors';
import { NoteName, MusicMode, Chord, ChordType, InstrumentType, sharpToFlatMap } from '../types/music';
import { getScaleNotes, createChord } from '../utils/chord-utils';
import { playChord, stopChord, playBassNote } from '../utils/audio-utils';

// Full list of available chord types in preference order (for 'FREE' mode)
const ALL_CHORD_TYPES: ChordType[] = [
  // Basic triads first
  'major', 'minor', 'dim', 'augmented', '5',
  
  // 7th chords
  'major7', 'minor7', '7', 'dim7', 'm7b5', 'φ7', 'minorMajor7',
  
  // 9th chords
  'major9', 'minor9', '9', 'add9', '7b9', '7#9', 'dim9', 'aug9',
  
  // 11th & 13th chords
  '11', 'm11', 'major11', '13', '13sus', '13b9', 'm11b5',
  
  // Sus chords
  'sus2', 'sus4', '7sus', '7sus4', '9sus', '7sus2b9',
  
  // 6th chords
  '6', 'minor6', '69', 'm69',
  
  // Altered/special chords
  '7#11', '7b13', 'maj9#11', 'm9b5', '9#11', 
  'maj7#5', '7alt', '7b5', '7#5',
  'augmented7', 'augmentedMajor7',
];

interface PianoXLProps {
  onNoteSelect?: (note: string) => void;
  selectedKey: NoteName;
  mode: MusicMode;
  octave: number;
  inversion: number;
  selectedSound: InstrumentType;
  onChordChange?: (chord: Chord | null) => void;
  onScaleNotesChange?: (notes: NoteName[]) => void;
  useFlats?: boolean;  // New prop to control flat/sharp display
  selectedBassOffset?: number | null;
}

// Add helper function for bass note calculation
const getBassNote = (root: NoteName, bassOffset: number | null): string => {
  if (bassOffset === null || bassOffset === 0) return '';
  
  const notes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = notes.indexOf(root);
  if (rootIndex === -1) return '';
  
  const bassIndex = (rootIndex + bassOffset) % 12;
  return `/${notes[bassIndex]}`;
};

export const PianoXL = forwardRef(function PianoXL({ 
  onNoteSelect,
  selectedKey,
  mode,
  octave = 0,
  inversion = 0,
  selectedSound = 'piano',
  onChordChange,
  onScaleNotesChange,
  useFlats = false,  // Default to sharp notation
  selectedBassOffset = null,
}: PianoXLProps, ref) {
  // State
  const [scaleNotes, setScaleNotes] = useState<NoteName[]>([]);
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [lastPressedNote, setLastPressedNote] = useState<NoteName | null>(null);
  const [chordTypeIndices, setChordTypeIndices] = useState<{ [key: string]: number }>({});
  const [prevMode, setPrevMode] = useState<MusicMode>(mode);

  // Track mode changes and update scales/chords accordingly
  useEffect(() => {
    if (selectedKey) {
      const allNotes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      if (mode === 'free' && mode !== prevMode) {
        // When entering FREE mode:
        // 1. Make all notes available
        setScaleNotes(allNotes);
        onScaleNotesChange?.(allNotes);
        
        // 2. Get the notes that were NOT in the previous scale
        const prevScaleNotes = getScaleNotes(selectedKey, prevMode);
        const newlyAvailableNotes = allNotes.filter(note => !prevScaleNotes.includes(note));
        
        // 3. Only add major triads for newly available notes that don't have a type
        if (newlyAvailableNotes.length > 0) {
          const updatedIndices = { ...chordTypeIndices };
          newlyAvailableNotes.forEach(note => {
            if (updatedIndices[note] === undefined) {
              updatedIndices[note] = 0; // major triad
            }
          });
          setChordTypeIndices(updatedIndices);
        }
      } else if (prevMode === 'free' && mode !== 'free') {
        // When leaving FREE mode
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
        // Clear all chord types to start fresh in the new mode
        setChordTypeIndices({});
      } else if (mode !== prevMode) {
        // For changes between non-FREE modes
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
        // Clear chord types for mode change
        setChordTypeIndices({});
      } else {
        // Just key changes within the same mode
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
      }
      
      // Stop any playing chord when mode changes
      if (mode !== prevMode) {
        setCurrentChord(null);
        onChordChange?.(null);
      }
      
      // Update prevMode for next change
      setPrevMode(mode);
    }
  }, [selectedKey, mode, prevMode]);

  // Convert note to flat notation if needed
  const convertNoteDisplay = (note: NoteName): NoteName => {
    if (mode === 'free' && useFlats) {
      return sharpToFlatMap[note];
    }
    return note;
  };

  // Get chord name for a note in the current scale
  const getChordName = (note: NoteName): string => {
    if (mode !== 'free' && !scaleNotes.includes(note)) return '';
    
    const chordType = getCurrentChordType(note);
    let name = convertNoteDisplay(note);
    
    switch (chordType) {
      // Basic triads
      case 'major': break;
      case 'minor': name += 'm'; break;
      case 'dim': name += 'dim'; break;
      case 'augmented': name += 'aug'; break;
      case '5': name += '5'; break;
      
      // 7th chords
      case 'major7': name += 'maj7'; break;
      case 'minor7': name += 'm7'; break;
      case '7': name += '7'; break;
      case 'dim7': name += 'dim7'; break;
      case 'm7b5': name += 'm7b5'; break;
      case 'φ7': name += 'φ7'; break;
      case 'minorMajor7': name += 'mMaj7'; break;
      
      // 9th chords
      case 'major9': name += 'maj9'; break;
      case 'minor9': name += 'm9'; break;
      case '9': name += '9'; break;
      case 'add9': name += 'add9'; break;
      case '7b9': name += '7b9'; break;
      case '7#9': name += '7#9'; break;
      case 'dim9': name += 'dim9'; break;
      case 'aug9': name += 'aug9'; break;
      
      // 11th & 13th chords
      case '11': name += '11'; break;
      case 'm11': name += 'm11'; break;
      case 'major11': name += 'maj11'; break;
      case '13': name += '13'; break;
      case '13sus': name += '13sus'; break;
      case '13b9': name += '13b9'; break;
      case 'm11b5': name += 'm11b5'; break;
      
      // Sus chords
      case 'sus2': name += 'sus2'; break;
      case 'sus4': name += 'sus4'; break;
      case '7sus': name += '7sus'; break;
      case '7sus4': name += '7sus4'; break;
      case '9sus': name += '9sus'; break;
      case '7sus2b9': name += '7sus2b9'; break;
      
      // 6th chords
      case '6': name += '6'; break;
      case 'minor6': name += 'm6'; break;
      case '69': name += '69'; break;
      case 'm69': name += 'm69'; break;
      
      // Altered/special chords
      case '7#11': name += '7#11'; break;
      case '7b13': name += '7b13'; break;
      case 'maj9#11': name += 'maj9#11'; break;
      case 'm9b5': name += 'm9b5'; break;
      case '9#11': name += '9#11'; break;
      case 'maj7#5': name += 'maj7#5'; break;
      case '7alt': name += '7alt'; break;
      case '7b5': name += '7b5'; break;
      case '7#5': name += '7#5'; break;
      case 'augmented7': name += 'aug7'; break;
      case 'augmentedMajor7': name += 'augMaj7'; break;
      
      default: name += chordType;
    }

    // Only add bass note if this is the last pressed note AND bass is active
    if (lastPressedNote === note && selectedBassOffset !== null) {
      const bassNote = getBassNote(note, selectedBassOffset);
      return name + bassNote;
    }
    return name;
  };

  // Get current chord type for a note
  const getCurrentChordType = (note: NoteName): ChordType => {
    // In 'FREE' mode, use the full chord type list
    if (mode === 'free') {
      const currentIndex = chordTypeIndices[note] || 0;
      return ALL_CHORD_TYPES[currentIndex] || 'major';
    }
    
    // In other modes, use the scale-specific chord types
    const availableTypes = getAvailableChordTypes(note);
    const currentIndex = chordTypeIndices[note] || 0;
    
    // If the note is not in the current scale, return 'major' as default
    if (availableTypes.length === 0) return 'major';
    
    return availableTypes[currentIndex % availableTypes.length] || 'major';
  };

  // Get available chord types for a note based on scale degree
  const getAvailableChordTypes = (note: NoteName): ChordType[] => {
    // In 'off' mode, all chord types are available
    if (mode === 'free') {
      return ALL_CHORD_TYPES;
    }
    
    // In other modes, chord types depend on the scale degree
    if (!scaleNotes.includes(note)) return [];
    
    const scaleIndex = scaleNotes.indexOf(note);
    const scaleDegree = (scaleIndex + 1).toString();
    
    return mode === 'minor' ? 
      MINOR_SCALE_CHORDS[scaleDegree] || [] : 
      MAJOR_SCALE_CHORDS[scaleDegree] || [];
  };

  // Add a new function to update chord display without playing
  const updateChordDisplay = (note: NoteName, chordType: ChordType) => {
    const chord = createChord(note, chordType);
    if (chord) {
      const modifiedNotes = chord.notes.map(note => {
        let modifiedNote = note;
        if (octave !== 0) {
          modifiedNote += 12 * octave;
        }
        return modifiedNote;
      });

      if (inversion !== 0) {
        for (let i = 0; i < Math.abs(inversion); i++) {
          if (inversion > 0) {
            modifiedNotes[0] += 12;
            modifiedNotes.push(modifiedNotes.shift()!);
          } else {
            modifiedNotes[modifiedNotes.length - 1] -= 12;
            modifiedNotes.unshift(modifiedNotes.pop()!);
          }
        }
      }

      const chordName = getChordName(note);
      const modifiedChord = { ...chord, notes: modifiedNotes, name: chordName };
      setCurrentChord(modifiedChord);
      onChordChange?.(modifiedChord);
    }
  };

  // Handle key press with octave and inversion
  const handleKeyPress = (note: NoteName) => {
    // In 'FREE' mode all notes are allowed, in other modes only scale notes
    if (mode !== 'free' && !scaleNotes.includes(note)) return;
    
    setLastPressedNote(note);
    const chordType = getCurrentChordType(note);
    const chord = createChord(note, chordType);
    
    if (chord) {
      // Apply octave and inversion
      const modifiedNotes = chord.notes.map(note => {
        let modifiedNote = note;
        if (octave !== 0) {
          modifiedNote += 12 * octave;
        }
        return modifiedNote;
      });

      // Apply inversion if set
      if (inversion !== 0) {
        for (let i = 0; i < Math.abs(inversion); i++) {
          if (inversion > 0) {
            modifiedNotes[0] += 12;
            modifiedNotes.push(modifiedNotes.shift()!);
          } else {
            modifiedNotes[modifiedNotes.length - 1] -= 12;
            modifiedNotes.unshift(modifiedNotes.pop()!);
          }
        }
      }

      // Play the main chord with the selected instrument
      playChord(modifiedNotes, selectedSound);

      // If bass is active and this is the last pressed note, play the bass note separately
      if (selectedBassOffset !== null && note === lastPressedNote) {
        const notes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = notes.indexOf(note);
        if (rootIndex !== -1) {
          let bassNote;
          if (selectedBassOffset === 0) {
            // For BASS (0), use the root note one octave lower
            bassNote = chord.notes[0] - 12;
          } else {
            // For +1 through +11, calculate the offset note
            bassNote = 48 + ((rootIndex + selectedBassOffset) % 12); // Start from C3 (48)
          }
          
          // Play just the single bass note
          playBassNote(bassNote);
        }
      }

      const chordName = getChordName(note);
      const modifiedChord = { ...chord, notes: modifiedNotes, name: chordName };
      setCurrentChord(modifiedChord);
      onChordChange?.(modifiedChord);
      onNoteSelect?.(note);
    }
  };

  // Piano key component with chord name
  const PianoKey = ({ isWhite = true, note }: { isWhite?: boolean; note: NoteName }) => {
    // Always use sharp notation internally, only convert for display
    const displayNote = mode === 'free' && useFlats && !isWhite ? 
      sharpToFlatMap[note] : 
      note;
    const chordName = getChordName(note);
    const displayChordName = mode === 'free' && useFlats ? 
      chordName.replace(/[A-G]#/g, match => sharpToFlatMap[match as NoteName]) : 
      chordName;
    const isInScale = mode === 'free' ? true : scaleNotes.includes(note);

    return (
      <Pressable 
        style={[
          styles.pianoKey,
          isWhite ? styles.whiteKey : styles.blackKey,
          isInScale && styles.keyInScale
        ]}
        onPressIn={() => {
          if (isInScale) {
            handleKeyPress(note);
          }
        }}
        onPressOut={() => {
          stopChord();
          setCurrentChord(null);
          onChordChange?.(null);
        }}
      >
        <View style={styles.keyContent}>
          {isInScale && (
            <Text style={[
              styles.chordNameText,
              isWhite ? styles.whiteKeyText : styles.blackKeyText
            ]}>
              {displayChordName}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  // Expose imperative handle for parent
  useImperativeHandle(ref, () => ({
    adjustLastChordType: (direction: 'up' | 'down') => {
      if (!lastPressedNote) return;
      
      // Get the appropriate chord types list
      const availableTypes = mode === 'free' ? 
        ALL_CHORD_TYPES : 
        getAvailableChordTypes(lastPressedNote);
      
      // In regular modes, if the note is not in scale, we shouldn't adjust its chord type
      if (mode !== 'free' && !scaleNotes.includes(lastPressedNote)) return;
      
      if (availableTypes.length === 0) return;
      
      const currentIndex = chordTypeIndices[lastPressedNote] || 0;
      const newIndex = direction === 'up'
        ? (currentIndex + 1) % availableTypes.length
        : (currentIndex - 1 + availableTypes.length) % availableTypes.length;
      
      // Just update the chord type indices - don't update display
      setChordTypeIndices(prev => ({
        ...prev,
        [lastPressedNote]: newIndex
      }));
    },
    getChordTypeIndices: () => chordTypeIndices,
    setChordTypeIndices: (indices: any) => setChordTypeIndices(indices),
  }));

  return (
    <View style={styles.container}>
      {/* Piano Keys Container */}
      <View style={styles.pianoContainer}>
        <View style={styles.whiteKeysRow}>
          {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as NoteName[]).map(note => (
            <PianoKey key={note} note={note} isWhite={true} />
          ))}
        </View>
        <View style={styles.blackKeysRow}>
          {(['C#', 'D#', null, 'F#', 'G#', 'A#'] as (NoteName | null)[]).map((note, index) => (
            note ? (
              <PianoKey 
                key={note} 
                note={note} 
                isWhite={false} 
              />
            ) : (
              <View key={index} style={styles.blackKeyPlaceholder} />
            )
          ))}
        </View>
      </View>
    </View>
  );
});

const MAJOR_SCALE_CHORDS: { [key: string]: ChordType[] } = {
  '1': ['major', 'major7', 'major9', 'add9'],
  '2': ['minor', 'minor7', 'minor9'],
  '3': ['minor', 'minor7', 'minor9'],
  '4': ['major', 'major7', 'major9', 'add9'],
  '5': ['major', '7', '9'],
  '6': ['minor', 'minor7', 'minor9'],
  '7': ['dim', 'dim7', 'm7b5'],
};

const MINOR_SCALE_CHORDS: { [key: string]: ChordType[] } = {
  '1': ['minor', 'minor7', 'minor9', 'm11'],
  '2': ['dim', 'dim7', 'm7b5'],
  '3': ['major', 'major7', 'add9'],
  '4': ['minor', 'minor7', 'minor9'],
  '5': ['minor', 'minor7', 'minor9'],
  '6': ['major', 'major7', 'add9'],
  '7': ['major', '7', '9'],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pianoContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    transform: [{ translateX: -134 }, { translateY: 78 }],
  },
  whiteKeysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 800,
  },
  blackKeysRow: {
    position: 'absolute',
    top: -128,
    left: -3,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    height: '60%',
    zIndex: 3,
    width: '100%',
    maxWidth: 800,
  },
  pianoKey: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  whiteKey: {
    width: 72,
    height: 119,
    backgroundColor: '#4A4A4A',
    marginHorizontal: 13.5,
  },
  blackKey: {
    width: 72,
    height: 119,
    backgroundColor: '#000000',
    marginHorizontal: 13.5,
    borderWidth: 2,
    borderColor: '#4A4A4A',
  },
  blackKeyPlaceholder: {
    width: 99,
    height: 119,
  },
  keyInScale: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  keyContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  chordNameText: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  whiteKeyText: {
    color: colors.text,
  },
  blackKeyText: {
    color: colors.text,
  },
}); 