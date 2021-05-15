$(function () {
    $("#sell-btn").click(function () {
        var category = $("#category").val();
        var name = $("#name").val();
        var description = $("#description").val();
        var price = $("#price").val();
        var longitude = $("#longitude").val();
        var latitude = $("#latitude").val();

        var ajax = $.ajax({
            type: "POST",
            url: "/sell",
            data: {
                "category": category,
                "name": name,
                "description": description,
                "price": price,
                "seller": seller,
                "longitude": longitude,
                "latitude": latitude
            },
            success: function (res) {
                clear_form_data();
            }
        });
        return false;
    })

    function clear_form_data() {
        $("#category").val("");
        $("#name").val("");
        $("#description").val("");
        $("#price").val("");
        $("#longitude").val("");
        $("#latitude").val("");
    }
})