$(document).on('click', "#staticCont #btnSection #selectReport", function(e){
	e.stopImmediatePropagation();
	e.preventDefault();
	e.stopPropagation();
	$.ajax({
		url : "/class/getsample",    
		processData: true,
		type : "GET",
		contentType : "application/json"
	}).done( function(result){
		$("#masterCont").empty().append(result);
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
			console.log('Success');
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
		createScatter("scatter1", 'LDA Document Clusters', result.lda);
		createScatter("scatter2", 'NMF Document Clusters', result.nmf);
		createScatter("scatter3", 'LSA Document Clusters', result.lsa);
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

const createScatter = (wordElement, title, dataArray) =>{
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
				  yAxes: [{
					gridLines:{
					  color: "#fff",
					  lineWidth:2,
					},
					ticks: {
						min: -20,
						max: 20,
						stepSize: 2
					}
				  }],
				  xAxes: [{
					gridLines:{
					  color: "#fff",
					  lineWidth:2
					},
					ticks: {
						min: -20,
						max: 20,
						stepSize: 2
					}
				  }]
			},
			responsive:true
		}
	});
}
