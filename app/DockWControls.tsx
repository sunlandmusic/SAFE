import React, { useState, useRef } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { NoteName, MusicMode, InstrumentType, Chord } from '../types/music';
import { PianoXL } from '../components/PianoXL';
import { PlusMinusBar } from '../components/PlusMinusBar';
import { SettingsPanelXL } from '../components/SettingsPanelXL';

const KEYS: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES: MusicMode[] = ['free', 'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];

type BassOffset = 'BASS' | '+1' | '+2' | '+3' | '+4' | '+5' | '-6' | '-5' | '-4' | '-3' | '-2' | '-1' | 'OFF';
const BASS_SEQUENCE: BassOffset[] = ['BASS', '+1', '+2', '+3', '+4', '+5', '-6', '-5', '-4', '-3', '-2', '-1', 'OFF'];

const SOUNDS: InstrumentType[] = ['balafon', 'piano', 'rhodes', 'steel_drum', 'pluck', 'pad'];

export default function DockWControls() {
  const [selectedKey, setSelectedKey] = useState<NoteName>('C');
  const [mode, setMode] = useState<MusicMode>('free');
  const [octave, setOctave] = useState<number>(0);
  const [inversion, setInversion] = useState<number>(0);
  const [selectedSound, setSelectedSound] = useState<InstrumentType>('balafon');
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [useFlats, setUseFlats] = useState(false);
  const [selectedBassOffset, setSelectedBassOffset] = useState<BassOffset>('BASS');
  const [lastPlayedChord, setLastPlayedChord] = useState<string>('');
  const [bassOffsetMap, setBassOffsetMap] = useState<Record<string, BassOffset>>({});
  const [isSoundWindowSelected, setIsSoundWindowSelected] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  const pianoXLRef = useRef<{ adjustLastChordType: (direction: 'up' | 'down') => void }>(null);

  const handleChordChange = (chord: Chord | null) => {
    setCurrentChord(chord);
    if (chord?.name) {
      setLastPlayedChord(chord.name);
    }
  };

  // Handlers for PlusMinusBar
  const handlePlus = () => {
    if (!selectedControl && pianoXLRef.current) {
      pianoXLRef.current.adjustLastChordType('up');
      return;
    }
    switch (selectedControl) {
      case 'key': {
        const currentIndex = KEYS.indexOf(selectedKey);
        setSelectedKey(KEYS[(currentIndex + 1) % KEYS.length]);
        break;
      }
      case 'mode': {
        const currentIndex = MODES.indexOf(mode);
        setMode(MODES[(currentIndex + 1) % MODES.length]);
        break;
      }
      case 'octave': {
        setOctave((prev) => Math.min(prev + 1, 2));
        break;
      }
      case 'inversion': {
        setInversion((prev) => Math.min(prev + 1, 3));
        break;
      }
      case 'bass': {
        const currentIndex = BASS_SEQUENCE.indexOf(selectedBassOffset);
        const nextIndex = (currentIndex + 1) % BASS_SEQUENCE.length;
        const newOffset = BASS_SEQUENCE[nextIndex];
        setSelectedBassOffset(newOffset);
        
        // Store the bass offset for this specific chord
        if (lastPlayedChord) {
          setBassOffsetMap(prev => ({
            ...prev,
            [lastPlayedChord]: newOffset
          }));
        }
        break;
      }
      default:
        break;
    }
  };

  const handleMinus = () => {
    if (!selectedControl && pianoXLRef.current) {
      pianoXLRef.current.adjustLastChordType('down');
      return;
    }
    switch (selectedControl) {
      case 'key': {
        const currentIndex = KEYS.indexOf(selectedKey);
        setSelectedKey(KEYS[(currentIndex - 1 + KEYS.length) % KEYS.length]);
        break;
      }
      case 'mode': {
        const currentIndex = MODES.indexOf(mode);
        setMode(MODES[(currentIndex - 1 + MODES.length) % MODES.length]);
        break;
      }
      case 'octave': {
        setOctave((prev) => Math.max(prev - 1, -2));
        break;
      }
      case 'inversion': {
        setInversion((prev) => Math.max(prev - 1, -3));
        break;
      }
      case 'bass': {
        const currentIndex = BASS_SEQUENCE.indexOf(selectedBassOffset);
        const nextIndex = (currentIndex - 1 + BASS_SEQUENCE.length) % BASS_SEQUENCE.length;
        const newOffset = BASS_SEQUENCE[nextIndex];
        setSelectedBassOffset(newOffset);
        
        // Store the bass offset for this specific chord
        if (lastPlayedChord) {
          setBassOffsetMap(prev => ({
            ...prev,
            [lastPlayedChord]: newOffset
          }));
        }
        break;
      }
      default:
        break;
    }
  };

  // Handlers for SettingsPanelXL
  const handleKeyPress = () => setSelectedControl(selectedControl === 'key' ? null : 'key');
  const handleModePress = () => setSelectedControl(selectedControl === 'mode' ? null : 'mode');
  const handleModeLongPress = () => {
    setMode('free');
    setSelectedControl(null);
  };
  const handleOctavePress = () => setSelectedControl(selectedControl === 'octave' ? null : 'octave');
  const handleInversionPress = () => setSelectedControl(selectedControl === 'inversion' ? null : 'inversion');
  const handleToggleFlats = () => setUseFlats(prev => !prev);

  // Handler for bass selection
  const handleBassPress = () => {
    if (selectedControl === 'bass') {
      // Deselecting bass
      setSelectedControl(null);
    } else {
      // Selecting bass - load stored offset for current chord if it exists
      setSelectedControl('bass');
      if (lastPlayedChord && bassOffsetMap[lastPlayedChord]) {
        setSelectedBassOffset(bassOffsetMap[lastPlayedChord]);
      }
      // If no stored offset, it stays at current value (defaults to BASS)
    }
  };

  // Add handler for relative key changes
  const handleRelativeKeyChange = (newKey: NoteName, newMode: MusicMode) => {
    setSelectedKey(newKey);
    setMode(newMode);
  };

  // Handler for sound selection
  const handleSoundPress = async () => {
    if (!isSoundWindowSelected) {
      // First press - select window and show loading state for initial sound
      setIsSoundWindowSelected(true);
      setIsLoadingSound(true);
      // Clear loading state after delay
      setTimeout(() => {
        setIsLoadingSound(false);
      }, 1000);
      return;
    }

    // Get next sound in sequence
    const currentIndex = SOUNDS.indexOf(selectedSound);
    const nextIndex = (currentIndex + 1) % SOUNDS.length;
    const nextSound = SOUNDS[nextIndex];

    // Start loading new sound
    setIsLoadingSound(true);
    setSelectedSound(nextSound);

    // Simulate loading time (replace with actual sound loading logic)
    setTimeout(() => {
      setIsLoadingSound(false);
    }, 1000); // Adjust timing as needed
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.overlayContainer}>
        {/* SLOT1: Eye Button (Orange) */}
        <View style={[styles.slot1Container, { backgroundColor: 'rgba(255, 165, 0, 0.2)' }]}>
          {/* Eye button will go here */}
        </View>

        {/* SLOT2: Piano XL Main Area (Blue) */}
        <View style={[styles.slot2Container, { backgroundColor: 'rgba(0, 0, 255, 0.2)' }]}>
          <PianoXL ref={pianoXLRef} />
        </View>

        {/* SLOT3: Settings Bar (Green) */}
        <View style={[styles.slot3Container, { backgroundColor: 'rgba(0, 255, 0, 0.2)' }]}>
          <SettingsPanelXL
            selectedKey={selectedKey}
            selectedMode={mode}
            selectedOctave={octave}
            selectedInversion={inversion}
            selectedSound={selectedSound}
            currentChord={currentChord?.name || ''}
            selectedControl={selectedControl}
            onKeyPress={handleKeyPress}
            onModePress={handleModePress}
            onModeLongPress={handleModeLongPress}
            onOctavePress={handleOctavePress}
            onInversionPress={handleInversionPress}
            onToggleFlats={handleToggleFlats}
            useFlats={useFlats}
            selectedBassOffset={selectedBassOffset}
            onBassPress={handleBassPress}
            lastPlayedChord={lastPlayedChord}
            onRelativeKeyChange={handleRelativeKeyChange}
            isSoundWindowSelected={isSoundWindowSelected}
            isLoadingSound={isLoadingSound}
            onSoundPress={handleSoundPress}
          />
        </View>

        {/* SLOT4: Plus/Minus Controls (Purple) */}
        <View style={[styles.slot4Container, { backgroundColor: 'rgba(128, 0, 128, 0.2)' }]}>
          <PlusMinusBar type="plus" onPress={handlePlus} />
          <PlusMinusBar type="minus" onPress={handleMinus} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slot1Container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slot2Container: {
    position: 'absolute',
    top: 86,
    left: 0,
    right: 42,
    bottom: 0,
  },
  slot3Container: {
    position: 'absolute',
    top: 0,
    left: 64,
    right: 42,
    height: 86,
  },
  slot4Container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 42,
    height: 374,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 