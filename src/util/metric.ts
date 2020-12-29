/*
Borrowed from
https://github.com/PacktPublishing/TypeScript-Microservices/tree/master/Chapter09/prometheus-grafana
*/
import * as promClient from 'prom-client';
import responseTime from 'response-time';
import { Response, Request } from 'express';

export const Register = promClient.register;
const Counter = promClient.Counter;
const Histogram = promClient.Histogram;
const Summary = promClient.Summary;

/*
  Prometheus counter that counts
  the total number of invocations of different types of HTTP requests.
*/
export const numOfRequests = new Counter({
    name: 'numOfRequests',
    help: 'Number of requests which are made through out the service',
    labelNames: ['method']
});

/*
  Prometheus client that counts the number of different paths.
  /hello and /world would be two different paths.
*/

export const totalPathsTakesn = new Counter({
    name: 'pathsTaken',
    help: 'paths taken in app',
    labelNames: ['path']
});

/* Prometheus client to summarize HTTP method,path, response and total time taken */
export const responses = new Summary({
    name: 'responses',
    help: 'Response time in millis',
    labelNames: ['method', 'path', 'status']
});

/* Function to start metric collection */
export const startCollection = function(): void {
    promClient.collectDefaultMetrics();
};

/* THis function increments the counters executed */
export const requestCounters = function(
    req: Request, res: Response, next: () => void
): void {
    if(req.path != 'metrics'){
        numOfRequests.inc({ method: req.method });
        totalPathsTakesn.inc({ path: req.path });
    }
    next();
};

/* this function updates response summary */
export const responseCounters = responseTime(
    function (req: Request, res: Response, time: number): void {
        if(req.url != '/metrics') {
            responses.labels(req.method, req.url, String(res.statusCode)).observe(time);
        }
    });

/* Histogram function */
export const httpRequestDurationMicroseconds = new Histogram({
    name: 'http_requests_duration_ms',
    help: 'Duration of HTTP Requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.10, 5, 15, 100, 200, 300, 400, 500, 600]
});
