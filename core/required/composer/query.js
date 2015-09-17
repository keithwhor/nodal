module.exports = (function() {

  'use strict';

  const ComposerRecord = require('./record.js');
  const utilities = require('../utilities.js');

  class ComposerQuery {

    constructor(request, query) {

      this._request = request;

      this._query = (query instanceof Array ? query : []).slice();

      this._filters = [];
      this._columns = [];
      this._orderBy = [];
      this._groupBy = [];
      this._transformations = {};

      this._count = 0;
      this._offset = 0;

      this._aggregate = false; // Group, but everything

    }

    __aggregateOrder__() {

      let modelConstructor = this._request._modelConstructor;
      let db = this._request._db;

      if (this._orderBy.length && this._groupBy.length) {
        this._orderBy.filter(order => !order.format).forEach((order, i) => {
          order.format = db.adapter.aggregate(
            modelConstructor.prototype.aggregateBy[order.columnName]
          );
        });
      }

    }

    __parseFilters__(filterObj) {

      let comparators = this._request._db.adapter.comparators;
      let columnLookup = this._request._columnLookup;

      filterObj.hasOwnProperty('__order') &&
        this.orderBy.call(this, filterObj.__order.split(' ')[0], filterObj.__order.split(' ')[1]);

      filterObj.hasOwnProperty('__offset') || filterObj.hasOwnProperty('__count') &&
        this.limit(filterObj.__offset || 0, filterObj.__count || 0);

      return Object.keys(filterObj).map(function(filter) {
        let column = filter.split('__');
        let comparator = column.length > 1 ? column.pop() : 'is';
        column = column.join('__');
        return {
          columnName: column,
          comparator: comparator,
          value: filterObj[filter],
        };
      }).filter(function(v) {
        return columnLookup[v.columnName] && comparators[v.comparator];
      });

    }

    __toSQL__(table, columns, sql, paramOffset) {

      let base = !table;

      table = table || this._request._table;
      columns = columns.length ? columns : this._request._columns;

      let db = this._request._db;

      let modelConstructor = this._request._modelConstructor;

      let multiFilter = db.adapter.createMultiFilter(table, this._filters);
      let params = db.adapter.getParamsFromMultiFilter(multiFilter);

      let generate;

      if (!this._groupBy.length && !this._aggregate) {

        generate = base ? db.adapter.generateSelectQuery.bind(db.adapter) :
          db.adapter.generateNestedSelectQuery.bind(db.adapter, sql);

      } else {

        generate = base ? db.adapter.generateGroupedSelectQuery.bind(
            db.adapter,
            this._groupBy,
            modelConstructor.prototype.aggregateBy
          ) :
          db.adapter.generateNestedGroupedSelectQuery.bind(
            db.adapter,
            sql,
            this._groupBy,
            modelConstructor.prototype.aggregateBy
          );

      }

      return {
        sql: generate(
          table,
          columns,
          multiFilter,
          this._orderBy,
          {count: this._count, offset: this._offset},
          paramOffset
        ),
        params: params
      };

    }

    __prepareQuery__(isSummary) {

      let query = this._query.slice();
      query.push(this);

      let queryCount = query.length;

      let genTable = i => `t${i}`;
      let grouped = !!query.filter(q => q._groupBy.length || q._aggregate).length;

      let columns = Array.from(query.reduce((set, query) => {
        query._columns.forEach(c => set.add(c));
        return set;
      }, new Set())).map(c => this._transformations[c] || c);

      let returnModels = grouped && (columns.length === this._request._columns.length);

      let preparedQuery = query.reduce((prev, query, i) => {
        // If it's a summary, convert the last query to an aggregate query.
        query = ((i === queryCount - 1) && isSummary) ? query.aggregate() : query;
        let select = query.__toSQL__(
          i && genTable(i),
          columns,
          prev.sql,
          prev.params.length
        );
        return {
          sql: select.sql,
          params: prev.params.concat(select.params)
        }
      }, {params: []});

      preparedQuery.grouped = grouped;
      preparedQuery.models = returnModels;
      preparedQuery.columns = columns;

      return preparedQuery;

    }

    __query__(pQuery, callback) {

      this._request._db.query(
        pQuery.sql,
        pQuery.params,
        callback
      );

      return this;

    }

    copy() {

      let copy = new this.constructor(this._query, this._request);

      Object.keys(this).forEach(k => copy[k] = this[k] instanceof Array ? this[k].slice() : this[k]);

      return copy;

    }

    aggregate() {

      let copy = this.copy();
      copy._groupBy = [];
      copy._orderBy = [];
      copy._aggregate = true;

      return copy;

    }

    transform(alias, transformFn, type, isArray) {

      if (typeof transformFn === 'string') {
        transformFn = new Function(transformFn, `return ${transformFn};`);
      }

      if (typeof transformFn !== 'function') {
        throw new Error('.transform requires valid transformation function');
      }

      let columns = utilities.getFunctionParameters(transformFn);

      this._transformations[alias] = {
        alias: alias,
        columns: columns,
        transform: transformFn,
        type: type,
        array: isArray
      };

      return this;

    }

    filter(filters) {

      if (this._filters.length) {
        this._query.push(this);
        let child = new ComposerQuery(this._request, this._query);
        return child.filter.apply(child, arguments);
      }

      if (!(filters instanceof Array)) {
        filters = [].slice.call(arguments);
      }

      this._filters = filters.map(
        this.__parseFilters__.bind(this)
      ).filter(f => f.length);

      return this;

    }

    orderBy(field, direction, formatFunc) {

      if (this._aggregate) {
        throw new Error('Can not call .orderBy on an aggregate query');
      }

      if (!this._request._columnLookup[field]) {
        return this;
      }

      if (typeof formatFunc !== 'function') {
        formatFunc = null;
      }

      this._orderBy.push({
        columnName: field,
        direction: ({'asc': 'ASC', 'desc': 'DESC'}[direction] || 'ASC'),
        format: formatFunc
      });

      this.__aggregateOrder__();

      return this;

    }

    groupBy(field, formatFunc) {

      if (this._aggregate) {
        throw new Error('Can not call .groupBy on an aggregate query');
      }

      if (!this._request._columnLookup[field]) {
        return this;
      }

      if (typeof formatFunc !== 'function') {
        formatFunc = null;
      }

      this._groupBy.push({
        columnName: field,
        format: formatFunc
      });

      this.__aggregateOrder__();

      return this;

    }

    limit(offset, count) {

      if (count === undefined) {
        count = offset;
        offset = offset;
      }

      count = parseInt(count);
      offset = parseInt(offset);

      this._count = Math.min(count, this._count);
      this._offset += offset;

      return this;

    }

    external() {

      return this.interface(this._request._modelConstructor.prototype.externalInterface);

    }

    interface(columns) {

      if (!(columns instanceof Array)) {
        columns = [].slice.call(arguments);
      }

      columns = columns.filter(column => this._request._columnLookup[column] || this._transformations[column])

      this._columns = columns;

      return this;

    }

    end(callback, summary) {

      let modelConstructor = this._request._modelConstructor;

      let pQuery = this.__prepareQuery__();

      this.__query__(
        pQuery,
        (err, result) => {

          let rows = result ? (result.rows || []).slice() : [];
          let models = null;

          pQuery.models && (models = rows.map(function(v) {
            return new modelConstructor(v, true);
          }));

          let record = new ComposerRecord(err, rows, modelConstructor.toResource(pQuery.columns), summary);

          callback.call(this._request, err, record, models);

        }
      );

      return this;

    }

    summarize(callback) {

      let pQuery = this.__prepareQuery__(true);

      this.__query__(
        pQuery,
        (err, result) => {

          this.end(callback, !err && result.rows && result.rows.length ? result.rows[0] : null);

        }
      );

      return this;

    }

  }

  return ComposerQuery;

})();
