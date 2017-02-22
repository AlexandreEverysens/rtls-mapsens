/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsApp.exceptions
 * @description
 * # exceptions
 * Provider in the rtlsApp.
 */

angular.module('rtlsMapsensApp')
  .service('exceptions', function() {

    this.API = function(message){

      var ex = function(message) {
        this.unexpected = false;
        this.title      = "Exception.API";
        this.message    = (message || "");
      };
      ex.prototype = new Error();
      ex.prototype.constructor = ex;

      return new ex(message);
    };


    this.MESSAGE = function(title, message, extended){

      var ex = function(title, message, extended) {
        this.unexpected = false;
        this.title      = (title || "");
        this.message    = (message || "");
        this.extended   = (extended ||{});
      };
      ex.prototype = new Error();
      ex.prototype.constructor = ex;

      return new ex(title, message, extended);
    }

  });
