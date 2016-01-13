function redirectMiddlewareFactory(router, route) {
  return function redirectMiddleware(req, event) {
    if (!event.parent()) {
      router.redirect(route);
    }
  }
}

export default redirectMiddlewareFactory;