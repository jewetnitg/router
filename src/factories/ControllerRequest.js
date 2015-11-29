/**
 * @author rik
 */
import _ from 'lodash';

import Request from './Request';

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

  destruct() {
    // abstract, should be overridden in the Controller
  },

  sync(data = {}) {
    this.grapnel.trigger('controller:sync', {
      route: this.route,
      data
    });
  }

});

export default ControllerRequest;