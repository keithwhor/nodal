module.exports = (function() {

  'use strict';

  const ModelArray = require('../model_array.js');
  const utilities = require('../utilities.js');

  class Composer {

    constructor(db, modelConstructor, query) {

      this._db = db;
      this._modelConstructor = modelConstructor;
      this._modelTable = modelConstructor.prototype.schema.table;
      this._modelColumns = modelConstructor.prototype.schema.columns.map(v => v.name);
      this._modelColumnLookup = this._modelColumns.reduce((obj, c) => { return (obj[c] = true), obj; }, {});
      this._modelRelationshipLookup = Object.assign({}, modelConstructor.prototype._joins);

      this._query = (query instanceof Array ? query : []).slice();

      this._filters = [];
      this._columns = [];
      this._orderBy = [];
      this._groupBy = null;
      this._joinArray = [];

      this._joinedColumns = [];

      this._transformations = {};

      this._count = 0;
      this._offset = 0;

    }

    __aggregateOrder__() {

      let modelConstructor = this._modelConstructor;
      let db = this._db;

      if (this._orderBy.length && this._groupBy) {
        this._orderBy.filter(order => !order.format).forEach((order, i) => {
          order.format = db.adapter.aggregate(
            modelConstructor.prototype.aggregateBy[order.columnName]
          );
        });
      }

    }

    __parseFilters__(filterObj) {

      let comparators = this._db.adapter.comparators;
      let columnLookup = this._modelColumnLookup;
      let relationshipLookup = this._modelRelationshipLookup;

      filterObj.hasOwnProperty('__order') &&
        this.orderBy.call(this, filterObj.__order.split(' ')[0], filterObj.__order.split(' ')[1]);

      filterObj.hasOwnProperty('__offset') || filterObj.hasOwnProperty('__count') &&
        this.limit(filterObj.__offset || 0, filterObj.__count || 0);

      Object.keys(filterObj)
        .filter(filter => relationshipLookup[filter])
        .forEach(filter => {
          let rel = relationshipLookup[filter];
          filterObj[rel.via] = filterObj[filter].get('id');
          delete filterObj[filter];
        });

      return Object.keys(filterObj)
        .map(filter => {

          let column = filter.split('__');
          let table = null;
          let rel = relationshipLookup[column[0]];

          if (rel) {
            column.shift();
            table = rel.model.prototype.schema.table;
          }

          let comparator = column.length > 1 ? column.pop() : 'is';
          column = column.join('__');

          // block out bad column names
          if (rel) {
            if (!rel.model.prototype.schema.columns.filter(c => c.name === column).length) {
              console.log('NULL');
              return null;
            }
          } else if (!columnLookup[column]) {
            return null;
          }

          if (!comparators[comparator]) {
            return null;
          }

          return {
            table: table,
            columnName: column,
            comparator: comparator,
            value: filterObj[filter],
          };

        })
        .filter(v => {
          return !!v;
        });

    }

    __prepareAggregateBy__(table, columns) {

      let modelConstructor = this._modelConstructor;
      let relationships = modelConstructor.prototype._joins;

      let aggregateBy = {};
      aggregateBy[table] = {};

      columns.filter(c => typeof c === 'string')
        .forEach(c => aggregateBy[table][c] = modelConstructor.prototype.aggregateBy[c]);

      columns.filter(c => c.transform)
        .forEach(c => {
          c.columns.forEach(c => aggregateBy[table][c] = modelConstructor.prototype.aggregateBy[c]);
        })

      columns.filter(c => c.relationship)
        .forEach(c => {
          aggregateBy[c.table] = aggregateBy[c.table] || {};
          aggregateBy[c.table][c.column] = relationships[c.relationship].model.prototype.aggregateBy[c.column];
        });

      return aggregateBy;

    }

    __toSQL__(table, columns, sql, paramOffset) {

      let base = !table;

      table = table || this._modelTable;

      let db = this._db;

      let modelConstructor = this._modelConstructor;

      let multiFilter = db.adapter.createMultiFilter(table, this._filters);
      let params = db.adapter.getParamsFromMultiFilter(multiFilter);

      return {
        sql: db.adapter.generateSelectQuery(
          base ? null : sql,
          table,
          columns,
          multiFilter,
          this._joinArray,
          this._groupBy,
          this.__prepareAggregateBy__(table, columns),
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
      let grouped = !!query.filter(q => q._groupBy).length;

      // let columns = Array.from(query.reduce((set, query) => {
      //   query._columns.forEach(c => set.add(c));
      //   return set;
      // }, new Set())).map(c => this._transformations[c] || c);
      let columns = this._columns.map(c => {
        if (typeof c === 'object' && c !== null) {
          let relationship = Object.keys(c)[0];
          console.log(c[relationship]);
          return c[relationship].map(name => {
            return this._joinedColumns.filter(jc => {
              return jc.relationship === relationship && jc.column === name;
            }).pop();
          });
        }
        return this._transformations[c] || c;
      }).filter(c => c);

      columns = [].concat.apply([], columns);

      if (!columns.length) {

        // If no columns specified, grab everything...

        columns = this._modelColumns.concat(
          Object.keys(this._transformations).map(t => this._transformations[t]),
          this._joinedColumns
        );

      }

      let returnModels = !grouped && (
        columns.filter(c => typeof(c) === 'string').length === this._modelColumns.length
      );

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

      this._db.query(
        pQuery.sql,
        pQuery.params,
        callback
      );

      return this;

    }

    copy() {

      let copy = new Composer(this._db, this._modelConstructor, this._query);

      Object.keys(this).forEach(k => copy[k] = this[k] instanceof Array ? this[k].slice() : this[k]);

      return copy;

    }

    aggregate() {

      let copy = this.copy();
      copy._groupBy = [];
      copy._orderBy = [];

      return copy;

    }

    __parseColumns__(columns) {

      let relationships = {};
      let tables = [];

      columns = columns.map((c, i) => {

        let colSplit = c.split('__');
        let colRelationshipName = colSplit.length > 1 ? colSplit.shift() : null;
        let colName = colSplit.join('__');

        if (colRelationshipName) {

          let rel = (
            relationships[colRelationshipName] = relationships[colRelationshipName] ||
              this.__getRelationship__(colRelationshipName)
          );

          if (!rel) {
            throw new Error(`Model has no relationship "${colRelationshipName}"`);
          }

          if (!rel.model.prototype.schema.columns.filter(c => c.name === colName).length) {
            throw new Error(`Model relationship "${colRelationshipName}" has no column "${colName}"`);
          }

          tables.push(rel.model.prototype.schema.table);

        } else {

          if (!this._modelColumnLookup[colName]) {
            throw new Error(`Model has no column "${colName}"`);
          }

          tables.push(null);

        }

        return colName;

      });

      return {
        tables: tables,
        columns: columns
      };

    }

    transform(alias, transformFn, type, isArray, useAggregate) {

      if (typeof transformFn === 'string') {
        transformFn = new Function(transformFn, `return ${transformFn};`);
      }

      if (typeof transformFn !== 'function') {
        throw new Error('.transform requires valid transformation function');
      }

      let columns = utilities.getFunctionParameters(transformFn);

      let parsedColumns = this.__parseColumns__(columns);

      this._transformations[alias] = {
        alias: alias,
        tables: parsedColumns.tables,
        columns: parsedColumns.columns,
        transform: transformFn,
        type: type,
        array: isArray,
        useAggregate: !!useAggregate
      };

      return this;

    }

    stransform(alias, transformFn, type, isArray) {

      return this.transform(alias, transformFn, type, isArray, true);

    }

    filter(filters) {

      if (this._filters.length) {
        this._query.push(this);
        let child = new Composer(this._db, this._modelConstructor, this._query);
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

    join(relationship, columns) {

      let relationships = this._modelConstructor.prototype._joins;
      let rel = Object.keys(relationships)
        .filter(name => name === relationship)
        .map(name => relationships[name])
        .pop();

      if (!rel) {
        throw new Error(`Model "${this._modelConstructor.name}" has no relation "${relationship}"`);
      }

      this._joinArray.push({
        table: rel.model.prototype.schema.table,
        field: 'id',
        baseField: rel.via
      });

      let columnLookup = rel.model.prototype.schema.columns
        .reduce((obj, c) => ((obj[c.name] = c), obj), {});

      columns = columns || Object.keys(columnLookup);

      this._joinedColumns = this._joinedColumns.concat(
        columns.map(column => {
          return {
            table: rel.model.prototype.schema.table,
            relationship: relationship,
            alias: `${relationship}\$${column}`,
            column: column,
            type: columnLookup[column].type
          }
        })
      );

      return this;

    }

    orderBy(field, direction, formatFunc) {

      if (this._groupBy && !this._groupBy.length) {
        throw new Error('Can not call .orderBy on a standalone aggregate query');
      }

      if (!this._modelColumnLookup[field]) {
        return this;
      }

      if (typeof formatFunc !== 'function') {
        formatFunc = null;
      }

      this._orderBy.push({
        columnName: field,
        direction: ({'asc': 'ASC', 'desc': 'DESC'}[(direction + '').toLowerCase()] || 'ASC'),
        format: formatFunc
      });

      this.__aggregateOrder__();

      return this;

    }

    __getRelationship__(field) {

      if (!field) {
        return undefined;
      }

      let relationships = this._modelConstructor.prototype._joins;
      return Object.keys(relationships)
        .filter(name => name === field)
        .map(name => relationships[name])
        .pop();

    }

    groupByRelationship(rel) {

      let table = rel.model.prototype.schema.table;
      this._groupBy = (this._groupBy || []).concat(
        rel.model.prototype.schema.columns.map(c => {
          return {
            tables: [table],
            columns: [c.name],
            format: null
          };
        })
      );

      this.__aggregateOrder__();

      return this;

    }

    groupBy(columns, formatFunc) {

      if (typeof columns === 'function') {

        formatFunc = columns;
        columns = utilities.getFunctionParameters(formatFunc);

      } else {

        if (typeof columns === 'string') {

          let rel = this.__getRelationship__(columns);
          if (rel) {
            return this.groupByRelationship(rel);
          }

          columns = [columns];

        }

      }

      let parsedColumns = this.__parseColumns__(columns);

      if (typeof formatFunc !== 'function') {
        formatFunc = null;
      }

      this._groupBy = this._groupBy || [];

      this._groupBy.push({
        tables: parsedColumns.tables,
        columns: parsedColumns.columns,
        format: formatFunc
      });

      this.__aggregateOrder__();

      return this;

    }

    limit(offset, count) {

      if (count === undefined) {
        count = offset;
        offset = 0;
      }

      count = parseInt(count);
      offset = parseInt(offset);

      this._count = this._count ? Math.min(count, this._count) : Math.max(count, 0);
      this._offset += offset;

      return this;

    }

    // TODO: Deprecate

    interface(columns) {

      if (!(columns instanceof Array)) {
        columns = [].slice.call(arguments);
      }

      columns = columns.filter(column => {
        return column && (typeof(column) === 'object') || this._modelColumnLookup[column] || this._transformations[column]
      });

      this._columns = columns;

      return this;

    }

    update(fields, callback) {

      this.interface('id');

      let db = this._db;
      let modelConstructor = this._modelConstructor;
      let pQuery = this.__prepareQuery__();

      let columns = Object.keys(fields);
      let params = columns.map(c => fields[c]);

      pQuery.sql = db.adapter.generateUpdateAllQuery(
        modelConstructor.prototype.schema.table,
        'id',
        columns,
        pQuery.params.length,
        pQuery.sql
      );

      pQuery.params = pQuery.params.concat(params);

      this.__query__(
        pQuery,
        (err, result) => {

          let rows = result ? (result.rows || []).slice() : [];

          let models = new ModelArray(modelConstructor);
          models.push.apply(models, rows.map(r => new modelConstructor(r, true)));

          callback.call(this, err, models);

        }
      )

    }

    end(callback, summary) {

      let modelConstructor = this._modelConstructor;

      let pQuery = this.__prepareQuery__();

      this.__query__(
        pQuery,
        (err, result) => {

          let rows = result ? (result.rows || []).slice() : [];
          let models;

          if (pQuery.models) {

            models = new ModelArray(modelConstructor);

            models.push.apply(
              models,
              rows.map(row => {

                let model = new modelConstructor(row, true);

                // Create new models out of relationships...
                let relationships = {};

                Object.keys(row).forEach(key => {
                  let index = key.indexOf('$');
                  if (index >= 0) {
                    let mainKey = key.substr(0, index);
                    let subKey = key.substr(index + 1);
                    relationships[mainKey] = relationships[mainKey] || {}
                    relationships[mainKey][subKey] = row[key];
                    return;
                  }
                });

                Object.keys(relationships).forEach(relationship => {

                  model.set(
                    relationship,
                    new this._modelRelationshipLookup[relationship].model(
                      relationships[relationship],
                      true
                    )
                  );

                });

                return model;

              })
            );

          }

          callback.call(this, err, models);

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

  return Composer;

})();
