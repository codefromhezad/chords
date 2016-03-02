// This function will recognize and generate :
    // Major triad: C
    // Minor triad: Cm
    // Diminished triad: Cdim
    // Augmented triad: Caug

var Harmony = {

    A4Frequency: 440,

    notesPerOctave: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],

    indexToFreq: [],
    nameToFreq: {},

    __buffersPrecalcDone: false,



    /**
     * Harmony Infos functions
     *  chordInfo: Only triadic chords are supported for now
    **/
    chordInfo: function(name) {
        name = name.toUpperCase();

        var chord_info = {
            root: null,
            family: null,
            type: null,
        };

        var triadic_chords = ["major", "minor", "dim", "aug"];

        // Triadic chords
        if( Harmony.notesPerOctave.indexOf(name) > -1 ) {

            chord_info.root = (name);
            chord_info.type = "major";

        } else if( Harmony.notesPerOctave.indexOf(name.slice(0, -1)) > -1 ) {

            chord_info.root = (name.slice(0, -1));
            chord_info.type = "minor";

        } else if( Harmony.notesPerOctave.indexOf(name.slice(0, -3)) > -1 ) {

            chord_info.root = (name.slice(0, -3));
            chord_info.type = name.substr(name.length - 3).toLowerCase();
        }

        if( triadic_chords.indexOf(chord_info.type) > -1 ) {
            chord_info.family = "triadic";
        }

        // TODO: Tetradic chords

        return chord_info;
    },



    /**
     * Harmony Maths functions
    **/
    addSemitones: function(name, octave, interval) {
        var root_index = Harmony.notesPerOctave.indexOf(name.toUpperCase());
        var added_index = root_index + interval;

        octave = (added_index > 11) ? octave + 1 : octave;
        return Harmony.notesPerOctave[added_index % 12] + "" + octave;
    },


    /**
     * Harmony Helper functions
    **/
    noteToFreq: function(name) {
        if( ! Harmony.__buffersPrecalcDone ) {
            Harmony.precalculateFreqBuffers();
        }

        if( Array.isArray(name) ) {
            for(var i in name) {
                name[i] = Harmony.noteToFreq(name[i]);
            }
            return name;
        }

        name = name.toUpperCase();
        if( ! Harmony.nameToFreq[name] ) {
            console.error('"' + name + '" is not a valid note name. Using "A4" instead.');
            name = "A4";
        }
        return Harmony.nameToFreq[name];
    },

    chordToNotes: function(name, octave) {

        if( octave === undefined ) {
            octave = 4;
        }

        name = name.toUpperCase();

        var chord_info = Harmony.chordInfo(name);

        var chord = [];
        var third_adder;
        var fifth_adder;

        if( chord_info.type == "major" ) {

            third_adder = 4;
            fifth_adder = 7;

        } else if( chord_info.type == "minor" ) {

            third_adder = 3;
            fifth_adder = 7;

        } else if( chord_info.type == "dim" ) {
            
            third_adder = 3;
            fifth_adder = 6;
        
        } else if( chord_info.type == "aug" ) {

            third_adder = 4;
            fifth_adder = 8;
        
        } else {

            return null;

        }

        // Write Root
        var root_name = chord_info.root;
        chord[0] = root_name + "" + octave;

        // Find and Write Third
        chord[1] = Harmony.addSemitones(root_name, octave, third_adder);

        // Find and Write Fifth
        chord[2] = Harmony.addSemitones(root_name, octave, fifth_adder);

        return chord;
    },


    /**
     * Harmony Core functions
    **/
    precalculateFreqBuffers: function() {
        var currentOctave = 0;
        var currentNoteIndex = 0;

        for(var n = 1; n <= 88; n++) {
            Harmony.indexToFreq[n] = Math.pow(2, (n - 49) / 12) * Harmony.A4Frequency;

            var baseNoteName = Harmony.notesPerOctave[currentNoteIndex % 12];
            var noteName = baseNoteName + currentOctave;
            Harmony.nameToFreq[noteName] = Harmony.indexToFreq[n];

            currentNoteIndex ++;
            if( baseNoteName == "G" ) {
                currentOctave ++;
            }
        }

        Harmony.__buffersPrecalcDone = true;
    }
};