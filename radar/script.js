var items = [];
var markers = [];
var map = null;
var showTimeout = 50;
var hideTimeout = 5000;
var mapStyles = [];

$(document).ready(function () {
    var turbomode = $.urlParam("turbomode") || 1;    
    (function loop() {
        var rand = Math.round(Math.random() * (5000/turbomode));
        setTimeout(function () {
            var claimDatum = claimData.pop();
            showClaim(claimDatum);
            loop();
        }, rand);
    }());

   
});

var showClaim = function (claimData) {
    var image = getIcon(claimData);

    var zip = claimData.zip;
    var country = getCountry(claimData);

    if (country == "norway" && zip.length == 3){ zip = "" + "0" + zip; }
    if (country == "norway" && zip.length == 2){ zip = "" + "00" + zip; }
    if (country == "norway" && zip.length == 1){ zip = "" + "000" + zip; }

    var countryCode = country=="norway" ? "no" : country=="sweden" ? "se" : "dk";

    console.log("http://maps.googleapis.com/maps/api/geocode/json?region=" + countryCode + "&components=country:" + countryCode + "&address=" + country + ", " + zip + "&sensor=false")
    $.get("http://maps.googleapis.com/maps/api/geocode/json?region=" + countryCode + "&components=country:" + countryCode + "&address=" + country + ", " + zip + "&sensor=false", 
        function (data) {
            if (data.status === 'OK' && data.results.length > 0) {
                var coordinates = data.results[0].geometry.location;

                var marker = new google.maps.Marker({
                    position: coordinates,
                    map: map,
                    icon: image,
                    title: claimData.company
                });

                window.setTimeout(function () {
                    markers.push(marker);
                }, showTimeout);

                switch (claimData.carbrand) {
                    case "Building": { $("#buildingCnt").text(parseInt($("#buildingCnt").text())+1); break; } 
                    case "Content": { $("#contentCnt").text(parseInt($("#contentCnt").text())+1); break; }
                    default:  { $("#autoCnt").text(parseInt($("#autoCnt").text())+1); break; }

                }

                removeMarker(marker, hideTimeout);
            }
        });

}

var removeMarker = function (marker, timeout) {
    window.setTimeout(function () {
        (function animationStep() {
            var opacity = marker.getOpacity();
            if (!opacity) {
                opacity = 1;
            }

            if (opacity > 0.1) {
                marker.setOpacity(opacity - 0.1);
                setTimeout(animationStep, 100);
            } else {
                marker.setVisible(false);
                marker.setMap(null);
                var index = markers.indexOf(marker);
                if (index !== -1)
                    markers.splice(index, 1);
            }
        })();
    }, timeout);
}

function getIcon(claimData) {
    var total = claimData.total;
    if (total > 50000) {
        total = 50000;
    }
    
    var size = (total / 50000.0) * 24 + 32;

    var icon = {
        url: claimData.carbrand == "Content" ? "icons/bike.png" : claimData.carbrand == "Building" ? "icons/house.ico" : "icons/car.png",
        scaledSize: new google.maps.Size(size, size), 
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(size/2, size/2)
    };

    return icon;
}

function getCountry(claimData) {
    switch (claimData.country.toLowerCase()) {
        case "se":
            return "Sweden";
        case "no":
            return "Norway";
        default:
            return claimData.country.toLowerCase();
    }
}

function initMap() {
    if (!map) {
        map = new google.maps.Map(document.getElementById('map'),
        {
            zoom: 5,
            center: { lat: 60.1702076, lng: 14.931883 },
            styles: $.urlParam('nightmode') ? mapStylesNight : mapStylesDay
        });
    }
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}