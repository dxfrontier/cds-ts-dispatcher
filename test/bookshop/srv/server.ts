import cds from '@sap/cds';

// Emitted at the very beginning of the bootstrapping process, when the express application has been constructed but no middleware or routes added yet.
cds.on('bootstrap', (app) => {
  console.log('Bootstrap loaded !');
});

module.exports = cds.server;
