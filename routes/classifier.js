require('dotenv').config();
const express			= require('express');
const router 			= express.Router();
const passport			= require("passport");
const dateFormat    	= require('dateformat');
const expressValidator 	= require('express-validator');
const axios 			= require("axios").default;
const validator 		= require('validator');
const natural 			= require('natural');
const TfIdf 			= natural.TfIdf;
const {Translate} 		= require('@google-cloud/translate').v2;
const Report 			= require('../models/report');
const functionFile 		= require('../public/functions/functions.js');
const ocrFile 			= require('../public/functions/ocrFunctions.js');
const middleware 		= require('../middleware/index.js');
const projectId 		= process.env.GOOGLE_PROJECT_ID
const credentials 		= JSON.parse(process.env.GOOGLE_TRANSLATE_CREDENTIALS)
const translate 		= new Translate({
										 credentials: credentials,
										 projectId : credentials.project_id});
// const client 			= new MongoClient(url)
// const connectionString 	= process.env.MONGO_DATABASE_CONNECT;

// let viridisPalette = ['#440154','#481567','#482677','#453781','#404788','#39568c','#33638d','#2d708e','#287d8e','#238a8d',
// 					  '#1f968b','#20a387','#29af7f','#3cbb75','#55c667','#73d055','#95d840','#b8de29','#dce319','#fde725']


router.get('', async (req, res) => {
	try{
		let readFile = await ocrFile.computerVision();
		console.log(readFile);
		res.render('pages/class');
	} catch(err){
		console.log(err);
	}	
});

router.get('/topicmodelling', async (req, res) => {
	try{		
		res.render('pages/topic');
	} catch(err){
		console.log(err);
	}	
});

router.get('/getrandomsample', async (req, res) => {
	try{
		let count = await Report.countDocuments({"sample": true})
		let random = Math.floor(Math.random() * count);
		let rtnDoc = await Report.findOne({"sample": true}).skip(random);
		let primaryReason = rtnDoc['Primary Problem'][0];
		let acn = rtnDoc['ACN'];
		let reporter = rtnDoc['Detector'][0];
		let narrative = rtnDoc['Narrative'];
		let nerArray = rtnDoc['ner'];
		for(let i = 0; i < nerArray.length; i++ ){			
			narrative = narrative.replace(new RegExp(nerArray[i], 'g'), '<span class="nerTxt">' + nerArray[i] + '</span>')
		}		
		let returnDocu = {
			acn : rtnDoc['ACN'],
			nar : narrative,
			reporter: joinArray(rtnDoc['Detector']),
			when : joinArray(rtnDoc['When Detected']),
			aircraft : rtnDoc['Make Model Name'],
			tod: rtnDoc['Local Time Of Day'] + " - " + rtnDoc['Light'],
			mission : rtnDoc['Mission'],
			sentiment : parseFloat(rtnDoc.sentiment),
			objective : parseFloat(rtnDoc.objective),
			ner : nerArray
		}
		res.render('partials/asrs_report',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/getacntopics', async (req, res) => {
	try{
		let rtnDoc = await Report.findOne({"ACN": req.body.acnCode})
		let codeBook = await Report.findOne({ "class": "code_book" })
		let reporter = rtnDoc['Detector'][0];
		let ldaKw = codeBook['lda_keywords'][parseInt(rtnDoc['lda_topic']) - 1];
		let lsaKw = codeBook['lsa_keywords'][parseInt(rtnDoc['lsa_topic']) - 1];
		let nmfKw = codeBook['nmf_keywords'][parseInt(rtnDoc['nmf_topic']) - 1];
		let returnDocu = {
			lsa: rtnDoc['lsa_topic'],
			lda: rtnDoc['lda_topic'],
			nmf: rtnDoc['nmf_topic'],
			lsaKw: joinArray(lsaKw.slice(0, 10)),
			ldaKw: joinArray(ldaKw.slice(0, 10)),
			nmfKw: joinArray(nmfKw.slice(0, 10))
		}
		//res.status(200).end();
		//res.status(200).send(returnDocu).end();
		res.render('partials/asrs_report_topics',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/getclassification', async (req, res) => {
	try{
		let acnCode = req.body.acnCode;
		let newPost = {
			"acn_code" : acnCode
		}
		let rtnData = await axios.post('https://flask-api-psiof.run-eu-central1.goorm.io/classification', newPost);
		// let rtnData = await axios.post('https://tclarke-msc-asrs.herokuapp.com/classification', newPost);
		let returnDocu = rtnData.data;
		res.render('partials/asrs_report_classification.ejs',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/informationretreival', async (req, res) => {
	try{
		let acnCode = req.body.acnCode;
		let rtnDoc = await Report.findOne({ 'ACN': acnCode});
		let acnArray = rtnDoc['top_15'][0].slice(0, 10);
		let scoreArray = rtnDoc['top_15'][1].slice(0, 10);
		let records = await Report.find({ 'ACN': { $in: acnArray } });
		let narrativeArray = ["","","","","","","","","",""]
		let classArray = []
		for(let i = 0; i < records.length; i++ ){			
			narrativeArray[acnArray.indexOf(records[i]['ACN'])] = records[i]['Narrative'];
			classArray.push(records[i]['Primary Problem'][0])
		}
		let rtnData = await axios.post('https://flask-api-psiof.run-eu-central1.goorm.io/summarisation', {"narratives": narrativeArray});
		let summaryString = ""
		for(let i = 0; i < rtnData.data.summary.length; i++ ){
			let spacer = " "
			if(i === 0){
				spacer = ""
			}
			let trimmedStr = rtnData.data.summary[i].trim();
			summaryString = summaryString + spacer + trimmedStr
		}
		for(let i=0; i < scoreArray.length; i++){
			let number = scoreArray[i] * 100;
			scoreArray[i] = number.toFixed(3) + "%";
		}			  
		let returnDocu = {
			acnArray : acnArray,
			scoreArray : scoreArray,
			narrativeArray : narrativeArray,
			classArray : classArray,
			summaryString : summaryString
		}
		res.render('partials/asrs_report_ir',{returnDocu:returnDocu});
		//res.status(200).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/wordclouds', async (req, res) => {
	try{
		let acnCode = req.body.acnCode;
		let rtnDoc = await Report.findOne({ 'ACN': acnCode});
		let acnArray = rtnDoc['top_15'][0].slice(0, 5);
		let records = await Report.find({ 'ACN': { $in: acnArray } });
		let narrativeArray = []
		let tokensArray = []
		for(let i = 0; i < records.length; i++ ){
			narrativeArray.push(records[i]['Narrative']);
			tokensArray = tokensArray.concat(records[i]['spacy_tokens']);
		}
		let tokensArrayUnique = Array.from(new Set(tokensArray));
		let tokensCount = [];
		for(i = 0; i < tokensArrayUnique.length ; i++){
			tokensCount.push(countUnique(tokensArray, tokensArrayUnique[i]))
		}
		let countVecArray = [];
		for(i = 0; i < tokensArrayUnique.length ; i++){
			let countVecObj = {
								"tag": tokensArrayUnique[i],
								"count": tokensCount[i]
							  };
			countVecArray.push(countVecObj);
		}
		
		let tfidf = new TfIdf();
		for(let i =0; i < narrativeArray.length; i++){
			tfidf.addDocument(narrativeArray[i]);
		}
		let tfidfArray = []
		tfidf.listTerms(0).forEach(function(item) {
			let tfidfObj = {
							"tag": item.term,
							"count": item.tfidf
							};
			tfidfArray.push(tfidfObj);	
		});
		countVecArray = countVecArray.sort((a, b) => (a.count > b.count) ? -1 : 1)
		tfidfArray = tfidfArray.sort((a, b) => (a.count > b.count) ? -1 : 1)
		rtnDoc = {
			cv : countVecArray.slice(0, 101),
			tfidf : tfidfArray.slice(0, 101)
		}
		res.status(200).send(rtnDoc).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/scattercharts', async (req, res) => {
	try{
		let viridisPalette = ['rgba(68, 1, 84, 0.75)','rgba(72, 21, 103, 0.75)',
					  'rgba(72, 38, 119, 0.75)','rgba(69, 55, 129, 0.75)',
					  'rgba(64, 71, 136, 0.75)','rgba(57, 86, 140, 0.75)',
					  'rgba(51, 99, 141, 0.75)','rgba(45, 112, 142, 0.75)',
					  'rgba(40, 125, 142, 0.75)','rgba(35, 138, 141, 0.75)',
					  'rgba(31, 150, 139, 0.75)','rgba(32, 163, 135, 0.75)',
					  'rgba(41, 175, 127, 0.75)','rgba(60, 187, 117, 0.75)',
					  'rgba(85, 198, 103, 0.75)','rgba(115, 208, 85, 0.75)',
					  'rgba(149, 216, 64, 0.75)','rgba(184, 222, 41, 0.75)',
					  'rgba(220, 227, 25, 0.75)','rgba(253, 231, 37, 0.75)']
		let acnCode = req.body.acnCode;
		let rtnDoc = await Report.findOne({ 'ACN': acnCode});
		let acnArray = rtnDoc['top_15'][0];
		let records = await Report.find({ 'ACN': { $in: acnArray } });
		let problemArray = [rtnDoc['Primary Problem'][0]];
		for(let i = 0; i < records.length; i++){
			problemArray.push(records[i]["Primary Problem"][0]);
		}		
		let problemArrayUnique = Array.from(new Set(problemArray));
		let dataArrayLda = []
		let dataArrayNmf = []
		let dataArrayLsa = []
		let dataArraySentObj = []
		for(let i = 0; i < problemArrayUnique.length; i++){
			dataArrayLda.push([]);
			dataArrayNmf.push([]);
			dataArrayLsa.push([]);
			dataArraySentObj.push([]);
		}
		let xArraySent = [rtnDoc['sentiment']];
		let yArrayObj = [rtnDoc['objective']];
		let xArrayLda = [rtnDoc['lda_xy'][0]];
		let yArrayLda = [rtnDoc['lda_xy'][1]];
		let xArrayNmf = [rtnDoc['nmf_xy'][0]];
		let yArrayNmf = [rtnDoc['nmf_xy'][1]];
		let xArrayLsa = [rtnDoc['lsa_xy'][0]];
		let yArrayLsa = [rtnDoc['lsa_xy'][1]];
		for(let i = 0; i < records.length; i++){
			xArrayLda.push(records[i]['lda_xy'][0]);
			yArrayLda.push(records[i]['lda_xy'][1]);
			xArrayNmf.push(records[i]['nmf_xy'][0]);
			yArrayNmf.push(records[i]['nmf_xy'][1]);
			xArrayLsa.push(records[i]['lsa_xy'][0]);
			yArrayLsa.push(records[i]['lsa_xy'][1]);
			xArraySent.push(records[i]['sentiment']);
			yArrayObj.push(records[i]['objective']);
		}
		for(let i = 0; i < problemArray.length; i++){
			let newIndex = problemArrayUnique.indexOf(problemArray[i]);
			let ldaObj = {
							'x' : xArrayLda[i],
							'y' : yArrayLda[i]
						}
			let nmfObj = {
							'x' : xArrayNmf[i],
							'y' : yArrayNmf[i]
						}
			let lsaObj = {
							'x' : xArrayLsa[i],
							'y' : yArrayLsa[i]
						}
			let sentObj = {
							'x' : xArraySent[i],
							'y' : yArrayObj[i]
						}
			dataArrayLda[newIndex].push(ldaObj);
			dataArrayNmf[newIndex].push(nmfObj);
			dataArrayLsa[newIndex].push(lsaObj);
			dataArraySentObj[newIndex].push(sentObj);
		}
		let dataArrayLdaRtn = []
		let dataArrayNmfRtn = []
		let dataArrayLsaRtn = []
		let dataArraySentObjRtn = []
		for(let i = 0; i < problemArrayUnique.length; i++){
			let randomNum = getRandomInt(0, viridisPalette.length - 1);
			let colour = viridisPalette[randomNum]
			viridisPalette.splice(randomNum, 1)
			let ldaObj = {
						label: problemArrayUnique[i],
						data: dataArrayLda[i],
    					backgroundColor: colour,
						borderColor: '#000000',
						borderWidth: 1,
						pointRadius: 9
					}
			let nmfObj = {
						label: problemArrayUnique[i],
						data: dataArrayNmf[i],
    					backgroundColor: colour,
						borderColor: '#000000',
						borderWidth: 1,
						pointRadius: 9
					}
			let lsaObj = {
						label: problemArrayUnique[i],
						data: dataArrayLsa[i],
    					backgroundColor: colour,
						borderColor: '#000000',
						borderWidth: 1,
						pointRadius: 9
					}
			let sentObjObj = {
						label: problemArrayUnique[i],
						data: dataArraySentObj[i],
    					backgroundColor: colour,
						borderColor: '#000000',
						borderWidth: 1,
						pointRadius: 9
					}
			dataArrayLdaRtn.push(ldaObj)
			dataArrayNmfRtn.push(nmfObj)
			dataArrayLsaRtn.push(lsaObj)
			dataArraySentObjRtn.push(sentObjObj)
		}		
		let rtnDocu = {
			lda : dataArrayLdaRtn,
			nmf : dataArrayNmfRtn,
			lsa: dataArrayLsaRtn,
			sentObj: dataArraySentObjRtn
		}		
		res.status(200).send(rtnDocu).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/updatetopics', async (req, res) => {
	try{
		let newPost = {
			"topics": parseInt(req.body.topics),
			"keywords": parseInt(req.body.keywords)
		}		
		//axios.post('https://flask-api-psiof.run-eu-central1.goorm.io/topicmodel/' + req.body.method, newPost);
		// axios.post('https://tclarke-msc-asrs.herokuapp.com/topicmodel/' + req.body.method, newPost);
		
		res.status(200).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.get('/gettopics', async (req, res) => {
	try{
		let rtnDoc = await Report.findOne({"class": "code_book"});
		let lda_keywords = rtnDoc['lda_keywords'];
		let nmf_keywords = rtnDoc['nmf_keywords'];
		let lsa_keywords = rtnDoc['lsa_keywords'];
		let lda_topics = []
		for(let i=0; i <lda_keywords.length; i++){
			lda_topics.push(i + 1);
			lda_keywords[i] = lda_keywords[i].join(', ')
		}
		let nmf_topics = []
		for(let i=0; i <nmf_keywords.length; i++){
			nmf_topics.push(i + 1);
			nmf_keywords[i] = nmf_keywords[i].join(', ')
		}
		let lsa_topics = []
		for(let i=0; i <lsa_keywords.length; i++){
			lsa_topics.push(i + 1);
			lsa_keywords[i] = lsa_keywords[i].join(', ')
		}
		let returnDocu = {
			lda_topics : lda_topics,
			lda_keywords : lda_keywords,
			nmf_topics: nmf_topics,
			nmf_keywords : nmf_keywords,
			lsa_topics : lsa_topics,
			lsa_keywords: lsa_keywords
		}
		//res.status(200).end();
		res.render('partials/topic_reports',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.get('/uploadcards', async (req, res) => {
	try{
		res.render('pages/uploadcards');
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/cardtranslate', async (req, res) => {
	try{
		let text = req.body.data;
		let [detections] = await translate.detect(text);
		detections = Array.isArray(detections) ? detections : [detections];
		let languageCode = detections[0].language;
		let confidence = (detections[0].confidence) * 100;		
		let [languages] = await translate.getLanguages();
		let rtnLanguage = '';
    	languages.forEach(function(language) {
			if (language.code == languageCode){
				rtnLanguage = language.name;
			}
		});
		let translation = await translate.translate(text, 'en');
		let returnDocu = {
			language: rtnLanguage,
			languageCode: languageCode,
			confidence: confidence,
			translation: translation[0]
		}
		let newPost = {
			text: returnDocu.translation
		}
		let rtnData = await axios.post('https://flask-api-psiof.run-eu-central1.goorm.io/sentiment', newPost);
		returnDocu.polarity = rtnData.data.polarity
		returnDocu.subjectivity = rtnData.data.subjectivity
		res.render('partials/translation',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.get('/runsentimentanalysis', async (req, res) => {
	try{		
		console.log("runsentimentanalysis");
		let rtnData = await axios.get('https://flask-api-psiof.run-eu-central1.goorm.io/categorise');
	} catch(err){
		console.log(err);
	}	
});


module.exports = router;


const joinArray = (array) =>{
	let returnString = array[0];
	if(array.length > 0){
		returnString = array.join(', ');
	}
	return returnString
}


const countUnique = (arr, val) => {
   	count = 0;
	for (let i = 0; i < arr.length; i++) {
   		if(arr[i] == val){
			count++
		}
	};
   	return count;
};


const langaugeDetect = (item) => {
   	count = 0;
	for (let i = 0; i < arr.length; i++) {
   		if(arr[i] == val){
			count++
		}
	};
   	return count;
};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


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
	gaugeTwo.set(polarity);
	gaugeTwo.animationSpeed = 32
};
