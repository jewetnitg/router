/**
 * @author rik
 */
import _ from 'lodash';

import Request from './Request';

/**
 * @class ControllerRequest
 * @extends Request
 *
 * @param options {Object} Object containing the properties
 *
 * @property params {Object} - inherited from {@link Request}, object containing the parameters
 * @property route {Object} - route object
 * @property grapnel {Grapnel} - Grapnel instance
 */
function ControllerRequest(options = {}) {
  const req = Request(options, ControllerRequest.prototype, {
    route: {
      value: options.route
    },
    grapnel: {
      value: options.grapnel
    }
  });

  req.grapnel.on('navigate', () => {
    req.sync = _.noop;
    req.destruct();
  });

  return req;
}

ControllerRequest.prototype = _.extend({}, Request.prototype, {

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
   *
   * @todo refactor to use Router instance
   */
  sync(data = {}) {
    this.grapnel.trigger('controller:sync', {
      route: this.route,
      data
    });
  }

});

export default ControllerRequest;