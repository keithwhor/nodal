module.exports = (function() {

  'use strict';

  const ComposerRecord = require('./record.js');

  class ComposerQuery {

    constructor(request, query) {

      this._request = request;

      this._query = (query instanceof Array ? query : []).slice();

      this._filters = [];
      this._columns = [];
      this._orderBy = [];
      this._groupBy = [];
      this._count = 0;
      this._offset = 0;

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

      if (!this._groupBy.length) {
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

      return this.values(this._request._modelConstructor.prototype.externalInterface);

    }

    values(columns) {

      if (!(columns instanceof Array)) {
        columns = [].slice.call(arguments);
      }

      columns = columns.filter(column => this._request._columnLookup[column])

      this._columns = columns;

      return this;

    }

    end(callback) {

      let query = this._query.slice();
      query.push(this);

      let genTable = i => `__T${i}__`;
      let grouped = !!query.filter(q => q._groupBy.length).length;
      let columns = query.reduce((prev, query) => {
        return query._columns.length ? query._columns.slice() : prev;
      }, []);
      let returnModels = grouped && (columns.length === this._request._columns.length);

      let queryConcat = query.reduce((prev, query, i) => {
        let select = query.__toSQL__(i && genTable(i), columns, prev.sql, prev.params.length);
        return {
          sql: select.sql,
          params: prev.params.concat(select.params)
        }
      }, {params: []});

      let db = this._request._db;
      let modelConstructor = this._request._modelConstructor;

      db.query(
        queryConcat.sql,
        queryConcat.params,
        (err, result) => {

          let rows = result ? (result.rows || []).slice() : [];
          let models = null;

          returnModels && (models = rows.map(function(v) {
            return new modelConstructor(v, true);
          }));

          let record = new ComposerRecord(err, rows, modelConstructor.toResource(columns));

          callback.call(this._request, err, record, models);

        }
      );

      return this;

    }

  }

  return ComposerQuery;

})();
