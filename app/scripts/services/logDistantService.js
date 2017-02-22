/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.logDistantService
 */
angular.module('rtlsMapsensApp')

  .service("logDistantService", [ 'rtlsConfig', function(conf) {

    var Me = this;
    this.L = logmatic;
    this.metas = {};
    this.APIkey = conf.logmatic.APIKey;

    this.init = function () {

      Me.L.init(Me.APIkey);
      Me.L.setIPTracking('client.IP');
      Me.L.setUserAgentTracking('client.user-agent');
      Me.L.setURLTracking('request.url');

      Me.metas = {
        'from' : {
          'name'    : 'Front-End',
          'type'    : conf.type,
          'version' : '4.0.0', // TODO : get version from conf !!!
        }
      }
    };

    this.setUser = function(me) {
      var user = _.pick(me, ['id', 'username']);
      _.set(user, 'role', _.pick(me.role, ['id', 'name']));
      _.set(user, 'company', _.pick(me.company, ['id', 'name']));
      _.set(Me.metas, 'user', user);
    };

    this.clearUser = function() {
      _.set(Me.metas, 'user', {});
    };

    this.$log = function(json) {
      if(!_.isEmpty(Me.APIkey)){ // send only if an API key is available
        Me.L.setMetas(Me.metas);
        return Me.L.log('', json);
      }
    };

    this.log = function(severity, message, meat, options) {
      if(meat == undefined)
        meat = {};
      if(options == undefined)
        options = {};

      var getPath = function(){
        return _.nth(window.location.href.match(/\/#(.[^#?]*)/), 1);
      };

      //return StackTrace.get().then(function(stack){
      Me.$log({
        'severity' : severity,
        'message'  : message,
        'meat'     : meat,
        'stack'    : [], //_.get(options, 'stack') ? stack : [] // if you want stack => options.stack : true !
        'request'  : { 'path' : getPath() }
      });
      //});
    };

    this.info = function( message, meat, options) {
      this.log('INFO', message, meat, options);
    };

    this.warn = function( message, meat, options) {
      this.log('WARN', message, meat, options);
    };

    this.error = function( message, meat, options) {
      this.log('ERROR', message, meat, options);
    };

    this.exception = function(exception){

      return StackTrace.fromError(exception).then(function(stack){
        Me.$log({
          'severity' : 'ERROR',
          'message'  : 'Exception : ' + exception.message,
          'stack'    : stack
        })
      });
    }



  }]);
