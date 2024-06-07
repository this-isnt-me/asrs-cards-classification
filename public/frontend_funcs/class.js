$(document).on('click', "#staticCont #btnSection #selectReport", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	$.ajax({
		url : "/class/getrandomsample",    
		processData: true,
		type : "GET",
		contentType : "application/json"
	}).done( function(result){
		$("#masterCont").empty().append(result);
		$("#masterCont #reportSection #guageSection #guageOne").empty().append('<canvas id="guage1"></canvas>');
		$("#masterCont #reportSection #guageSection #guageTwo").empty().append('<canvas id="guage2"></canvas>');
		let polarity = $("#masterCont #reportSection #guageSection #polarity").val()
		let subjectivity = $("#masterCont #reportSection #guageSection #subjectivity").val()
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
		$("#masterCont #reportSection #guageSection #guageLabelOne").text(guageLabelOne);
		$("#masterCont #reportSection #guageSection #guageLabelTwo").text(guageLabelTwo);
		let formData = {
			"acnCode": $("#masterCont #reportSection #acnNumber").text()
		};
		$.ajax({
			url : "/class/getacntopics",    
			processData: true,
			data : JSON.stringify(formData),
			type : "POST",
			contentType : "application/json"
		}).done( function(result){
			$("#masterCont #reportSection #topicsSection").empty().append(result);
		})
		.fail(function(err){
			console.log('Failure');
		});
	})
	.fail(function(err){
		console.log("Not Worked")
	});	
});

$(document).on('click', "#masterCont #reportSection #classifyReport", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	console.log('Click Click Click');
	let formData = {
		"acnCode": $("#masterCont #reportSection #acnNumber").text()
	};
	$.ajax({
		url : "/class/getclassification",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		console.log('Success getclassification');
		$("#masterCont #reportSection #inforetreivalSection").empty().append(result);
		$.ajax({
			url : "/class/informationretreival",    
			processData: true,
			data : JSON.stringify(formData),
			type : "POST",
			contentType : "application/json"
		}).done( function(result){
			console.log('Success informationretreival');
			$("#masterCont #reportSection #inforetreivalSection").append(result);
			getCloudData(formData)
		})
		.fail(function(err){
			console.log('Failure');
		});
	})
	.fail(function(err){
		console.log('Failure');
	});
})

const getCloudData = (formData) =>{
	console.log('get cloud data');
	$.ajax({
		url : "/class/wordclouds",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#veryHiddenDiv").removeClass( "veryHidden" );
		createCloud("chartdiv", 'Count ratio for Words', result.cv);
		createCloud("chartdiv2", 'TFIDF ratio for Words', result.tfidf);
		getScatterData(formData);
	})
	.fail(function(err){
		console.log('Failure');
	});
}

const getScatterData = (formData) =>{
	console.log('get scatter data');
	$.ajax({
		url : "/class/scattercharts",    
		processData: true,
		data : JSON.stringify(formData),
		type : "POST",
		contentType : "application/json"
	}).done( function(result){
		$("#veryHiddenDiv2").removeClass( "veryHidden" );
		createScatter("scatter1", 'Sentiment-Objectivity Clusters', result.sentObj, 'Sentiment (Negative to Positive)', 'Objectivity (Objective to Subjective)');
		createScatter("scatter2", 'NMF Document Clusters', result.nmf, '', '');
		createScatter("scatter3", 'LSA Document Clusters', result.lsa, '', '');
		createScatter("scatter4", 'LDA Document Clusters', result.lda, '', '');
	})
	.fail(function(err){
		console.log('Failure');
	});
}


const createCloud = (wordElement, title, dataArray) =>{
	am4core.useTheme(am4themes_animated);
	var chart = am4core.create(wordElement, am4plugins_wordCloud.WordCloud);
	chart.fontFamily = "Courier New";
	chart.tooltip.disabled = true;
	var series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());
	
	series.data = dataArray
	series.randomness = 0.1;
	series.labelsContainer.rotation = 0;
	series.dataFields.word = "tag";
	series.dataFields.value = "count";

	series.heatRules.push({
	 "target": series.labels.template,
	 "property": "fill",
	 "min": am4core.color("#0000CC"),
	 "max": am4core.color("#CC00CC"),
	 "dataField": "value"
	});
	series.showOnInit = false;

	var hoverState = series.labels.template.states.create("hover");
	hoverState.properties.fill = am4core.color("#FF0000");

	let text = title;
	var title = chart.titles.create();
	title.text = text;
	title.fontFamily = "Courier New";
	title.fontSize = 20;
	title.fontWeight = "800";
	title.fill = am4core.color("#ffffff");
}

const createScatter = (wordElement, title, dataArray, xLabel, yLabel) =>{
	let xmax = 20;
	let xmin = -20;
	let ymax = 20;
	let ymin = -20;
	if (wordElement === "scatter1"){
		xmax = 1;
		xmin = -1;
		ymax = 1;
		ymin = 0;
	}
	let ctx = document.getElementById(wordElement).getContext('2d');
	let scatterChart = new Chart(ctx, {
		type: 'scatter',
		data: {
			datasets: dataArray
		},
		plugins: [{
				  id: 'custom_canvas_background_color',
				  beforeDraw: (chart) => {
					const ctx = chart.canvas.getContext('2d');
					ctx.save();
					ctx.globalCompositeOperation = 'destination-over';
					ctx.fillStyle = 'white';
					ctx.fillRect(0, 0, chart.width, chart.height);
					ctx.restore();
				  }
				}],
		options: {
			plugins: {
				title: {
					display: true,
					text: title,
					font: {
						weight: 'bold',
						size: 20
					},
					color: "#000"
				}
			},
			scales: {
				  x: {
					title:{
					  color: "#000",
					  display: true,
					  text: xLabel
					},
					min: xmin,
				    max: xmax
				  },
				  y: {
					title:{
					  color: "#000",
					  display: true,
					  text: yLabel
					},
					min: ymin,
				    max: ymax
				  },
				  yAxes: [{
					gridLines:{
					  color: "#fff",
					  lineWidth:2,
					},
					ticks: {
						stepSize: 2
					}
				  }],
				  xAxes: [{
					gridLines:{
					  color: "#fff",
					  lineWidth:2
					},
					ticks: {
						stepSize: 2
					}
				  }]
			},
			responsive:true
		}
	});
}


const updateGuages = (polarity, subjectivity) => {
	console.log(polarity, subjectivity)
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

$(document).on('click', "#mainCont .toggle_btn", function(e){
    e.stopImmediatePropagation();
    e.preventDefault();
    e.stopPropagation();
    let id = $(this).attr('id').replace('toggle_btn','');
	$("#hidden_sec" + id).slideToggle(800);
	$("#toggle_icon" + id).toggleClass("down");
});