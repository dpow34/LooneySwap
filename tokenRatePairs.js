var srcToken = document.getElementById("srcToken"); 
var destToken = document.getElementById("destToken"); 
var srcAmount = document.getElementById("srcAmount");
var destinAmount = document.getElementById("destAmount");
var tokenDict = {};


window.onload = init();

function init() {
	srcAmount.value= "";
	destinAmount.value = "";
}

var request = new XMLHttpRequest();
request.open('GET', 'https://apiv4.paraswap.io/v2/tokens/3');

request.onreadystatechange = function () {
  if (this.readyState === XMLHttpRequest.DONE) {
    jsonToken = JSON.parse(this.responseText);
    createDict(jsonToken);
    populateDropDowns();
 
  }
};

request.send();


function createDict(jsonToken) {
	var tokens = jsonToken['tokens'];
    for (var i = 0; i < tokens.length; i++){
    	var symbol = jsonToken.tokens[i].symbol;
    	var address = jsonToken.tokens[i].address;
    	tokenDict[symbol] = address;
    }
}

function populateDropDowns() {
   	for (var key in tokenDict) {
   		srcDropDown(key);
   		destDropDown(key);
   	}
}

function srcDropDown(key){
	var opt = key;
	var el = document.createElement("option");
	el.textContent = opt;
	el.value = opt;
	srcToken.appendChild(el);
}

function destDropDown(key){
	var opt = key;
	var el = document.createElement("option");
	el.textContent = opt;
	el.value = opt;
	destToken.appendChild(el);
}

function tokenCheck(){
	var srcTokenSymbol = srcToken.value;
	var destTokenSymbol = destToken.value;
	var srcTokenValue = srcAmount.value;
	var defaultValue = "Choose a Token";
	if (srcTokenSymbol == defaultValue || destTokenSymbol == defaultValue || srcTokenValue.length == 0 || srcTokenSymbol == destTokenSymbol){
		return;
	}
	setUpURL(srcTokenSymbol, destTokenSymbol, srcTokenValue);

}


function setUpURL(srcTokenSymbol, destTokenSymbol, srcTokenValue) {
	var convertedNumber = convertForTransaction(srcTokenValue);
	var srcTokenAddress = tokenDict[srcTokenSymbol];
	var destTokenAddress = tokenDict[destTokenSymbol];
	var url = `https://apiv4.paraswap.io/v2/prices?network=3&from=${srcTokenAddress}&to=${destTokenAddress}&amount=${convertedNumber}&side=SELL`;
	callAPI(url);
}

function callAPI(url) {
	console.log(url);
	var request = new XMLHttpRequest();

	request.open('GET', url);

	request.onreadystatechange = function () {
	  if (this.readyState === 4) {
	    var jsonResponse = JSON.parse(this.responseText);
	    var destAmount = jsonResponse['priceRoute']['bestRoute'][0].destAmount;
	    displayDestAmount(destAmount);
	  }
};
	request.send();
}

function displayDestAmount(destAmount) {
	destinAmount.value = destAmount / (10**18);

}

function countDecimals(srcTokenValue) {
    if ((srcTokenValue % 1) != 0) {
        return srcTokenValue.toString().split(".")[1].length;  
    }
    return 0;
}

function convertForTransaction(srcTokenValue) {
	var decimals = 0;
	var numberForTransaction;
	if (srcTokenValue[0] == "."){
		decimals = countDecimals(srcTokenValue);
		var multiplier = srcTokenValue*10;
		numberForTransaction = (10**(18-decimals))*multiplier;
		return numberForTransaction;
	}
	numberForTransaction = (10**18)*srcTokenValue;
	return numberForTransaction;
	// var multiplier = srcTokenValue*10;
	// console.log(multiplier);
	// var numberForTransaction = (10**(18-decimals));
	// console.log(numberForTransaction);
}

srcAmount.onkeydown = function(e) {
	if(!((e.keyCode > 95 && e.keyCode < 106)
		|| (e.keyCode > 47 && e.keyCode < 58)
		|| (e.keyCode == 8) || (e.keyCode == 190) 
		|| (e.keyCode == 110))) {
        return false;
    }
    if ((e.keyCode == 190) || (e.keyCode == 110) && srcAmount.value.length != 0) {
    	if (srcAmount.value.match(/[.]/g) != null && srcAmount.value.match(/[.]/g).length > 0){
    		return false;
    	} 

    }
}