const fsExtra = require('fs-extra');
const { join } = require('path');

before(() =>
  fsExtra.copySync(join(process.cwd(), 'src', 'test', 'fixtures'), join(process.cwd(), 'tmp', 'fixtures')),
);

after(() => fsExtra.removeSync(join(process.cwd(), 'tmp', 'fixtures')));
