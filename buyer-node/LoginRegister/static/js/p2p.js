$(function () {

    function initRecommendation() {
        $.ajax({
            type: "POST",
            url: "http://localhost:8080/init-recommendation",
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            data: {
                "userId": userId
            }
        });
    }

    initRecommendation()

    $("#update-geo-btn").click(function () {
        var longitude = $("#longitude").val();
        var latitude = $("#latitude").val();

        $.ajax({
            type: "POST",
            url: "http://localhost:8080/geolocation",
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            data: {
                "longitude": longitude,
                "latitude": latitude
            }
        });
        return false;
    })

    $("#update-recommendation-btn").click(function () {
        var ajax = $.ajax({
            type: "GET",
            url: "http://localhost:8080/recommendation",
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            success: function (res) {
                updateRecommendationList(res);
            }
        });
        return false;
    })

    $("#search-btn").click(function () {
        var jsonData;
        if ($("#category").val() == null || $("#category").val() == "") {
            jsonData = {};
        } else {
            jsonData = {
                "category": $("#category").val()
            };
        }

        var ajax = $.ajax({
            type: "GET",
            url: "http://localhost:8080/search",
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            data: jsonData,
            success: function (res) {
                updateSearchResult(res);
            }
        });
        return false;
    })

    function updateSearchResult(res) {
        searchedItems = res['data'];
        var items = [];
        items.push(
            `<table>
                        <thead>
                            <tr>
                                <td>category</td>
                                <td>name</td>
                                <td>description</td>
                                <td>price(ether)</td>
                                <td>click to buy</td>
                            </tr>
                        </thead>
                        <tbody>`
        );
        for (var i in searchedItems) {
            var item = searchedItems[i];
            items.push(`<tr id ="` + item._id + `">
                                <td name="category">` + item.category + `</td>
                                <td name="name">` + item.name + `</td>
                                <td name="description">` + item.description + `</td>
                                <td name="price">` + item.price + `</td>
                                <td><button name="buy" data-index="` + i + `">buy</button><td>
                            </tr>`);
        }
        $('#searchResult').html(items.join(''));
    }

    function updateRecommendationList(res) {
        const data = res['data'];
        var items = [];
        for (var i in data) {
            var item = data[i];
            items.push('<pre id="' + item._id + '">' + JSON.stringify(item) + '</pre>');
        }
        $('#recommendationResult').html(items.join(''));
    }
})