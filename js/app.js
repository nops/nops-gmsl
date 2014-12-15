var app = angular.module('mapStoreLocatorApp', ['ngRoute', 'appControllers']);

app.config(['$routeProvider',
function($routeProvider) {
    $routeProvider.
    when('/start', {
        templateUrl: 'templates/start.html',
        controller: 'StartCtrl'
    }).
    when('/maps/:type', {
        templateUrl: 'templates/maps.html',
        controller: 'MapsCtrl'
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
