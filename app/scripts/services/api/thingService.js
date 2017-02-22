/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.service:thingService
 * @requires Restangular
 * @description
 * # thingService
 * Service in charge of consuming the `things` REST API.
 */
angular.module('rtlsMapsensApp')
  .service('thingService', function (Restangular, apiUtils, usersService) {

    var api = Restangular.one('things');

    this.findOne = function (id) {
      if(usersService.exception.privileges('SEARCH_THING')) {
        return api.get(id);
      }
    };

    this.findFiltered = function (options) {
      if(usersService.exception.privileges('SEARCH_THING')) {
        return api.get(apiUtils.toRtlsOptions(options));
      }
    };


    this.findAll = function () {
      var options = apiUtils.getUnlimitedOptions();
      apiUtils.addParam(options, 'enabled', 'true');
      return this.findFiltered(options);
    };

    this.findWithProblem = function () {
      var options = apiUtils.getDefaultOptions();
      apiUtils.addParam(options, 'enabled', 'true');
      apiUtils.addParam(options, 'hasProblems', 'true');
      return this.findFiltered(options);
    };

    this.findWithoutProblem = function () {
      var options = apiUtils.getDefaultOptions();
      apiUtils.addParam(options, 'enabled', 'true');
      apiUtils.addParam(options, 'hasProblems', 'false');
      return this.findFiltered(options);
    };


    this.JSON = {

      find: function (json, url) {

        if (usersService.exception.privileges('SEARCH_THING')) {

          if (!url) {
            url = {
              'first-result': 1,
              'limit': -1
            }
          }
          return api.customPOST(json, "search", url, {'Content-Type': "application/json"});
        }

      }

    }


  });
