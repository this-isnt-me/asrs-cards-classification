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
		res.render('pages/upload');
	} catch(err){
		console.log(err);
	}	
});

router.post('/coderequest', async (req, res) => {
	try{
		let email = req.body.email;
		email = email.toLowerCase();
		if (validator.isEmail(email) === true && email.includes("allan.smillie@taqa") === true ){
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
				await Access.findByIdAndUpdate(foundDoc._id, {used : true});
				res.render('partials/uploader');
			} else {
				res.status(500).end();
			}			
		} else {
			res.status(500).end();
		}
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
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

router.post('/cardupload', async (req, res) => {
	try{
		let cardData = req.body.cardData;
		for (let i = 0; i < cardData.length; i++){
			console.log(cardData[i]);
			let values = Object.values(cardData[i]);
			for (let j = 0; j < values.length; j++){
				console.log(values[j]);
			}
		}
		res.status(200).end();
	} catch(err){
		console.log(err);
		res.status(500).send(err).end();
	}	
});

module.exports = router;

///allan.smillie@taqanorth.com