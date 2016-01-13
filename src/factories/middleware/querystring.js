import _ from 'lodash';

import getQueryString from '../../helpers/getQueryString';

function queryStringMiddlewareFactory() {
  return function queryStringMiddleware(req, event, next) {
    const queryString = getQueryString();
    _.defaults(req.params, queryString);
    next();
  }
}

export default queryStringMiddlewareFactory;