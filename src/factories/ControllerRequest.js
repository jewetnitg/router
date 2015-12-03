/**
 * @author rik
 */
import _ from 'lodash';

import Request from 'frontend-policies/src/factories/Request';

/**
 * @class ControllerRequest
 * @extends Request
 *
 * @param options {Object} Object containing the properties
 *
 * @property params {Object} - inherited from {@link Request}, object containing the parameters
 * @property route {Object} - route object
 */
function ControllerRequest(options = {}) {
  const req = Request(options.params, ControllerRequest.prototype);

  req.route = options.route;
  req.destruct = options.destruct || req.destruct;

  req.route.router.grapnel.on('navigate', () => {
    req.sync = _.noop;
    req.destruct();
  });

  return req;
}

ControllerRequest.prototype = {

  /**
   * Called when the ControllerRequest is destructed,
   * this should be overridden in a Controller and stop all listeners for that Controller.
   *
   * @method destruct
   * @memberof ControllerRequest
   * @instance
   * @abstract
   */
  destruct() {
    // abstract, should be overridden in a Controller
  },

  /**
   * Syncs data for a route, will call the Router#sync(route, data) method
   *
   * @method sync
   * @instance
   * @memberof ControllerRequest
   *
   * @param data
   */
  sync(data = {}) {
    this.route.router.sync(this.route, data);
  }

};

export default ControllerRequest;