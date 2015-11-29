/**
 * @author rik
 */
import executePolicies from '../../helpers/executePolicies';

function policyMiddlewareFactory(route, grapnel, policies) {
  return function policyMiddleware(req, res, next) {
    if (route.policies && route.policies.length) {
      executePolicies(route.policies, req.params, policies)
        .then((data) => {
          grapnel.trigger('policy:success', {
            route,
            data
          });
          next();
        }, (data) => {
          res.preventDefault();
          grapnel.trigger('policy:failure', {
            route,
            data
          });
          // @todo redirect to unauthorized route if specified
        });
    } else {
      next();
    }
  }
}

export default policyMiddlewareFactory;