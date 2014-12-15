var appControllers = angular.module('appControllers', []);

appControllers.controller('StartCtrl', ['$scope', '$location', '$rootScope', function($scope, $location, $rootScope) {
    $scope.showAll = function() {
        $location.path('/maps/all');
    };

    $scope.showNearest = function() {
        $location.path('/maps/nearest');
    };
}]);

appControllers.controller('MapsCtrl', ['$scope', '$location', '$rootScope', '$http', '$routeParams', 'loadGoogleMapAPI', function($scope, $location, $rootScope, $http, $routeParams, loadGoogleMapAPI) {

    //Init arrays
    $scope.stores = [];

    $scope.markers = [];

    $rootScope.hasNavbar = true;

    $scope.init = false;

    $http.get('stores.json').success(function(data) {
        $scope.stores = data;
        if ($scope.markers.length == 0 && $scope.init == true) {
            $scope.setStores();
        }
    });

    //Show messages in bottom of page
    $scope.showAlert = function(msg) {
        $('.message .message-content').html(msg);
        $('.message').show();
    };

    //Close message alert
    $scope.close = function() {
        $('.message').hide();
    };

    $scope.showAlert('Waiting location...');

    //Set default location
    $scope.lat = 37.386339;
    $scope.long = -122.085823;

    // Initialize the map
    $scope.initialize = function() {

        $scope.location = new google.maps.LatLng($scope.lat, $scope.long);

        //Verify browser supports geolocation
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                $scope.location = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);
                $scope.setMyMarker();
                if ($scope.showStores) {
                    $scope.setMarkers($scope.showStores);
                }
                $scope.close();
            }, function(err) {
                $scope.showAlert('Error: The Geolocation service failed.');
            });
        } else {
            $scope.showAlert('Error: Your browser doesn\'t support geolocation.');
        }

        //Google maps default options
        $scope.mapOptions = {
            zoom: 12,
            center: $scope.location,
            streetViewControl: false,
            panControl: false,
            zoomControl: true,
            mapTypeControl: true
        };

        //Define map
        $scope.map = new google.maps.Map(document.getElementById('maps'), $scope.mapOptions);

        $scope.setMyMarker();

        $scope.setStores();

        $scope.init = true;
    };

    //Show markers in the map
    $scope.setMarkers = function(stores) {
        $scope.markers = [];
        for (var i = 0; i < stores.length; i++) {
            var store = stores[i];
            var myLatLng = new google.maps.LatLng(store['lat'], store['long']);
            var contentString = '<div id="content">'+
                '<h1>'+store['name']+'</h1>'+
                '<p>'+store['address']+'</p>'+
                '</div>';
            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            $scope.markers[i] = new google.maps.Marker({
                position: myLatLng,
                map: $scope.map,
                title: store['name'],
                infowindow: infowindow
            });
            google.maps.event.addListener($scope.markers[i], 'click', function() {
                this.infowindow.open($scope.map, this);
            });
        }
        $scope.map.setCenter(myLatLng);
    }

    //Show user location in the map
    $scope.setMyMarker = function() {
        if ($scope.myMarker) {
            $scope.myMarker.setMap(null);
        }
        $scope.myMarker = new google.maps.Marker({
            position: $scope.location,
            map: $scope.map,
            icon: 'http://maps.google.com/mapfiles/kml/shapes/target.png'
        });
    };

    //Define how stores will appear
    $scope.setStores = function() {
        // If nearest, only one (nearest) store
        if ($routeParams.type == 'nearest') {
            $scope.showStores = [];
            //Verify stores array loaded
            if ($scope.stores.length > 0) {
                //Set first distance as min distance
                var myFLatLng = new google.maps.LatLng($scope.stores[0]['lat'], $scope.stores[0]['long']);
                var minDist = google.maps.geometry.spherical.computeDistanceBetween(myFLatLng, $scope.location);
                $scope.showStores[0] = $scope.stores[0];
                //Try all others stores
                for (var i = 1; i < $scope.stores.length; i++) {
                    var store = $scope.stores[i];
                    var myLatLng = new google.maps.LatLng(store['lat'], store['long']);
                    var dist = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, $scope.location);
                    if (dist < minDist) {
                        $scope.showStores[0] = store;
                    }
                }
            }
        } else {
            //If all, show all the stores
            $scope.showStores = $scope.stores;
            $scope.setMarkers($scope.showStores);
        }
    };

    // Loads google map script
    loadGoogleMapAPI.then(function () {
        // Promised resolved
        $scope.initialize();
    }, function () {
        // Promise rejected
        $scope.showAlert('Error: Couldn\'t load maps.');
    });
}]);
