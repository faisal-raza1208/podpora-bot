import request from 'supertest';
// import mockDialogOpen from slack.mock must be before we import app
import { MockWebClient } from '../mocks/slack.mock';
import { Logger } from 'winston';
import logger from '../../src/util/logger';

import app from '../../src/app';

const loggerSpy = jest.spyOn(logger, 'error').mockReturnValue(({} as unknown) as Logger);
const dialog = MockWebClient.prototype.dialog;

interface ServiceResponseCallback {
    (body: Record<string, unknown>): void;
}

interface ApiService {
    (params: Record<string, unknown>): any;
}

function merge(target: any, source: any) {
    const target_copy = Object.assign({}, target);

    return Object.assign(target_copy, source);
}

function build_service(api_path: string) {
    return function(params: Record<string, unknown>) {
        return request(app).post(api_path).send(params);
    };
}

function build_response(service: any) {
    return function(callback: ServiceResponseCallback, done: jest.DoneCallback) {
        return service.end((err: any, res: any) => {
            if (err) {
                done(err);
            }
            return callback(res.body);
        });
    };
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/slack/command', () => {
    const default_params = {
        token: 'token value',
        team_id: 'T0001',
        team_domain: 'example',
        enterprise_id: 'E0001',
        enterprise_name: 'Globular%20Construct%20Inc',
        channel_id: 'C2147483705',
        channel_name: 'test',
        user_id: 'U2147483697',
        user_name: 'Joe',
        command: '/some-command',
        text: '',
        response_url: 'https://hooks.slack.com/commands/1234/5678',
        trigger_id: '13345224609.738474920.8088930838d88f008e0'
    };

    const api_path = '/api/slack/command';
    const service = build_service(api_path);

    function test_support_command_with_dialog(params: Record<string, unknown>) {
        it('sends dialog to Slack', (done) => {
            service(params).expect(200).end((err, res) => {
                if (err) {
                    done(err);
                }

                expect(dialog.open.mock.calls.length).toEqual(1);

                done();
            });
        });

        describe('response.body', () => {
            const response = build_response(service(params));

            it('returns empty', (done) => {
                response((body: Record<string, unknown>) => {
                    expect(body).toEqual({});
                    done();
                }, done);
            });
        });

        describe('when opening dialog fails', () => {
            it('logs the error', (done) => {
                dialog.resolve = false;

                service(params).expect(200).end((err, res) => {
                    if (err) {
                        done(err);
                    }

                    expect(loggerSpy).toHaveBeenCalled();

                    done();
                });
            });
        });
    }


    it('returns 200 OK', () => {
        return service(default_params).expect(200);
    });

    describe('command: /support', () => {
        const support_params = merge(default_params, { command: '/support' });

        describe('response.body', () => {
            const commandHelpResponse = {
                text: '👋 Need help with support bot?\n\n'
                    + '> Submit a request for data:\n>`/support data`\n\n'
                    + '> Submit a bug report:\n>`/support bug`'
            };
            const response = build_response(service(support_params));

            it('contains command help message', (done) => {
                response((body: Record<string, unknown>) => {
                    expect(body).toEqual(commandHelpResponse);
                    done();
                }, done);
            });
        });

        describe('text: bug', () => {
            const bug_params = merge(support_params, { text: 'bug' });

            test_support_command_with_dialog(bug_params);
        });


        describe('text: data', () => {
            const data_params = merge(support_params, { text: 'data' });

            test_support_command_with_dialog(data_params);
        });
    });
});

describe('POST /api/slack/event', () => {
    const api_path = '/api/slack/event';
    const service = build_service(api_path);

    it('returns 200 OK', (done) => {
        return service({}).expect(200, done);
    });

    describe('challenge', () => {
        const params = {
            'type': 'url_verification',
            'token': 'foo',
            'challenge': 'baz'
        };
        const response = build_response(service(params));

        it('responds back with the challenge', (done) => {
            response((body: Record<string, unknown>) => {
                expect(body.challenge).toEqual('baz');
                done();
            }, done);
        });
    });
});

/*
  Any interactions with shortcuts, modals, or interactive components
  on Slack will be sent to this endpoint.
  (Handle dialog submissions from /support slash command)
*/
describe('POST /api/slack/interaction', () => {
    const api_path = '/api/slack/interaction';
    const service = build_service(api_path);
    const payload = {
        'type': 'dialog_submission',
        'token': '6ato2RrVWQZwZ5Hwc91KnuTB',
        'action_ts': '1591735130.109259',
        'team': {
            'id': 'THS7JQ2RL',
            'domain': 'supportdemo'
        },
        'user': {
            'id': 'UHAV00MD0',
            'name': 'joe_wick'
        },
        'channel': {
            'id': 'CHNBT34FJ',
            'name': 'support'
        },
        'submission': {
            'title': 'fdsafd',
            'reproduce': 'fdsfdsa',
            'expected': 'fdsfdsa',
            'currently': 'dsfdsa'
        }, 'callback_id': 'syft1591734883700',
        'response_url': 'https://hooks.slack.com/app/response_url',
        'state': 'bug'
    };

    it('returns 200 OK', (done) => {
        return service({ payload: JSON.stringify(payload) }).expect(200, done);
    });

    xit('sends slack chat message with submission to support channel', (done) => {

        done();
    });

    xit('creates a jira ticket', (done) => {
        done();
    });
});
