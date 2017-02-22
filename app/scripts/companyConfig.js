/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

angular.module('rtlsMapsensApp')
  .constant('companyConfig', {

    "idlogistics": {

      "map" :{
        "sidebar" : {
          "historics": {
            "previousDays" : "3",
          },
          "movements" : {
            "dateFormat": {
              "value" : "L LT",
            } ,
            "durationFormat": {
              "value" : "minutes",
              "translate_key" : "time.minutes"
            }
          },
          "travels" : {
            "dateFormat": {
              "value" : "L LT",
            } ,
            "durationFormat": {
              "value" : "minutes",
              "translate_key" : "time.minutes"
            }
          },
        }
      }
    }
  });
