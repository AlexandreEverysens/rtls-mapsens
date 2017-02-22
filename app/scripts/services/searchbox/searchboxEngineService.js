/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.service:searchBoxEngineService
 * @description
 * # searchBoxEngineService
 * Service in the rtlsMapsensApp.
 */
angular.module('rtlsMapsensApp')
  .service('searchBoxEngineService', function ($rootScope, $q, thingService, locationService) {

    var self = this;


    this.Event = {

      service: 'searchBoxEngineService',

      broadcast: function (transmitter, data) {
        $rootScope.$broadcast(self.Event.service + '.' + transmitter, data);
      }

    };



    //
    // Fuel : shelter all the selectors data from this account : things, location, tag.
    //        Getting them from API request is delegated. Use import() after getting them to feed the Engine.
    //
    this.Fuel = {

      tanks: [
        {type: 'thing',    tank: []},
        {type: 'location', tank: []},
        {type: 'tag',      tank: []},
      ],

      get: function (type) {
        return _.find(self.Fuel.tanks, ['type', type]);
      },

      find: function (type, id) {
        return _.find(self.Fuel.get(type).tank, function (e) {
          return type == e.type && id == e.id;
        });
      },

      clean: function () {
        _.forEach(self.Fuel.tanks, function (e) {
          e.tank = [];
        });
      },

      import: function (L, type) {
        //self.Fuel.clean();
        _.forEach(L, function (e) {
          self.Fuel.get(type).tank.push(self.Fuel.wrap(e, type));
        });

        //@easter egg
        if( type == 'thing' )
          self.Fuel.get(type).tank.push(self.Fuel.wrap(youness, type));
      },

      wrap: function (o, type) {
        return _.clone({
          id: o.id,
          type: type,
          raw: o
        })
      }

    };


    //
    // Fuzzy : fuzzy logic
    //
    this.Fuzzy = {

      matches: [
        {type: 'thing',    tank: [], Fuse: null},
        {type: 'location', tank: [], Fuse: null},
        {type: 'tag',      tank: [], Fuse: null},
      ],

      get: function (type) {
        return _.find(self.Fuzzy.matches, ['type', type]);
      },

      find: function (type, id) {
        return _.find(self.Fuzzy.get(type).tank, function (e) {
          return type == e.type && id == e.id;
        });
      },

      Fuse: {

        config: {
          caseSensitive: false,
          includeScore: false,
          shouldSort: true,
          tokenize: false,
          threshold: 0.4,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          verbose: false
        },

        initialize: function (type, config) {
          self.Fuzzy.get(type).Fuse = new Fuse(self.Fuel.get(type).tank, config ? config : self.Fuzzy.Fuse.config);
        },

        search: function (type, q) {
          return (self.Fuzzy.get(type).tank = self.Fuzzy.get(type).Fuse.search(q));
        }

      },

    };


    //
    // Pilot : manage User (Pilot) clicks
    //
    this.Pilot = {

      name: 'Pilot',
      list: [],

      clean: function () {
        self.Pilot.list = [];
        self.Event.broadcast('Pilot.remove', 'all');
      },

      equals: function(a, b){
        return   a.type      == b.type &&
          a.category  == b.category &&
          a.attribute == b.attribute &&
          a.value     == b.value;
      },

      get: function (o) {
        return _.find(self.Pilot.list, function (e) {
          return self.Pilot.equals(o, e);
        })
      },

      count: function (p) {
        var countBytype = function (type) {
          return _.filter(self.Pilot.list, function (e) {
            return e.type == type
          }).length;
        };
        switch (p) {
          case 'thing' :
            return countBytype(p);
          case 'location' :
            return countBytype(p);
          default :
            return self.Pilot.list.length;
        }
      },

      push: function (type, key, pid) {

        var o = null;

        //@easter egg
        if( pid == 0){
          var raw = self.Fuel.find(type, pid).raw;
          self.Event.broadcast('Pilot.easterEgg', raw);
        }


        // Build a valid token from reduce data coming from Fuzzy logic
        if( _.isString(type) && _.isString(key) && _.isNumber(pid) ){

          try{
            var raw = self.Fuel.find(type, pid).raw;
          }
          catch(e){
            return console.warn('searchBoxEngineService.Pilot.push() : unable to find => type:'+type +' id:'+pid);
          }

          //var rxcat   = new RegExp('^raw\.([^\.]+)$');
          var rxlastkey = new RegExp('(\.[^\.]*)$');
          var path      = key.replace(/(\.[^\.]*)$/, '');
          var category  = path.match(rxlastkey)[0].match('([a-zA-Z]+)')[0];
          var catfull   = _.replace(key.match('[^\.]*\.[^\.]*$')[0], 'raw.', ''); // twins last keys. example : 'characteristictype.name'

          var o = {
            'type'      : type,     // thing | location
            'category'  : category, // Use to discriminate single selector from group (see token.js)
            'desc0'     : '-',      // Descriptor of the token
            'desc1'     : '-',      // Sub descriptor
            'attribute' : '',       // Attribute for API request
            'value'     : '',       // Value for API request
            'raw'       : raw,      // raw Fuel item in the token
          };

          if( category == 'raw' ){
            // request comes from a click directly on a suggestion (or main text), so it's a parent id
            o.desc0 = raw.name;
            o.desc1 = type;
            o.value = pid;
            o.attribute = 'id';
          }
          else {
            // request comes from a click on a fuzzy highlighted token, so it's a child id
            o.desc0 = _.get(o, key);
            o.desc1 = _.replace(catfull, /\[[0-9*]\]/g, ''); // removes array brackets []
            o.value = _.get(o, path + '.id', '');
            o.attribute = category + '.id';
          }

        }


        // Bypass with already valid built object
        if( _.isObject(type) ){
          o = type;
        }


        if (o && !self.Pilot.get(o)) {   // push only if not already exists in list
          self.Pilot.list.push(o);
          return o;
        }
        return null;
      },

      remove: function (o) {
        self.Event.broadcast('Pilot.remove', _.remove(self.Pilot.list, function(e){ return self.Pilot.equals(o, e) }));
      },

      click: function (type, key, pid) {
        self.Event.broadcast('Pilot.click', self.Pilot.push(type, key, pid));
      },

      watch: function () {

        $rootScope.$watch(
          function () {
            return self.Pilot.list;
          },
          function (list, o) {
            self.Pilot.actions(list, o);
          }, true);
      },

      actions: function (list, o) {
        self.Requester.dispatcher(list);
      }

    };


    //
    // Requester
    //
    this.Requester = {


      dispatcher: function (list) {

        self.Requester.stacks.clean(); //optimisation future : verifier que les items demandés ne sont pas déjà dans tokens/request et ne pas les requeter à nouveau à l'API

        _.forEach(list, function (token) {

          // token comes from "thing" list. We decide what API requests should be made.
          if (token.type == 'thing')
            self.Requester.stacks.push('thing', token);

          // token comes from "location" list. We decide what API requests should be made.
          if (token.type == 'location')
            self.Requester.stacks.push('location', token);
        });

        self.Requester.build();
        return self.Requester.fire();
      },


      clean: function () {

      },


      stacks: {

        container: [
          {name: 'thing',    tokens: [], request: null},
          {name: 'location', tokens: [], request: null},
        ],
        get: function (name) {
          return _.find(self.Requester.stacks.container, ['name', name]);
        },
        push: function (name, token) {
          self.Requester.stacks.get(name).tokens.push(token);
        },
        clean: function () {
          _.forEach(self.Requester.stacks.container, function (e) {
            e.tokens = [];
            e.request = null;
          });
        }
      },


      build: function () {

        _.forEach(self.Requester.stacks.container, function (e) {

          _.forEach(e.tokens, function (token, i) {
            if (i == 0) {
              e.request = _.cloneDeep(self.Requester.syntax.base);
            }
            e.request.predicates[0].predicates.push({
              "attribute" : token.attribute,
              "value"     : token.value,
              "operation" : "EQUALS"
            });
          });

        });

      },


      fire: function () {

        var promises = [];

        _.forEach(self.Requester.stacks.container, function (e) {

          if (e.name == 'thing' && !_.isEmpty(e.request)) {

            e.request.predicates.push({
              "attribute": "enabled",
              "operation": "EQUALS",
              "value": "true"
            });

            promises.push(thingService.JSON.find(e.request).then(function (data) {
              self.Event.broadcast('Requester.fire.thing', data);
            }));
          }

          if (e.name == 'location' && !_.isEmpty(e.request)) {

            /* TODO : manage archived/deleted Locations ! */

            promises.push(locationService.JSON.find(e.request).then(function (data) {
              self.Event.broadcast('Requester.fire.location', data);
            }));
          }

        });

        if (promises.length) {
          return $q.all(promises).then(function () {
            self.Event.broadcast('Requester.fire.end');
          });
        }

        return $q.when([]); // return a resolved promise (nothing has been done in this method !)
      },


      syntax: {
        base: {
          "operator": "AND",
          "predicates": [
            {
              "operator": "OR",
              "predicates": []
            }
          ]
        },
      }


    };


    this.Pilot.watch();




    //@easter egg
    var youness = {
      "id": 0,
      "createdAt": "2016-04-18T08:33:03.430Z",
      "name": "Y0une$$!",
      "enabled": true,
      "dateEnabled": "2016-04-18T08:33:03.430Z",
      "dateLeavingLastKnownLocation": "2016-06-17T14:58:39.000Z",
      "thingGroup": {
        "id": 100015,
        "name": "Who's the boss ?"
      },
      "tag": {
        "id": 100069,
        "currentState": {
          "id": 340,
          "state": "DEPLOYED",
          "date": "2016-04-18T08:32:37.856Z"
        },
        "mac": "Lâche ton 06!"
      },
      "x": 50.6319389,
      "y": 3.0203307,
      "dateLastActivity": "2016-06-17T18:28:38.000Z",
      "dateLastPosition": "2016-06-17T18:28:38.000Z",
      "characteristics": [
        {
          "type": "STRING",
          "id": 0,
          "characteristicType": {
            "type": "STRING",
            "id": 0,
            "name": "Signe Particulier"
          },
          "value": "Chante du Rammstein sous la douche !"
        },
        {
          "type": "STRING",
          "id": 0,
          "characteristicType": {
            "type": "STRING",
            "id": 0,
            "name": "Permis B"
          },
          "value": "Plus rapide qu'Ayrton Senna !"
        },
        {
          "type": "STRING",
          "id": 0,
          "characteristicType": {
            "type": "STRING",
            "id": 0,
            "name": "Nourriture"
          },
          "value": "Exclusivement pains au chocolat !"
        },
      ]
    }



  });

