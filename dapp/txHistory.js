const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        const accountStr = accounts[0];
        document.getElementById("account_number").innerHTML = accountStr.slice(accountStr.length) + accountStr.slice(0, 6) + '...' + accountStr.slice(accountStr.length - 4);
        getTxHistory(accounts[0]);
    });
});

function getTxHistory(account) {
    const url = location.protocol + '//' + location.host + `/users/${account}/txns`;
    $.ajax({
        url: url,
        type: "GET",
        success: function(result){
            formatTxTable(result.results, account);
        },
        error: function(error){
            console.log(error);
        }
    });
}

function formatTxTable(txns, account) {
    for(let i = 0; i < txns.length; i++) {
        let table = document.getElementById('txBody')
        getTokenSymbol(txns[i].srcToken, account).then((srcSymbol) => {
            getTokenSymbol(txns[i].destToken, account).then((destSymbol) => {
                let date = new Date(txns[i].timeStamp);
                table.innerHTML += formatTxRow(date.toLocaleString(), srcSymbol, txns[i].srcAmount, destSymbol, txns[i].destAmount);
            });
        });   
    }
}

function formatTxRow(time, tokenIn, amountIn, tokenOut, amountOut) {
    return `<tr>
                <td scope="row">${time}</td>
                <td>${tokenIn}</td>
                <td>${amountIn}</td>
                <td>${tokenOut}</td>
                <td>${amountOut}</td>
            </tr>`;
}

function getTokenSymbol(tokenAddress, account) {
    let erc20contractInstance;
    if(tokenAddress.toLowerCase() == '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()) {
        return Promise.resolve('ETH');
    } else {
        try {
            erc20contractInstance = new web3.eth.Contract(erc20Abi, tokenAddress, {from: account});
            return erc20contractInstance.methods.symbol().call();
        } catch {
            return Promise.reject();
        }
    }
}