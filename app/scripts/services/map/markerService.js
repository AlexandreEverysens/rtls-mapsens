/**
 * Created by Darlene Alderson on 21/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.map.marker
 */
angular.module('rtlsMapsensApp')

  .service("markersService", [ 'severityService', 'rtlsConfig', 'leafletService',
    function(severityService, rtlsConfig, leafletService) {

      var Me = this;


      this.Config = {

        scope : null,
        map   : null,

        initialize: function(scope, map) {
          Me.Config.scope = scope;
          Me.Config.map   = map;
        },

        execute: function(){
          Me.Listeners.things.listen();
          Me.Listeners.locations.listen();
        }
      };



      this.Commands = {

        things : {

          list : [],

          import: function(list){

            var unwrapped = _.map(Me.Commands.things.list, function(t) {
              return t.raw;
            });

            var comparator = function(a,b){
              a.newProblems = _.sortBy(a.newProblems, function(o){ return o.id; });
              b.newProblems = _.sortBy(b.newProblems, function(o){ return o.id; });
              return _.isEqual(a,b);
            };

            // Speed optimization : rather than destroy all things from map (and rebuild all), we evaluate
            // the ones who have to be destroyed and the ones who have to be shown.
            var toRemove = _.differenceWith(unwrapped, list, comparator);
            var toAdd    = _.differenceWith(list, unwrapped, comparator);

            _.each(toRemove, function(raw) {
              Me.Commands.things.remove(raw.id);
            });

            _.each(toAdd, function(raw) {

              if (_.isUndefined(raw.x) || _.isUndefined(raw.y)) {
                raw.x = -75;
                raw.y = 0;
              } //If object doesn't have valid coords, we put it in the middle of Antartica !

              Me.Commands.things.add(raw);
            });

          },
          add : function(raw) {

            var thing = Me.Commands.things.get(raw.id);
            if(thing && _.isEqual(thing.raw, raw))
              return; //It won't add a identical thing in the list

            Me.Commands.things.list.push( Me.Commands.things.wrap(raw) );
          },
          wrap : function(raw){
            return {
              id  : raw.id,
              raw : raw,

              marker: {
                visible: false,
              },
              historics: {
                interval: null,
                list: [],
                step: 'initial',
              },
              newProblemsSummary : Me.Commands.utils.newProblemsSummarize(raw)
            }
          },
          get : function(thingId) {
            return _.find(Me.Commands.things.list, function (t) { return t.id == thingId; });
          },
          each: function(f) {
            _.each(Me.Commands.things.list, f);
          },
          remove: function(thingId){
            Me.Commands.things.list = _.without(Me.Commands.things.list, Me.Commands.things.get(thingId));
          },
          removeAll: function(){
            Me.Commands.things.list = [];
          },
          latLngs: function(thingId){
            if(thingId) {
              var t = Me.Commands.things.get(thingId);
              return L.latLng(_.get(t, 'raw.x'), _.get(t, 'raw.y'));
            }
            else
              return _.compact(_.map(Me.Commands.things.list, function (t) {
                return L.latLng(t.raw.x, t.raw.y)
              }));
          },
          fit: function(thingId) {
            if(thingId)
              leafletService.fitMap([Me.Commands.things.latLngs(thingId)]);
            else
              leafletService.fitMap(Me.Commands.things.latLngs());
          },
          zoom: function(thingId, z){

          },

          marker : {
            show : function(thingId, b) {
              _.set(Me.Commands.things.get(thingId), 'marker.visible', (b == undefined) ? true : b);
            },
            showAll : function() {
              Me.Commands.things.each(function(e){
                Me.Commands.things.marker.show(e.id);
              });
            },
            hide : function(thingId) {
              Me.Commands.things.marker.show(thingId, false);
            },
            hideAll : function() {
              Me.Commands.things.each(function(e){
                Me.Commands.things.marker.hide(e.id);
              });
            },
          },

          historics: {

            show : function(thingId, historics) {
              var thing = Me.Commands.things.get(thingId);
              if( _.isObject(thing) && _.size(historics) > 0) {
                thing.historics.list = historics;
                thing.historics.step = 'show';
              }
              if( _.isObject(thing) && _.size(historics) == 0) {
                thing.historics.list = [];
                thing.historics.step = 'hide';
              }
            },
            hide : function(thingId) {
              Me.Commands.things.historics.show(thingId, []);
            },
            latLngs: function(thingId){
              return _.compact(_.map(Me.Commands.things.get(thingId).historics.list, function (e) {
                return L.latLng(e.x, e.y)
              }));
            },
            fit: function(thingId) {
              leafletService.fitMap(Me.Commands.things.historics.latLngs(thingId));
            },
            //only SAVE the interval. It NOT change anything to historics.list
            interval: function(thingId, startDate, endDate) {

              var t = Me.Commands.things.get(thingId);
              if (t && _.isObjectLike(startDate) && _.isObjectLike(endDate)) {
                t.historics.interval = { startDate: startDate, endDate: endDate };
              }
              return t ? t.historics.interval : null;
            }
          }

        },


        locations : {

          list : [],

          import: function(list){

            Me.Commands.locations.removeAll();

            _.each(list, function(raw) {
              Me.Commands.locations.add(raw);
            });
          },
          add : function(raw) {

            var location = Me.Commands.locations.get(raw.id);
            if(location && _.isEqual(location.raw, raw))
              return;

            Me.Commands.locations.list.push( Me.Commands.locations.wrap(raw) );
          },
          wrap : function(raw){
            return {
              id  : raw.id,
              raw : raw,
              marker: {
                visible: false,
              },
              regions : {
                shape : {
                  visible: [],
                }
              },
              newProblemsSummary : Me.Commands.utils.newProblemsSummarize(raw)
            }
          },
          get : function(locationId) {
            return _.find(Me.Commands.locations.list, function (l) { return l.id == locationId; });
          },
          each: function(f) {
            _.each(Me.Commands.locations.list, f);
          },
          remove: function(locationId){
            Me.Commands.locations.list = _.without(Me.Commands.locations.list, Me.Commands.locations.get(locationId));
          },
          removeAll: function(){
            Me.Commands.locations.list = [];
          },
          latLngs: function(locationId){
            if(locationId) {
              var l = Me.Commands.locations.get(locationId);
              return leafletService.computeLocationCenter(_.get(l, 'raw'));
            }
            else
              return _.compact(_.map(Me.Commands.locations.list, function (l) {
                return leafletService.computeLocationCenter(l.raw);
              }));
          },
          fit: function(locationId) {
            if(locationId)
              leafletService.fitMap([Me.Commands.locations.latLngs(locationId)]);
            else
              leafletService.fitMap((Me.Commands.locations.latLngs()))
          },
          zoom: function(locationId, z){
            var zl = _.get(Me.Commands.locations.get(locationId), 'zoomLevel', 1);
            Me.map.center.zoom = (z==undefined) ? zl : z;
          },

          marker : {
            show : function(locationId, b) {
              _.set(Me.Commands.locations.get(locationId), 'marker.visible', (b == undefined) ? true : b);
            },
            showAll : function() {
              Me.Commands.locations.each(function(e){
                Me.Commands.locations.marker.show(e.id);
              });
            },
            hide : function(locationId) {
              Me.Commands.locations.marker.show(locationId, false);
            },
            hideAll : function() {
              Me.Commands.locations.each(function(e){
                Me.Commands.locations.marker.hide(e.id);
              });
            }
          },

          regions : {

            get: function(locationId, regionId){
              return _.find(_.get(Me.Commands.locations.get(locationId), 'raw.regions'), function (r) {
                return r.id == regionId;
              });
            },

            latLngs: function(locationId){

              var latLngsFromRegion = function(region){
                if(region.type == 'CIRCLE') // Particular case of circle region. We must evaluate the bounding box before call fit.
                {
                  var center        = leafletService.computeRegionCenter(region);
                  var latlngBorder0 = Me.destinationVincenty(center,   0,  region.radius + 5);
                  var latlngBorder1 = Me.destinationVincenty(center, 180,  region.radius + 5);
                  return [latlngBorder0, latlngBorder1];
                }
                if(region.type == 'RECTANGLE'){
                  return [L.latLng(region.northEast), L.latLng(region.southWest)]
                }
                if(region.type == 'POLYGON'){
                  return _.map(region.path, function(e){
                    return L.latLng(e.lat, e.lon);
                  })
                }
                return [];
              };

              var AllLatLngs = [];
              _.forEach(_.get(Me.Commands.locations.get(locationId), 'raw.regions'), function(region) {
                AllLatLngs = _.concat(AllLatLngs, latLngsFromRegion(region));
              });

              return AllLatLngs;
            },
            fit: function(locationId){
              leafletService.fitMap(Me.Commands.locations.regions.latLngs(locationId));
            },

            marker : {
              //TODO;
            },
            shape : {
              show : function(locationId, regionId) {
                //TODO;
              },
              showAll : function(locationId) {
                var l = Me.Commands.locations.get(locationId);
                l.regions.shape.visible = _.map(l.raw.regions, function (r) {
                  return r.id;
                });
              },
              hide : function(locationId, regionId) {
                Me.Commands.locations.get(locationId).regions.shape.visible =
                  _.without(Me.Commands.locations.get(locationId).regions.shape.visible, regionId);
              },
              hideAll : function(locationId) {
                Me.Commands.locations.get(locationId).regions.shape.visible = [];
              },
            }
          }

        },

        utils: {

          newProblemsSummarize: function(o) {

            // Group all problems by Type and then compute their highestSeverity
            var groupByType = severityService.group.from.array.highest(o.newProblems);
            // Compute the very highestSeverity over all the groupBy
            var veryHighestSeverity = severityService.level.from.objects.highest(groupByType);

            return {
              'highestSeverity': veryHighestSeverity,
              'groupByType': groupByType
            }
          }

        },

      };



      //
      // Listeners
      //
      // - Watch all change show/hide request on location.list/thing.list and make it happens in UI
      //
      this.Listeners = {

        Actions : null,

        things : {

          listen: function () {
            Me.Config.scope.$watch(
              function () {
                return Me.Commands.things.list;
              },
              function (n, o) {
                Me.Listeners.things.actions(n, o);
              }, true);
          },

          actions: function(n, o) {

            // MARKERS :
            {
              // Check every thing object to guess if it should be display as marker or not
              _.each(n, function (t) {
                Me.Listeners.Actions.things.marker.show(t.id, t.marker.visible);
              });

              // Check for ghost things : if a thing as been removed in Commands.things.list, it must be delete here.
              _.each(_.difference(Me.ids(o), Me.ids(n)), function (id) {
                Me.Listeners.Actions.things.historics.hide(_.find(o, function (e) { return e.id == id; })); // search the thing object through old (previous) list !
                Me.Listeners.Actions.things.marker.hide(id);
              });
            }

            // HISTORY
            {
              _.each(n, function (t) {
                Me.Listeners.Actions.things.historics.hide(_.find(o, function(e){ return e.id == t.id; }));
                Me.Listeners.Actions.things.historics.show(t);
              });
            }
          }
        },

        locations : {

          listen: function () {
            Me.Config.scope.$watch(
              function(){
                return Me.Commands.locations.list;
              },
              function(n, o) {
                Me.Listeners.locations.actions(n, o);
              }, true);
          },

          actions: function(n, o) {


            // Check every location and there regions to guess if it should be display or not
            {
              _.each(n, function (l) {

                // location . marker
                {
                  if(l.marker.visible)
                    Me.Listeners.Actions.locations.marker.show(l.id);
                  else
                    Me.Listeners.Actions.locations.marker.hide(l.id);
                }

                // location . regions
                var prev = _.find(o, function(e){ return e.id == l.id; });
                if(prev) {
                  Me.Listeners.Actions.locations.region.hide(prev.regions.shape.visible, l.id);
                }
                Me.Listeners.Actions.locations.region.show(l.regions.shape.visible, l.id);


                //console.log("listener.locations.actions (show/hide) : " + l.id);

              });

            }

            // Check for ghost location in marker array
            {
              var locationRemovedList = _.difference(Me.ids(o), Me.ids(n)); // check difference between two : "ids arrays"

              _.each(locationRemovedList, function(locationId) {

                // Hide the centered location marker
                Me.Listeners.Actions.locations.marker.hide(locationId);

                // Hide all regions related to this location
                var l = _.find(o, function (l) { return l.id == locationId; }); // Get the regions via previous list, the current no contains this location anymore.
                Me.Listeners.Actions.locations.region.hide(l.regions.shape.visible, l.id);


                //console.log("listener.locations.actions (ghost) : " + l.id);

              });
            }
          }
        }
      };



      this.Actions = {


        Draws : null, //this.Draws_Leaflet,
        Map   : null, //this.Map_Leaflet,

        things : {

          marker : {

            show : function(thingId, b) {
              //try {
              if(b === false){
                Me.Actions.Draws.things.marker.hide(thingId);
              }else {
                var m =  Me.Actions.Draws.things.marker.build(thingId);
                Me.Actions.Map.marker.add(m, Me.Actions.things.marker.uniq(thingId));
              }
              //} catch(e){ console.error(e); }
            },
            hide : function(thingId){
              Me.Actions.Map.marker.remove(Me.Actions.things.marker.uniq(thingId));
            },
            uniq : function(thingId) {
              return 'marker;thing#'+thingId.toString();
            }
          },

          historics : {

            show : function(thing) {

              _.each(thing.historics.list, function(curr, i){

                var arrow  = true; // default : arrow visible
                var marker = null;
                var next   = (i < thing.historics.list.length) ? thing.historics.list[i+1] : null;
                var locationIdCurr = _.get(curr, 'location.id');
                var locationIdNext = _.get(next, 'location.id');

                //
                // Show history marker, but decides if his arrow should be display or not.
                //
                if( next ){
                  if( _.isNumber(locationIdCurr) && _.isNumber(locationIdNext) )
                    if( locationIdCurr == locationIdNext )
                      arrow = false; // if curr & prev point are in the SAME Location : no arrow, no line
                }
                else
                  arrow = false; // if curr is the last point : no arrow

                Me.Actions.Map.marker.add(
                  Me.Actions.Draws.things.historics.marker.build(thing.id, curr, i, arrow ? L.latLng(next.x, next.y) : 0),
                  Me.Actions.things.historics.uniq('marker', thing.id, i)
                );

                //
                // Show history line
                //
                if( next && arrow )
                {
                  var line = Me.Actions.Draws.things.historics.line.build(L.latLng(curr.x, curr.y), L.latLng(next.x, next.y));
                  line = _.assign(line, { className : Me.Actions.things.historics.uniq('line', thing.id, i) });   // unique string for the class name of the SVG Path in DOM
                  Me.Actions.Map.vector.add(line, Me.Actions.things.historics.uniq('line', thing.id, i) );    // unique string for the path array of angular-leaflet
                }

              });

            },
            hide : function(thing){

              if( !_.isObject(thing) )
                return;

              _.each(thing.historics.list, function(he, i){
                Me.Actions.Map.marker.remove(Me.Actions.things.historics.uniq('marker', thing.id, i));
                Me.Actions.Map.vector.remove(Me.Actions.things.historics.uniq('line',   thing.id, i));
              });

            },

            uniq : function(type, thingId, i) { // example => "marker_history;thing#100007;index_src#28;"
              return type + '_history;thing#' + thingId.toString() + ';index_src#' + i.toString() + ';'; //+ ((j) ? (',#' + j.toString()) : '');
            },
          }
        },

        locations : {

          marker : {

            show : function(locationId) {
              var m =  Me.Actions.Draws.locations.marker.build(locationId);
              Me.Actions.Map.marker.add(m, Me.Actions.locations.marker.uniq(locationId));
            },
            hide : function(locationId){
              Me.Actions.Map.marker.remove(Me.Actions.locations.marker.uniq(locationId));
            },
            uniq : function(locationId) {
              return 'marker_location#'+locationId.toString();
            }
          },

          region : {

            show : function(regionIds, locationId){

              _.each(regionIds, function(regionId){

                var shape = Me.Actions.Draws.locations.region.build(locationId, regionId);
                Me.Actions.Map.vector.add(shape, Me.Actions.locations.region.uniq(locationId, regionId));
              });
            },
            hide : function(regionIds, locationId){

              _.each(regionIds, function(regionId){
                Me.Actions.Map.vector.remove(Me.Actions.locations.region.uniq(locationId, regionId));
              });
            },
            uniq : function(locationId, regionId) {
              return 'location_region_shape#'+locationId.toString() + ',#' + regionId.toString();
            }
          }
        }
      };


      this.Draws_Leaflet = {

        things : {

          marker : {
            build : function(thingId) {
              return _.assign( leafletService.thing.marker.me(Me.Config.scope.$new(), Me.Commands.things.get(thingId)),
                {layer: Me.Config.map.layers.overlays.things.name}); // add overlay for clustering manager
            }
          },

          historics : {

            marker : {
              build: function (thingId, he, options, latLngDst) {
                var marker = leafletService.thing.marker.history(Me.Config.scope.$new(), Me.Commands.things.get(thingId), he, options, latLngDst);
                _.assign(marker, {layer: Me.Config.map.layers.overlays.history.name}); // add overlay for clustering manager
                return _.assign(marker, options);
              }
            },

            line : {
              build : function(latLngSrc, latLngDst, options) {
                return  _.assign({ type: "polyline", color: '#1a82eb', weight: 1, latlngs: [latLngSrc,latLngDst] }, options);
              }
            }
          }
        },

        locations : {

          marker : {
            build : function(locationId) {
              return _.assign(leafletService.location.marker.me(Me.Config.scope.$new(), Me.Commands.locations.get(locationId)),
                {layer: Me.Config.map.layers.overlays.locations.name}); // add overlay for clustering manager
            }
          },

          region : {
            build : function(locationId, regionId) {
              var region = Me.Commands.locations.regions.get(locationId, regionId);
              return leafletService.createShapeFromRegion(region, Me.Commands.locations.get(locationId));
            }
          }
        }

      };


      this.Map_Leaflet = {

        marker : {
          add : function (marker, uniq) {
            Me.Config.map.markers[ Me.Map_Leaflet.utils.markerPathName(uniq) ] = marker;
          },
          remove : function(uniq) {
            delete(Me.Config.map.markers[ Me.Map_Leaflet.utils.markerPathName(uniq) ]);
          },
          get : function(uniq) {
            return Me.Config.map.markers[ Me.Map_Leaflet.utils.markerPathName(uniq) ];
          }
        },

        vector : {

          add : function (vct, uniq) {
            Me.Config.map.paths[ Me.Map_Leaflet.utils.vectorPathName(uniq) ] = vct;
          },
          remove : function(uniq) {
            delete(Me.Config.map.paths[ Me.Map_Leaflet.utils.vectorPathName(uniq) ]);
          }
          //TODO
          /*
           remove() by regular expr (pour les regions par exemple)
           */

        },

        utils : {

          markerPathName :  function(uniq){
            return uniq;
          },
          vectorPathName :  function(uniq){
            return uniq;
          }
        }

      };


      this.Actions.Draws     = this.Draws_Leaflet;
      this.Actions.Map       = this.Map_Leaflet;
      this.Listeners.Actions = this.Actions;
      //this.Listeners.things.listen();
      //this.Listeners.locations.listen();
      //this.Events.leaflet.markers.listen();






      //
      // Utils Methods
      //

      this.ids = function(list){ return _.map(list, function(e){ return e.id; })};

      this.destinationVincenty = function(lonlat, brng, dist) { //@vincent : touched to work with leaflet

        // http://www.movable-type.co.uk/scripts/latlong-vincenty.html#direct

        var VincentyConstants = {
          a: 6378137,
          b: 6356752.3142,
          f: 1/298.257223563
        };


        //var u = L.Util;
        var ct = VincentyConstants;
        var a = ct.a, b = ct.b, f = ct.f;
        var lon1 = lonlat.lng;
        var lat1 = lonlat.lat;
        var s = dist;
        var pi = Math.PI;
        var alpha1 = brng * pi/180 ; //converts brng degrees to radius
        var sinAlpha1 = Math.sin(alpha1);
        var cosAlpha1 = Math.cos(alpha1);
        var tanU1 = (1-f) * Math.tan( lat1 * pi/180 /* converts lat1 degrees to radius */ );
        var cosU1 = 1 / Math.sqrt((1 + tanU1*tanU1)), sinU1 = tanU1*cosU1;
        var sigma1 = Math.atan2(tanU1, cosAlpha1);
        var sinAlpha = cosU1 * sinAlpha1;
        var cosSqAlpha = 1 - sinAlpha*sinAlpha;
        var uSq = cosSqAlpha * (a*a - b*b) / (b*b);
        var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
        var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
        var sigma = s / (b*A), sigmaP = 2*Math.PI;
        while (Math.abs(sigma-sigmaP) > 1e-12) {
          var cos2SigmaM = Math.cos(2*sigma1 + sigma);
          var sinSigma = Math.sin(sigma);
          var cosSigma = Math.cos(sigma);
          var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
            B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
          sigmaP = sigma;
          sigma = s / (b*A) + deltaSigma;
        }
        var tmp = sinU1*sinSigma - cosU1*cosSigma*cosAlpha1;
        var lat2 = Math.atan2(sinU1*cosSigma + cosU1*sinSigma*cosAlpha1,
          (1-f)*Math.sqrt(sinAlpha*sinAlpha + tmp*tmp));
        var lambda = Math.atan2(sinSigma*sinAlpha1, cosU1*cosSigma - sinU1*sinSigma*cosAlpha1);
        var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
        var lam = lambda - (1-C) * f * sinAlpha *
          (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
        var revAz = Math.atan2(sinAlpha, -tmp);  // final bearing
        var lamFunc = lon1 + (lam * 180/pi); //converts lam radius to degrees
        var lat2a = lat2 * 180/pi; //converts lat2a radius to degrees

        return L.latLng(lat2a, lamFunc);
      };


    }]
  );
