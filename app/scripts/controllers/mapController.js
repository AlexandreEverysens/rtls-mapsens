/**
 * Created by Darlene Alderson on 21/02/2017.
 */
'use strict';

/**
 * @ngdoc function
 * @name rtlsMapsensApp.controller:MapCtrl
 * @description
 * # MapCtrl
 * Controller of the rtlsMapsensApp
 */
angular.module('rtlsMapsensApp')
  .controller('MapCtrl',
    ['$scope', '$q', '$timeout', 'leafletService', 'leafletData', 'leafletMarkerEvents', 'markersService',
    function ($scope, $q, $timeout, leafletService, leafletData, leafletMarkerEvents, markersService) {

    $scope.Markers = markersService;
    $scope.Events = {
      leaflet : {
        markers: {
          utils: {
            getThingId: function(s) {
              var R = null;
              try {
                R = s.match(/thing#([0-9]+)/)[1];
              } catch (e) {}
              return R;
            },
            getIndexSrc: function(s) {
              var R = null;
              try {
                R = s.match(/index_src#([0-9]+)/)[1];
              } catch (e) {}
              return R;
            },
            scale: function(elem, value) {
              elem = (!elem.is('div.leaflet-marker-icon')) ? elem.parents('div.leaflet-marker-icon') : elem;
              elem.find('div.scale').css('transform', 'scale(' + (_.isNumber(value) ? value : 1).toString() + ')');
            },
            stroke : function(thingId, index, disable){
              $('[class*="thing#'+thingId+';"]').filter('[class*="index_src#'+index+';"]').
              attr({'stroke-width': disable ? 1 : 4})
            },
          },
          listen: function(){
            //
            // Scale the Marker on mouseover and thicken the stroke between historic points
            //
            var markerEvents = leafletMarkerEvents.getAvailableEvents();
            for (var k in markerEvents) {
              var eventName = 'leafletDirectiveMarker.' + markerEvents[k];

              $scope.$on(eventName, function (event, args) {

                var layerName = _.get(args, 'layerName');
                var modelName = _.get(args, 'modelName');
                var type      = _.get(args, 'leafletEvent.type');

                if( (type == 'mouseover' || type == 'mouseout') && layerName == 'history' &&
                  _.startsWith(modelName, 'marker_history')) {

                  $scope.Events.leaflet.markers.utils.stroke(
                    $scope.Events.leaflet.markers.utils.getThingId (modelName),
                    $scope.Events.leaflet.markers.utils.getIndexSrc(modelName),
                    (type == 'mouseout') ? true : false
                  );
                }

                if( (type == 'mouseover' || type == 'mouseout') &&
                  (
                    layerName == 'things'    ||
                    layerName == 'locations' ||
                    layerName == 'history'
                  ) &&
                  _.startsWith(modelName, 'marker')) {

                  $scope.Events.leaflet.markers.utils.scale(
                    $(args.leafletEvent.originalEvent.srcElement || args.leafletEvent.originalEvent.originalTarget), // Chrome|IE : scrElement / Firefox : originalTarget
                    (type == 'mouseover') ? 1.3 : null
                  );
                }

              });
            }


            //
            // Scale the Cluster on mouseover
            //
            $timeout(function(){
              leafletData.getLayers().then(function(layers) {
                _.forEach(layers.overlays, function(l){
                  _.forEach(['clustermouseover', 'clustermouseout'], function(n){
                    l.on(n, function (args) {

                      var type = _.get(args, 'type');
                      if( (type == 'clustermouseover' || type == 'clustermouseout')) {

                        $scope.Events.leaflet.markers.utils.scale(
                          $(args.originalEvent.srcElement || args.originalEvent.originalTarget),
                          (type == 'clustermouseover') ? 1.3 : null
                        );
                      }

                    });
                  })
                })
              });
            }, 100);


          },
        }
      }
    };

    /**
     * Map configuration
     */
    $scope.map = {
      //paddingTopLeft:[500, 500],
      center: {
        autoDiscover: true,
        zoom: 7,
        save: {
          zoom: 1,
          lat: 0,
          lng: 0,

          current: function(){
            $scope.map.center.save.zoom = $scope.map.center.zoom;
            $scope.map.center.save.lat  = $scope.map.center.lat;
            $scope.map.center.save.lng  = $scope.map.center.lng;
          },
          reset: function(){
            $scope.map.center.zoom = $scope.map.center.save.zoom;
            $scope.map.center.lat  = $scope.map.center.save.lat;
            $scope.map.center.lng  = $scope.map.center.save.lng;
          }
        }
      },
      events: {
        map: {
          enable: ['zoomstart', 'drag', 'click', 'popupopen', 'popupclose', 'load'],
          logic: 'emit'
        }
      },

      markers: {},
      paths: {},
      layers: {
        baselayers: {

          streets: _.clone(leafletService.tileLayers.mapbox.streetsBasic),
          //mapbox_streets   : _.clone(leafletService.tileLayers.mapbox.streets),
          //mapbox_satellite : _.clone(leafletService.tileLayers.mapbox.streetsSatellite)
        },
        overlays: {
          things: {
            name: 'things',
            type: 'markercluster',
            visible: true,
            layerOptions: {
              iconCreateFunction: function (cluster) {
                return leafletService.thing.cluster.me(cluster);
              },
              polygonOptions: leafletService.polygons.thing.defaultClustered,
              //attribution: ''
            },
            layerParams: {
              showOnSelector: false,
            }
          },
          locations: {
            name: 'locations',
            type: 'markercluster',
            visible: true,

            layerOptions: {
              iconCreateFunction: function (cluster) {
                return leafletService.location.cluster.me(cluster);
              },
              polygonOptions: leafletService.polygons.location.defaultClustered,
              //attribution: ''
            },
            layerParams: {
              showOnSelector: false,
            }
          },
          history: {
            name: 'history',
            type: 'markercluster',
            visible: true,

            layerOptions: {
              iconCreateFunction: function (cluster) {
                return leafletService.thing.cluster.history(cluster);
              },
              polygonOptions: leafletService.polygons.thing.defaultHistoryClustered,
              maxClusterRadius:40,
              //attribution: ''
            },
            layerParams: {
              showOnSelector: false,
            }
          }
        }
      },
      defaults: {
        minZoom: 2,
        zoomControlPosition: 'bottomright'
      }
    };

    $scope.$on('leafletDirectiveMap.load', function(event, a, b){
      //$scope.eventDetected = "ZoomStart";
      //console.log($scope.map.center)
      $scope.map.center.save.current();
    });
    $scope.$on('leafletDirectiveMap.popupclose', function(event, a, b){
      //$scope.eventDetected = "ZoomStart";
      //console.log('leafletDirectiveMap.popupclose !')
    });

    leafletData.getMap().then(function (map) {

      // Refresh cluster icons on zoom end, so that they have the right color depending on severity
      map.on('zoomend', function (currentState) {
        leafletData.getLayers().then(function (layers) {
          layers.overlays.things.refreshClusters();
          layers.overlays.locations.refreshClusters();
        });
      });

      map.on('popupclose', function(e) {
        setTimeout(function(){
          //$scope.Popups.things.historics.total_reset();
        },10);
      });


      // Center marker on map
      leafletData.getLayers().then(function (layers) {
        _.each([layers.overlays.things, layers.overlays.locations], function (layer) { //@vincent : only fit at click on things|locations and NO at historics or others markers
          layer.on('click', function (event) {
            map.panTo(event.layer.getLatLng());
          });
        });
      });
    });

    /**
     * Map interactions
     */

    $scope.Markers.Config.initialize($scope, $scope.map);
    $scope.Markers.Config.execute();
    $scope.Events.leaflet.markers.listen();
  }]);
