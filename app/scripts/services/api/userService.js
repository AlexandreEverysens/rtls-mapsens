/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsApp.service:usersService
 * @description
 * # usersService
 * Service in charge of consuming the `login` REST API.
 */
angular.module('rtlsMapsensApp')
  .service('usersService', function(Restangular, $q, exceptions,$cookies,$translate,$window, amMoment, moment, angularMomentConfig,companyConfig) {

    var self = this;


    this.profile = {

      //me   : null,
      loaded_ : false,

      loaded : function(b){
        if(!_.isUndefined(b)){ self.profile.loaded_ = b; }
        return self.profile.loaded_;
      },

      clear : function() {
        self.profile.loaded(false);
        self.profile.me =
          {
            role : {
              name : null,
              privileges : []
            }
          };
        self.profile.problemsTypes = [];
      },

      request : function(force) {

        if(!self.profile.loaded() || force == true) { //for avoid concurrency call after login

          var RestFulResponse = Restangular.withConfig(function(cfg) {
            cfg.setFullResponse(true);
          });

          var lang = self.languages.toApiName(self.profile.getLanguageAndTimezone().lang);

          return RestFulResponse.one('users').one('me').get({lang: lang}).then(function(result) {

            Restangular.setDefaultHeaders({ 'X-XSRF-TOKEN': result.headers('X-XSRF-TOKEN') }); // Use to load the good token after a page reload !

            self.profile.me = result.data.plain();

            //TODO : if(usersService.exception.privileges('GET_PROBLEM_TYPES')) {

            return Restangular.one('problems').one('types').get().then(function(result) {
              self.profile.problemsTypes = result.plain();
              self.profile.loaded(true);
            });
          });
        }
        return $q.when([]); // return resolved promise
      },

      update : function (info){

        // presets of language and timezone in cookies
        $cookies.put("language", info.language);
        $cookies.put("timezone", info.timezone);
        $translate.use(info.language);
        angularMomentConfig.timezone = $cookies.get("timezone");
        amMoment.changeLocale(info.language);

        var request = Restangular.withConfig(function(cfg) {
          cfg.setFullResponse(true);
        });

        return request.one('users').customPUT(info).then(function(result){
          return Restangular.setDefaultHeaders({ 'X-XSRF-TOKEN': result.headers('X-XSRF-TOKEN') }); // Use to load the good token after a page reload !
        });
      },

      getMe : function() {

        var langTz = self.profile.getLanguageAndTimezone();

        if(self.profile.loaded()) {
          var p = self.profile.me;
          _.set(p, "language", langTz.lang);
          _.set(p, "timezone", langTz.tz);
          return p;
        }
        return null;
      },

      getLanguageAndTimezone: function(){

        var lang = $cookies.get("language") || $window.navigator.userLanguage || $window.navigator.language;
        lang = _.truncate(lang,{'length':4, 'omission':'', 'separator':'-'});
        var tz = $cookies.get("timezone") || angularMomentConfig.timezone;
        angularMomentConfig.timezone = tz;

        return {
          lang: lang,
          tz: tz
        };
      },

      getProblemsTypes : function() {
        if(self.profile.loaded())
          return self.profile.problemsTypes;
        return [];
      }
    };

    this.company = {
      item : function (path) {
        var name = _.toLower(self.profile.me.company.name);
        return _.get(_.get(companyConfig, name), path, null);
      }
    };


    this.role = function(is) {
      if(_.isString(is))
        return (is == self.role()) ? true : false;
      if(_.isArray(is))
        return _.find(is, function(e) { return e == self.role(); }) ? true : false;

      return self.profile.me.role.name;
    };

    this.privileges = function(has, operator) {

      if( _.isUndefined(operator) )
        operator = 'or';

      if(_.isString(has))
        return _.find(self.privileges(), ['name', has]) ? true : false;
      if(_.isArray(has) && operator == 'or')
        return _.find(has, function(e) {
          return _.find(self.privileges(), ['name', e]);
        }) ? true : false;
      if(_.isArray(has) && operator == 'and')
        ;

      return self.profile.me.role.privileges;
    };


    this.exception = {

      privileges : function(has, operator) {
        var r = self.privileges(has, operator);
        // TODO UNCOMMENT THIS @Vincent It's just to remove error and setup map
        //if(!r)
          //throw exceptions.API('Not allowed. (Privileges failed : ' + has + ')');
        return r;
      }
    };

    this.languages = {
      toApiName: function(name){
        switch(name){
          case "fr":
            return "fr_FR";
          case "en":
            return "en_US";
        }

        return name;
      }
    };

    self.profile.clear();

  });
