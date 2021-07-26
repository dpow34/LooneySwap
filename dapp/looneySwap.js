const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
const contractAddress = '0x7c55f55Ed5A9C0e56F00b4BCDeA3579e90EB3175';
let contractInstance;

$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        contractInstance = new web3.eth.Contract(looneySwapAbi, contractAddress, {from: accounts[0]});
        // truncate user account number to display on webpage
        const accountStr = accounts[0];
        document.getElementById("account_number").innerHTML = accountStr.slice(accountStr.length) + accountStr.slice(0, 6) + '...' + accountStr.slice(accountStr.length - 4);
    
        $("#looneySwap_button").click(()=>{
            event.preventDefault();
            document.getElementById('errorText').innerHTML = '';
            let tokenAddress = $('#srcToken').val();
            let amount = $('#srcAmount').val();
            looneySwap(accounts[0], tokenAddress, amount);
        });

        $("#addLiquidity_button").click(()=>{
            event.preventDefault();
            document.getElementById('errorText').innerHTML = '';
            let tokenAddress = $('#srcToken').val();
            let amount = $('#srcAmount').val();
            addLiquidity(accounts[0], tokenAddress, amount);
        });
        
    });

    let srcAmount = document.getElementById("srcAmount");

    // igonores "+" and "-" key values
    srcAmount.onkeydown = function(e) {
        if(e.key == "-" || e.key == "+"){
            return false;
        }
    }

    // prevents value being pasted that has multiple decimal places or invalid characters
    srcAmount.addEventListener('paste', (event) => {
        let pasteNum = event.clipboardData.getData('text/plain');
        let decimalCount = (pasteNum.match(/\./g)).length;
        if (decimalCount > 1) {
            event.stopPropagation();
            event.preventDefault();
        }
        let isNum = /^\d+$/.test(pasteNum);
        if (isNum == false){
            event.stopPropagation();
            event.preventDefault();
        }
    });

    document.getElementById("looneySwap_button").disabled = true;
    document.getElementById("addLiquidity_button").disabled = true;
});

function looneySwap(account, tokenAddress, amount) {
    getDecimals(tokenAddress, account).then((decimals) => {
        amount = BigInt(amount*10**decimals);
        contractInstance.methods.getLQProviders().call().then((LQProviders) => {
            if(LQProviders.length > 0) {
                approveToken(tokenAddress, contractAddress, account, amount).on('receipt', function(receipt) {
                    contractInstance.methods.looneySwap(tokenAddress, amount).send();
                }).on('error', function(error, receipt) {
                    document.getElementById('errorText').innerHTML = 'TOKEN TRANSFER NOT APPROVED';
                });
            } else {
                document.getElementById('errorText').innerHTML = 'NO LIQUIDITY AVAILABLE';
            }
        })
    }).catch((error) => {
        document.getElementById('errorText').innerHTML = 'IVALID ADDRESS';
    })
}

function addLiquidity(account, tokenAddress, amount) {
    getDecimals(tokenAddress, account).then((decimals) => {
        amount = BigInt(amount*10**decimals);
        approveToken(tokenAddress, contractAddress, account, amount).on('receipt', function(receipt) {
            contractInstance.methods.addLiquidity(tokenAddress, amount).send()
        }).on('error', function(error, receipt) {
            document.getElementById('errorText').innerHTML = 'TOKEN TRANSFER NOT APPROVED';
        });
    }).catch((error) => {
        document.getElementById('errorText').innerHTML = 'IVALID ADDRESS';
    })
}

function getDecimals(tokenAddress, account) {
    let erc20contractInstance;
    try {
        erc20contractInstance = new web3.eth.Contract(erc20Abi, tokenAddress, {from: account});
        return erc20contractInstance.methods.decimals().call();
    } catch {
        document.getElementById('errorText').innerHTML = 'IVALID ADDRESS';
        return Promise.reject();
    }
}

function approveToken(tokenAddress, contractAddress, account, amount) {
    let erc20contractInstance;
    try {
        erc20contractInstance = new web3.eth.Contract(erc20Abi, tokenAddress, {from: account});
        return erc20contractInstance.methods.approve(contractAddress, amount).send();
    } catch {
        document.getElementById('errorText').innerHTML = 'IVALID ADDRESS';
        return Promise.reject(new Error('Invalid Address'));
    }
}

// ignores invalid input characters
function validateInput() {
    let srcAmount = document.getElementById("srcAmount").value;
    let srcToken = document.getElementById("srcToken").value;
    
    let rgx = /^[0-9]*\.?[0-9]*$/;

    srcAmount = srcAmount.match(rgx);
    if (srcAmount == 0 || srcToken == ''){
        document.getElementById("looneySwap_button").disabled = true;
        document.getElementById("addLiquidity_button").disabled = true;
    } else {
        document.getElementById("looneySwap_button").disabled = false;
        document.getElementById("addLiquidity_button").disabled = false;
    }
    return srcAmount;
}