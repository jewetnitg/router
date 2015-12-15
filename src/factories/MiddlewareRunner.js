/**
 * @author rik
 */
import _ from 'lodash';

const session = {};

function reqFactory(params = {}) {
  return {
    params,
    param(path) {
      return _.get(params, path);
    },
    session
  };
}

function resFactory(syncHandler) {
  return _.extend({
    sync(data) {
      syncHandler(data);
    }
  }, data);
}

function MiddlewareRunner(options = {}) {
  const middlewareRunner = {};

  _.each(options, (middlewareTypeDefinition, middlewareType) => {
    const middleware = middlewareRunner[middlewareType] = Object.create(MiddlewareRunner.prototype);
    middleware.type = middlewareType;

    _.defaults(middlewareTypeDefinition, MiddlewareRunner.defaults, {
      middleware: {}
    });

    _.extend(middleware, middlewareTypeDefinition);
  });

  return middlewareRunner;
}

MiddlewareRunner.defaults = {
  req: true,
  res: false,
  parallel: false,
  extendResWithResolvedData: true,
  resFactory,
  reqFactory
};

MiddlewareRunner.prototype = {

  run(middlewareNames = [], data = {}) {
    if (typeof middlewareNames === 'string') {
      middlewareNames = [middlewareNames];
    }

    if (this.parallel) {
      return runParallel.call(this, middlewareNames, data);
    } else {
      return runSequence.call(this, middlewareNames, data);
    }
  }

};

function runParallel(middlewareNames, data = {}) {
  const promises = [];
  const req = this.req ? this.reqFactory(data) : null;
  const res = this.res ? this.resFactory() : null;

  _.each(middlewareNames, (name) => {
    const invert = name[0] === '!';
    name = name.replace('!', '');
    const middleware = _.get(this.middleware, name);

    if (!middleware) {
      throw new Error(`${this.type} middleware with name '${name}' not defined.`);
    }

    promises.push(
      Promise.resolve()
        .then(() => {
          return middleware(req, res);
        })
        .then(data => {
          if (invert) {
            return Promise.reject();
          } else {
            return data;
          }
        }, data => {
          if (invert) {
            return Promise.resolve();
          } else {
            return Promise.reject(data);
          }
        })
    );
  });

  return Promise.all(promises);
}

function runSequence(middlewareNames, data = {}, stateObj = false) {
  stateObj = stateObj || {
      index: 0,
      req: this.req ? this.reqFactory(data) : null,
      res: this.res ? this.resFactory() : null
    };

  if (!middlewareNames.length) {
    return Promise.resolve(stateObj.res);
  }

  const name = middlewareNames[stateObj.index].replace('!', '');
  const invert = middlewareNames[stateObj.index][0] === '!';
  const middleware = _.get(this.middleware, name);

  if (!middleware) {
    throw new Error(`${this.type} middleware with name '${name}' not defined.`);
  }

  return Promise.resolve()
    .then(() => {
      return middleware(stateObj.req, stateObj.res)
    })
    .then((data) => {
      if (invert) {
        return Promise.reject();
      } else {
        if (this.res && this.extendResWithResolvedData) {
          _.extend(stateObj.res, data);
        }

        if (middlewareNames.length - 1 === stateObj.index) {
          return Promise.resolve(stateObj.res);
        } else {
          stateObj.index++;
          return runSequence.call(this, middlewareNames, data, stateObj);
        }
      }
    }, (data) => {
      if (invert) {
        return Promise.resolve();
      } else {
        return Promise.reject(data);
      }
    });
}

export default MiddlewareRunner;