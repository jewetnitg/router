/**
 * @author rik
 */
function policyMiddlewareFactory(route) {
  return function policyMiddleware(req, res, next) {
    if (route.policies && route.policies.length) {
      route.router.policy(route.policies, req.params)
        .then(() => {
          next();
        }, (data) => {
          res.preventDefault();
          const unauthorizedRoute = route.unauthorized || route.router.options.unauthorizedRoute;

          if (unauthorizedRoute) {
            route.router.redirect(unauthorizedRoute);
          }

          route.router.fail(route, {
            reason: 'policy',
            data
          });
        });
    } else {
      next();
    }
  }
}

export default policyMiddlewareFactory;