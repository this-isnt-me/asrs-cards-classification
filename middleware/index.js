const functionFile 		= require('../public/functions/functions.js');
let middlewareObj ={};

middlewareObj.isActive = (req, res, next) => {
	if (req.isAuthenticated() && req.user.accountlive === true){
		return next()
	} else if (req.isAuthenticated() && req.user.accountlive != true){
		req.logout();
		res.redirect('/');
	} else {
		res.redirect('/');
	}	
}

middlewareObj.signinToLowerCase = function (req, res, next){
    req.body.username  = functionFile.encrypt(req.body.loginUsername.toLowerCase());
	req.body.password = req.body.loginPassword;
    next();
    };

module.exports = middlewareObj;