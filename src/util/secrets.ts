import logger from './logger';
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from 'redis';

if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'test') {
    dotenv.config({ path: '.env.example' });
} else if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
    logger.debug('Using .env file to supply config environment variables');
} else if (process.env.NODE_ENV !== 'production') {
    logger.error('No .env file present in non production environment.');
    logger.error('See README.md for development setup instructions.');
    process.exit(1);
}

export interface SlackOptions {
    [index: string]: string;

    id: string,
    api_token: string,
    domain: string,
}

export interface JiraOptions {
    [index: string]: string;

    username: string,
    api_token: string,
    host: string
}

export interface SupportOptions {
    [index: string]: string;
    channel_id: string
    config_name: string
}

export interface ProductOptions {
    [index: string]: string;
    channel_id: string
    config_name: string
}

const SLACK_OPTIONS: { [index: string]: SlackOptions }
    = JSON.parse(process.env['SLACK_OPTIONS'] as string);
const JIRA_OPTIONS: { [index: string]: JiraOptions }
    = JSON.parse(process.env['JIRA_OPTIONS'] as string);
const SUPPORT_OPTIONS: { [index: string]: SupportOptions }
    = JSON.parse(process.env['SUPPORT_OPTIONS'] as string);
const PRODUCT_OPTIONS: { [index: string]: ProductOptions }
    = JSON.parse(process.env['PRODUCT_OPTIONS'] as string);

const FEATURE_FLAGS: { [index: string]: boolean }
    = (process.env['FEATURE_FLAGS'] &&
        JSON.parse(process.env['FEATURE_FLAGS'] as string)) || {};

const REDIS_URL = process.env.REDIS_URL as string;
const redis_client = createClient({ url: REDIS_URL });
let redis_connected = false;

redis_client.on('error', function(error: Error) {
    logger.info('Redis Client Error', error);
});

redis_client.on('end', () => {
    logger.info('Redis Client Disconnected');
    redis_connected = false;
});

redis_client.on('connect', () => {
    logger.info('Redis Client Connected');
    redis_connected = true;
});

redis_client.on('reconnecting', () => logger.info('Redis Client Reconnecting'));

const store = {
    slackOptions: (id: string): SlackOptions => {
        return SLACK_OPTIONS[id];
    },
    jiraOptions: (id: string): JiraOptions => {
        return JIRA_OPTIONS[id];
    },
    supportOptions: (id: string): SupportOptions => {
        return SUPPORT_OPTIONS[id];
    },
    productOptions: (id: string): ProductOptions => {
        return PRODUCT_OPTIONS[id];
    },
    featureFlag: (name: string): boolean => {
        return FEATURE_FLAGS[name];
    },

    set: (...args: string[]): Promise<string> => {
        if (redis_connected) {
            return redis_client.MSET(args);
        }

        return redis_client.connect().then(() => {
            return redis_client.MSET(args);
        });
    },

    get: (key: string): Promise<string | null> => {
        if (redis_connected) {
            return redis_client.get(key);
        }

        return redis_client.connect().then(() => {
            return redis_client.get(key);
        });
    }
};

export const SESSION_SECRET = process.env['SESSION_SECRET'];

if (!SESSION_SECRET) {
    logger.error('No client secret. Set SESSION_SECRET environment variable.');
    process.exit(1);
}

const metrics_basic_auth = process.env['METRICS_BASIC_AUTH'] as string;

if (!metrics_basic_auth) {
    logger.error('No metrics auth credentials. Set METRICS_BASIC_AUTH environment variable.');
    process.exit(1);
}
const METRICS_BASIC_AUTH_USERS = Object.fromEntries([metrics_basic_auth.split(':')]);

export {
    store,
    METRICS_BASIC_AUTH_USERS
};
