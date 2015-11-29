/**
 * @author rik
 */
import _ from 'lodash';

function Request(options = {}, prototype = Request.prototype, extraProps = {}) {
  const props = _.extend({
    params: {
      value: options.params || {}
    }
  }, extraProps);

  return Object.create(prototype, props);
}

Request.prototype = {

  param(key) {
    return this.params[key];
  }

};

export default Request;