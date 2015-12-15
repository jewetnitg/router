/**
 * @author rik
 */
import _ from 'lodash';

function DataResponseFactoryFactory(router) {
  function DataResponseFactory() {
    const _destruct = [];
    const dataResponse = {
      set destruct(val) {
        if (typeof val === 'function') {
          _destruct.push(val);
        }
      },

      get destruct() {
        return _destruct;
      },

      sync(data) {
        router.sync(data);
      }
    };

    router.grapnel.on('navigate', () => {
      dataResponse.sync = _.noop;

      _.each(_destruct, (destruct) => {
        destruct();
      });
    });

    return dataResponse;
  }

  return DataResponseFactory;
}


export default DataResponseFactoryFactory;