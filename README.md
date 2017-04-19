# SendPulse-rest-api-node.js
A simple SendPulse REST client library and example for Node.js

### Install

```
npm install sendpulse-api
```

### Usage

```javascript
var sendpulse = require("sendpulse-api");
/*
 * https://login.sendpulse.com/settings/#api
 */
var API_USER_ID = "USER_ID";
var API_SECRET = "USER_SECRET";
var TOKEN_STORAGE = "/tmp/";

sendpulse.init(API_USER_ID,API_SECRET,TOKEN_STORAGE);

var cb = function cb(data){
    console.log(data);
}

sendpulse.listAddressBooks(cb);
```