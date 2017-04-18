var __karmaWebpackManifest__ = [];

function inManifest(path) {
  return __karmaWebpackManifest__.indexOf(path) >= 0;
}

var testsContext = require.context(".", true, /(\.spec|\.test)$/);
var runnable = testsContext.keys().filter(inManifest);
 
// Run all tests if we didn't find any changes 
if (!runnable.length) {
  runnable = testsContext.keys();
}
 
runnable.forEach(testsContext);
