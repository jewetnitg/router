/**
 * @author rik
 */
import policyExecutor from '../../singletons/policyExecutor';

function policyMiddlewareFactory(route) {
  return function policyMiddleware(req, res, next) {
    if (route.policies && route.policies.length) {
      policyExecutor.execute(route.policies, req.params)
        .then(() => {
          next();
        }, (data) => {
          res.preventDefault();
          if (route.unauthorized) {
            route.router.redirect(route.unauthorized);
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