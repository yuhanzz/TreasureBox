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
            sellerEtherAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            seller = sellerEtherAccounts[0];
            $('#displayEtherAccount').html('Your Ethereum account: ' + seller);
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
    ], '0x590660C69508a5B4f6e70e450516Bad17A7DD691', {
        from: seller, // default from address
    });

    $("#retrieve").click(function () {
        contractInstance.methods.retrieveOrderHistory(seller).call(function (error, result) {
            if (error) {
                console.log('error');
                console.log(error);
            }
            displaySoldItems(result);
        });

        return false;
    })

    function displaySoldItems(result) {
        const categoryArray = result[0];
        const nameArray = result[1];
        const shippingArray = result[2];
        const priceArray = result[3];
        const buyerArray = result[4];

        var items = [];
        items.push(
            `<table>
                        <thead>
                            <tr>
                                <td>category</td>
                                <td>name</td>
                                <td>shipping address</td>
                                <td>price(ether)</td>
                                <td>buyer</td>
                            </tr>
                        </thead>
                        <tbody>`
        );
        for (var i in categoryArray) {
            items.push(`<tr>
                                <td name="category">` + categoryArray[i] + `</td>
                                <td name="name">` + nameArray[i] + `</td>
                                <td name="shipping">` + shippingArray[i] + `</td>
                                <td name="price">` + window.web3.utils.fromWei(priceArray[i], 'ether') + `</td>
                                <td name="buyer">` + buyerArray[i] + `</td>
                            </tr>`);
        }
        $('#retrieveResult').html(items.join(''));

    }
})