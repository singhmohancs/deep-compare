const deepCompare = require('./index');
const basePath = './files';
const filesDirs = ['en', 'nl'];


const _compare = deepCompare({
  basePath: basePath,
  compareWith: filesDirs,
  createUpdate: false,
  defaultDir: 'en',
  key_placeholder: 'demo_key11'
});


// _compare
//   .directory()
//   .then(response => {
//     console.log(response);
//   });

  _compare.createDirectory('demo');