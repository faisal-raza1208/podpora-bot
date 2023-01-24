import {
    fileShareEventToIssueComment,
    statusChangeMessage,
    viewToSubmission
} from '../../src/lib/slack_jira_helpers';
import { ViewSubmission } from '../../src/lib/slack/api_interfaces';

afterEach(() => {
    jest.clearAllMocks();
});

describe('statusChangeMessage(issue, changelog)', () => {
    describe('move from Done to active state', () => {
        const changelog = {
            id: '10143',
            items: [
                {
                    field: 'resolution',
                    fieldtype: 'jira',
                    fieldId: 'resolution',
                    from: null,
                    fromString: 'Duplicate',
                    to: '10000',
                    toString: null
                },
                {
                    field: 'status',
                    fieldtype: 'jira',
                    fieldId: 'status',
                    from: '10001',
                    fromString: 'Done',
                    to: '10002',
                    toString: 'In Progress'
                }
            ]
        };

        it('does not include the resolution in Slack message', () => {
            const msg = statusChangeMessage(changelog);

            expect(msg).toContain('Status changed from');
            expect(msg).toContain('Done');
            expect(msg).toContain('In Progress');
            expect(msg).not.toContain('null');
        });
    });
});

describe('viewToSubmission(view, request_type)', () => {
    const viewSubmissionView: Partial<ViewSubmission['view']> = {
        state: {
            values: {}
        }
    };

    it('returns empty submission object', () => {
        const submission = viewToSubmission(
            viewSubmissionView as ViewSubmission['view']
        );

        expect(submission).toEqual({});
    });

    describe('with plain text input', () => {
        const viewSubmissionView: Partial<ViewSubmission['view']> = {
            state: {
                values: {
                    sl_single_value_block: {
                        sl_single_value: {
                            type: 'plain_text_input',
                            value: 'Test A'
                        },
                    }
                }
            }
        };

        it('returns submission with key and value from input', () => {
            const submission = viewToSubmission(
                viewSubmissionView as ViewSubmission['view']
            );

            expect(submission).toEqual({ single_value: 'Test A' });
        });
    });

    describe('with static select', () => {
        const viewSubmissionView: Partial<ViewSubmission['view']> = {
            state: {
                values: {
                    ss_region_block: {
                        ss_region: {
                            type: 'static_select',
                            selected_option: {
                                text: { text: 'Test J' }
                            }
                        }
                    }
                }
            }
        };

        it('returns submission with key and value from select', () => {
            const submission = viewToSubmission(
                viewSubmissionView as ViewSubmission['view']
            );

            expect(submission).toEqual({ region: 'Test J' });
        });

        describe('when no value selected', () => {
            const viewSubmissionView: Partial<ViewSubmission['view']> = {
                state: {
                    values: {
                        ss_region_block: {
                            ss_region: {
                                type: 'static_select',
                                selected_option: null
                            }
                        }
                    }
                }
            };

            it('returns submission with key and `undefined` as value from select', () => {
                const submission = viewToSubmission(
                    viewSubmissionView as ViewSubmission['view']
                );

                expect(submission).toEqual({ region: undefined });
            });
        });
    });

    describe('with multi select', () => {
        const viewSubmissionView: Partial<ViewSubmission['view']> = {
            state: {
                values: {
                    ms_component_block: {
                        ms_component: {
                            type: 'multi_static_select',
                            selected_options: [
                                {
                                    text: { text: 'Test C1' }
                                },
                                {
                                    text: { text: 'Test C2' }
                                }
                            ]
                        }
                    }
                }
            }
        };

        it('returns submission with key and list of values from select', () => {
            const submission = viewToSubmission(
                viewSubmissionView as ViewSubmission['view']
            );

            expect(submission).toEqual({ component: ['Test C1', 'Test C2'] });
        });

        describe('when no value selected', () => {
            const viewSubmissionView: Partial<ViewSubmission['view']> = {
                state: {
                    values: {
                        ms_component_block: {
                            ms_component: {
                                type: 'multi_static_select',
                                selected_options: []
                            }
                        }
                    }
                }
            };

            it('returns submission with key and empty array as value from select', () => {
                const submission = viewToSubmission(
                    viewSubmissionView as ViewSubmission['view']
                );

                expect(submission).toEqual({ component: [] });
            });
        });
    });

    describe('with unknown inputtype', () => {
        const viewSubmissionView: Partial<ViewSubmission['view']> = {
            state: {
                values: {
                    sl_unknown_block: {
                        sl_unknown: {
                            type: 'unknown_input_type',
                            value: 'Test D'
                        }
                    }
                }
            }
        };

        it('raise error', () => {
            expect(() => {
                viewToSubmission(
                    viewSubmissionView as ViewSubmission['view']
                );
            }).toThrowError();
        });
    });
});

describe('fileShareEventToIssueComment(event, url, user_name)', () => {
    const bin_file = {
        id: 'F015XSUL1K4',
        name: 'puzzle.org',
        title: 'puzzle.org',
        mimetype: 'text/plain',
        filetype: 'text',
        pretty_type: 'Plain Text',
        url_private: 'https://files.slack.com/files-pri/THS7JQ2RL-F015XSUL1K4/puzzle.org',
        url_private_download: 'https://files.slack.com/fi/download/puzzle.org',
        permalink: 'https://test.slack.com/files/UHAV00MD0/F015XSUL1K4/puzzle.org',
        permalink_public: 'https://slack-files.com/THS7JQ2RL-F015XSUL1K4-b0d770cfec'
    };

    const img_file = {
        id: 'F015N0DGC87',
        name: 'Cover.jpg',
        title: 'Cover.jpg',
        mimetype: 'image/jpeg',
        filetype: 'jpg',
        pretty_type: 'JPEG',
        user: 'UHAV00MD0',
        url_private: 'https://files.slack.com/files-pri/T0001-F015N0DGC87/cover.jpg',
        url_private_download: 'https://files.slack.com/fi15N0DGC87/download/cover.jpg',
        thumb_360: 'https://files.slack.com/files-tmb/T00C87-428249289d/cover_360.jpg',
        thumb_160: 'https://files.slack.com/files-tmb/T00GC87-428249289d/cover_160.jpg',
        original_w: 250,
        original_h: 250,
        permalink: 'https://test.slack.com/files/UHAF015N0DGC87/cover.jpg',
        permalink_public: 'https://slack-files.com/T0001-F015N0DGC87-bcd4f0fe25',
    };

    const event = {
        type: 'message',
        text: 'some message',
        files: [bin_file, img_file],
        user: 'UHAV00MD0',
        ts: '1593117566.000400',
        thread_ts: '1593117373.000100',
        channel: 'CHS7JQ7PY',
        subtype: 'file_share'
    };

    const result = fileShareEventToIssueComment(event, 'some url', 'Egon Bondy');

    it('contains the text message and link to slack', () => {
        expect(result).toContain('some message');
        expect(result).toContain('some url');
    });

    it('contains user name', () => {
        expect(result).toContain('Egon Bondy');
    });

    describe('files: [bin_file]', () => {
        it('contains file download link', () => {
            expect(result).toContain(bin_file.url_private_download);
        });
    });

    describe('files: [image]', () => {
        it('contains also image thumb (preview) url', () => {
            expect(result).toContain(img_file.thumb_360);
            expect(result).toContain(img_file.url_private);
            expect(result).toContain(img_file.url_private_download);
        });
    });
});
