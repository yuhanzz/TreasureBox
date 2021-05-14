$(function () {

    // load ethereum and web3
    (async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else {
            alert('Please install Metamask.');
        }
    })();

    // load ether account
    (async () => {
        try {
            buyerEtherAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            buyerEtherAccount = buyerEtherAccounts[0];
            $('#displayEtherAccount').html('Your Ethereum account: ' + buyerEtherAccount);
        } catch (e) {
            console.log(e);
        }
    })();
})