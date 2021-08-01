// simple html/css animation/dropdown & interactive window 
$(document).ready(function() {
    const menu = document.querySelector('#dropdown_option')
    const choices = document.querySelector('.navbar_categories')
    menu.addEventListener('click', function(){
        menu.classList.toggle('isActive');
        choices.classList.toggle('active');
    });
});

var slippageSlider = document.getElementById("slippageRange");
var output = document.getElementById("slippage");
output.innerHTML = slippageSlider.value + "%";
  
slippageSlider.oninput = function() {
  output.innerHTML = this.value + "%";
}

// Token Lists with Rates

var srcToken = document.getElementById("srcToken"); 
var destToken = document.getElementById("destToken"); 
var srcAmount = document.getElementById("srcAmount");
var destinAmount = document.getElementById("destAmount");
var tokenDict = {};

const ETHErrorTokens = ["WETH"];
const DAIErrorTokens = ["sUSD", "OMG", "ELF", "BAT", "MANA", "LINK", "ZRX"];
const sUSDErrorTokens = ["DAI", "KNC", "OMG", "ELF", "BAT", "MANA", "ZRX", "LINK"];
const WETHErrorTokens = ["ETH"]
const KNCErrorTokens = ["DAI", "sUSD", "KNC", "ELF", "BAT", "MANA", "ZRX", "LINK"];
const OMGErrorTokens = ["DAI", "sUSD", "KNC", "ELF", "BAT", "MANA", "ZRX", "LINK"];
const ELFErrorTokens = ["DAI", "sUSD", "KNC", "OMG", "BAT", "MANA", "ZRX", "LINK"];
const BATErrorTokens = ["sUSD", "KNC", "OMG", "ELF", "MANA", "ZRX", "LINK"];
const MANAErrorTokens = ["DAI", "sUSD", "KNC", "OMG", "ELF", "BAT", "ZRX", "LINK"];
const ZRXErrorTokens = ["sUSD", "KNC", "OMG", "ELF", "BAT", "MANA", "LINK"];
const LINKErrorTokens = ["DAI", "sUSD", "OMG", "ELF", "BAT", "MANA", "ZRX"];

window.onload = init();
// when refresh values are erased
function init() {
	srcAmount.value= "";
	destinAmount.value = "";
    document.getElementById("exchange_button").disabled = true;
}

// gets token list
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

// create dictionary for token list
function createDict(jsonToken) {
	var tokens = jsonToken['tokens'];
    var tokenDescriptors = []
    var symbol;
    for (var i = 0; i < tokens.length; i++){
        tokenDescriptors = [];
    	symbol = jsonToken.tokens[i].symbol;
    	tokenDescriptors.push(jsonToken.tokens[i].address);
        tokenDescriptors.push(jsonToken.tokens[i].decimals);
        tokenDescriptors.push(jsonToken.tokens[i].img);
    	tokenDict[symbol] = tokenDescriptors;
        if (symbol == "WBTC" || symbol == "sBTC" || symbol == "SNX" || symbol == "cBAT" || symbol == "cSAI") {
            delete tokenDict[symbol];
        }
    }
   
}


function populateDropDowns() {
   	for (var key in tokenDict) {
   		srcDropDown(key);
   		destDropDown(key);
   	}
}

// populates srcDropDown
function srcDropDown(key){
	var opt = key;
	var el = document.createElement("option");
	el.textContent = opt;
	el.value = opt;
	srcToken.appendChild(el);
}

// populates destDropDown
function destDropDown(key){
	var opt = key;
	var el = document.createElement("option");
	el.textContent = opt;
	el.value = opt;
	destToken.appendChild(el);
}

// changes destDropDown to default if user changed srcDropDown to equal destDropDown
// disables token pairs that are not compatible w/ disabling button
function srcDropDownCheck(){
    srcToken = document.getElementById("srcToken");
    destToken = document.getElementById("destToken");
    if (srcToken.value == destToken.value) {
        destToken.selectedIndex = 0;
        destinAmount.value = "";
    }
    if (srcToken.value != "Choose a Token"){
        var tokenErrorArray = eval(srcToken.value + 'ErrorTokens');
        disableDropDown("destToken", tokenErrorArray);
    }
    else {
        $("#destToken").find("option:disabled").prop("disabled",false);
        document.getElementById("exchange_button").disabled = true;
    }
    tokenCheck(); 
}

// changes srcDropDown to default if user changed destDropDown to eqaul srcDropDown
// disables token pairs that are not compatible w/ disabling button
function destDropDownCheck(){
    srcToken = document.getElementById("srcToken");
    destToken = document.getElementById("destToken");
    if (srcToken.value == destToken.value) {
        srcToken.selectedIndex = 0;
        destinAmount.value = "";
    }
    if (destToken.value != "Choose a Token"){
        var tokenErrorArray = eval(destToken.value + 'ErrorTokens');
        disableDropDown("srcToken", tokenErrorArray); 
    }
    else {
        document.getElementById("exchange_button").disabled = true;
        $("#srcToken").find("option:disabled").prop("disabled",false);
    }
    tokenCheck();
}

// disables token pairs that are not compatible
function disableDropDown(tokenSpot, tokenErrorArray) {
    for(i = 0; i < tokenErrorArray.length; i++){
        if (i == 0){
            $(`#${tokenSpot} option[value='${tokenErrorArray[i]}']`).attr("disabled", "disabled").siblings().removeAttr("disabled");
        }
        else {
            $(`#${tokenSpot} option[value='${tokenErrorArray[i]}']`).attr("disabled", "disabled");
        }
    }
}


// checks if all necessary inputs are filled out for swap calculation
function tokenCheck(amount = 0){
    var srcTokenValue = document.getElementById("srcAmount").value;
	var srcTokenSymbol = document.getElementById("srcToken").value;
	var destTokenSymbol = document.getElementById("destToken").value;
    if (amount != 0){
        srcTokenValue = amount;
    }
	var defaultValue = "Choose a Token";
	if (srcTokenSymbol == defaultValue || destTokenSymbol == defaultValue || srcTokenValue == undefined || srcTokenSymbol == destTokenSymbol){
		destinAmount.value = "";

		return;
	}
    if(checkZeros(srcTokenValue) == true)  {
        destinAmount.value = "";
        return;
    }
	setUpURL(srcTokenSymbol, destTokenSymbol, srcTokenValue);

}

// checks to see if src value is all 0's to update destValue - example "0.0000"
function checkZeros(value){
    for (var i = 0; i < value.length; i++){
        if (value[i] != "0" && value[i] != ".") {
            return false;
        }
    }
    return true;
}

var convertedNumber; // global to be used for sending transaction

// sets up URL for API call for token pair rates
function setUpURL(srcTokenSymbol, destTokenSymbol, srcTokenValue) {
	convertedNumber = convertForTransaction(srcTokenValue);
	var srcTokenAddress = tokenDict[srcTokenSymbol][0];
	var destTokenAddress = tokenDict[destTokenSymbol][0];
	var url = `https://apiv4.paraswap.io/v2/prices?network=3&from=${srcTokenAddress}&to=${destTokenAddress}&amount=${convertedNumber}&side=SELL`;
	callAPI(url);
}

// calls API for token rates
function callAPI(url) {
	var request = new XMLHttpRequest();

	request.open('GET', url);

	request.onreadystatechange = function () {
	  if (this.readyState === 4) {
	    var jsonResponse = JSON.parse(this.responseText);
        if (jsonResponse['error'] == undefined) {
            document.getElementById('errorText').innerHTML = '';
            var destAmount = jsonResponse['priceRoute']['bestRoute'][0].destAmount;
            document.getElementById("exchange_button").disabled = false;
	        displayDestAmount(destAmount);
        }
        // error handling
        else {
            document.getElementById("exchange_button").disabled = true;
            destinAmount.value = "";
            if (jsonResponse.error == "Invalid Amount"){
                document.getElementById('errorText').innerHTML = 'TOO MUCH TO SWAP';
            }
            if (jsonResponse.error == "ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT"){
                document.getElementById('errorText').innerHTML = 'ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT';
            }
            else {
                document.getElementById('errorText').innerHTML = 'ERROR';
            }
        }
	  }
};
	request.send();
}

// displays destination token value
function displayDestAmount(destAmount) {
	destinAmount.value = destAmount / (10**18);

}

// counts number of decimal places number has
function countDecimalPlaces(srcTokenValue) {
    if ((srcTokenValue % 1) != 0) {
        return srcTokenValue.toString().split(".")[1].length;  
    }
    return 0;
}

// converts number to lowest denomination
function convertForTransaction(srcTokenValue) {
	var decimals = 0;
	var numberForTransaction;
    var denomination = 18;
    if (srcToken.value == "WBTC" || srcToken.value == "cSAI" || srcToken.value == "cBAT") {
        denomination = 8;
    }
	if (srcTokenValue[0] == "."){
		decimals = countDecimalPlaces(srcTokenValue);
		var multiplier = srcTokenValue*10;
		numberForTransaction = (10**(denomination-decimals))*multiplier;
		return numberForTransaction;
	}
	numberForTransaction = (10**denomination)*srcTokenValue;
	return numberForTransaction;
}

// igonores "+" and "-" key values
srcAmount.onkeydown = function(e) {
    if(e.key == "-" || e.key == "+"){
        return false;
    }
}

// prevents value being pasted that has multiple decimal places or invalid characters
srcAmount.addEventListener('paste', (event) => {
    var pasteNum = event.clipboardData.getData('text/plain');
    var decimalCount = (pasteNum.match(/\./g)).length;
    if (decimalCount > 1) {
        event.stopPropagation();
        event.preventDefault();
    }
    var isNum = /^\d+$/.test(pasteNum);
    if (isNum == false){
        event.stopPropagation();
        event.preventDefault();
    }
})

// ignores invalid characters
function validate() {
    srcAmount = document.getElementById("srcAmount").value;
    var rgx = /^[0-9]*\.?[0-9]*$/;

    srcAmount = srcAmount.match(rgx);
    if (srcAmount == 0){
        document.getElementById("exchange_button").disabled = true;
    }
    tokenCheck(srcAmount);
    return srcAmount;
}


// Token transaction

const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

const tokenTransferProxy = "0xDb28dc14E5Eb60559844F6f900d23Dce35FcaE33";

const erc20ABI = [{
    "constant": false,
    "inputs": [
        {
            "name": "_spender",
            "type": "address"
        },
        {
            "name": "_value",
            "type": "uint256"
        }
    ],
    "name": "approve",
    "outputs": [
        {
            "name": "",
            "type": "bool"
        }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}]



const ETH = {
        symbol: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18,
        img: "https://img.paraswap.network/ETH.png",
        network: 3
    }

const DAI = {
        symbol: "DAI",
        address: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
        decimals: 18,
        img: "https://img.paraswap.network/DAI.png",
        network: 3
    }


$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        $("#exchange_button").click(()=>{
            event.preventDefault();
            getPriceRoute(accounts[0]);
        });
        // truncate user account number to display on webpage
        const accountStr = accounts[0];
        document.getElementById("account_number").innerHTML = accountStr.slice(accountStr.length) + accountStr.slice(0, 6) + '...' + accountStr.slice(accountStr.length - 4);
    });
});

function getPriceRoute(account) {
    const priceUrl = `https://apiv4.paraswap.io/v2/prices?network=3&from=${tokenDict[srcToken.value][0]}&to=${tokenDict[destToken.value][0]}&amount=${convertedNumber}&side=SELL`;
    console.log(priceUrl);
    $.ajax({
        url: priceUrl,
        type: "GET",
        headers: {
            'X-Partner':'LooneySwap'
        },
        success: function(result){
            exchange(account, result.priceRoute);
        },
        error: function(error){
            console.log('Error getting Price Route');
            console.log(error);
        }
    });
} 

function getSlippage() {
    return (100 - slippageSlider.value)/100;
}

async function exchange(account, priceRoute) {
    const exchangeUrl = `https://apiv4.paraswap.io/v2/transactions/3`;
    
    //calculate minimum amount of DAI to recieve after 10% slippage
    var slippage = getSlippage();
    console.log(slippage);
    const destAmount = (priceRoute.destAmount*slippage).toFixed(0);
    
    const config = {
        priceRoute,
        srcToken: tokenDict[srcToken.value][0],
        srcDecimals: tokenDict[srcToken.value][1],
        destToken: tokenDict[destToken.value][0],
        destDecimals: tokenDict[destToken.value][1],
        srcAmount: convertedNumber.toFixed(0),
        destAmount,
        userAddress: account,
        referrer: 'LooneySwap',
        receiver: '0x0000000000000000000000000000000000000000'
    }

    let approved = await approveToken(config.srcToken, tokenTransferProxy, account, config.srcAmount)

    if (approved) {
        $.ajax({
            url: exchangeUrl,
            type: "POST",
            headers: {
                'X-Partner':'LooneySwap',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(config),
            success: function(tx){
                web3.eth.sendTransaction(tx, (err) => {
                    console.log(err);
                });
            },
            error: function(error){
                console.log('Error getting transaction');
                console.log(error);
            }
        })
    } else {
        console.log('Allowance not approved')
    }
}

async function approveToken(tokenAddress, contractAddress, account, amount) {
    if (tokenAddress != "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        contractInstance = new web3.eth.Contract(erc20ABI, tokenAddress, {from: account});
        return await contractInstance.methods.approve(contractAddress, amount).send();
    } else {
        return true;
    } 
}
