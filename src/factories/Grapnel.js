/**
 * @author rik
 */
import Grapnel from 'grapnel';
import _ from 'lodash';

import securityMiddlewareFactory from './middleware/security';
import dataMiddlewareFactory from './middleware/data';
import successMiddlewareFactory from './middleware/success';

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
      securityMiddlewareFactory(route),
      dataMiddlewareFactory(route),
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

function redirectMiddlewareFactory(router, route) {
  return function redirectMiddleware(req, event) {
    if (!event.parent()) {
      router.redirect(route);
    }
  }
}

export default GrapnelFactory;