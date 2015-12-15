/**
 * @author rik
 */
import _ from 'lodash';
import View from 'frontend-view';

function StaticView(options) {
  _.defaults(options, options.router.options.staticViewConfig, StaticView.defaults);

  if (!options.name) {
    throw new Error(`Can't construct StaticView, no name provided.`);
  }

  if (StaticView.staticViews[options.name]) {
    throw new Error(`Can't construct StaticView, StaticView with name '${options.name}' already exists`);
  }

  if (!options.router.options.views[options.view]) {
    throw new Error(`Can't construct StaticView, view with name '${options.view}' not defined.`);
  }

  const viewOptions = _.clone(options.router.options.views[options.view]);
  _.defaults(viewOptions, options.router.options.viewConfig);

  viewOptions.holder = options.holder || viewOptions.holder;
  viewOptions.$holder = options.$holder || viewOptions.$holder;
  viewOptions.el = options.el || viewOptions.el;

  const staticView = Object.create(StaticView.prototype);
  _.extend(staticView, _.omit(options, _.keys(StaticView.prototype)));
  staticView.options = options;
  staticView.view = View(viewOptions);

  staticView.render()
    .then(() => {
      const currentRoute = staticView.router.currentRoute;
      if (!currentRoute || !currentRoute.staticViews || currentRoute.staticViews.indexOf(staticView.name) === -1) {
        staticView.hide();
      }
    });

  return staticView;
}

StaticView.staticViews = {};

StaticView.prototype = {

  get holder() {
    return this.view.holder;
  },

  get $holder() {
    return this.view.$holder;
  },

  get el() {
    return this.view.el;
  },

  get $el() {
    return this.view.$el;
  },

  render(data = {}) {
    return this.router.security(this.security, data)
      .then(() => {
        return this.router.data(this.data, data);
      })
      .then((data) => {
        this.view.render(data);
      })
      .catch(() => {
        this.hide();
      });
  },

  hide() {
    this.view.hide();
  },

  show() {
    this.view.show();
  }

};

StaticView.defaults = {};

export default StaticView;