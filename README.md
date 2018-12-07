# deep-compare
- Checks if file exists
- Add if key is missing

### Use-case

There is a directory `files` that contains `directories` that has `json` files.

* `files`
  * `en`
    * `a.json`
    * `b.json`
    * `c.json`
  * `nl`  
    * `c.json`  

 Find missing files and keys in `nl` directory.

 ### Example 

Import dependency
```
const deepCompare = require('deep-compare-json');
```

```javascript
const basePath = './files';
const filesDirs = ['en', 'nl'];


deepCompare.directory({
  basePath: basePath,
  compareWith: filesDirs,
  createUpdate: false,
  defaultDir: 'en',
  key_placeholder: 'demo_key'
}).then(response => {
  console.log(response);
});
```

### Result

```json
{ nl:
   [ 
     { file: a.json',
       missing_keys:
        'Error: ENOENT: no such file or directory, open \'./files/nl/a.json\'' 
    },
     { file: 'b.json',
       missing_keys:
        'Error: ENOENT: no such file or directory, open \'./files/nl/b.json\'' 
    },
     { file: 'c.json',
       missing_keys: 'form.fields.name.errors.min1Len' 
      } 
  ] 
}
```

#### Settings
Name  | Type | Description
------------- | -------------- | -------------
`basePath` | `string` | `required` base path of directory. See example 
`compareWith` | `array` | `required` An array of directory's name inside `basePath`
`defaultDir` | `string` | `optional` Directory and files are compared against this directory.
`createUpdate` | `boolean` | `optional` Default: `false` if set to `true` then missing key and files are created. 
`key_placeholder` | `string` | `optional` Default: `missing_key`. A placeholder value of missing key.
`debugLog` | `boolean` | `optional` Default : `false`. If set to `true` then shows log
