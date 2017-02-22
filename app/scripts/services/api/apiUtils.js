/**
 * Created by Darlene Alderson on 22/02/2017.
 */
'use strict';

/**
 * @ngdoc service
 * @name rtlsMapsensApp.apiUtils
 * @description
 * # apiUtils
 * Service in the rtlsMapsensApp.
 */
angular.module('rtlsMapsensApp')
  .service('apiUtils', function (Restangular, rtlsConfig) {

    var _this = this;
    var defaultLimit = rtlsConfig.tabs.defaultLimit;
    var defaultPageNumber = rtlsConfig.tabs.defaultPageNumber;
    var defaultQuery = null;
    var defaultSort = null;

    this.queryToQ = function (query, type) {

      if (_.isUndefined(type)) {
        type = "text";
      }

      if (!query) {
        return '';
      }

      if (typeof query !== 'object') {
        throw "query should be an object";
      }

      if (!_.size(query)) {
        return null;
      }

      var dotized = dotize.convert(query);
      var q = _.reduce(dotized, function (accu, item, key) {
        if (accu) {
          accu += ',';
        }

        item = item.replace(/,/g, "\\,").replace(/=/g, "\\="); //escape "," and "=" in the query fields !

        switch (type) {
          case "text":
            accu += key + '=*' + item + '*';
            break;
          case "enum":
            accu += key + '=' + item;
            break;
        }
        return accu;
      }, '');

      return q;
    };

    /**
     * Returns an object containing the default options to be passed to the RTLS API.
     * @returns {{limit: (string|string), first-result: (string|string), query: *, sort: *}}
     */
    this.getDefaultOptions = function () {
      return {
        limit: defaultLimit,
        'first-result': defaultPageNumber,
        query: defaultQuery,
        sort: defaultSort
      };
    };

    this.getUnlimitedOptions = function () {
      return {
        limit: -1
      };
    };

    /**
     *
     * @param {Object} options The object to convert into a RTLS API-compatible object.
     */
    this.toRtlsOptions = function (options) {

      var rtlsOptions = {};

      if (options.limit) {
        rtlsOptions.limit = options.limit || defaultLimit;
      }
      if (options['first-result']) {
        rtlsOptions['first-result'] = options['first-result'] || defaultPageNumber;
      }
      //if (options.sort) {
      rtlsOptions.sortBy = options.sort ? options.sort.sortBy : null;
      //}
      //if (options.sort) {
      rtlsOptions.sortOrder = options.sort ? options.sort.sortOrder : null;
      //}

      rtlsOptions.q = '';

      if (_.has(options, 'query')) {
        var dotizedQuery = this.queryToQ(options.query);
        this._addStringQueryParam(rtlsOptions, dotizedQuery);
      }

      if (_.has(options, 'searchableParams')) {
        _.forEach(options.searchableParams, function (searchableParam) {
          _this._addSearchableQueryParam(rtlsOptions, searchableParam.paramName, searchableParam.paramValue);
        });
      }

      if (_.has(options, 'fixedParams')) {
        _.forEach(options.fixedParams, function (fixedParam) {
          _this._addFixedQueryParam(rtlsOptions, fixedParam.paramName, fixedParam.paramValue);
        });
      }

      if (_.has(options, 'stringParams')) {
        _.forEach(options.stringParams, function (stringParam) {
          _this._addStringQueryParam(rtlsOptions, stringParam);
        });
      }

      if (rtlsOptions.q === '' || rtlsOptions.q === null || rtlsOptions.q === undefined) {
        rtlsOptions = _.omit(rtlsOptions, 'q');
      }

      return rtlsOptions;
    };

    /**
     * Add a new searchable parameter to the passed object.
     * A searchable parameter is likely to be used with the search syntax (such as *value*).
     * @param {Object} options The object to update with the passed parameter.
     * @param {string} paramName The parameter name.
     * @param {string} paramValue The parameter value.
     */
    this.addSearchableParam = function (options, paramName, paramValue) {

      if (paramValue !== '') {
        if (!_.has(options, 'searchableParams')) {
          options.searchableParams = [];
        }

        options.searchableParams.push({"paramName": paramName, "paramValue": paramValue});
      }
    };

    /**
     * Add a new parameter to the passed object.
     * The parameter has a fixed value here.
     * @param {Object} options The object to update with the passed parameter.
     * @param {string} paramName The parameter name.
     * @param {string} paramValue The parameter value.
     */
    this.addParam = function (options, paramName, paramValue) {

      if (!_.has(options, 'fixedParams')) {
        options.fixedParams = [];
      }
      options.fixedParams.push({"paramName": paramName, "paramValue": paramValue});

    };
    /**
     * Add a new string as a query parameter.
     * @param options The object to update with the passed parameter.
     * @param {string} stringParam The string to append as a query parameter.
     */
    this.addStringParam = function (options, stringParam) {
      if (!_.has(options, 'stringParams')) {
        options.stringParams = [];
      }
      options.stringParams.push(stringParam);
    };

    // Private functions

    this._addSearchableQueryParam = function (options, param, value) {

      if (value !== '') {
        if (options.q) {
          options.q += ',' + param + '=*' + value + '*';
        }
        else {
          options.q = param + '=*' + value + '*';
        }
      }
    };

    this._addFixedQueryParam = function (options, param, value) {

      if(value == undefined) { //@vincent : to manage param like "dateArchived=" with NO value
        return options.q = param + '=';
      }

      if (value !== '') {
        if (options.q) {
          options.q += ',' + param + '=' + value;
        }
        else {
          options.q = param + '=' + value;
        }
      }

    };

    this._addStringQueryParam = function (options, string) {

      if (string !== '') {
        if (options.q) {
          options.q += ',' + string;
        }
        else {
          options.q = string;
        }
      }
    };
  });

