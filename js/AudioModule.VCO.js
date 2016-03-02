AudioModule.VCO = (function() {

	// Constructor
	var VCO = function() {
		AudioModule.construct(this);

		this.type = "sine";
		this.baseFrequency = Harmony.noteToFreq("A4");
		this.processor = [];
	};
	

	// Accessors
	VCO.prototype.setType = function(type) {
		this.type = type;
		
		this.forEachProcessor( function(processor, module) {
			processor.type = module.type;
		});
	}

	VCO.prototype.setBaseFrequency = function(freq) {
		this.baseFrequency = freq;
	}


	// Playback
	VCO.prototype.start = function(frequency) {
		var osc = AudioModule.context.createOscillator();
		osc.type = this.type;
		osc.frequency.value = frequency;

		if( this.output ) {
			osc.connect(this.output.processor);
		}

		this.processor.push(osc);

		osc.start(0);

		return this.processor.length - 1;
	}

	VCO.prototype.stop = function(voiceIndex) {
		var osc = this.processor[voiceIndex];

		if( ! osc ) {
			console.error('No VCO oscillator found at index ' + voiceIndex);
			return;
		}

		osc.stop();
		delete(this.processor[voiceIndex]);
	}


	// UX Building
	VCO.prototype.buildUI = function(css) {
		return this.spawnWidget(
			'VCO', 

			[0, 1],

			'<div class="websynth-input">'+
				'<label>Wavetype</label>'+
				'<select class="type-selector">'+
					'<option value="sine" '+(this.type == 'sine' ? 'selected' : '')+'>Sine</option>'+
					'<option value="square" '+(this.type == 'square' ? 'selected' : '')+'>Square</option>'+
					'<option value="sawtooth" '+(this.type == 'sawtooth' ? 'selected' : '')+'>Sawtooth</option>'+
					'<option value="triangle" '+(this.type == 'triangle' ? 'selected' : '')+'>Triangle</option>'+
				'</select>'+
			'</div>'+
			'<div class="websynth-input">'+
				'<label>Base frequency (Hz)</label>'+
				'<input type="text" class="frequency-selector" value="'+this.baseFrequency+'">'+
			'</div>'+
			'<div class="websynth-buttonbar">'+
				'<button class="playback-control start">Start</button>'+
			'</div>',
			
			function($uiItem, module) {
				$uiItem.find('.type-selector').selectmenu({
					width: 100,
					change: function( event, ui ) {
						var newType = ui.item.value;
						module.setType(newType);
					}
				});

				$uiItem.find('.frequency-selector').on('change', function(e) {
					module.setBaseFrequency($(this).val());
				});

				$uiItem.find('.playback-control').on('click', function(e) {
					e.preventDefault();
					var $this = $(this);
					
					if( $this.hasClass('start') ) {
						var freq = module.baseFrequency;
						var oscIndex = module.start(freq);

						$this.attr('data-osc-index', oscIndex);
						$this.text('Stop').removeClass('start');
					} else {
						var oscIndex = $this.attr('data-osc-index');
						module.stop(oscIndex);

						$this.attr('data-osc-index', null);
						$this.text('Start').addClass('start');
					}
					return false;
				});
			},

			css
		);
	}
	
	// Export VCO
	return VCO;
})();
