/**
 * @author rik
 */
import _ from 'lodash';

import Router from '../../src/factories/Router';

describe(`Router`, () => {

  it(`should be a function`, (done) => {
    expect(Router).to.be.a('function');
    done();
  });

});