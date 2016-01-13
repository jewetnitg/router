/**
 * @author rik
 */
import Grapnel from 'grapnel';
import _ from 'lodash';

import successMiddlewareFactory from './middleware/success';
import queryStringMiddlewareFactory from './middleware/querystring';
import redirectMiddlewareFactory from './middleware/redirect';

function GrapnelFactory(options = {}, router = {}, Router = {}) {
  const grapnelOptions = _.pick(options, [
    'pushState',
    'root',
    'env',
    'mode',
    'hashBang'
  ]);

  router.grapnel = new Grapnel(grapnelOptions);

  addRoutesToGrapnelRouter(options, router, Router);

  return router.grapnel;
}

function addRoutesToGrapnelRouter(options, router, Router) {
  options.routes = options.routes || {};

  _.each(options.routes, (route, routeName) => {
    _.defaults(route, Router.routeDefaults, {
      route: routeName,
      router
    });

    const middleware = [
      queryStringMiddlewareFactory(),
      successMiddlewareFactory(route)
    ];

    middleware.unshift(route.route);
    router.grapnel.get.apply(router.grapnel, middleware);

    return route;
  });

  addDefaultRouteToGrapnelRouter(options, router);
  addNotFoundRouteToGrapnelRouter(options, router);
}

function addDefaultRouteToGrapnelRouter(options, router) {
  const defaultRoute = options.defaultRoute;

  if (defaultRoute) {
    if (!options.routes[defaultRoute]) {
      throw new Error(`Default route '${defaultRoute}' doesn't exist.`);
    }

    const defaultRouteMiddleware = redirectMiddlewareFactory(router, defaultRoute);

    router.grapnel.get('/', defaultRouteMiddleware);
    router.grapnel.get('', defaultRouteMiddleware);
  }
}

function addNotFoundRouteToGrapnelRouter(options, router) {
  const notFoundRoute = options.notFoundRoute;

  if (notFoundRoute) {
    if (!options.routes[notFoundRoute]) {
      throw new Error(`Default route '${notFoundRoute}' doesn't exist.`);
    }

    const notFoundMiddleware = redirectMiddlewareFactory(router, options.notFoundRoute);

    router.grapnel.get('/*', notFoundMiddleware);
    router.grapnel.get('*', notFoundMiddleware);
  }
}

export default GrapnelFactory;