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

    var contractInstance = new window.web3.eth.Contract([
        {
            "inputs": [],
            "name": "last_completed_migration",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function",
            "constant": true
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function",
            "constant": true
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "completed",
                    "type": "uint256"
                }
            ],
            "name": "setCompleted",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function",
            "constant": true
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "category",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "shipping",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "internalType": "address payable",
                    "name": "seller",
                    "type": "address"
                }
            ],
            "name": "makeOrder",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function",
            "payable": true
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "seller",
                    "type": "address"
                }
            ],
            "name": "retrieveOrderHistory",
            "outputs": [
                {
                    "internalType": "string[]",
                    "name": "",
                    "type": "string[]"
                },
                {
                    "internalType": "string[]",
                    "name": "",
                    "type": "string[]"
                },
                {
                    "internalType": "string[]",
                    "name": "",
                    "type": "string[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                },
                {
                    "internalType": "address[]",
                    "name": "",
                    "type": "address[]"
                },
                {
                    "internalType": "address[]",
                    "name": "",
                    "type": "address[]"
                }
            ],
            "stateMutability": "view",
            "type": "function",
            "constant": true
        }
    ], '0x590660C69508a5B4f6e70e450516Bad17A7DD691', {  // TODO: change from ganache to ropsten
        from: buyerEtherAccount, // default from address
    });

    $('#searchResult').on('click', 'button', function () {
        var i = $(this).attr("data-index");
        var item = searchedItems[i];
        var _id = item._id;
        var category = item.category;
        var name = item.name;
        var price = window.web3.utils.toWei(item.price.toString());
        var seller = item.seller;

        // TODO: add an input box for entering shipping address
        var shipping = '90 Columbus';

        contractInstance.methods.makeOrder(category, name, shipping, price, seller).send({
            gas: 300000,
            from: buyerEtherAccount,
            value: price
        })
            .on('transactionHash', function (hash) {
                console.log('hash');
                console.log(hash);
            });

        return false;
    });


})