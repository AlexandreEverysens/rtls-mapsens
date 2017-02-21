/**
 * Created by Darlene Alderson on 21/02/2017.
 */

'use strict';

/**
 * @ngdoc service
 * @name rtlsApp.service:leafletService
 * @description
 * # leafletService
 * Service in the rtlsApp.
 */
angular.module('rtlsMapsensApp')
  .service('leafletService', function ($timeout, leafletPathsHelpers, leafletMapDefaults, leafletData, severityService) {

    var that = this;


    this.thing = {

      marker: {

        me: function (scope, thing) {

          var R = {
            type: 'thing',
            data: thing,
            lat: _.isNumber(thing.raw.x) ? thing.raw.x : 0,
            lng: _.isNumber(thing.raw.y) ? thing.raw.y : 0,
            highestSeverity: thing.newProblemsSummary.highestSeverity.string, // for clustering color
            zIndexOffset: 3, // allow thing marker to be above an history marker if they are on the same place
            riseOnHover: true,
            icon: {
              type: 'div',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              className : 'marker-thing ' + _.toLower('severity-' + thing.newProblemsSummary.highestSeverity.string),
              popupAnchor:[0,-20],
              html: [
                '<div class="scale">',
                '<span class="fa-stack fa-lg">',
                '<i class="fa fa-map-marker fa-stack-1x layer-low" ></i>',
                '<i class="fa fa-map-marker fa-stack-1x layer-middle"></i>',
                '<i class="fa fa-map-marker fa-stack-1x layer-high" ></i>',
                '</span>',
                '</div>'
              ].join('')
            },
          };

          if( thing.id == 0 )
          {
            R.icon.iconSize = [193, 193],
              R.icon.className += ' easterEgg';
          }

          return R;
        },

        history : function (scope, thing, historics, i, latLngDst) {

          var latLngSrc = L.latLng(historics.x, historics.y);
          var aw        = (latLngDst != 0) ? true : false;

          var arrow = {
            bottom: aw ? '<i class="fa fa-angle-down fa-stack-2x arrow bottom"></i>' : '',
            top   : aw ? '<i class="fa fa-angle-down fa-stack-2x arrow top"></i>'    : ''
          };

          return {
            icon: {
              type: 'div',
              iconSize: [34, 34],
              className : "marker-history",
              html: [
                '<div class="scale">',
                '<div class="rotate" style="transform: rotate(' + that.computeAngle(latLngSrc, latLngDst) + 'deg)">',
                '<span class="fa-stack fa-lg">',
                '<i class="fa fa-circle-o fa-stack-2x pin bottom"></i>',
                arrow.bottom,
                '<i class="fa fa-circle-o fa-stack-2x pin top"></i>',
                arrow.top,
                '</span>',
                '</div>',
                '</div>'
              ].join('')
            },
            message: '<rtls-popup-history-directive thingid="' + thing.id + '" index="' + i + '"></rtls-popup-history-directive>',
            riseOnHover: true,
            getMessageScope: function () { return scope },
            modelId: thing.id,
            lat: historics.x,
            lng: historics.y,
            zIndexOffset: -1,
            popupOptions: {
              autoPan: false //@vincent : fix the _panAnim TypeError
            }
          }
        }
      },

      cluster: {

        me: function (cluster) {

          return new L.DivIcon({
            className: 'clustered cluster-thing ' + _.toLower('severity-' + severityService.level.from.array.highest(that.clusterHighestSeverity(cluster)).string),
            iconSize: [40, 42],
            iconAnchor: [20, 42],
            html: [
              '<div class="scale">',
              '<span class="fa-stack fa-lg">',
              '<i class="fa fa-map-marker fa-stack-1x layer-low" ></i>',
              '<i class="fa fa-map-marker fa-stack-1x layer-middle"></i>',
              '<i class="fa fa-map-marker fa-stack-1x layer-high" ></i>',
              '<i class="fa fa-circle fa-stack-1x layer-hole" ></i>',
              '<i class="fa fa-cubes fa-stack-1x layer-top" ></i>',
              '</span>',
              '<span class="count">' + cluster.getChildCount() + '</span>',
              '</div>'
            ].join('')
          });
        },

        history: function (cluster) {

          return new L.DivIcon({
            className: 'clustered cluster-historic',
            iconSize: [32, 32],
            html: [
              '<div class="scale">',
              '<span class="fa-stack fa-lg">',
              '<i class="fa fa-circle fa-stack-1x layer-low"></i>',
              '<i class="fa fa-circle fa-stack-1x layer-middle"></i>',
              '<i class="fa fa-circle fa-stack-1x layer-high"></i>',
              '</span>',
              '<span class="count">' + cluster.getChildCount() + '</span>',
              '</div>'
            ].join('')
          });
        }
      }

    };



    this.location = {

      marker: {

        me : function (scope, location) {

          var center = that.computeLocationCenter(location.raw);

          return {
            type: 'location',
            data: location,
            lat: center.lat,
            lng: center.lng,
            highestSeverity: location.newProblemsSummary.highestSeverity.string, // for clustering color
            zIndexOffset: 2, // allow thing marker to be above an history marker if they are on the same place
            riseOnHover: true,
            icon: {
              type: 'div',
              iconSize: [32, 32],
              className : "marker-location " +  _.toLower('severity-' + location.newProblemsSummary.highestSeverity.string),
              popupAnchor:[0,-7],
              html : [
                '<div class="scale">',
                '<span class="fa-stack fa-lg">',
                '<i class="fa fa-crosshairs fa-stack-1x layer-low" ></i>',
                '<i class="fa fa-crosshairs fa-stack-1x layer-middle" ></i>',
                '</span>',
                '</div>'
              ].join('')
            }
          }
        }

      },

      cluster: {

        me: function (cluster) {

          return new L.DivIcon({
            className: 'clustered cluster-location ' + _.toLower('severity-' + severityService.level.from.array.highest(that.clusterHighestSeverity(cluster)).string),
            iconSize: [40, 40],
            html: [
              '<div class="scale">',
              '<span class="fa-stack fa-lg">',
              '<i class="fa fa-crosshairs fa-stack-1x layer-low"></i>',
              '<i class="fa fa-crosshairs fa-stack-1x layer-middle"></i>',
              '<i class="fa fa-circle fa-stack-1x layer-high"></i>',
              '</span>',
              '<span class="count">' + cluster.getChildCount() + '</span>',
              '</div>',
            ].join('')
          });
        }

      }

    };


    // Description of polygons that are show when mouse fly over a cluster
    this.polygons = {
      location: {
        default: {
          //fillColor: '#00832C',
          color: '#005783',
          weight: 5,
          opacity: 0.8,
          fillOpacity: 0.2,
        },
        defaultClustered: {
          fillColor: '#00832C',
          color: '#00832C',
          weight: 3,
          opacity: 0.5,
          fillOpacity: 0.2,
          dashArray: '3, 10'
        }
      },
      thing: {
        defaultClustered: {
          fillColor: '#1051AA',
          color: '#1051AA',
          weight: 3,
          opacity: 0.5,
          fillOpacity: 0.2,
          dashArray: '3, 10'
        },
        defaultHistoryClustered: {
          fillColor: '#1051AA',
          color: '#1051AA',
          weight: 3,
          opacity: 0.5,
          fillOpacity: 0.2,
          dashArray: '3, 10'
        }
      }

    };





    /**
     * Functions "Utils"
     *
     */

    this.computeRegionCenter = function(region) {

      if( region.type == "CIRCLE")
      {
        return L.latLng(region.center.lat, region.center.lon);
      }
      if( region.type == "RECTANGLE")
      {
        return L.latLngBounds(
          L.latLng(region.southWest.lat, region.southWest.lon),
          L.latLng(region.northEast.lat, region.northEast.lon)).getCenter();
      }
      if( region.type == "POLYGON" && region.path && region.path.length > 0 )
      {
        return L.polygon(region.path).getBounds().getCenter();
      }

      return L.latLng(0,0);
    };


    this.computeLocationCenter = function(location) {

      var bounds = L.polygon(_.map(_.get(location, 'regions'), function (region) { return that.computeRegionCenter(region); })).getBounds();
      if(bounds.isValid())
        return bounds.getCenter(); // getCenter() : use centroid algorithm

    };


    this.computeAngle = function (latLngSrc, latLngDst) {

      var points = [];
      points.push(latLngSrc);
      points.push(latLngDst);
      var p = 0;
      var diffLat = points[p + 1]["lat"] - points[p]["lat"];
      var diffLng = points[p + 1]["lng"] - points[p]["lng"];
      var angle = 270 - (Math.atan2(diffLat, diffLng) * 57.295779513082);

      return angle;
    };


    this.fitMap = function (arrayOfLatLngs, zoom) {

      var bounds = new L.LatLngBounds(arrayOfLatLngs);

      if(bounds.isValid()){
        leafletData.getMap().then(function (map) {
          map.fitBounds(bounds, {});

          if(zoom != undefined)
            map.setZoom(zoom);
        });
      }
    };


    this.createShapeFromRegion = function (region, location) {
      var shape = {
        modelId: location.id,
        regionId: region.id,
      };

      _.assign(shape, that.polygons.location.default);

      switch (region.type) {
        case 'CIRCLE':
          _.assign(shape, {
            type: 'circle',
            latlngs: {lat: region.center.lat, lng: region.center.lon},
            radius: region.radius
          });
          break;
        case 'RECTANGLE':
          _.assign(shape, {
            type: 'rectangle',
            latlngs: [
              {lat: region.northEast.lat, lng: region.northEast.lon},
              {lat: region.southWest.lat, lng: region.southWest.lon}
            ]
          });
          break;
        case 'POLYGON':
          _.assign(shape, {
            type: 'polygon',
            latlngs: _.map(region.path, function (vertex) {
              return {lat: vertex.lat, lng: vertex.lon};
            })
          });
          break;
        default:
          shape = null;
          break;
      }

      return shape;
    };


    this.clusterHighestSeverity = function(cluster) {
      return _.map(cluster.getAllChildMarkers(), function (marker) {
        return marker.options.highestSeverity;
      });
    };



    this.tileLayers = {
      mapbox: {
        streets: {
          name: 'Mapbox Streets',
          type: 'xyz',
          url: 'https://api.mapbox.com/{version}/mapbox.streets/{z}/{x}/{y}.png?access_token={access_token}',
          layerParams: {
            version: 'v4',
            //access_token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
            access_token: 'pk.eyJ1IjoidGhpYmF1bHRkdWNoYXRlYXUiLCJhIjoiY2lqZXJrcG9tMDAwMXczbTRzZTZtamI2bSJ9.AQyDn8yrLLpm4G5GvHLLeA'
          },
          layerOptions: {
            showOnSelector: false,
          }
        },
        light: {
          name: 'Mapbox Light',
          type: 'xyz',
          url: 'https://api.mapbox.com/{version}/mapbox.light/{z}/{x}/{y}.png?access_token={access_token}',
          layerParams: {
            version: 'v4',
            //access_token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
            access_token: 'pk.eyJ1IjoidGhpYmF1bHRkdWNoYXRlYXUiLCJhIjoiY2lqZXJrcG9tMDAwMXczbTRzZTZtamI2bSJ9.AQyDn8yrLLpm4G5GvHLLeA'
          },
          layerOptions: {
            showOnSelector: false,
          }
        },
        streetsBasic: {
          name: 'Mapbox Basic',
          type: 'xyz',
          url: 'https://api.mapbox.com/{version}/mapbox.streets-basic/{z}/{x}/{y}.png?access_token={access_token}',
          layerParams: {
            version: 'v4',
            //access_token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
            access_token: 'pk.eyJ1IjoidGhpYmF1bHRkdWNoYXRlYXUiLCJhIjoiY2lqZXJrcG9tMDAwMXczbTRzZTZtamI2bSJ9.AQyDn8yrLLpm4G5GvHLLeA'
          },
          layerOptions: {
            showOnSelector: false,
          }
        },
        streetsSatellite: {
          name: 'Mapbox Satellite',
          type: 'xyz',
          url: 'https://api.mapbox.com/{version}/mapbox.streets-satellite/{z}/{x}/{y}.jpg?access_token={access_token}',
          layerParams: {
            version: 'v4',
            //access_token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
            access_token: 'pk.eyJ1IjoidGhpYmF1bHRkdWNoYXRlYXUiLCJhIjoiY2lqZXJrcG9tMDAwMXczbTRzZTZtamI2bSJ9.AQyDn8yrLLpm4G5GvHLLeA'
          },
          layerOptions: {
            showOnSelector: false,
          }
        },
        comic: {
          name: 'Mapbox Comic',
          type: 'xyz',
          url: 'https://api.mapbox.com/{version}/mapbox.comic/{z}/{x}/{y}.png?access_token={access_token}',
          layerParams: {
            version: 'v4',
            //access_token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
            access_token: 'pk.eyJ1IjoidGhpYmF1bHRkdWNoYXRlYXUiLCJhIjoiY2lqZXJrcG9tMDAwMXczbTRzZTZtamI2bSJ9.AQyDn8yrLLpm4G5GvHLLeA'
          }
        }
      },
      cartodb: {
        lightAll: {
          name: 'cartodb',
          type: 'xyz',
          url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        }
      },
      google: {
        googleRoadmap: {
          name: 'Google Streets',
          type: 'google',
          layerType: 'ROADMAP'
        }
      }
    };




  });

