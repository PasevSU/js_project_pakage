import { User } from './models/User';

const express = require('express');

const i18n = require('i18n');

const app = express();

const logger = require('./helpers/log.js');

const compression = require('compression');

const path = require('path');

const mongoose = require('mongoose');

const bodyParser = require('body-parser');

const HttpError = require('./models/HttpError.js');

const jwt = require('jsonwebtoken');

const JWT_KEY = process.env.JWT_KEY || 'tradeblock';

// See: https://github.com/mashpie/i18n-node for more options
i18n.configure({
  locales: ['en'],
  defaultLocale: 'en',
  directory: path.join(__dirname, 'locales'),
});

// default: using 'accept-language' header to guess language settings
// See: https://github.com/mashpie/i18n-node
app.use(i18n.init);
app.use(bodyParser.json());
app.use(compression());
app.use(require('express-status-monitor')());
app.use((req, res, next) => {
  req.JWT_KEY = JWT_KEY;
  return next();
})

app.use('/auth', require('./controllers/auth.controller.js'));

app.use((req, res, next) => {
  let authorizationHeader = req.headers['authorization'];
  if (!authorizationHeader) {
    return next(new HttpError(400, res.__('INVALID_AUTH_TOKEN')));
  }
  
  let authorizationHeaderArr = authorizationHeader.split(' ');
  if (authorizationHeaderArr.length !== 2) {
    return next(new HttpError(400, res.__('INVALID_AUTH_TOKEN')));
  }
  
  let decodedToken = jwt.verify(authorizationHeaderArr[1], req.JWT_KEY);
  if (!decodedToken) {
    return next(new HttpError(400, res.__('INVALID_AUTH_TOKEN')));
  }
  
  return User.findById(decodedToken.id, (findUserErr, user) => {
    if (findUserErr) {
      return next(findUserErr);
    }
    
    if (!user) {
      return next(new HttpError(400, res.__('INVALID_AUTH_TOKEN')));
    }
    
    req.user = user;
    return next();
  });
});

app.use('/users', require('./controllers/users.controller.js'));
app.use('/products', require('./controllers/products.controller.js'));
app.use('/orders', require('./controllers/orders.controller.js'));

/*eslint-disable no-unused-vars */
app.use(function clientErrorHandler(err, req, res, next) {
  res.status(err.statusCode || 500).json(err);
});

mongoose.connect(process.env.DB_URI || 'mongodb://localhost/tradeblock', {
  useMongoClient: true,
  autoIndex: true,
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0
});

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info('Server started on port %s', port));
