/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.service:locationService
 * @description
 * # locationService
 * Service in charge of consuming the `locations` REST API.
 */
angular.module('rtlsMapsensApp')
  .service('locationService', function (Restangular, apiUtils, usersService) {

    var api = Restangular.one('locations');

    this.findOne = function (id) {
      if(usersService.exception.privileges('SEARCH_LOCATION')) {
        return api.get(id);
      }
    };

    this.findFiltered = function (options) {
      if(usersService.exception.privileges('SEARCH_LOCATION')) {
        return api.get(apiUtils.toRtlsOptions(options));
      }
    };

    this.findAll = function () {
      return this.findFiltered(apiUtils.getUnlimitedOptions());
    };

    this.findWithProblem = function () {
      var options = apiUtils.getDefaultOptions();
      apiUtils.addParam(options, 'hasProblems', 'true');
      return this.findFiltered(options);
    };

    this.findWithoutProblem = function () {
      var options = apiUtils.getDefaultOptions();
      apiUtils.addParam(options, 'hasProblems', 'false');
      return this.findFiltered(options);
    };


    this.JSON = {

      find: function (json, url) {

        if (usersService.exception.privileges('SEARCH_LOCATION')) {

          if (!url) {
            url = {
              'first-result': 1,
              'limit': -1
            }
          }

          return api.customPOST(json, "search", url, {'Content-Type': "application/json"});
        }

      },

      syntax: {
        "operator": "AND",
        "predicates": [
          {
            "operator": "OR",
            "predicates": []
          },
        ]
      }

    }


  });
