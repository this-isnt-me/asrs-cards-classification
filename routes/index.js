const express			= require('express');
const router 			= express.Router();
const passport			= require("passport");
const dateFormat    	= require('dateformat');
const expressValidator 	= require('express-validator');
const validator 		= require('validator');
const Access 			= require('../models/access');
const Card 				= require('../models/card');
const functionFile 		= require('../public/functions/functions.js');
const middleware 		= require('../middleware/index.js');

router.get('', async (req, res) => {
	try{
		res.redirect('/class');
		//res.render('pages/index');
	} catch(err){
		console.log(err);
	}	
});

router.post('/coderequest', async (req, res) => {
	try{
		let email = req.body.email;// let email = functionFile.encrypt(req.body.email);
		email = email.toLowerCase();
		if (validator.isEmail(email) === true && email.includes("@taqa") === true ){
			let rand = Math.floor(Math.random() * (8 - 5 + 1) + 5);
			let date = new Date(new Date().getTime() + 30 * 60000);
			let code = functionFile.makeSignUpToken(rand);
			let data = {
				code: functionFile.encrypt(code),
				date: date,
				used: false
			};
			console.log(code)
			await Access.create(data);
			//functionFile.sendAccessEmail(email,code);
			res.render('partials/accesscode');
		} else {
			res.status(500).end();
		}		
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/codeconfirm', async (req, res) => {
	try{
		let accessCode = functionFile.encrypt(req.body.accesscode);
		let foundDoc = await Access.findOne({code : accessCode});
		if (foundDoc !== null){
			let now = new Date()
			if (now < foundDoc.date && foundDoc.used === false){
				let cardCount = await Card.count({});
				let rand = Math.floor(Math.random() * cardCount);
  				let randomDoc = await Card.findOne().skip(rand);
				let data = {
					action: functionFile.decrypt(randomDoc.contents[0]),
					conversation: functionFile.decrypt(randomDoc.contents[1]),
					corrective: functionFile.decrypt(randomDoc.contents[2]),
					id: randomDoc._id
				}
				await Access.findByIdAndUpdate(foundDoc._id, {used : true});
				res.render('partials/classifier',{card:data});
			} else {
				console.log(1)
				res.status(500).send({msg:'Not a valid code. Either it is incorrect or Expired'}).end();
			}			
		} else {
				console.log(2)
			res.status(500).send({msg:'Not a valid code. Either it is incorrect or Expired'}).end();
		}
	} catch(err){
		console.log(err);
				console.log(3)
		res.status(500).send({msg:'Not a valid code. Either it is incorrect or Expired'}).end();
	}	
});

router.get('/codereset', async (req, res) => {
	try{		
		res.render('partials/requestcode');
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

router.post('/classifycard', async (req, res) => {
	try{
		let qualityArray = [1,2,3,4,5];
		let toneArray = ["Negative","Neutral","Positive"];
		let classArray = ["Bypassing Safety Controls","Confined Space","Driving",
						  "Energy Isolation","Hot Work","Line of Fire",
						  "Safe Mechanical Lifting","Work Authorisation","Working at Height"];
		let cardId = req.body.cardId;
		let cardQuantity =  qualityArray[parseInt(req.body.cardQuality)];
		let cardTone =  toneArray[parseInt(req.body.cardTone)];
		let cardClass =  classArray[parseInt(req.body.cardClass)];
		let foundDoc = await Card.findById(cardId);
		foundDoc.classArray.push(cardClass);
		foundDoc.qualityArray.push(cardQuantity);
		foundDoc.sentimentArray.push(cardTone);
		foundDoc.class = freqCount(foundDoc.classArray);
		foundDoc.quality = parseInt(arrayAverage(foundDoc.qualityArray));
		foundDoc.sentiment = freqCount(foundDoc.sentimentArray);
		await Card.findByIdAndUpdate(cardId, foundDoc);
		let cardCount = await Card.count({});
		let rand = Math.floor(Math.random() * cardCount);
		let randomDoc = await Card.findOne().skip(rand);
		let data = {
			action: functionFile.decrypt(randomDoc.contents[0]),
			conversation: functionFile.decrypt(randomDoc.contents[1]),
			corrective: functionFile.decrypt(randomDoc.contents[2]),
			id: randomDoc._id
		}
		res.render('partials/classifier',{card:data});
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

module.exports = router;

//tim.clarke@taqanorth.com

const freqCount = (array) =>{
    if(array.length == 0)
        return null;
    let modeMap = {};
    let maxEl = array[0], maxCount = 1;
    for(let i = 0; i < array.length; i++){
        let el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

const arrayAverage = (array) => {
	let sum = 0;
	for( var i = 0; i < array.length; i++ ){
		sum += parseInt( array[i],10)
	}
	return Math.round(sum / array.length);
}

const testCards = async () =>{
	let arrayOne =['Witnessed a person walking in a barried off area.','Spoke to the person and discovered a barrier had been taken down and not been put back up.','Restored the barrier that had been taken down. Went and checked all the other barriers to ensure they were still in place. Held a Time out for safety to remind people involved in the operation they need to make sure all barriers are restored after crossing them.'];
	let arrayTwo =['Saw a man walking down the stairs without holding ontot the handrail.','Stopped the man and reminded him that stairs can be slippery offshore especially in wet weather. Man said he was in rush and didn\'t think about it.','Man agreed to hold handrail in the future.'];
	let arrayThree =['Saw man in the gym using exercise equipment without wiping it down after use.','Spoke to the man and reminded him it was essential to maintain a high standard of hygine in the gym, esepecially given the current Covid situation.','Man agreed to wipe down equipment properly after use.'];
	arrayOne = encryptArray(arrayOne);
	arrayTwo = encryptArray(arrayTwo);
	arrayThree = encryptArray(arrayThree);
	let alpha = await Card.create({contents:arrayOne})
	let beta = await Card.create({contents:arrayTwo})
	let charlie = await Card.create({contents:arrayThree})
	console.log(alpha._id, beta._id, charlie._id);
}
		 
		 
const encryptArray =(array) =>{
	for (let i = 0; i < array.length; i++){
		array[i] = functionFile.encrypt(array[i]);
	}
	return array;
}