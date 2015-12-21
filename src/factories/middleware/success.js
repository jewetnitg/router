/**
 * @author rik
 */
function successMiddlewareFactory(route) {
  return function successMiddleware(req, res, next) {
    route.router.success(route, req.params, res.data);
  }
}

export default successMiddlewareFactory;