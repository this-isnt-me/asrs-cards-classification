console.log('ocr.js file calling');
require('dotenv').config();
'use strict';

const async = require('async');
const fs = require('fs');
const https = require('https');
const path = require("path");
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const key = process.env.MS_OCR_KEY;
const endpoint = process.env.MS_OCR_ENDPOINT;

const computerVisionClient = new ComputerVisionClient(
new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);
async function computerVision() {
  let rtnString = "";
  const STATUS_SUCCEEDED = "succeeded";
  const STATUS_FAILED = "failed"
  const handwrittenTextURL = 'https://res.cloudinary.com/corazonoil/image/upload/v1639959158/IMG_20211218_230512_ro3kdh.jpg'
  const operationLocationUrl = await computerVisionClient.read(handwrittenTextURL)
	.then((response) => {
	  return response.operationLocation;
	});
  const operationIdUrl = operationLocationUrl.substring(operationLocationUrl.lastIndexOf('/') + 1);
  while (true) {
	const readOpResult = await computerVisionClient.getReadResult(operationIdUrl)
	  .then((result) => {
		return result;
	  })
	if (readOpResult.status === STATUS_FAILED) {
	  break;
	}
	if (readOpResult.status === STATUS_SUCCEEDED) {
	  for (const textRecResult of readOpResult.analyzeResult.readResults) {
		for(let i = 0; i < textRecResult.lines.length; i++) {
			if (i === 0){
				rtnString = textRecResult.lines[i].text
			} else {
				rtnString = rtnString + " " + textRecResult.lines[i].text
			}
		}
		// console.log(rtnString)
		// for (const line of textRecResult.lines) {
		//   console.log(line.text)
		// }
	  }
	  break;
	}
	await sleep(500);
  }
	return rtnString;
}

module.exports = {
	computerVision: computerVision
}