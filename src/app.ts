import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import {
    startCollection,
    requestCounters,
    responseCounters
} from './util/metric';

// Controllers (route handlers)
import * as homeController from './controllers/home';
import * as apiController from './controllers/api';
import * as apiSlackController from './controllers/api/slack';
import * as apiJiraController from './controllers/api/jira';
import * as metricsController from './controllers/metrics';

// Create Express server
const app = express();

// Express configuration
/* istanbul ignore next */
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
);

app.use(requestCounters);
app.use(responseCounters);

/**
 * Primary app routes.
 */
app.get('/', homeController.index);

/**
 * API routes.
 */
app.get('/api', apiController.getApi);
app.post('/api/slack/command', apiSlackController.postCommand);
app.post('/api/slack/interaction', apiSlackController.postInteraction);
app.post('/api/slack/event', apiSlackController.postEvent);
app.post('/api/jira/event/:team_id', apiJiraController.postEvent);


/**
 * Prometheus metrics exposition
 */
app.get('/metrics', metricsController.index);
startCollection();

export default app;
