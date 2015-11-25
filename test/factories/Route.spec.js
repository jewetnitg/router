/**
 * @author rik
 */
import _ from 'lodash';

import Model from '../../src/factories/Route';
import ModelValidator from '../../src/validators/Router';

describe(`Model`, () => {

  it(`should be a function`, (done) => {
    expect(Model).to.be.a('function');
    done();
  });

});