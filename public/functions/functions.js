console.log('alpha.js file calling');
require('dotenv').config();
const validator 		= require('validator');
const request 			= require('request');
const crypto 			= require('crypto');
//const tokenizer 		= require('sbd');
const expressValidator 	= require('express-validator');

const makeSignUpToken = (length) =>{
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

const encrypt = (input) => {
    let cipher = crypto.createCipher('aes-256-cbc', process.env.ENCODING_KEY);
    let crypted = cipher.update(input, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

const decrypt = (input) => {
    if (input === null || typeof input === 'undefined') { return input }
    let decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCODING_KEY);
    let dec = decipher.update(input, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

const sendAccessEmail = async(email,code) => {
	let first = email.split('.', 1)[0];
	first = first.charAt(0).toUpperCase() + first.slice(1);
	const mailjet = require ('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)
	const request = mailjet.post("send", {'version': 'v3.1'}).request({
		"Messages":[
			{
				"From": {
					"Email": "tim.clarke@hitchadvisor.info",
					"Name": "Tim Clarke"
				},
				"To": [
					{
						"Email": email,
						"Name": " " + first
					}
				],
				"TemplateID": 2884249,
				"TemplateLanguage": true,
				"Subject": "Cards Access Code",
				"Variables": {
				  "firstName": first,
				  "tfa": code
				}
			}
		]
	})
}


module.exports = {
	encrypt: encrypt,
	decrypt: decrypt,
	makeSignUpToken: makeSignUpToken,
	sendAccessEmail: sendAccessEmail,
}