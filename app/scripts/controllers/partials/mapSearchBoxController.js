'use strict';

/**
 * @ngdoc controller
 * @name rtlsMapsensApp.controller:MapSidebarCtrl
 * @description
 * # MapSidebarCtrl
 * Controller of the rtlsMapsensApp.
 */
angular.module('rtlsMapsensApp')
  .controller('MapSearchBoxCtrl', ['$rootScope', '$scope', '$q', '$compile', '$translate', '$timeout', '$stateParams',
    'thingService', 'locationService', 'leafletService', 'searchBoxEngineService', 'logDistantService', 'apiUtils',
    function ($rootScope, $scope, $q, $compile, $translate, $timeout, $stateParams,
              thingService, locationService, leafletService, engine, lds, apiUtils) {



      /**
       *  Searchbar show/hide
       */
      $scope.searchbox = {

        _show: true,
        show: function (b) {
          if (!_.isUndefined(b))
            return ($scope.searchbox._show = b);
          return $scope.searchbox._show;
        },
        toggle: function () {
          $scope.searchbox.show(!$scope.searchbox.show());
        }

      };


      /**
       *  Tokens show/hide
       */
      $scope.tokens = {

        _show: true,
        show: function (b) {
          if (!_.isUndefined(b))
            return ($scope.tokens._show = b);
          return $scope.tokens._show;
        },
        toggle: function () {
          if ($scope.tokens.show()) {
            $scope.tokens.show(false);
            $scope.tokens.show(false);
          }
          else
            $scope.tokens.show(true);
        },
        list: function () {
          return engine.Pilot.list;
        },
        zoom: function(type, id) {
          if( type == 'thing'){
            $scope.Markers.Commands.things.fit(id);
          }
          if( type == 'location'){
            $scope.Markers.Commands.locations.regions.fit(id);
          }
        },
        unzoom: function(){
          leafletService.fitMap(_.union($scope.Markers.Commands.things.latLngs(), $scope.Markers.Commands.locations.latLngs()));
        },
        dblclick: function(type, id){
          $rootScope.$broadcast('event.map.tokens.dblclick', {type:type, id:id});
        },

        events : {
          $on : function(){
            $rootScope.$on('event.map.tokens', function(e, d){
              if( d.command == 'hide')
                $scope.tokens.show(false);
              if( d.command == 'show')
                $scope.tokens.show(true);
            });
          }
        },
      };

      $scope.tokens.events.$on();



      /**
       *  Layers button (road/satellite)
       */
      $scope.layers = {

        baselayers: {
          current: function () {
            if (_.has($scope.map.layers.baselayers, 'streets'))
              return 'streets';
            return 'satellite';
          },
          toggle: function () {
            if ($scope.layers.baselayers.current() == 'streets') {
              delete $scope.map.layers.baselayers.streets;
              $scope.map.layers.baselayers.satellite = _.clone(leafletService.tileLayers.mapbox.streetsSatellite);
            } else {
              delete $scope.map.layers.baselayers.satellite;
              $scope.map.layers.baselayers.streets = _.clone(leafletService.tileLayers.mapbox.streetsBasic);
            }
          }
        }
      };


      /**
       *  Trash button
       */
      $scope.trash = {
        push: function () {
          engine.Pilot.clean();
          //$scope.input.instance.typeahead('val', '');
          $scope.input.instance.focus();
        }
      };


      /**
       *  Parameters
       */
      $scope.parameters = {

        pending: [],

        show: {

          things: function () {

            var id = _.get($stateParams.search, 'thing.id') || _.get($stateParams, 'thingId');
            if (id)
              $scope.parameters.pending.push({name: 'thing', id: _.toNumber(id)});
          },
          locations: function () {

            var id = _.get($stateParams.search, 'location.id');
            if (id)
              $scope.parameters.pending.push({name: 'location', id: id});
          }
        },

        throttled : _.throttle(function() {
          $scope.parameters.show.things();
          $scope.parameters.show.locations();
        }, 5000, { 'trailing': false })
      };


      $scope.$on( 'popup.location.viewObjectsIn', function (e, d) {

        engine.Pilot.click({
          "type"       : "thing",
          "desc0"      : d.name,
          "desc1"      : "currentLocation.name", // translate path
          "attribute"  : "currentLocation.id",
          "value"      : d.id
        });
      });


      $scope.showAllProblems = function(){

        engine.Pilot.click({
          "type"       : "thing",
          "desc0"      : $translate.instant('things.withProblems'),
          "desc1"      : "things",
          "attribute"  : "hasProblems",
          "value"      : true,
          "classes"    : "hasProblems"
        });

        engine.Pilot.click({
          "type"       : "location",
          "desc0"      : $translate.instant('locations.withProblems'),
          "desc1"      : "locations",
          "attribute"  : "hasProblems",
          "value"      : true,
          "classes"    : "hasProblems"
        });
      };







      /**
       *  Events
       */
      $scope.$on('typeahead:opened', function (a,b) {

        // Typeahead init event => get instance
        $scope.input.instance = $('#search-box-id');

        // Possible parameters from table equipements (throttled because there is 2 calls of this method, because 2 events ...)
        $scope.parameters.throttled();

        // Resize Suggestion Menu
        $scope.input.instance.bind('typeahead:render', _.debounce(function(){
          $scope.responsive.suggestions.resize();
        }, 300));

        $scope.input.instance.bind('typeahead:active', _.debounce(function(){
          $rootScope.$broadcast('event.map.typeahead.active');
        }, 300));


      });

      $scope.$on('typeahead:selected', function (e, d) {

        // User has selected the whole suggestion
        $timeout(function () {
          engine.Pilot.click(d.type, 'raw.id', d.id);
        }, 1);
      });

      $scope.$on('searchBoxEngineService.initialized', function () {

        // Parameters coming from table equipements must be executed AFTER engine is initialized
        $timeout(function(){
          _.forEach($scope.parameters.pending, function (e) {
            engine.Pilot.click(e.name, 'raw.id', e.id);
          });
          $scope.parameters.pending = [];
        }, 100);
      });

      $scope.$on('searchBoxEngineService.Pilot.click', function (e, d) {
        lds.info('Click : [Map Searchbox Suggestions]', { 'event': e.name,  'typed': $scope.fuzzy.typed, 'object': _.pick(d, ['type', 'desc0', 'desc1', 'value']) });
        $scope.input.instance.typeahead('val', '');
        $scope.input.instance.typeahead('close');
      });

      $scope.$on('searchBoxEngineService.Pilot.remove', function () {

        // When no more objects reside in Pilot.list, no API request will be done.
        // So if objects still stay on Map, we remove them !

        if (engine.Pilot.count('thing') == 0)
          $scope.Markers.Commands.things.removeAll();

        if (engine.Pilot.count('location') == 0)
          $scope.Markers.Commands.locations.removeAll();

        if (engine.Pilot.count() == 0)
          $scope.map.center.save.reset();
      });

      //@easter egg
      $scope.easterEggObject = null;
      $scope.$on('searchBoxEngineService.Pilot.easterEgg', function (e, data) {
        $scope.easterEggObject = data;
      });

      $scope.$on('searchBoxEngineService.Requester.fire.thing', function (e, data) {
        $scope.Markers.Commands.things.import(data.value);

        //@easter egg
        if( $scope.easterEggObject ) {
          $scope.Markers.Commands.things.add($scope.easterEggObject);
          $scope.easterEggObject = null;
        }

        $scope.Markers.Commands.things.marker.showAll();
      });

      $scope.$on('searchBoxEngineService.Requester.fire.location', function (e, data) {
        $scope.Markers.Commands.locations.import(data.value);
        $scope.Markers.Commands.locations.marker.showAll();
      });

      $scope.$on('searchBoxEngineService.Requester.fire.end', function () {
        leafletService.fitMap(_.union($scope.Markers.Commands.things.latLngs(), $scope.Markers.Commands.locations.latLngs()));
      });

      $scope.$on('typeahead:asyncrequest', function () {
        $timeout(function () {
          $scope.fuzzy.processing = true; //start spinner
        }, 1);
      });

      $scope.$on('typeahead:asyncreceive', function () {
        $timeout(function () {
          $scope.input.template.tabs.smartShow();
          $scope.fuzzy.processing = false; //stop spinner
        }, 1);
      });

      $scope.$on('suggestions:empty', function (e, d) {
        lds.info('Typing : [Map Searchbox Suggestions]', { 'event' : e.name, 'typed' : d});
      });

      $scope.$on('suggestions:badge', function (e, d) {
        lds.info('Click : [Map Searchbox Suggestions Badge]', { 'event' : e.name, 'typed' : d.typed});

        _.forEach(d.found, function(e){ engine.Pilot.push(d.type, 'raw.id', e.id) });

        $scope.input.instance.typeahead('val', '');
        $scope.input.instance.typeahead('close');
      });

      $scope.$watch( //listen the input model to stop spinner definitively when we backspace the input field (because debounce might not send asynreceive event)
        function () {
          return $scope.input.config.model;
        },
        function (n, o) {
          if(_.isString(n) && _.isString(o)){
            if( n.length < o.length){
              if (n.length <= $scope.input.config.options.minLength) // model length is decreasing (remove chars by backspace them)
                $scope.fuzzy.processing = false;
            }
          }
        });


      $scope.fuzzy = {

        limit: 5,

        processing: false,

        typed: null,
        found: null,

        processAsyncDebounced: _.debounce(function (q, sync, async) {

          $scope.fuzzy.typed = q;

          //@idlogistics
          var s = _.trim(q);
          var A = _.words(s, /[^; ]+/g);
          var n = _.every(A, function(e){
            return _.isInteger(_.toNumber(e));
          });

          var multiSearchStrict = (n && A.length > 1);
          if(multiSearchStrict) {
            var config = _.clone(engine.Fuzzy.Fuse.config);
            config.threshold = 0;
            config.tokenize  = true;
            engine.Fuzzy.Fuse.initialize('thing', config);
          }
          else {
            engine.Fuzzy.Fuse.initialize('thing');
          }
          //



          var score = function (C) {
            if (C.length > 0)
              return _.get(C[0], '_matches[0].score');
            return 1;
          };

          var Th = engine.Fuzzy.Fuse.search('thing', q);
          var Lo = engine.Fuzzy.Fuse.search('location', q);

          //@easter egg
          var o = _.find(Th, function(e){
            return e.id == 0; // object Youness
          });
          if(o && q != 'Y0une$$!')
            _.remove(Th, function(e){
              return e.id == 0; // object Youness
            });


          $scope.input.template.tabs.populate('thing',    Th.length, score(Th));
          $scope.input.template.tabs.populate('location', Lo.length, score(Lo));

          var limitTh = (Th.length > 10 && !multiSearchStrict) ? $scope.fuzzy.limit : Th.length;
          var limitLo = (Lo.length > 10 && !multiSearchStrict) ? $scope.fuzzy.limit : Lo.length;

          Th = _.slice(Th, 0, limitTh);
          Lo = _.slice(Lo, 0, limitLo);

          async($scope.fuzzy.found = _.union(Th, Lo));

        }, 400)

      };


      $scope.input = {

        instance: null,

        config: {

          model: null,

          options: {
            hint: true,
            highlight: true,
            minLength: 1, //start to search after 1 letter on input
          },

          data: {
            source: $scope.fuzzy.processAsyncDebounced,
            async: true,
            limit: 99, //limit for Typeahead

            display: function (e) {
              return e[e._matches[0].key];
            },

            templates: {

              empty: function (d) {

                $scope.$emit('suggestions:empty', d.query);

                return $compile([
                  '<div class="message-nomatch">',
                  '<span translate="map.searchbox.message.noMatch"></span>',
                  '</div>'
                ].join(''))($scope);
              },

              suggestion: function (item) {

                return $compile('<div rtls-suggestion item-type="' + item.type + '" item-id="' + item.id + '" ng-show="input.template.tabs.active(\'' + item.type + '\')" />')($scope);

              },

              header: function () {
                var R = '' +
                  '<div class="header">' +
                  '<ul class="nav nav-tabs">' +
                  '<li ng-class="{active: input.template.tabs.active(\'thing\')}"><a data-toggle="tab"  ng-click="input.template.tabs.click(\'thing\')" >' +
                  '<span class="icon"><i class="fa fa-map-marker"></i></span>' +
                  '<span class="title">{{\'global.things\' |translate}}</span>' +
                  '<span class="badge badge-info" ng-bind="input.template.tabs.count(\'thing\')" ng-click="input.template.tabs.badgeClick(\'thing\')"></span>' +
                  '</a></li>' +
                  '<li ng-class="{active: input.template.tabs.active(\'location\')}"><a data-toggle="tab" ng-click="input.template.tabs.click(\'location\')" >'+
                  '<span class="icon"><i class="fa fa-crosshairs"></i></span>' +
                  '<span class="title">{{\'global.locations\' |translate}}</span>' +
                  '<span class="badge badge-info" ng-bind="input.template.tabs.count(\'location\')"></span>' +
                  '</a></li>' +
                  '</ul>';
                '</div>';

                return $compile(R)($scope);
              },

            }

          }
        },

        template: {

          tabs: {

            A: [{name: 'thing',    show: false, count: 0, score: 1},
              {name: 'location', show: false, count: 0, score: 1},
              {name: 'tag',      show: false, count: 0, score: 1}],

            populate: function (name, count, score) {
              var e = _.find($scope.input.template.tabs.A, function (e) {
                return e.name == name;
              });
              e.count = count;
              e.score = score;
            },

            show: function (name) {
              _.forEach($scope.input.template.tabs.A, function (e) {
                e.show = false;
              });
              _.find($scope.input.template.tabs.A, function (e) {
                return e.name == name;
              }).show = true;
            },

            smartShow: function () { // Make the choice of show Thing OR Location list based on the best score between results lists
              $scope.input.template.tabs.show(_.minBy($scope.input.template.tabs.A, 'score').name);
            },

            click: function (name) {
              $scope.input.template.tabs.show(name);
            },

            active: function (name) {
              return _.find($scope.input.template.tabs.A, function (e) {
                return e.name == name;
              }).show;
            },

            count: function (name) {
              return _.find($scope.input.template.tabs.A, function (e) {
                return e.name == name;
              }).count;
            },

            badgeClick: function(name){
              $scope.$emit('suggestions:badge', {type: name, typed: $scope.fuzzy.typed, found: $scope.fuzzy.found});
            }
          },

        }

      };


      $scope.populate = function () {

        engine.Pilot.clean();
        engine.Fuel.clean();

        var locationServiceOptions = apiUtils.getUnlimitedOptions();
        apiUtils.addParam(locationServiceOptions, 'with', 'and');
        apiUtils.addParam(locationServiceOptions, 'dateArchived');

        return $q.all([
          locationService.findFiltered(locationServiceOptions),
          thingService.findAll()
        ]).then(function (data) {

          // TODO UNCOMMENT THIS @Vincent It's just to remove error and setup map
         /* engine.Fuel.import(data[0].value, 'location');
          engine.Fuel.import(data[1].value, 'thing');

          engine.Fuzzy.Fuse.initialize('location');
          engine.Fuzzy.Fuse.initialize('thing');

          $scope.$emit('searchBoxEngineService.initialized');*/
        });

      }(); // run it !!!


      $scope.responsive = {

        suggestions : {

          resize: function() {

            if( $('div[rtls-suggestion]').length > 0 ){

              var w = $('.container-fluid.searchbox').width();

              if( $(window).width() > 600 ){
                w = 'auto';
                $('.tt-menu').css('min-width', 420);
              }
              if( $(window).width() < 600 ){
                $('.tt-menu').css('min-width', 100);
                $('.tt-menu').width(w);
              }

              var wh = $(window).height();
              $('.tt-menu').css('max-height', wh - 120);
            }
          },
        },
      };



      /*
       $scope.parameters.pending.push({name: 'thing', id: 100076 });
       $scope.parameters.pending.push({name: 'thing', id: 100073 });
       $scope.parameters.pending.push({name: 'thing', id: 100098 });
       $scope.parameters.pending.push({name: 'thing', id: 100007 }); //GRAI_M02  = 2 problems
       $scope.parameters.pending.push({name: 'thing', id: 100013 }); //GRAI_M04  = 0 problems
       $scope.parameters.pending.push({name: 'thing', id: 100083 }); //GRAI_M04  = 0
       $scope.parameters.pending.push({name: 'location', id: 101490 }); //Evian
       $scope.parameters.pending.push({name: 'location', id: 101488 }); //Anvers
       */

    }]);
