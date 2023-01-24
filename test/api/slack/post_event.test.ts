import nock from 'nock';
import { Logger } from 'winston';
import { merge, build_service, build_response, fixture } from '../../helpers';
import logger from '../../../src/util/logger';
import { store } from '../../../src/util/secrets';
import {
    EventCallbackPayload,
    PostEventPayloads
} from '../../../src/lib/slack/api_interfaces';
import app from '../../../src/app';
import feature from '../../../src/util/feature';

const logErrorSpy = jest.spyOn(logger, 'error').mockReturnValue({} as Logger);
const storeGetSpy = jest.spyOn(store, 'get');

beforeAll(() => {
    return nock.enableNetConnect(/localhost|127\.0\.0\.1/);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/slack/event', () => {
    const api_path = '/api/slack/event';
    const service = build_service<PostEventPayloads>(app, api_path);
    const event_payload =
        fixture('slack/events.message_with_file') as EventCallbackPayload;
    const user_info = fixture('slack/users.info.response');
    const file_info = fixture('slack/files.info');

    describe('type: url_verification', () => {
        const params = {
            type: 'url_verification',
            token: 'dummy token',
            challenge: 'dummy challenge'
        } as PostEventPayloads;
        const response = build_response(service(params));

        it('responds back with the challenge param', (done) => {
            response((body: Record<string, unknown>) => {
                expect(body.challenge).toEqual('dummy challenge');
                done();
            }, done);
        });
    });

    describe('type: file_share event_callback in normal channel', () => {
        function test_file_share_on_supported_channel(params: EventCallbackPayload): void {
            describe('when redis throws an error', () => {
                it('logs the error', (done) => {
                    const key_error: Error = new Error('Some redis error');
                    storeGetSpy.mockImplementationOnce(() => {
                        return Promise.reject(key_error);
                    });

                    service(params).expect(200).end((err) => {
                        if (err) {
                            return done(err);
                        }

                        expect(logErrorSpy).toHaveBeenCalled();
                        expect(logErrorSpy.mock.calls[0].toString())
                            .toContain(key_error.message);
                        done();
                    });
                });
            });

            it('add message as comment to Jira Issue', (done) => {
                expect.assertions(2);
                const issue_key = 'some-issue-key';
                const checkJiraComment = (body: string): void => {
                    expect(body).toContain('files.slack');
                    expect(body).toContain('Egon Spengler');

                    done();
                };

                nock('https://example.com')
                    .post(`/rest/api/2/issue/${issue_key}/comment`, (body) => {
                        checkJiraComment(JSON.stringify(body));

                        return body;
                    }).reply(200);

                nock('https://slack.com')
                    .post('/api/users.info')
                    .reply(200, user_info);

                storeGetSpy.mockImplementationOnce(() => {
                    return Promise.resolve(issue_key);
                });

                service(params).expect(200).end((err) => {
                    if (err) {
                        return done(err);
                    }
                });
            });

            describe('message not in a thread', () => {
                const not_in_thread_params = merge<EventCallbackPayload>(params, {
                    'event': merge<EventCallbackPayload['event']>(
                        params['event'], {
                        thread_ts: undefined
                    })
                });

                it('will be ignored', () => {
                    return service(not_in_thread_params).expect(200);
                });
            });
        }

        describe('message on support channel', () => {
            const params = merge<EventCallbackPayload>(
                event_payload, {
                'event': merge<EventCallbackPayload['event']>(
                    event_payload['event'], { channel: 'suppchannel' }
                )
            });

            test_file_share_on_supported_channel(params);
        });

        describe('message on product channel', () => {
            const params = merge<EventCallbackPayload>(
                event_payload, {
                'event': merge<EventCallbackPayload['event']>(
                    event_payload['event'], { channel: 'prodchannel' }
                )
            });

            test_file_share_on_supported_channel(params);
        });

        describe('message not on support or product channel', () => {
            const params = merge<EventCallbackPayload>(
                event_payload, {
                'event': merge<EventCallbackPayload['event']>(
                    event_payload['event'], { channel: 'unknownchannel' }
                )
            });

            it('will be ignored', () => {
                return service(params).expect(200);
            });
        });

        describe('when something goes wrong', () => {
            const params = merge<EventCallbackPayload>(
                event_payload,
                {
                    'team_id': 'BAD-TEAM-ID'
                });

            it('logs the error', (done) => {
                service(params).expect(200).end((err) => {
                    if (err) {
                        return done(err);
                    }

                    expect(logErrorSpy).toHaveBeenCalled();
                    expect(logErrorSpy.mock.calls[0].toString())
                        .toContain('postEvent');
                    done();
                });
            });
        });
    });

    describe('type: file_share event_callback in connected channel', () => {
        const event_payload = fixture(
            'slack/events.message_with_file_in_connected_channel'
        ) as EventCallbackPayload;
        const params = merge<EventCallbackPayload>(
            event_payload, {
            'event': merge<EventCallbackPayload['event']>(
                event_payload['event'], { channel: 'suppchannel' }
            )
        });

        it('add message as comment to Jira Issue', (done) => {
            expect.assertions(2);
            const issue_key = 'some-issue-key';
            const checkJiraComment = (body: string): void => {
                expect(body).toContain('tedair.gif');
                expect(body).toContain('Egon Spengler');

                done();
            };

            nock('https://example.com')
                .post(`/rest/api/2/issue/${issue_key}/comment`, (body) => {
                    checkJiraComment(JSON.stringify(body));

                    return body;
                }).reply(200);

            nock('https://slack.com')
                .post('/api/users.info')
                .reply(200, user_info);

            nock('https://slack.com')
                .post('/api/files.info')
                .reply(200, file_info);

            storeGetSpy.mockImplementationOnce(() => {
                return Promise.resolve(issue_key);
            });

            service(params).expect(200).end((err) => {
                if (err) {
                    return done(err);
                }
            });
        });
    });

    describe('post event logging', () => {
        const params = merge<EventCallbackPayload>(
            event_payload, {
            'event': merge<EventCallbackPayload['event']>(
                event_payload['event'], { channel: 'unknownchannel' }
            )
        });

        it('logs the received event', () => {
            const featureSpy = jest.spyOn(feature, 'is_enabled');
            const logInfoSpy = jest.spyOn(logger, 'info')
                .mockReturnValue({} as Logger);
            featureSpy.mockImplementationOnce(() => true);

            return service(params).expect(200).then(() => {
                expect(logInfoSpy).toHaveBeenCalled();
            });
        });
    });

    describe('type: non file_share event_callback', () => {
        const dummy_event = {
            ts: 'not important',
            type: 'dummy',
            channel: 'dummy',
            thread_ts: 'foo-thread-ts'
        };
        const event_payload = {
            type: 'event_callback',
            token: 'dummy token',
            subtype: 'not a file share',
            team_id: 'T001',
            event: dummy_event
        } as EventCallbackPayload;

        it('will be ignored', () => {
            return service(event_payload).expect(200);
        });
    });
});
