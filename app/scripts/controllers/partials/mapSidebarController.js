/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc controller
 * @name rtlsMapsensApp.controller:MapSidebarCtrl
 * @description
 * # MapSidebarCtrl
 * Controller of the rtlsMapsensApp.
 */
angular.module('rtlsMapsensApp')
  .controller('MapSidebarCtrl', ['$rootScope','$scope', '$timeout', 'markersService',
    function ($rootScope, $scope, $timeout, Markers)
    {

      $scope.container = [];
      $scope.classes   = ['_close'];


      //
      // Methods
      //

      // Push a new element in the sidebar (a thing or a location)
      $scope.push = function(type, id){

        if(_.isString(type) && _.isNumber(id)){

          // To be displayed in sidebar, elements have to be ready/requested in Markers Service, because they are API requested after user clicks on some Suggestions.
          // Here, we check that the asked type/id is available, maybe an API request is pending ... (Seen on slow connexion)
          if(type == 'thing'    && !Markers.Commands.things.get(id))    return;
          if(type == 'location' && !Markers.Commands.locations.get(id)) return;

          //
          if(!$scope.find(type, id)){
            $scope.container = []; // !!! Limit to ONE entry visible !!!
            $scope.container.push({type:type, id:id});
            $scope.classes   = ['_open'];
            $rootScope.$broadcast('event.map.tokens', {command: 'hide'});
          }
          else
            $scope.close(type, id); // If user click on the same marker again, it closes sidebar
        }
      };

      // Find if element is already in the sidebar
      $scope.find = function(type, id) {
        return _.find($scope.container, function(e){
          return (e.type == type && e.id == id);
        });
      };

      // Close the sidebar
      $scope.close = function(type, id) {

        //if($scope.find(type, id) || (type === 'force')){
        $scope.container = [];
        $scope.classes   = ['_close'];
        $rootScope.$broadcast('event.map.tokens', {command: 'show'});
        //}
      };

      // Throttling click
      $scope.click = _.throttle(function(d){
        if( _.get(d, 'layerName') == 'things' || _.get(d, 'layerName') == 'locations' ){
          $scope.push(d.model.type, d.model.data.raw.id);
        }
      }, 400, { 'leading': true });


      //
      // Events
      //

      $rootScope.$on('leafletDirectiveMarker.click', function(e, d){
        $scope.click(d);
      });

      $rootScope.$on('event.map.tokens.dblclick', function(e, d){
        $scope.push(d.type, d.id);
      });

      $rootScope.$on('event.thingDirective.close', function(e, d){
        $scope.close('thing', d.id);
      });

      $rootScope.$on('locationDirective.close', function(e, d){
        $scope.close('location', d.id);
      });

      $rootScope.$on('event.map.typeahead.active', function(){
        $timeout(function(){
          $scope.close('force');
        }, 25)
      });



    }]);
