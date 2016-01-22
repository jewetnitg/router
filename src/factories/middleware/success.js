import makeAnchorDOMElementsUseRouterNavigate from '../../helpers/makeAnchorDOMElementsUseRouterNavigate';

function successMiddlewareFactory(route) {
  return function successMiddleware(req, res, next) {
    route.router.director.setComposition(route, req.params, res.data)
      .then((data) => {
        makeAnchorDOMElementsUseRouterNavigate(route.router);
        route.router.trigger('route', {
          route,
          data,
          params: req.params
        });
      }, (err) => {
        handleFailedViewDirectorMiddleware(route, err);
      });
  }
}

// @todo refactor both cases to use one, more abstract function
function handleFailedViewDirectorMiddleware(route, data) {
  switch (data.code) {
    // @todo add query string with message like done for 500
    case 403:
      const unauthorized = route.unauthorized || route.router.options.unauthorizedRoute;

      if (typeof unauthorized === 'string') {
        route.router.redirect(unauthorized);
      } else if (typeof unauthorized === 'function') {
        unauthorized(route, data);
      }

      route.router.trigger('unauthorized', {
        route,
        data
      });
      break;
    case 500:
      let error = route.error || route.router.options.errorRoute;

      if (typeof error === 'string') {
        if (data) {
          if (data.error && typeof data.error === 'string') {
            error += '?error=' + data.error;
          } else if (data.error instanceof Error) {
            error += '?error=' + data.error.message;
          }
        }

        route.router.redirect(error);
      } else if (typeof error === 'function') {
        error(route, data);
      }

      console.warn('error in data middleware', route, data);

      route.router.trigger('error', {
        route,
        error: data.error || data
      });

      break;
  }
}

export default successMiddlewareFactory;