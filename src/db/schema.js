module.exports = {

  migration_id: 20150417002731,

  SearchResult: {

    table: 'search_results',

    fields: [
      {name: 'id', type: 'index'},
      {name: 'term', type: 'string'},
      {name: 'location', type: 'string'},
      {name: 'neighborhood', type: 'string'},
      {name: 'street', type: 'string'},
      {name: 'user_id', type: 'int'},
      {name: 'offset', type: 'int'},
      {name: 'count', type: 'int'},
      {name: 'total', type: 'int'},
      {name: 'listing_ids', type: 'int', properties: {"array":true}},
      {name: 'space_type_ids__in', type: 'int', properties: {"array":true}},
      {name: 'feature_ids__in', type: 'int', properties: {"array":true}},
      {name: 'latitude', type: 'float'},
      {name: 'latitude__gte', type: 'float'},
      {name: 'latitude__lte', type: 'float'},
      {name: 'longitude', type: 'float'},
      {name: 'longitude__gte', type: 'float'},
      {name: 'longitude__lte', type: 'float'},
      {name: 'price__gte', type: 'int'},
      {name: 'price__lte', type: 'int'},
      {name: 'size__gte', type: 'int'},
      {name: 'size__lte', type: 'int'},
      {name: 'is_admin', type: 'boolean'},
      {name: '__order', type: 'string'},
      {name: 'is_initial_search', type: 'boolean'},
      {name: 'session_key', type: 'string'},
      {name: 'user_agent', type: 'string'},
      {name: 'is_mobile', type: 'boolean'},
      {name: 'ip_address', type: 'string'},
      {name: 'created_at', type: 'datetime'}
    ]

  }

};
