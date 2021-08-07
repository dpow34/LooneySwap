const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
const contractAddress = '0x7c55f55Ed5A9C0e56F00b4BCDeA3579e90EB3175';
let contractInstance;

$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        contractInstance = new web3.eth.Contract(looneySwapAbi, contractAddress, {from: accounts[0]});
        // truncate user account number to display on webpage
        const accountStr = accounts[0];
        document.getElementById("account_number").innerHTML = accountStr.slice(0, 6) + '...' + accountStr.slice(accountStr.length - 4);
        // truncate user balance to display on webpage
        web3.eth.getBalance(accountStr).then(value => {
            document.getElementById("amount_data").innerHTML = String(value / Math.pow(10, 18)).slice(0, 4) + ' ETH';
        });


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

        getLQBalances(accounts[0]);
    });
    
    // html/css animation/dropdown & interactive window 
    const menu = document.querySelector('#dropdown_option')
    const choices = document.querySelector('.navbar_categories')
    
    menu.addEventListener('click', function(){
        menu.classList.toggle('isActive');
        choices.classList.toggle('active');
    });

    formatInputListeners(document.getElementById("srcAmount"));

    document.getElementById("looneySwap_button").disabled = true;
    document.getElementById("addLiquidity_button").disabled = true;
});

function formatInputListeners(element) {
    // igonores "+" and "-" key values
    element.onkeydown = function(e) {
        if(e.key == "-" || e.key == "+"){
            return false;
        }
    }

    // prevents value being pasted that has multiple decimal places or invalid characters
    element.addEventListener('paste', (event) => {
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
}

function looneySwap(account, tokenAddress, amount) {
    getTokenDecimals(tokenAddress, account).then((decimals) => {
        let safe_amount = new BigNumber(amount.toString() + `e+${decimals}`);
        safe_amount = safe_amount.toString();
        contractInstance.methods.getLQProviders().call().then((LQProviders) => {
            if(LQProviders.length > 0) {
                approveToken(tokenAddress, contractAddress, account, safe_amount.toString()).on('receipt', function(receipt) {
                    contractInstance.methods.looneySwap(tokenAddress, safe_amount.toString()).send().on('receipt', function(receipt) {
                        parseTx(receipt, account);
                        getLQBalances(account);
                    });
                }).on('error', function(error, receipt) {
                    document.getElementById('errorText').innerHTML = 'TOKEN TRANSFER NOT APPROVED';
                });
            } else {
                document.getElementById('errorText').innerHTML = 'NO LIQUIDITY AVAILABLE';
            }
        })
    }).catch((error) => {
        document.getElementById('errorText').innerHTML = 'INVALID ADDRESS';
    })
}

function addTxToDatastore(tx) {
    const url = location.protocol + '//' + location.host + '/txns';
    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(tx),
        headers: {
            'Content-Type': 'application/json'
        },
        error: function(error){
            console.log(error);
        }
    });
}

function addUserToDatastore(tx) {
    const url = location.protocol + '//' + location.host + '/users';
    data = { address : tx.ownerAddress};
    $.ajax({
        url: url,
        type: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data),
        success: function(result){
            addTxToDatastore(tx);
        },
        error: function(error){
            console.log(error);
        }
    });
}

function saveTxToDatastore(tx) {
    const url = location.protocol + '//' + location.host + '/users/';
    $.ajax({
        url: url + tx.ownerAddress,
        type: "GET",
        success: function(result){
            addTxToDatastore(tx);
        },
        error: function(error){
            addUserToDatastore(tx)
        }
    });
}

function parseTx(receipt, account) {
    let raw = receipt.events.swap.returnValues;
    let tx = {};
    tx.txId = receipt.transactionHash;
    tx.ownerAddress = raw.sender;
    tx.srcToken = raw.tokenIn;
    tx.destToken = raw.tokenOut;
    getTokenDecimals(raw.tokenIn, account).then(decimalsIn => {
        getTokenDecimals(raw.tokenOut, account).then(decimalsOut => {
            let safe_in = new BigNumber(raw.amountIn.toString() + `e-${decimalsIn}`);
            let safe_out = new BigNumber(raw.amountOut.toString() + `e-${decimalsOut}`);
            tx.srcTokenDecimals = decimalsIn;
            tx.srcAmount = safe_in.toString();
            tx.destTokenDecimals = decimalsOut;
            tx.destAmount = safe_out.toString();
            saveTxToDatastore(tx);
        });
    });
}

function addLiquidity(account, tokenAddress, amount) {
    getTokenDecimals(tokenAddress, account).then((decimals) => {
        let safe_amount = new BigNumber(amount.toString() + `e+${decimals}`);
        approveToken(tokenAddress, contractAddress, account, safe_amount.toString()).on('receipt', function(receipt) {
            contractInstance.methods.addLiquidity(tokenAddress, safe_amount.toString()).send().on('receipt', function(receipt) {
                getLQBalances(account);
            });
        }).on('error', function(error, receipt) {
            document.getElementById('errorText').innerHTML = 'TOKEN TRANSFER NOT APPROVED';
        });
    }).catch((error) => {
        document.getElementById('errorText').innerHTML = 'INVALID ADDRESS';
    })
}

function withdrawLiquidity(account, tokenAddress, amount) {
    getTokenDecimals(tokenAddress, account).then((decimals) => {
        let safe_amount = new BigNumber(amount.toString() + `e+${decimals}`);
        contractInstance.methods.withdrawLiquidity(tokenAddress, safe_amount.toString()).send().on('receipt', function(receipt) {
            getLQBalances(account);
        });
    }).catch((error) => {
        document.getElementById('errorText').innerHTML = 'INVALID ADDRESS';
    })
}

function getLQBalances(account) {
    contractInstance.methods.getLQBalances(account).call().then((balances) => {
        balances.reduce((p, balance, i) => {
            let erc20contractInstance = new web3.eth.Contract(erc20Abi, balance.token, {from: account});
            let decimals;
            return p.then(() => erc20contractInstance.methods.decimals().call())
                    .then((d) => {
                        decimals = d;
                        return erc20contractInstance.methods.symbol().call();
                    })
                    .then((s) => {
                        let symbol = s;
                        let amount = new BigNumber(balance.amount.toString() + `e-${decimals}`);
                        let safe_amount = amount.toString();
                        let table = document.getElementById('lqBody');
                        if(i == 0) {
                            table.innerHTML = '';
                        }
                        table.innerHTML += formatLQBalance(account, balance.token, symbol, safe_amount, i+1);
                        formatInputListeners(document.getElementById((i+1).toString()));
                        document.getElementById((i+1).toString() + "_withdraw").disabled = true; 
                    })
        }, Promise.resolve() );
        if(balances.length == 0) {
            document.getElementById('lqTable').style.display = "none";
        } else {
            document.getElementById('lqTable').style.display = "block";
        }
    });
}

function formatLQBalance(account, tokenAddress, symbol, amount, index) {
    let buttonId = index.toString() + "_withdraw";
    let amountId = index.toString() + "_max";
    return `<tr>
                <th scope="row">${index}</th>
                <td>${symbol}</td>
                <td id="${amountId}">${amount}</td>
                <td><input type="number" name="amount" id="${index}" oninput="validateTableInput('${index}', '${buttonId}')"></td>
                <td><button class="btn btn-primary" type="button" onclick="inputMaxAmount('${amount}', '${index}')">Max</button></td>
                <td><button class="btn btn-primary" type="button" id="${buttonId}" onclick="withdrawLiquidity('${account}', '${tokenAddress}', '${amount}')">Withdraw Liquidity</button></td>
            </tr>`
}

function inputMaxAmount(amount, index) {
    document.getElementById(index).value = amount;
    validateTableInput(index, index.toString() + "_withdraw");
}

function getTokenDecimals(tokenAddress, account) {
    let erc20contractInstance;
    try {
        erc20contractInstance = new web3.eth.Contract(erc20Abi, tokenAddress, {from: account});
        return erc20contractInstance.methods.decimals().call();
    } catch {
        document.getElementById('errorText').innerHTML = 'INVALID ADDRESS';
        return Promise.reject();
    }
}

function approveToken(tokenAddress, contractAddress, account, amount) {
    let erc20contractInstance;
    try {
        erc20contractInstance = new web3.eth.Contract(erc20Abi, tokenAddress, {from: account});
        return erc20contractInstance.methods.approve(contractAddress, amount).send();
    } catch {
        document.getElementById('errorText').innerHTML = 'INVALID ADDRESS';
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

function validateTableInput(id, buttonId) {
    let amount = document.getElementById(id.toString()).value;
    let rgx = /^[0-9]*\.?[0-9]*$/;
    amount = amount.match(rgx);
    if (amount == 0 || amount > parseFloat(document.getElementById(id.toString() + "_max").innerHTML)) {
        document.getElementById(buttonId).disabled = true;
    } else {
        document.getElementById(buttonId).disabled = false;
    }
    return amount;
}