import _ from 'lodash';

import makeRouteSplatExtractor from '../helpers/makeRouteSplatExtractor';

/**
 *
 * @param options {Object} Object containing the properties
 *
 * @property router {Router}
 * @property route {String}
 * @property {Object<Function<Promise>>} [policies={}]
 * @todo add alias property that tunnels its splats / params to another route
 *
 * @class Route
 */
function Route(options = {}) {
  _.defaults(options, Route.defaults);

  const props = {
    router: {
      value: options.router
    },
    route: {
      value: options.route
    },
    policies: {
      value: options.policies
    },
    unauthorized: {
      value: options.unauthorized
    },
    options: {
      value: options
    },
    getParamsFromUrl: {
      value: makeRouteSplatExtractor(options.route)
    }
  };

  return Object.create(Route.prototype, props);
}

/**
 * The default options of a Route, these may be overridden, overriding the default route is not recommended.
 *
 * @name defaults
 * @type Object
 * @memberof Route
 *
 * @property {String} [route='']
 * @property {String} [unauthorized='']
 * @property {String|Array<String>} [policies=[]]
 */
Route.defaults = {
  route: '',
  unauthorized: '',
  policies: []
};

Route.prototype = {

  /**
   * @method execute
   * @memberof Route
   *
   * @param {Object} [params={}]
   *
   * @returns {*}
   */
  execute(params = {}) {
    //noinspection JSUnusedAssignment
    return privateApi.executePolicies.call(this, params)
      .then(() => {
        return this.router.routeHandler(this, params);
      }, (policyError) => {
        console.warn(`Policies failed`, policyError);

        if (this.unauthorized) {
          this.router.redirect(this.unauthorized);
        }
      })
  }

};

const privateApi = {

  executePolicies(params) {
    if (Array.isArray(this.policies)) {
      return Promise.all(
        _.map(this.policies, policy => {
          return privateApi.executePolicy.call(this, policy, params);
        })
      );
    } else if (typeof this.policies === 'string') {
      //noinspection JSUnusedAssignment
      return privateApi.executePolicy.call(this, this.policies, params);
    } else {
      return Promise.resolve();
    }
  },

  executePolicy(policyName, params) {
    const policy = this.router.policies[policyName];

    if (!policy) {
      throw new Error(`Can't execute policy '${policyName}', policy not defined.`);
    }

    return policy(params);
  }

};

export default Route;