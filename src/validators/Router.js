/**
 * @author rik
 */

const ModelValidator = {

  construct(options = {}) {
    if (!options.name || typeof options.name !== 'string') {
      throw new Error(`Can't construct model, no name specified.`);
    }

    if (!options.connection || typeof options.connection !== 'string') {
      throw new Error(`Can't construct model, no connection specified.`);
    }

    if (!communicator.connections[options.connection]) {
      throw new Error(`Can't construct model, connection '${options.connection}' not defined.`);
    }

    if (!options.url || typeof options.url !== 'string') {
      throw new Error(`Can't construct model, no url specified.`);
    }

    if (!options.idAttribute || typeof options.idAttribute !== 'string') {
      throw new Error(`Can't construct model, no idAttribute specified.`);
    }

    if (!options.api || typeof options.api !== 'object') {
      throw new Error(`Can't construct model, no api specified.`);
    }

    if (!options.createdOnAttribute || typeof options.createdOnAttribute !== 'string') {
      throw new Error(`Can't construct model, no idAttribute specified.`);
    }

    if (!options.updatedOnAttribute || typeof options.updatedOnAttribute !== 'string') {
      throw new Error(`Can't construct model, no idAttribute specified.`);
    }

    if (!options.defaults || typeof options.defaults !== 'object') {
      throw new Error(`Can't construct model, no defaults specified.`);
    }

  }

};

export default ModelValidator;