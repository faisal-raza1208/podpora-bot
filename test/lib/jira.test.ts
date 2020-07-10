import nock from 'nock';
import { Logger } from 'winston';
import { fixture } from '../helpers';
import logger from '../../src/util/logger';
import {
    Jira,
    Issue
} from '../../src/lib/jira';
import {
    SubmissionType,
    SupportRequest,
    BugSubmission
} from '../../src/lib/slack_team';

const createIssueResponse = fixture('jira/issues.createIssue.response');

const bug_report = {
    id: '1592066203.000100',
    team_id: 'THS7JQ2RL',
    user: {
        id: 'UHAV00MD0',
        name: 'sherlock_holmes'
    },
    type: SubmissionType.BUG,
    submission: {
        title: 'bug report title',
        description: 'bug report description',
        expected: 'we like this to happen',
        currently: 'this is what happens now',
        type: SubmissionType.BUG
    } as BugSubmission,
    url: 'http://example.com/bug',
    channel: 'CHS7JQ7PY'
} as SupportRequest;
const data_request = {
    id: '1592066203.000200',
    team_id: 'THS7JQ2RL',
    user: {
        id: 'UHAV00MD1',
        name: 'john_watson'
    },
    type: SubmissionType.DATA,
    submission: {
        title: 'data request title',
        description: 'data request description',
        type: SubmissionType.DATA
    },
    url: 'http://example.com/data',
    channel: 'CHS7JQ7PY'
} as SupportRequest;

beforeAll(() => {
    return nock.disableNetConnect();
});

afterAll(() => {
    return nock.enableNetConnect();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('Jira', () => {
    const mock_config = {
        username: 'some name',
        api_token: 'abc-123',
        host: 'http://example.com'
    };

    const jira = new Jira(mock_config);

    describe('#createIssue()', () => {
        const issue = createIssueResponse as Issue;

        it('returns a Promise to create issue and link it to the slack thread', (done) => {
            let api_call_body: string;
            expect.assertions(7);
            nock(mock_config.host)
                .post('/rest/api/2/issue', (body) => {
                    api_call_body = JSON.stringify(body);
                    return body;
                }).reply(200, createIssueResponse);

            jira.createIssue(bug_report)
                .then((res) => {
                    const submission = bug_report.submission as BugSubmission;
                    expect(res).toEqual(issue);
                    expect(api_call_body).toContain(submission.title);
                    expect(api_call_body).toContain(submission.description);
                    expect(api_call_body).toContain(submission.expected);
                    expect(api_call_body).toContain(submission.currently);
                    expect(api_call_body).toContain(bug_report.user.name);
                    expect(api_call_body).toContain('Bug');
                    done();
                }).catch(done);
        });

        describe('API failure', () => {
            it('it catch and log the failure', (done) => {
                const loggerSpy = jest.spyOn(logger, 'error')
                    .mockReturnValue({} as Logger);
                expect.assertions(3);

                nock(mock_config.host)
                    .post('/rest/api/2/issue')
                    .reply(500, createIssueResponse);

                jira.createIssue(bug_report)
                    .catch((res) => {
                        expect(loggerSpy).toHaveBeenCalled();
                        const logger_call = loggerSpy.mock.calls[0].toString();
                        expect(logger_call).toEqual(
                            expect.stringContaining('createIssue')
                        );
                        expect(res).toEqual({ ok: false });
                        done();
                    });
            });
        });

        describe('data request', () => {
            const issue = createIssueResponse as Issue;

            it('changes issuetype to data', (done) => {
                let api_call_body: string;
                expect.assertions(5);
                nock(mock_config.host)
                    .post('/rest/api/2/issue', (body) => {
                        api_call_body = JSON.stringify(body);
                        return body;
                    }).reply(200, createIssueResponse);

                jira.createIssue(data_request)
                    .then((res) => {
                        const submission = data_request.submission;
                        expect(res).toEqual(issue);
                        expect(api_call_body).toContain(submission.title);
                        expect(api_call_body).toContain(submission.description);
                        expect(api_call_body).toContain(data_request.user.name);
                        expect(api_call_body).toContain('Task');
                        done();
                    }).catch(done);
            });
        });
    });

    describe('#issueUrl', () => {
        it('returns url to jira issue on host domain', () => {
            const issue = createIssueResponse as Issue;
            const url = jira.issueUrl(issue);

            expect(url).toEqual(`${mock_config.host}/browse/${issue.key}`);
        });
    });


    describe('#linkRequestToIssue', () => {
        it('returns a promise', (done) => {
            const issue = createIssueResponse as Issue;

            nock(mock_config.host)
                .post(
                    `/rest/api/2/issue/${issue.key}/remotelink`
                ).reply(200, { ok: true });

            jira.linkRequestToIssue(bug_report, issue).then((res) => {
                expect(res).toEqual({ ok: true });
                done();
            });
        });
    });
});
