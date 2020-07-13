import redis, { RedisClient } from 'redis';
import logger from './logger';
import { REDIS_URL } from './secrets';

let client: RedisClient;

function redis_client(): RedisClient {
    if (typeof client === 'undefined') {
        // TODO: move to secrets.ts ?
        client = redis.createClient(REDIS_URL);

        client.on('error', function(error: Error) {
            logger.error(error);
        });
    }

    return client;
}

export default redis_client;
