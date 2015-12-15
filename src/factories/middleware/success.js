/**
 * @author rik
 */
function successMiddlewareFactory(route) {
  return function successMiddleware(req, res, next) {
    route.router.success(route, res.data);
  }
}

export default successMiddlewareFactory;