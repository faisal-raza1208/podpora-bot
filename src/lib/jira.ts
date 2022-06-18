import { Version2Client } from 'jira.js';
import logger from '../util/logger';
import {
    Issue,
    CreateIssue,
    CreatedIssue,
    RemoteIssueLinkIdentifies
} from './jira/api_interfaces';

const slack_icon = {
    url16x16: 'https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png',
    title: 'Slack'
};

class Jira {
    constructor(config: { username: string, api_token: string, host: string }) {
        const client_cfg = {
            host: config.host,
            authentication: {
                basic: {
                    email: config.username,
                    apiToken: config.api_token
                }
            },
            telemetry: false,
            newErrorHandling: true
        };

        this.host = config.host;
        this.client = new Version2Client(client_cfg);
    }
    host: string;
    client: Version2Client;

    addSlackThreadUrlToIssue(
        url: string,
        issue: CreatedIssue
    ): Promise<RemoteIssueLinkIdentifies> {
        // TODO: extract out
        const title = url;
        const icon = slack_icon;

        const link_params = {
            issueIdOrKey: issue.key,
            object: {
                url,
                title,
                icon
            }
        };

        return this.client.issueRemoteLinks.createOrUpdateRemoteIssueLink(link_params)
            .catch((err) => {
                logger.error('addSlackThreadUrlToIssue', err);
                return Promise.reject({ ok: false });
            });
    }

    createIssue(issue_params: CreateIssue): Promise<CreatedIssue> {
        return this.client.issues.createIssue(issue_params)
            .catch((err) => {
                logger.error('createIssue', err);
                return Promise.reject({ ok: false });
            });
    }

    issueUrl(issue: { key: string }): string {
        return `${this.host}/browse/${issue.key}`;
    }

    addComment(issue_key: string, comment: string): Promise<unknown> {
        return this.client.issueComments.addComment({
            issueIdOrKey: issue_key,
            body: comment
        }).catch((err) => {
            logger.error('addComment', err);
            // TODO reject?
            return Promise.resolve({ ok: false });
        });
    }

    toKey(issue: { id: string }): string {
        return [this.host, issue.id].join(',');
    }

    find(id: number): Promise<Issue> {
        const issue_params = { issueIdOrKey: `${id}` };

        return this.client.issues.getIssue(issue_params)
            .then((issue) => {
                // we cast the response to an Issue
                // because although oficial documentation nor
                // the jira.js package includes in 'fields'
                // attribute 'issuelinks' it is part of the official response
                // and we use it.
                // See example response:
                // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/#api-rest-api-2-issue-issueidorkey-get-responses
                // vs https://developer.atlassian.com/cloud/jira/platform/jira-expressions-type-reference/#issue
                // or https://github.com/MrRefactoring/jira.js/blob/master/src/version2/models/fields.ts
                return issue as unknown as Issue;
            })
            .catch((err) => {
                logger.error('find', id, err);
                return Promise.reject({ ok: false });
            });
    }
}

export {
    Jira
};
