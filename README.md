# SendPulse-rest-api-node.js
A simple SendPulse REST client library and example for Node.js

API Documentation [https://sendpulse.com/api](https://sendpulse.com/api)

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

sendpulse.init(API_USER_ID,API_SECRET,TOKEN_STORAGE,function() {
    sendpulse.listAddressBooks(console.log);
});
```

You can get full list of API library methods in [example](https://github.com/sendpulse/sendpulse-rest-api-node.js/blob/master/example.js)
