var Synth = function() {
	
	if( ! window.SynthAudioContext ) {
		window.SynthAudioContext = new (window.AudioContext || window.webkitAudioContext)();
	}

	this.context = window.SynthAudioContext;

	this.oscType = "sine";
	this.gain = 0.2;

	this.currentChords = {};
	this.currentVoices = {};
	this.VCA;
	this.MasterOutput;

	this.listeners = {
		__noteOn: null,
		__noteOff: null,
		__chordOn: null,
		__chordOff: null,
		__chordPlayed: null
	}

	this.boot = function() {
		// Init VCA Stage
		this.VCA = this.context.createGain();
		this.VCA.gain.value = this.gain;

		// Connect VCA to System Output
		this.VCA.connect(this.context.destination);

		// (VCOs are initiated on each noteOn to handle polyphony)
	}

	// Boot
	this.boot();

	// Methods
	this.on = function(ev, cb) {
		this.listeners['__' + ev] = cb;
	}

	this.noteOn = function(noteName) {
		// Stops previous osc if voice was already in use
		if( this.currentVoices[noteName] ) {
			this.noteOff(noteName);
		}

		// Init Voice's VCO Stage
		var voiceVCO = this.context.createOscillator();
		voiceVCO.type = this.oscType;
		voiceVCO.frequency.value = Harmony.noteToFreq(noteName);
		
		// Connect VCO to VCA Stage
		voiceVCO.connect(this.VCA);

		// Keep trace of active voices
		this.currentVoices[noteName] = voiceVCO;

		// Play !
		voiceVCO.start(0);

		// Trigger listener
		if( this.listeners.__noteOn ) {
			this.listeners.__noteOn(noteName);
		}

		return noteName;
	}

	this.noteOff = function(noteName) {
		var osc = this.currentVoices[noteName];

		// Trigger listener
		if( this.listeners.__noteOff ) {
			this.listeners.__noteOff(noteName);
		}

		if( ! osc ) {
			return;
		}

		osc.stop();
		delete(this.currentVoices[noteName]);
	}

	this.chordOn = function(chordName, octave) {
		var chord = Harmony.chordToNotes(chordName, octave);

		if( chord.length ) {

			// Trigger listener
			if( this.listeners.__chordOn ) {
				this.listeners.__chordOn(chordName, octave);
			}

			for(var i in chord) {
				this.noteOn(chord[i]);
			}
		}

		this.currentChords[chordName+""+octave] = chord;
	}

	this.chordOff = function(chordName, octave) {
		var chord = this.currentChords[chordName+""+octave];

		// Trigger listener
		if( this.listeners.__chordOff ) {
			this.listeners.__chordOff(chordName, octave);
		}

		if( ! chord.length ) {
			return;
		}

		for(var i in chord) {
			this.noteOff(chord[i]);
		}

		delete(this.currentChords[chordName+""+octave]);
	}

	this.playChords = function(listOfChords, loop, chordIndex) {
		var that = this;
		var chordIndex = (chordIndex === undefined) ? 0 : chordIndex;

		( function(that, listOfChords, chordIndex, loop) {
			if( chordIndex >= listOfChords.length ) {
				if( loop ) {
					chordIndex = 0;
				} else {
					return;
				}
			}

			var chordName = listOfChords[chordIndex][0], 
				octave = listOfChords[chordIndex][1], 
				durationMs = listOfChords[chordIndex][2];

			that.chordOn(chordName, octave);

			if( that.listeners.__chordPlayed ) {
				that.listeners.__chordPlayed(chordName, octave, durationMs);
			}

			setTimeout( function() {
				that.chordOff(chordName, octave);
				that.playChords(listOfChords, loop, chordIndex + 1);
			}, durationMs);

		}) (that, listOfChords, chordIndex, loop);
	}
}