const express			= require('express');
const router 			= express.Router();
const passport			= require("passport");
const dateFormat    	= require('dateformat');
const expressValidator 	= require('express-validator');
const axios 			= require("axios").default;
const validator 		= require('validator');
const natural 			= require('natural');
const TfIdf 			= natural.TfIdf;
const Report 			= require('../models/report');
const functionFile 		= require('../public/functions/functions.js');
const middleware 		= require('../middleware/index.js');
// const client 			= new MongoClient(url)
// const connectionString 	= process.env.MONGO_DATABASE_CONNECT;

// let viridisPalette = ['#440154','#481567','#482677','#453781','#404788','#39568c','#33638d','#2d708e','#287d8e','#238a8d',
// 					  '#1f968b','#20a387','#29af7f','#3cbb75','#55c667','#73d055','#95d840','#b8de29','#dce319','#fde725']



router.get('', async (req, res) => {
	try{		
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

router.get('/getsample', async (req, res) => {
	console.log('getsample')
	try{
		let count = await Report.countDocuments({"sample": true})
		let random = Math.floor(Math.random() * count);
		let rtnDoc = await Report.findOne({"sample": true}).skip(random);
		let primaryReason = rtnDoc['Primary Problem'][0];
		let acn = rtnDoc['ACN'];
		let reporter = rtnDoc['Detector'][0];
		let returnDocu = {
			acn : rtnDoc['ACN'],
			nar : rtnDoc['Narrative'],
			reporter: joinArray(rtnDoc['Detector']),
			when : joinArray(rtnDoc['When Detected']),
			aircraft : rtnDoc['Make Model Name'],
			tod: rtnDoc['Local Time Of Day'] + " - " + rtnDoc['Light'],
			mission : rtnDoc['Mission'],
		}
		//res.status(200).send(returnDocu).end();
		res.render('partials/asrs_report',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/getacntopics', async (req, res) => {
	console.log('getacntopics')
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
	console.log('getclassification')
	try{
		let acnCode = req.body.acnCode;
		let newPost = {
			"acn_code" : acnCode
		}
		//let rtnData = await axios.post('https://flask-api-psiof.run-eu-central1.goorm.io/classification', newPost);
		let rtnData = await axios.post('https://tclarke-msc-asrs.herokuapp.com/classification', newPost);
		let returnDocu = rtnData.data;
		res.render('partials/asrs_report_classification.ejs',{returnDocu:returnDocu});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/informationretreival', async (req, res) => {
	console.log('informationretreival')
	try{
		let acnCode = req.body.acnCode;
		let rtnDoc = await Report.findOne({ 'ACN': acnCode});
		let acnArray = rtnDoc['top_15'][0].slice(0, 5);
		let scoreArray = rtnDoc['top_15'][1].slice(0, 5);
		let records = await Report.find({ 'ACN': { $in: acnArray } });
		let narrativeArray = ["","","","",""]
		for(let i = 0; i < records.length; i++ ){			
			narrativeArray[acnArray.indexOf(records[i]['ACN'])] = records[i]['Narrative'];
		}
		for(let i=0; i < scoreArray.length; i++){
			let number = scoreArray[i] * 100;
			scoreArray[i] = number.toFixed(3) + "%";
		}			  
		let returnDocu = {
			acnArray : acnArray,
			scoreArray : scoreArray,
			narrativeArray: narrativeArray			
		}
		res.render('partials/asrs_report_ir',{returnDocu:returnDocu});
		//res.status(200).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/wordclouds', async (req, res) => {
	console.log('wordclouds')
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
	console.log('scattercharts')
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
		for(let i = 0; i < problemArrayUnique.length; i++){
			dataArrayLda.push([]);
			dataArrayNmf.push([]);
			dataArrayLsa.push([]);
		}
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
			dataArrayLda[newIndex].push(ldaObj);
			dataArrayNmf[newIndex].push(nmfObj);
			dataArrayLsa[newIndex].push(lsaObj);
		}
		let dataArrayLdaRtn = []
		let dataArrayNmfRtn = []
		let dataArrayLsaRtn = []
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
			dataArrayLdaRtn.push(ldaObj)
			dataArrayNmfRtn.push(nmfObj)
			dataArrayLsaRtn.push(lsaObj)
		}		
		let rtnDocu = {
			lda : dataArrayLdaRtn,
			nmf : dataArrayNmfRtn,
			lsa: dataArrayLsaRtn
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
		axios.post('https://tclarke-msc-asrs.herokuapp.com/topicmodel/' + req.body.method, newPost);
		
		res.status(200).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.get('/gettopics', async (req, res) => {
	console.log('gettopics')
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


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
