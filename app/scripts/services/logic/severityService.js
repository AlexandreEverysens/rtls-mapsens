/**
 * Created by Darlene Alderson on 21/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.service:severityService
 * @description
 * # severityService
 * Service in the rtlsMapsensApp.
 */
angular.module('rtlsMapsensApp')
  .service('severityService', function () {

    var self = this;

    var severity = {
      val : { NONE: 0,   LOW: 1,   MEDIUM: 2,   HIGH: 4   },
      str : { 0: 'NONE', 1: 'LOW', 2: 'MEDIUM', 4: 'HIGH' }
    };

    var color = {
      human: {NONE: 'green', LOW: 'yellow', MEDIUM: 'orange', HIGH: 'red', UNKNOW: 'black'},
      html: {NONE: '#aec887', LOW: '#f1c40f', MEDIUM: '#fd9f43', HIGH: '#fc6e66', UNKNOW: '#000000'},
    };



    this.level = {

      factory : {

        //private :
        raw : {

          highestFromArray : function (A) {
            var sum = severity.NONE;
            _.each(A, function (k) {
              sum |= severity.val[k];
            });
            if( sum & severity.val.HIGH)   return severity.val.HIGH;
            if( sum & severity.val.MEDIUM) return severity.val.MEDIUM;
            if( sum & severity.val.LOW)    return severity.val.LOW;
            return severity.val.NONE;
          },

          toString : function (raw) {
            return  severity.str[raw];
          }
        },

        //public
        highestFromArray: function (A) {
          var raw = self.level.factory.raw.highestFromArray(A);
          return {
            value: raw,
            string: self.level.factory.raw.toString(raw),
            color: self.color.from.value.get(raw)
          }
        }

      },


      //public
      from : {

        // array of problem objects
        objects: {

          highest: function (APO) {
            return self.level.factory.highestFromArray(_.map(APO, function (e) {
              if (_.has(e, 'severity'))
                return e.severity;
              if (_.has(e, 'highestSeverity'))
                return e.highestSeverity.string;
            }));
          }
        },

        // array of severity strings, example => ['MEDIUM', 'HIGH', 'LOW', ...]
        array : {

          highest: function (A) {
            return self.level.factory.highestFromArray(A);
          }

        }
      }

    };


    this.group = {

      from: {

        array: {

          highest: function (A) {
            // First takes an array of newProblems, GroupBy Type, then extract the highestSeverity and return
            // an array of the groups.
            return _.map(_.groupBy(A, function (e) {
              return e.type;
            }), function (AO) {
              return {
                type: AO[0].type,     // all theses objects are from same type, thanks to GroupBy
                category: AO[0].category, // also same category
                count: AO.length,      // count of problems of same Type
                highestSeverity: self.level.from.objects.highest(AO),
              }
            });

          }
        }
      }

    };


    this.color = {

      from : {

        objects: {

          /*
           highest: function (APO) {
           return color[self.level.factory.highestFromArray(_.map(APO, 'severity')).value];
           }*/
        },

        value: {
          get: function (v) {
            var attr = self.level.factory.raw.toString(v);
            return {
              html: color.html[attr],
              human: color.human[attr],
            }
          }
        }
      }

    }



  });

