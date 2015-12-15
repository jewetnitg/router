/**
 * @author rik
 */
function middlewareMiddlewareFactory(type, route, failureRouteAttribute) {
  return function middleware(req, res, next) {
    if (route[type] && route[type].length) {
      route.router[type](route[type], req.params)
        .then((data) => {
          res.data = data;
          next();
        }, (data) => {
          res.preventDefault();
          const failureRoute = route[failureRouteAttribute] || route.router[failureRouteAttribute];

          if (failureRoute) {
            route.router.redirect(failureRoute);
          }

          route.router.fail(route, {
            reason: type,
            data
          });
        });
    } else {
      next();
    }
  }
}

export default middlewareMiddlewareFactory;