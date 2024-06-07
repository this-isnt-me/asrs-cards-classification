$("#staticCont #cardUploadSection #cardText").focus(function() {
	autosize(this);
});

$(document).on('click', "#staticCont #cardUploadSection #cardUploadBtn", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	let formData = {
		"data": $("#staticCont #cardUploadSection #cardText").val()
	};
	$.ajax({
		url : "/class/cardtranslate",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#staticCont #displaySection").empty().append(result);
		autosize(document.querySelector("#staticCont #displaySection #translationText"));
		$("#staticCont #guageSection #guageOne").empty().append('<canvas id="guage1"></canvas>');
		$("#staticCont #guageSection #guageTwo").empty().append('<canvas id="guage2"></canvas>');
		let polarity = $("#staticCont #displaySection #polarity").val()
		let subjectivity = $("#staticCont #displaySection #subjectivity").val()
		updateGuages(polarity, subjectivity);
		let guageLabelOne = "Stongly Negative"
		if (polarity < -0.2 && polarity > -0.6){
			guageLabelOne = "Negative"
		} else if (polarity < 0.2 && polarity > -0.2){
			guageLabelOne = "Neutral"
		} else if (polarity < 0.6 && polarity > 0.2){
			guageLabelOne = "Positive"
		} else if (polarity > 0.6){
			guageLabelOne = "Stongly Positive"
		} 
		let guageLabelTwo = "Stongly Objective"
		if (subjectivity < 0.4 && subjectivity > 0.2){
			guageLabelTwo = "Objective"
		} else if (subjectivity < 0.6 && subjectivity > 0.4){
			guageLabelTwo = "Balanced"
		} else if (subjectivity < 0.8 && subjectivity > 0.6){
			guageLabelTwo = "Subjective"
		} else if (subjectivity > 0.8){
			guageLabelTwo = "Stongly Subjective"
		}
		$("#staticCont #guageSection #guageLabelOne").text(guageLabelOne);
		$("#staticCont #guageSection #guageLabelTwo").text(guageLabelTwo);
	})
	.fail(function(err){
		console.log('Failure');
	});
})

$(document).on('click', "#staticCont #cardUploadSection #runSentiment", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	$.ajax({
		url : "/class/runsentimentanalysis",    
		processData: true,
		type : "GET",
		contentType : "application/json"
	}).done( function(result){
		console.log("success");
	})
	.fail(function(err){
		console.log('Failure');
	});
})


const updateGuages = (polarity, subjectivity) => {
	let optsOne = {
		// color configs
		colorStart: "#6fadcf",
		colorStop: void 0,
		gradientType: 0,
		strokeColor: "#e0e0e0",
		generateGradient: true,
		percentColors: [[0.0, "#ff0000" ], [0.25, "#ffc100"], [0.50, "#ffff00"], [0.75, "#d6ff00"], [1.0, "#63ff00"]],

		// customize pointer
		pointer: {
		  length: 0.8,
		  strokeWidth: 0.035,
		  iconScale: 1.0,		
		  color: '#FFFFFF'
		},

		// static labels
		staticLabels: {
		  font: "15px sans-serif",
		  labels: [-1, -0.5, 0, 0.5, 1],
		  fractionDigits: 1,		
		  color: '#FFFFFF'
		},
		
		// render ticks
		renderTicks: {
		  divisions: 5,
		  divWidth: 1.1,
		  divLength: 0.7,
		  divColor: "#FFFFFF",
		  subDivisions: 3,
		  subLength: 0.5,
		  subWidth: 0.6,
		  subColor: "#FFFFFF"
		},

		// the span of the gauge arc
		angle: 0.025,

		// line thickness
		lineWidth: 0.44,

		// radius scale
		radiusScale: 1.0,

		// font size
		fontSize: 40,

		// if false, max value increases automatically if value > maxValue
		limitMax: false,

		// if true, the min value of the gauge will be fixed
		limitMin: false,

		// High resolution support
		highDpiSupport: true

	};
	let targetOne = document.getElementById('guage1'); 
	let gaugeOne = new Gauge(targetOne).setOptions(optsOne);
	gaugeOne.maxValue = 1;
	gaugeOne.setMinValue(-1); 
	gaugeOne.set(polarity);
	gaugeOne.animationSpeed = 32
	let optsTwo = {
		// color configs
		colorStart: "#6fadcf",
		colorStop: void 0,
		gradientType: 0,
		strokeColor: "#e0e0e0",
		generateGradient: true,
		percentColors: [[0.0, "#ff0000" ], [0.25, "#ffc100"], [0.50, "#ffff00"], [0.75, "#d6ff00"], [1.0, "#63ff00"]],

		// customize pointer
		pointer: {
		  length: 0.8,
		  strokeWidth: 0.035,
		  iconScale: 1.0,		
		  color: '#FFFFFF'
		},

		// static labels
		staticLabels: {
		  font: "15px sans-serif",
		  labels: [0, 0.25, 0.5, 0.75, 1],
		  fractionDigits: 1,		
		  color: '#FFFFFF'
		},
		
		// render ticks
		renderTicks: {
		  divisions: 5,
		  divWidth: 1.1,
		  divLength: 0.7,
		  divColor: "#FFFFFF",
		  subDivisions: 3,
		  subLength: 0.5,
		  subWidth: 0.6,
		  subColor: "#FFFFFF"
		},

		// the span of the gauge arc
		angle: 0.025,

		// line thickness
		lineWidth: 0.44,

		// radius scale
		radiusScale: 1.0,

		// font size
		fontSize: 40,

		// if false, max value increases automatically if value > maxValue
		limitMax: false,

		// if true, the min value of the gauge will be fixed
		limitMin: false,

		// High resolution support
		highDpiSupport: true

	};
	let targetTwo = document.getElementById('guage2'); 
	let gaugeTwo = new Gauge(targetTwo).setOptions(optsTwo);
	gaugeTwo.maxValue = 1;
	gaugeTwo.setMinValue(0); 
	gaugeTwo.set(subjectivity);
	gaugeTwo.animationSpeed = 32
};

// $(document).ready(function() {
// 	// e.stopImmediatePropagation();
// 	// e.preventDefault();
// 	// e.stopPropagation();
// 	$.ajax({
// 		url : "/class/gettopics",    
// 		processData: true,
// 		type : "GET",
// 		contentType : "application/json"
// 	}).done( function(result){
// 		//alert("Success");
// 		$("#displaySection").empty().append(result);
// 	})
// 	.fail(function(err){
// 		console.log('Failure');
// 		console.log(err);	
// 	});
// })
