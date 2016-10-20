var items = [];
var markers = [];
var map = null;
var showTimeout = 50;
var hideTimeout = 5000;

$(document).ready(function () {
    
    (function loop() {
        var rand = Math.round(Math.random() * (1000));
        setTimeout(function () {
            var t = claimData.pop();
            showClaim(t);
            // alert(JSON.stringify(t));
            loop();
        }, rand);
    }());

   
});

var testClaim = {
    'id': 1,
    'country': 'SE',
    'zip': '693 70',
    'total': 10000,
    'carbrand': 'audi',
    'datetime': '2016-01-01T23:12:56'
};

var updateCounter = function () {
    $('#cntr').text($('div').length);
}

var showClaim = function (claimData) {
    var image = getIcon(claimData);

    var zip = claimData.zip;
    var country = getCountry(claimData);

    if (country == "norway" && zip.length == 3){ zip = "" + "0" + zip; }
    if (country == "norway" && zip.length == 2){ zip = "" + "00" + zip; }
    if (country == "norway" && zip.length == 1){ zip = "" + "000" + zip; }

    var countryCode = country=="norway" ? "no" : country=="sweden" ? "se" : "dk";

    console.log("http://maps.googleapis.com/maps/api/geocode/json?components=country:" + countryCode + "&address=" + country + ", " + zip + "&sensor=false")
    $.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + country + ", " + zip +
        "&sensor=false", function (data) {
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
    
    var size = (total / 50000) * 24 + 15;

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
            center: { lat: 57.2973031, lng: 12.7991264 },
            styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{color: '#263c3f'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{color: '#6b9a76'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#38414e'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#212a37'}]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{color: '#9ca5b3'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#746855'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#1f2835'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{color: '#f3d19c'}]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{color: '#2f3948'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#515c6d'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#17263c'}]
            }
          ]
        });

        showClaim(testClaim, 50, 3000);
    }
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}
