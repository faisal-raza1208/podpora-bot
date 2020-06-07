import { SLACK_API_TOKEN } from './../util/secrets';
import { WebClient } from '@slack/web-api';

const slackWeb = new WebClient(SLACK_API_TOKEN);

export default slackWeb;
