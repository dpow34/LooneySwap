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
            formatTxTable(result);
        },
        error: function(error){
            console.log(error);
        }
    });
}

function formatTxTable(txns) {
    console.log(txns);
}

function formatTxRow(txHash, time, tokenIn, amountIn, tokenOut, amountOut) {
    return `<tr>
                <th scope="row">${txHash}</th>
                <td>${time}</td>
                <td>${tokenIn}</td>
                <td>${amountIn}</td>
                <td>${tokenOut}</td>
                <td>${amountOut}</td>
            </tr>`;
}