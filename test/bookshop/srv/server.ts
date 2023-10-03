/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import cds from '@sap/cds';
import 'reflect-metadata';

const listenMessage = console.log('Server listening...');

// Emitted at the very beginning of the bootstrapping process, when the express application has been constructed but no middleware or routes added yet.
cds.on('bootstrap', (app) => {
  console.log('Bootstrap loaded !');
});
cds.once('listening', () => listenMessage);

module.exports = cds.server;
