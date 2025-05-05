import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { NoteName, MusicMode, InstrumentType } from '../types/music';

// Add helper function for relative key calculation
const getRelativeKey = (currentKey: NoteName, currentMode: MusicMode): { key: NoteName, mode: MusicMode } | null => {
  if (currentMode !== 'major' && currentMode !== 'minor') return null;
  
  const notes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const currentIndex = notes.indexOf(currentKey);
  
  if (currentMode === 'minor') {
    // Going from minor to major: up 3 semitones
    const majorIndex = (currentIndex + 3) % 12;
    return { key: notes[majorIndex], mode: 'major' };
  } else {
    // Going from major to minor: down 3 semitones
    const minorIndex = (currentIndex + 9) % 12;
    return { key: notes[minorIndex], mode: 'minor' };
  }
};

// Add helper function for sharp to flat conversion
const sharpToFlatMap: Record<NoteName, string> = {
  'C': 'C',
  'C#': 'Db',
  'D': 'D',
  'D#': 'Eb',
  'E': 'E',
  'F': 'F',
  'F#': 'Gb',
  'G': 'G',
  'G#': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'B': 'B'
};

// Update bass offset type
type BassOffset = 'BASS' | '+1' | '+2' | '+3' | '+4' | '+5' | '-6' | '-5' | '-4' | '-3' | '-2' | '-1' | 'OFF';

// Update sequence to include BASS (root note) and OFF at the end
const BASS_SEQUENCE: BassOffset[] = ['BASS', '+1', '+2', '+3', '+4', '+5', '-6', '-5', '-4', '-3', '-2', '-1', 'OFF'];

interface SettingsPanelXLProps {
  onSkinPress?: () => void;
  onSkinLongPress?: () => void;
  onSavePress?: () => void;
  onSoundPress?: () => void;
  onKeyPress?: () => void;
  onKeyLongPress?: () => void;
  onModePress?: () => void;
  onModeLongPress?: () => void;
  onOctavePress?: () => void;
  onInversionPress?: () => void;
  selectedKey?: NoteName;
  selectedMode?: MusicMode;
  selectedOctave?: number;
  selectedInversion?: number;
  selectedSound?: InstrumentType;
  currentChord?: string;
  isSaving?: boolean;
  isSoundWindowSelected?: boolean;
  selectedControl?: string | null;
  abMemory?: { A: any | null; B: any | null };
  onABSave?: (slot: 'A' | 'B') => void;
  onABLoad?: (slot: 'A' | 'B') => void;
  onABClear?: (slot: 'A' | 'B') => void;
  onRelativeKeyChange?: (key: NoteName, mode: MusicMode) => void;
  onToggleFlats?: () => void;
  useFlats?: boolean;
  selectedBassOffset?: BassOffset;
  onBassPress?: () => void;
  onBassChange?: (offset: BassOffset) => void;
  lastPlayedChord?: string;
  isLoadingSound?: boolean;
}

const formatInstrumentName = (name: InstrumentType): string => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function SettingsPanelXL({
  onSkinPress,
  onSkinLongPress,
  onSavePress,
  onSoundPress,
  onKeyPress,
  onKeyLongPress,
  onModePress,
  onModeLongPress,
  onOctavePress,
  onInversionPress,
  selectedKey = 'A#',
  selectedMode = 'free',
  selectedOctave = 0,
  selectedInversion = 0,
  selectedSound = 'balafon',
  currentChord = '',
  isSaving = false,
  isSoundWindowSelected = false,
  selectedControl = null,
  abMemory = { A: null, B: null },
  onABSave,
  onABLoad,
  onABClear,
  onRelativeKeyChange,
  onToggleFlats,
  useFlats = false,
  selectedBassOffset = 'BASS',
  onBassPress,
  onBassChange,
  lastPlayedChord = '',
  isLoadingSound = false,
}: SettingsPanelXLProps) {

  const renderModeWithAlternateName = (mode: string) => {
    const upperMode = mode.toUpperCase();
    let mainText = '';
    let alternateName = '';
    
    switch (upperMode) {
      case 'OFF': 
        mainText = 'MODE';
        alternateName = 'OFF';
        break;
      case 'MAJOR': 
        mainText = 'MAJOR';
        alternateName = 'IONIAN';
        break;
      case 'MINOR': 
        mainText = 'MINOR';
        alternateName = 'AEOLIAN';
        break;
      case 'MIXOLYDIAN': 
        mainText = 'MIXO';
        alternateName = 'LYDIAN';
        break;
      case 'PHRYGIAN':
        mainText = 'PHRYG';
        alternateName = 'IAN';
        break;
      default: 
        mainText = upperMode;
        break;
    }

    return (
      <View style={styles.modeValueContainer}>
        {mainText && <Text style={styles.settingValue}>{mainText}</Text>}
        {alternateName && (
          <Text style={styles.alternateModeName}>{alternateName}</Text>
        )}
      </View>
    );
  };

  const SettingItem = ({ 
    label, 
    value, 
    onPress,
    onLongPress,
    isSelected = false
  }: { 
    label: string; 
    value: string | number; 
    onPress?: () => void;
    onLongPress?: () => void;
    isSelected?: boolean;
  }) => {
    const getChordFontSize = (chordName: string) => {
      const length = chordName.length;
      if (length <= 5) return 28;
      if (length <= 7) return 24;
      if (length <= 9) return 20;
      return 16;
    };

    const handleItemLongPress = () => {
      if (label === 'KEY') {
        if (selectedMode === 'major' || selectedMode === 'minor') {
          // Only handle relative key change in major/minor modes
          const relative = getRelativeKey(selectedKey as NoteName, selectedMode);
          if (relative && onRelativeKeyChange) {
            onRelativeKeyChange(relative.key, relative.mode);
          }
        } else if (selectedMode === 'free') {
          // In FREE mode, toggle between sharp and flat notation
          onToggleFlats?.();
        }
      } else if (label === 'MODE' && selectedMode !== 'free') {
        // Toggle to FREE mode on long press
        onModeLongPress?.();
      }
      onLongPress?.();
    };

    return (
      <Pressable 
        style={[
          styles.settingItem,
          label === 'MODE' && styles.modeSettingItem,
          label === 'CHORD' && styles.chordDisplay,
          isSelected && styles.selectedSetting,
        ]}
        onPress={onPress}
        onLongPress={handleItemLongPress}
      >
        {(label !== 'MODE' || value.toString().toUpperCase() === 'OFF') && (
          <Text style={styles.settingLabel}>{label}</Text>
        )}
        {label === 'MODE' ? (
          renderModeWithAlternateName(value.toString())
        ) : (
          <Text style={[
            styles.settingValue,
            label === 'CHORD' && [
              styles.chordValue,
              { fontSize: getChordFontSize(value.toString()) }
            ]
          ]}>{value}</Text>
        )}
      </Pressable>
    );
  };

  // Simplify the display value function since BASS is now part of the cycle
  const getBassDisplayValue = (value: BassOffset): string => {
    return value;
  };

  // Add handler for bass press
  const handleBassPress = () => {
    if (onBassPress) {
      onBassPress();
    }
  };

  // Update sound display logic
  const getSoundDisplayValue = (sound: InstrumentType, isSelected: boolean): string => {
    if (!isSelected) return 'SOUNDS';
    return formatInstrumentName(sound).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Skin button */}
      <Pressable 
        style={styles.skinButton} 
        onPress={onSkinPress}
        onLongPress={onSkinLongPress}
      >
        <MaterialIcons name="image" size={24} color={colors.textOffWhite} />
      </Pressable>

      {/* Bass window - Updated with simplified display logic */}
      <Pressable 
        style={[
          styles.bassWindow,
          selectedControl === 'bass' && styles.selectedSetting
        ]} 
        onPress={handleBassPress}
      >
        <Text style={[
          styles.settingValue,
          selectedControl === 'bass' && styles.selectedText
        ]}>
          {getBassDisplayValue(selectedBassOffset)}
        </Text>
        {selectedControl === 'bass' && lastPlayedChord && (
          <Text style={styles.bassChordLabel}>
            {lastPlayedChord}
          </Text>
        )}
      </Pressable>

      {/* A and B buttons (replace save button) */}
      <View style={styles.abButtonRow}>
        <Pressable
          style={[styles.abButton, abMemory.A ? styles.abButtonOccupied : null]}
          onPress={() => abMemory.A && onABLoad && onABLoad('A')}
          onLongPress={() => {
            if (abMemory.A) {
              onABClear && onABClear('A');
            } else {
              onABSave && onABSave('A');
            }
          }}
        >
          <Text style={styles.abButtonText}>A</Text>
        </Pressable>
        <Pressable
          style={[styles.abButton, { marginLeft: 10 }, abMemory.B ? styles.abButtonOccupied : null]}
          onPress={() => abMemory.B && onABLoad && onABLoad('B')}
          onLongPress={() => {
            if (abMemory.B) {
              onABClear && onABClear('B');
            } else {
              onABSave && onABSave('B');
            }
          }}
        >
          <Text style={styles.abButtonText}>B</Text>
        </Pressable>
      </View>

      {/* Sound selection window - Updated with loading state */}
      <Pressable 
        style={[
          styles.soundWindow,
          isSoundWindowSelected && styles.soundWindowSelected
        ]}
        onPress={onSoundPress}
      >
        <Text style={styles.soundText}>
          {getSoundDisplayValue(selectedSound, isSoundWindowSelected)}
        </Text>
        {isSoundWindowSelected && isLoadingSound && (
          <Text style={styles.loadingText}>LOADING</Text>
        )}
      </Pressable>

      {/* Settings Panel */}
      <View style={styles.settingsPanel}>
        <SettingItem 
          label="KEY" 
          value={selectedMode === 'free' && useFlats ? sharpToFlatMap[selectedKey] : selectedKey}
          onPress={onKeyPress}
          onLongPress={onKeyLongPress}
          isSelected={selectedControl === 'key'}
        />
        <SettingItem 
          label="MODE" 
          value={selectedMode}
          onPress={onModePress}
          onLongPress={() => onModeLongPress?.()}
          isSelected={selectedControl === 'mode'}
        />
        <SettingItem 
          label="OCT" 
          value={selectedOctave}
          onPress={onOctavePress}
          isSelected={selectedControl === 'octave'}
        />
        <SettingItem 
          label="INV" 
          value={selectedInversion}
          onPress={onInversionPress}
          isSelected={selectedControl === 'inversion'}
        />
        <View style={styles.chordDisplay}>
          <Text style={styles.chordLabel}>CHORD</Text>
          <Text style={[
            styles.chordValue,
            { fontSize: currentChord.length <= 5 ? 28 : 
                       currentChord.length <= 7 ? 24 : 
                       currentChord.length <= 9 ? 20 : 16 }
          ]}>
            {currentChord}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 86,
  },
  skinButton: {
    position: 'absolute',
    top: 22,
    left: 9,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  abButtonRow: {
    position: 'absolute',
    top: 22,
    left: 69,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  abButton: {
    width: 32,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  abButtonText: {
    color: colors.textOffWhite,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  soundWindow: {
    position: 'absolute',
    left: 156,
    top: 22,
    width: 132,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
    marginRight: 8,
  },
  soundWindowSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
  },
  soundText: {
    color: colors.textOffWhite,
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  settingsPanel: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 5,
    height: 67,
    alignItems: 'center',
    position: 'absolute',
    top: 12,
    left: 286,
    width: 'auto',
    zIndex: 3,
  },
  settingItem: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
    width: 58,
    marginRight: 7,
  },
  modeSettingItem: {
    width: 102,
    minWidth: 0,
    padding: 2,
    margin: 0,
    height: 67,
    marginRight: 7,
  },
  settingLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13.8,
    fontWeight: '400',
    marginBottom: 2,
  },
  settingValue: {
    color: colors.textOffWhite,
    fontSize: 18.4,
    fontWeight: '400',
  },
  chordDisplay: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 67,
    justifyContent: 'center',
    width: 102,
  },
  chordLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13.8,
    fontWeight: '400',
    marginBottom: 2,
  },
  chordValue: {
    color: colors.textOffWhite,
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
  },
  modeValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    margin: 0,
    width: '100%',
  },
  alternateModeName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 0,
    letterSpacing: 0.5,
  },
  selectedSetting: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(100, 100, 100, 0.8)',
    borderWidth: 2,
  },
  abButtonOccupied: {
    borderColor: 'rgba(100, 100, 100, 0.5)',
    borderWidth: 3,
  },
  selectedText: {
    color: colors.textOffWhite,
    opacity: 0.8,
  },
  bassWindow: {
    position: 'absolute',
    top: 82,
    left: -6,
    width: 71,
    height: 67,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bassChordLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
}); 