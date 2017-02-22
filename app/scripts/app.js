'use strict';

/**
 * @ngdoc overview
 * @name rtlsMapsensApp
 * @description
 * # rtlsMapsensApp
 *
 * Main module of the application.
 */
angular
  .module('rtlsMapsensApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui-leaflet',
    'pascalprecht.translate',
    'ui.router',
    'restangular',
    'angularMoment'
  ])

  .run(function($rootScope, logDistantService, Restangular){

    /**
     * logDistantService (Logmatic.io) init
     */
    logDistantService.init();

    $rootScope.$on('$stateChangeStart', function(event, toState) {
      $rootScope.currentState = toState.name;
    });

    Restangular.setDefaultHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    Restangular.setDefaultHttpFields({
      withCredentials: true
    });

  })

  .config(function ($translateProvider) {
    $translateProvider.useMissingTranslationHandlerLog();
    $translateProvider
      .useStaticFilesLoader({
        files: [{
          prefix: 'languages/',
          suffix: '.json'
        }]
      })
      .registerAvailableLanguageKeys(['en', 'fr'], {
        'en*': 'en',
        'fr*': 'fr'
      });

    //$translateProvider.useLocalStorage();
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escape');
    // $translateProvider.useCookieStorage();
  })

  .config(function ($routeProvider) {
    $routeProvider
      .when('/map', {
        templateUrl: 'views/map.html',
        controller: 'MapCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  .constant('rtlsConfig', {
    "type": "dev",
    "backend": {
      "domain": "http://ci.api.everysens.com",
      "api": "/api"
    },
    "links": {
      "settings": "/secure/index-admin",
      "profile": "/secure/user-profile",
      "logout": "/logout"
    },
    "dashboard": {
      "displayLosses": "true"
    },
    "tabs": {
      "defaultLimit": "30",
      "defaultPageNumber": "1",
      "defaultCountPerPage": "10"
    },
    "map": {
      "historic" : {
        "previousDays" : "15"
      }
    },
    "logmatic" : {
      "APIKey" : "kbG9UnXvSbid8C5cgt565Q"
    },
    "google":{
      "APIGeocodingKey" : "AIzaSyDalNuZhyLfft55jRO08H4SOiby22SI0h4"
    }
  });
