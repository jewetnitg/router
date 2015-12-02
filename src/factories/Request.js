/**
 * @author rik
 */
import _ from 'lodash';

/**
 * @class Request
 * @param options {Object} Object with the properties listed below
 * @param {Object} [prototype=Request.prototype] - the prototype to base the instance on
 * @param {Object} [extraProps={}] - extra properties for the instance
 *
 * @property {Object} [params={}] - parameters of this request
 *
 * @example
 * const req = Request({params: {...}}, Request.prototype);
 * const specialReq = Request({params: {...}}, SpecialRequest.prototype, {
 *   prop: {
 *     value: 'prop'
 *   }
 * });
 */
function Request(options = {}, prototype = Request.prototype, extraProps = {}) {
  const props = _.extend({
    params: {
      value: options.params || {}
    }
  }, extraProps);

  return Object.create(prototype, props);
}

Request.prototype = {

  /**
   * @method param
   * @memberof Request
   * @instance
   *
   * @param key {String} Key of the param to get
   *
   * @returns {*}
   */
  param(key) {
    return this.params[key];
  }

};

export default Request;