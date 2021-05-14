pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;

contract TreasureboxOrders {
    address public owner;
    mapping(address => OrderHistory) internal orderHistory;

    struct Order {
        string category;
        string name;
        string shipping;
        uint256 price;
        address buyer;
        address seller;
    }

    struct OrderHistory {
        bool exists;
        uint256 orderCount;
        mapping(uint256 => Order) orders;
    }

    function makeOrder(
        string memory category,
        string memory name,
        string memory shipping,
        uint256 price,
        address payable seller
    ) public payable {
        if (!orderHistory[seller].exists) {
            orderHistory[seller] = OrderHistory ({
                exists : true,
                orderCount : 0
            });
        }
        uint256 orderIndex = orderHistory[seller].orderCount;
        orderHistory[seller].orders[orderIndex] = Order ({
            category : category,
            name : name,
            shipping : shipping,
            price : price,
            buyer : msg.sender,
            seller : seller
        });
        orderHistory[seller].orderCount += 1;

        seller.transfer(price);
    }

    function retrieveOrderHistory(address seller) public view returns (
        string[] memory,
        string[] memory,
        string[] memory,
        uint256[] memory,
        address[] memory,
        address[] memory
        ) {
        OrderHistory storage history = orderHistory[seller];
        uint256 count = history.orderCount;
        string[] memory categoryArray = new string[](count);
        string[] memory nameArray = new string[](count);
        string[] memory shippingArray = new string[](count);
        uint256[] memory priceArray = new uint256[](count);
        address[] memory buyerArray = new address[](count);
        address[] memory sellerArray = new address[](count);
        
        for (uint256 i = 0; i < count; i++) {
            categoryArray[i] = history.orders[i].category;
            nameArray[i] = history.orders[i].name;
            shippingArray[i] = history.orders[i].shipping;
            priceArray[i] = history.orders[i].price;
            buyerArray[i] = history.orders[i].buyer;
            sellerArray[i] = history.orders[i].seller;
        }
        
        return (categoryArray, nameArray, shippingArray, priceArray, buyerArray, sellerArray);
    }

    constructor() public {
        owner = msg.sender;
    }

}