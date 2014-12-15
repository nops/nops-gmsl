var app = angular.module('mapStoreLocatorApp', ['ngRoute']);

app.config(['$routeProvider',
function($routeProvider) {
    $routeProvider.
    when('/start', {
        templateUrl: 'templates/start.html',
        controller: 'StartCtrl'
    }).
    when('/maps', {
        templateUrl: 'templates/maps.html',
        controller: 'MapsCtrl'
    }).
    when('/error', {
        templateUrl: 'templates/error.html',
        controller: 'ErrorCtrl'
    }).
    otherwise({
        redirectTo: '/start'
    });
}]);

// Lazy loading of Google Map API
app.service('loadGoogleMapAPI', ['$window', '$q',
function ( $window, $q ) {

    var deferred = $q.defer();

    // Load Google map API script
    function loadScript() {
        // Use global document since Angular's $document is weak
        var script = document.createElement('script');
        script.src = '//maps.googleapis.com/maps/api/js?sensor=false&language=en&libraries=geometry&callback=initMap';

        document.body.appendChild(script);
    }

    // Script loaded callback, send resolve
    $window.initMap = function () {
        deferred.resolve();
    }

    loadScript();

    return deferred.promise;
}]);

app.controller('StartCtrl', ['$scope', '$location', '$rootScope', function($scope, $location, $rootScope) {
    $scope.showAll = function() {
        $rootScope.show = 'all';
        $location.path('/maps');
    };

    $scope.showNearest = function() {
        $rootScope.show = 'nearest';
        $location.path('/maps');
    };
}]);


app.controller('ErrorCtrl', ['$scope', function($scope) {

}]);

app.controller('MapsCtrl', ['$scope', '$location', '$rootScope', '$http', 'loadGoogleMapAPI', function($scope, $location, $rootScope, $http, loadGoogleMapAPI) {

    $scope.stores = [];

    $rootScope.hasNavbar = $location.path() === '/maps';

    $scope.handleError = function() {
        $('.message .message-content').html('Error: The Geolocation service failed.');
        $('.message').show();
    };

    $scope.close = function() {
        $('.message').hide();
    };

    $http.get('stores.json').success(function(data) {
        $scope.stores = data;
    });

    $scope.lat = 37.386339;
    $scope.long = -122.085823;

    // Initialize the map
    $scope.initialize = function() {

        $scope.location = new google.maps.LatLng($scope.lat, $scope.long);

        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                $scope.location = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);

                $scope.map.setCenter($scope.location);
            }, function(err) {
                $scope.handleError();
            });
        } else {
            $scope.handleError();
        }

        $scope.mapOptions = {
            zoom: 12,
            center: $scope.location,
            streetViewControl: false,
            panControl: false,
            zoomControl: true,
            mapTypeControl: true
        };

        $scope.map = new google.maps.Map(document.getElementById('maps'), $scope.mapOptions);

        var stores = [];

        if ($rootScope.show == 'nearest') {
            var myFLatLng = new google.maps.LatLng($scope.stores[0]['lat'], $scope.stores[0]['long']);
            var minDist = google.maps.geometry.spherical.computeDistanceBetween(myFLatLng, $scope.location);
            console.log(minDist);
            stores[0] = $scope.stores[0];
            for (var i = 0; i < $scope.stores.length; i++) {
                var store = $scope.stores[i];
                var myLatLng = new google.maps.LatLng(store['lat'], store['long']);
                var dist = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, $scope.location);
                if (dist < minDist) {
                    stores[0] = store;
                    console.log(minDist);
                }
            }
        } else {
            stores = $scope.stores;
        }

        $scope.setMarkers(stores);

        /*new google.maps.Marker({
            position: $scope.location,
            map: $scope.map,
        });*/
    };

    $scope.setMarkers = function(stores) {
        for (var i = 0; i < stores.length; i++) {
            var store = stores[i];
            var myLatLng = new google.maps.LatLng(store['lat'], store['long']);
            var contentString = '<div id="content">'+
                '<h1 id="firstHeading" class="firstHeading">'+store['name']+'</h1>'+
                '<p>'+store['address']+'</p>'+
                '</div>';
            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            var marker = new google.maps.Marker({
                position: myLatLng,
                map: $scope.map,
                title: store['name'],
                infowindow: infowindow
            });
            google.maps.event.addListener(marker, 'click', function() {
                this.infowindow.open($scope.map, this);
            });
        }
    }

    // Loads google map script
    loadGoogleMapAPI.then(function () {
        // Promised resolved
        $scope.initialize();
    }, function () {
        // Promise rejected
        $scope.handleError();
    });
}]);
