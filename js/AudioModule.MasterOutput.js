AudioModule.MasterOutput = (function() {

	// Constructor
	var MasterOutput = function() {
		AudioModule.construct(this);
		this.processor = AudioModule.context.destination;
	};


	// UX Building
	MasterOutput.prototype.buildUI = function(css) {
		return this.spawnWidget('MasterOutput', [1, 0], null, null, css);
	}
	
	// Export MasterOutput
	return MasterOutput;
})();