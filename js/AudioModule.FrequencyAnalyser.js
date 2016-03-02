AudioModule.FrequencyAnalyser = (function() {

	// Constructor
	var FrequencyAnalyser = function() {
		AudioModule.construct(this);

		this.processor = AudioModule.context.createAnalyser();
		this.processor.fftSize = 256;
		
		this.bufferLength = this.processor.frequencyBinCount;
		this.dataArray = new Float32Array(this.bufferLength);
	};


	// UX Building
	FrequencyAnalyser.prototype.buildUI = function(css) {
		return this.spawnWidget(
			'Analyser', 

			[1, 1],

			'<canvas class="analyser-canvas" width="200" height="200"></canvas>',
			
			function($uiItem, module) {
				var canvas = $uiItem.find('.analyser-canvas')[0];
				var canvasCtx = canvas.getContext('2d');

				var analyser = module.processor;
				var dataArray = module.dataArray;
				var bufferLength = module.bufferLength;

				var WIDTH = canvas.width;
				var HEIGHT = canvas.height;

				function draw() {
					drawVisual = requestAnimationFrame(draw);

					analyser.getFloatFrequencyData(dataArray);	

					canvasCtx.fillStyle = 'rgb(200, 200, 200)';
					canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

					var barWidth = (WIDTH / bufferLength) * 2.5;
					var barHeight;
					var x = 0;

					for(var i = 0; i < bufferLength; i++) {
						barHeight = (dataArray[i] + 140)*2;

						canvasCtx.fillStyle = 'rgb(' + Math.floor(barHeight+100) + ',50,50)';
					    canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);
					    x += barWidth + 1;
					}
				};

				draw();
			},

			css
		);
	}

	
	// Export FrequencyAnalyser
	return FrequencyAnalyser;
})();