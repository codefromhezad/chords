// AudioModule Definition
var AudioModule = {
	context: new (window.AudioContext || window.webkitAudioContext)(),
	
	globals: {
		references: [],
		connectionsReferences: {},

		masterModule: null
	},

	UI: {
		containerSelector: '#websynth-canvas',

		selectedOutputId: null,
		selectedOutputConnector: null,

		selectedInputId: null,
		selectedInputConnector: null,

		currentConnectionSourceType: null,

		svgConnectionsReferences: {},
		svgOutputsReferences: {},
		svgInputsReferences: {},

		$currentSvgLine: null,

		cancelConnecting: function() {
			AudioModule.UI.selectedOutputId = null;
			AudioModule.UI.selectedOutputConnector = null;
			AudioModule.UI.selectedInputId = null;
			AudioModule.UI.selectedInputConnector = null;
			AudioModule.UI.currentConnectionSourceType = null;

			if( AudioModule.UI.$currentSvgLine ) {
				AudioModule.UI.$currentSvgLine.remove();
				AudioModule.UI.$currentSvgLine = null;
			}
		},

		makeSvgLine: function() {
			var svgHtml = '<svg class="svg-line-wrapper" version="1.1" xmlns="http://www.w3.org/2000/svg">'+
				'<line/>' +
			'</svg>';

			AudioModule.UI.$currentSvgLine = $(svgHtml);

			$(AudioModule.UI.containerSelector).append(AudioModule.UI.$currentSvgLine);
		},

		updateSvgLine: function($svg, x1, y1, x2, y2) {
			var containerOffset = $(AudioModule.UI.containerSelector).offset();
			var xInv = false;
			var yInv = false;

			var tx1 = x1 - containerOffset.left,
				tx2 = x2 - containerOffset.left,
				ty1 = y1 - containerOffset.top,
				ty2 = y2 - containerOffset.top;

			if( tx1 > tx2 ) {
				tx2 = [tx1, tx1 = tx2][0];
				xInv = true;
			}

			if( ty1 > ty2 ) {
				ty2 = [ty1, ty1 = ty2][0];
				yInv = true;
			}

			var w = tx2 - tx1;
			var h = ty2 - ty1;

			$svg.attr({
				width: w,
				height: h,
				viewPort: '0 0 '+w+' '+h
			}).css({
				left: tx1,
				top: ty1
			});

			var svgLine = $svg[0].querySelector('line');
			svgLine.setAttribute('x1', xInv ? w : 0);
			svgLine.setAttribute('y1', yInv ? h : 0);
			svgLine.setAttribute('x2', (!xInv) ? w : 0);
			svgLine.setAttribute('y2', (!yInv) ? h : 0);
		},

		connectModules: function($svgLine, inputModule, outputModule) {
			if( AudioModule.globals.connectionsReferences[outputModule.referenceId + '-' + inputModule.referenceId] !== undefined ) {
				return false;
			}

			inputModule.$ui.addClass('input-connected');
			outputModule.$ui.addClass('output-connected');

			outputModule.connectTo(inputModule);
			AudioModule.UI.svgConnectionsReferences[outputModule.referenceId + '-' + inputModule.referenceId] = AudioModule.UI.$currentSvgLine;
			AudioModule.UI.svgOutputsReferences[outputModule.referenceId] = inputModule.referenceId;
			AudioModule.UI.svgInputsReferences[inputModule.referenceId] = outputModule.referenceId;

			AudioModule.UI.$currentSvgLine = null;

			return true;
		},

		spawnModule: function(moduleSlug, css) {
			if( AudioModule[moduleSlug] === undefined ) {
				console.error(moduleSlug + ' is not a valid AudioModule name');
				return null;
			}

			var mod = new AudioModule[moduleSlug]();
			return mod.buildUI(css);
		},

		setupListeners: function() {

			/* Handling user interaction with input/output connectors */
			$('body').on('mousedown', '.websynth-module .connectors .connector', function(e) {
				e.preventDefault();

				var $this = $(this);
				var $module = $this.closest('.websynth-module');

				if( $this.hasClass('output') ) {
					
					if( AudioModule.UI.selectedOutputId !== null ) {
						return false;
					}

					AudioModule.UI.selectedOutputId = $module.attr('data-reference-id');
					AudioModule.UI.selectedOutputConnector = $this.attr('data-n');

					AudioModule.UI.currentConnectionSourceType = "output";
					
				} else if( $this.hasClass('input') ) {
					
					if( AudioModule.UI.selectedInputId !== null ) {
						return false;
					}

					AudioModule.UI.selectedInputId = $module.attr('data-reference-id');
					AudioModule.UI.selectedInputConnector = $this.attr('data-n');
					
					AudioModule.UI.currentConnectionSourceType = "input";
				}

				AudioModule.UI.makeSvgLine();

				return false;
			});

			$('body').on('mouseup', '.websynth-module .connectors .connector', function(e) {
				e.preventDefault();

				var $this = $(this);
				var $module = $this.closest('.websynth-module');

				if( AudioModule.UI.currentConnectionSourceType === null ) {
					return false;
				}

				if( $this.hasClass('output') && AudioModule.UI.currentConnectionSourceType == "input" ) {

					AudioModule.UI.selectedOutputId = $module.attr('data-reference-id');
					AudioModule.UI.selectedOutputConnector = $this.attr('data-n');

				} else if( $this.hasClass('input') && AudioModule.UI.currentConnectionSourceType == "output" ) {
					
					AudioModule.UI.selectedInputId = $module.attr('data-reference-id');
					AudioModule.UI.selectedInputConnector = $this.attr('data-n');

				} else {
					AudioModule.UI.cancelConnecting();
					return false;
				}

				var inputModule = AudioModule.globals.references[AudioModule.UI.selectedInputId];
				var outputModule = AudioModule.globals.references[AudioModule.UI.selectedOutputId];

				if( ! AudioModule.UI.connectModules(AudioModule.UI.$currentSvgLine, inputModule, outputModule) ) {
					AudioModule.UI.cancelConnecting();
				}
				
				return false;
			});

			/* Handling wrong mouseup target */
			$('body').on('mouseup', function(e) {
				if( AudioModule.UI.currentConnectionSourceType !== null && ! $(e.target).is('.connector') ) {
					e.preventDefault();
					AudioModule.UI.cancelConnecting();
				}
			});

			/* Updating SVG Line UI on mousemove */
			$('body').on('mousemove', function(e) {

				if( AudioModule.UI.$currentSvgLine !== null && AudioModule.UI.currentConnectionSourceType !== null ) {
					
					if( AudioModule.UI.currentConnectionSourceType == "input" ) {
						var sourceModule = AudioModule.globals.references[AudioModule.UI.selectedInputId];
						var $from = sourceModule.$ui.find('.connector.input').eq(AudioModule.UI.selectedInputConnector);
					} else if( AudioModule.UI.currentConnectionSourceType == "output" ) {
						var sourceModule = AudioModule.globals.references[AudioModule.UI.selectedOutputId];
						var $from = sourceModule.$ui.find('.connector.output').eq(AudioModule.UI.selectedOutputConnector);
					}
					
					var fromOffset = $from.offset();

					var x1 = fromOffset.left + 4;
					var y1 = fromOffset.top + 4;
					var x2 = e.pageX;
					var y2 = e.pageY;

					AudioModule.UI.updateSvgLine(AudioModule.UI.$currentSvgLine, x1, y1, x2, y2);
				}

			});
		}
	},

	boot: function() {
		AudioModule.globals.masterModule = new AudioModule.MasterOutput();
		
		var $masterWidget = AudioModule.globals.masterModule.buildUI({
			top: '50%',
			right:'2%'
		});
		
		$(AudioModule.UI.containerSelector).append($masterWidget);

		AudioModule.UI.setupListeners();
	},

	construct: function(module) {
		module.input = null;
		module.output = null;

		module.processor = null;

		module.referenceId = AudioModule.globals.references.length;
		AudioModule.globals.references.push(module);

		module.$ui = null;

		module.iconImage = null;

		module.spawnWidget = function(title, numInputsAndOutputs, template, callback, css) {
			var inputsHTML = '';
			var outputsHTML = '';

			for(var n = 0; n < numInputsAndOutputs[0]; n++) {
				inputsHTML += '<div class="connector input" data-n="'+n+'"></div>';
			}

			for(var n = 0; n < numInputsAndOutputs[1]; n++) {
				outputsHTML += '<div class="connector output" data-n="'+n+'"></div>';
			}

			var uiHtml = '<div class="websynth-module websynth-'+title.toLowerCase()+'" '+
							  'data-reference-id="'+module.referenceId+'">'+
				'<h3>'+title+'</h3>'+
				'<div class="content">'+
					(template ? template : '') +
				'</div>'+
				'<div class="connectors inputs">' + inputsHTML + '</div>' +
				'<div class="connectors outputs">' + outputsHTML + '</div>' +
			'</div>';

			var $uiItem = $(uiHtml);

			if( css ) {
				$uiItem.css(css);
			}

			$uiItem.draggable({
				handle: "h3",
				drag: function(e, ui) {
					var $widget = ui.helper;
					var widgetReferenceId = $widget.attr('data-reference-id');

					function moveRelatedSvg(outputId, inputId) {
						var outputModule = AudioModule.globals.references[outputId];
						var inputModule = AudioModule.globals.references[inputId];

						var $from = outputModule.$ui.find('.connector.output');
						var $to = inputModule.$ui.find('.connector.input');
						var $svgLine = AudioModule.UI.svgConnectionsReferences[outputId + '-' + inputId];

						var fromOffset = $from.offset();
						var toOffset = $to.offset();

						var x1 = fromOffset.left + 4;
						var y1 = fromOffset.top + 4;
						var x2 = toOffset.left + 4;
						var y2 = toOffset.top + 4;

						AudioModule.UI.updateSvgLine($svgLine, x1, y1, x2, y2);
					}

					if( AudioModule.UI.svgOutputsReferences[widgetReferenceId] !== undefined ) {
						var outputId = widgetReferenceId;
						var inputId = AudioModule.UI.svgOutputsReferences[widgetReferenceId];

						moveRelatedSvg(outputId, inputId);
					}


					if( AudioModule.UI.svgInputsReferences[widgetReferenceId] !== undefined ) {
						var outputId = AudioModule.UI.svgInputsReferences[widgetReferenceId];
						var inputId = widgetReferenceId;

						moveRelatedSvg(outputId, inputId);
					} 
				}
			});

			module.$ui = $uiItem;

			if( callback ) {
				( function(module, $uiItem) {
					callback($uiItem, module);
				}) (module, $uiItem);
			}

			return $uiItem;
		}

		module.connectTo = function(dest) {
			( function(module, dest) {
				if( AudioModule.globals.connectionsReferences[module.referenceId + '-' + dest.referenceId] !== undefined ) {
					console.log('Already connected');
					return false;
				}

				module.output = dest;
				dest.input = module;

				if( Object.prototype.toString.call( module.processor ) === '[object Array]' ) {
					// Special case for VCO's (they must instanciate one oscillator node per sound)
					for(var moduleProcIndex in module.processor) {
						module.processor[moduleProcIndex].connect(dest.processor);
					}
				} else {
					// Regular case
					module.processor.connect(dest.processor);
				}

				AudioModule.globals.connectionsReferences[module.referenceId + '-' + dest.referenceId] = true;

			}) (module, dest);
		}

		module.forEachProcessor = function(callback) {
			( function(module, callback) {
				if( Object.prototype.toString.call( module.processor ) === '[object Array]' ) {
					// Special case for VCO's (they must instanciate one oscillator node per sound)
					for(var moduleProcIndex in module.processor) {
						callback(module.processor[moduleProcIndex], module);
					}
				} else {
					// Regular case
					callback(module.processor, module);
				}
			}) (module, callback);
		}
	},
}