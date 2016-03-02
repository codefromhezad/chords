AudioModule.Analyser = (function() {

	// Constructor
	var Analyser = function() {
		AudioModule.construct(this);

		this.processor = AudioModule.context.createAnalyser();
		this.processor.fftSize = 2048;
		
		this.bufferLength = this.processor.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);
		this.processor.getByteTimeDomainData(this.dataArray);
	};


	// UX Building
	Analyser.prototype.buildUI = function(css) {
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

					analyser.getByteTimeDomainData(dataArray);

					canvasCtx.fillStyle = 'rgb(200, 200, 200)';
					canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

					canvasCtx.lineWidth = 2;
					canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

					canvasCtx.beginPath();

					var sliceWidth = WIDTH * 1.0 / bufferLength;
					var x = 0;

					for(var i = 0; i < bufferLength; i++) {

						var v = dataArray[i] / 128.0;
						var y = v * HEIGHT/2;

						if(i === 0) {
							canvasCtx.moveTo(x, y);
						} else {
							canvasCtx.lineTo(x, y);
						}

						x += sliceWidth;
					}

					canvasCtx.lineTo(canvas.width, canvas.height/2);
					canvasCtx.stroke();
				};

				draw();
			},

			css
		);
	}

	
	// Export Analyser
	return Analyser;
})();