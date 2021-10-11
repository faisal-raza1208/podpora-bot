import { merge } from '../helpers';
import supportConfig from '../../src/lib/support_config';
import feature from '../../src/util/feature';
import { ViewSubmission } from '../../src/lib/slack/api_interfaces';

describe('supportConfig', () => {
    const slack_user = { id: 'foo-user-id', name: 'Joe Doe' };
    describe('default', () => {
        const config = supportConfig('default');
        it('exists', () => {
            expect(config).toBeDefined();
        });
    });

    describe('syft', () => {
        const config = supportConfig('syft');
        it('exists', () => {
            expect(config).toBeDefined();
        });

        describe('#issueParams(submission, slack_user, request_type)', () => {
            describe('bug', () => {
                const request_type = 'bug';
                let submission = {
                    title: 'Test A',
                    description: 'Test B',
                    currently: 'Test C',
                    expected: 'Test D'
                };
                const desc = `${submission.description}

Currently:
${submission.currently}

Expected:
${submission.expected}

Submitted by: ${slack_user.name}`;

                it('matches expected object', () => {
                    expect(
                        config.issueParams(submission, slack_user, request_type)
                    ).toEqual({
                        fields: {
                            project: { key: 'SUP' },
                            summary: submission.title,
                            issuetype: { name: 'Bug' },
                            description: desc,
                            labels: ['support']
                        }
                    });
                });

                describe('feature: new_bug_fields', () => {
                    const fields = {
                        component: 'Test E',
                        version: 'Test F',
                        employer: 'Test G',
                        worker: 'Test H',
                        listing: 'Test I',
                        shift: 'Test J',
                        test_data: 'Test K',
                        region: 'Test L',
                        device: 'Test M',
                        urgency: 'Test O'
                    };

                    const fieldLabels = {
                        component: 'Component/Platform',
                        version: 'App version',
                        employer: 'Employer ID',
                        worker: 'Worker ID',
                        listing: 'Listing ID',
                        shift: 'Shift ID',
                        test_data: 'Test data',
                        region: 'Region/Country',
                        device: 'Device',
                        urgency: 'Urgent'
                    };

                    submission = merge(submission, fields);

                    describe('.fields.description', () => {
                        it('contains new bug fields labels', () => {
                            const featureSpy = jest.spyOn(feature, 'is_enabled');
                            featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                            const { description } = config
                                .issueParams(submission, slack_user, request_type).fields;

                            Object.values(fieldLabels)
                                .forEach((label: string) => {
                                    expect(description).toContain(label);
                                });
                        });

                        it('contains new bug fields values', () => {
                            const featureSpy = jest.spyOn(feature, 'is_enabled');
                            featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                            const { description } = config
                                .issueParams(submission, slack_user, request_type).fields;

                            Object.values(fields)
                                .forEach((value: string) => {
                                    expect(description).toContain(value);
                                });
                        });
                    });
                });
            });

            describe('data', () => {
                const request_type = 'data';
                const submission = {
                    title: 'Test A',
                    description: 'Test B',
                    reason: 'Test C'
                };
                const desc = `${submission.description}

Reason and urgency:
${submission.reason}

Submitted by: ${slack_user.name}`;

                it('matches expected object', () => {
                    expect(
                        config.issueParams(submission, slack_user, request_type)
                    ).toEqual({
                        fields: {
                            project: { key: 'SUP' },
                            summary: submission.title,
                            issuetype: { name: 'Data Request' },
                            description: desc,
                            components: [{ name: 'Back-end' }],
                            labels: ['support']
                        }
                    });
                });
            });

            describe('when long title', () => {
                const request_type = 'data';
                const long_title = 'few random words repeated many times'.repeat(10);
                const submission = {
                    title: long_title,
                    description: 'Test B',
                    reason: ''
                };
                const first_part_of_title = long_title.slice(0, 128);
                const second_part_of_title = long_title.slice(128, -1);
                const desc = `${second_part_of_title}

${submission.description}

Reason and urgency:


Submitted by: ${slack_user.name}`;
                it('slice the title to acceptable length and prepend to description', () => {
                    expect(
                        config.issueParams(submission, slack_user, request_type)
                    ).toEqual({
                        fields: {
                            project: { key: 'SUP' },
                            summary: first_part_of_title,
                            issuetype: { name: 'Data Request' },
                            description: desc,
                            components: [{ name: 'Back-end' }],
                            labels: ['support']
                        }
                    });
                });

            });
        });

        describe('#messageText(submission, user, request_type)', () => {
            describe('data', () => {
                const request_type = 'data';
                const submission = {
                    title: 'Test title',
                    description: 'Test description',
                    reason: 'Test reason'
                };

                it('returns a string', () => {
                    const result = config.messageText(submission, slack_user, request_type);
                    expect(result).toContain('*Test title*');
                    expect(result).toContain('Test description');
                    expect(result).toContain('Test reason');
                });
            });

            describe('bug', () => {
                const request_type = 'bug';
                let submission = {
                    title: 'Test title',
                    description: 'Test description',
                    currently: 'Test currently',
                    expected: 'Test expected'
                };

                it('returns a string', () => {
                    const result = config.messageText(submission, slack_user, request_type);
                    expect(result).toContain('*Test title*');
                    expect(result).toContain('Test description');
                    expect(result).toContain('Test currently');
                    expect(result).toContain('Test expected');
                });

                describe('feature: new_bug_fields', () => {
                    const fields = {
                        component: 'Test E',
                        version: 'Test F',
                        employer: 'Test G',
                        worker: 'Test H',
                        listing: 'Test I',
                        shift: 'Test J',
                        test_data: 'Test K',
                        region: 'Test L',
                        device: 'Test M',
                        urgency: 'Test O'
                    };

                    const fieldLabels = {
                        component: 'Component/Platform',
                        version: 'App version',
                        employer: 'Employer ID',
                        worker: 'Worker ID',
                        listing: 'Listing ID',
                        shift: 'Shift ID',
                        test_data: 'Test data',
                        region: 'Region/Country',
                        device: 'Device',
                        urgency: 'Urgent'
                    };

                    submission = merge(submission, fields);

                    it('contains new bug fields labels', () => {
                        const featureSpy = jest.spyOn(feature, 'is_enabled');
                        featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                        const result = config.messageText(submission, slack_user, request_type);

                        Object.values(fieldLabels)
                            .forEach((label: string) => {
                                expect(result).toContain(label);
                            });
                    });

                    it('contains new bug fields values', () => {
                        const featureSpy = jest.spyOn(feature, 'is_enabled');
                        featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                        const result = config.messageText(submission, slack_user, request_type);

                        Object.values(fields)
                            .forEach((value: string) => {
                                expect(result).toContain(value);
                            });
                    });
                });
            });
        });

        describe('#view(key)', () => {
            it('returns json modal definition', () => {
                const result = config.view('bug');

                expect(
                    new Set(Object.keys(result))
                ).toEqual(new Set(['title', 'type', 'blocks', 'submit', 'private_metadata']));
            });

            describe('feature: new_bug_fields', () => {
                const featureSpy = jest.spyOn(feature, 'is_enabled');
                featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');
                const result = config.view('bug');
                const blocks_ids = result.blocks.map((block) => { return block.block_id; });

                expect(
                    new Set(blocks_ids)
                ).toEqual(new Set([
                    'sl_title_block',
                    'ml_description_block',
                    'sl_currently_block',
                    'sl_expected_block',
                    'ss_urgency_block',
                    'ms_component_block',
                    'ss_region_block',
                    'sl_version_block',
                    'sl_employer_block',
                    'sl_worker_block',
                    'sl_listing_block',
                    'sl_shift_block',
                    'sl_test_data_block',
                    'ss_device_block'
                ]));
            });
        });

        describe('#commandsHelpText()', () => {
            const expected_text =
                '👋 Need help with support bot?\n\n'
                + '> Submit a request for data:\n>`/support data`\n\n'
                + '> Submit a bug report:\n>`/support bug`';

            it('matches expected text', () => {
                expect(config.commandsHelpText()).toEqual(expected_text);
            });
        });

        describe('#viewToSubmission(view, request_type)', () => {
            describe('bug submission', () => {
                const viewSubmissionView: Partial<ViewSubmission['view']> = {
                    state: {
                        values: {
                            sl_title_block: {
                                sl_title: {
                                    type: 'plain_text_input',
                                    value: 'Test A'
                                },
                            },
                            ml_description_block: {
                                ml_description: {
                                    type: 'plain_text_input',
                                    value: 'Test B'
                                },
                            },
                            sl_currently_block: {
                                sl_currently: {
                                    type: 'plain_text_input',
                                    value: 'Test C'
                                },
                            },
                            sl_expected_block: {
                                sl_expected: {
                                    type: 'plain_text_input',
                                    value: 'Test D'
                                },
                            },
                        }
                    }
                };

                const submission = config
                    .viewToSubmission(
                        viewSubmissionView as ViewSubmission['view'], 'bug'
                    );

                const fields = Object.keys(
                    (viewSubmissionView as ViewSubmission['view']).state.values
                )
                    .map(key => key.split('_')[1]);

                it.each(fields)('includes the "%s" property', field => {
                    expect(submission[field]).toBeDefined();
                });

                describe('feature: new_bug_fields', () => {
                    const viewSubmissionView: Partial<ViewSubmission['view']> = {
                        state: {
                            values: {
                                sl_title_block: {
                                    sl_title: {
                                        type: 'plain_text_input',
                                        value: 'Test A'
                                    },
                                },
                                ml_description_block: {
                                    ml_description: {
                                        type: 'plain_text_input',
                                        value: 'Test B'
                                    },
                                },
                                ms_component_block: {
                                    ms_component: {
                                        type: 'multi_static_select',
                                        selected_options: [
                                            {
                                                text: { text: 'Test C1' }
                                            },
                                            {
                                                text: { text: 'Test C2' }
                                            },
                                        ]
                                    },
                                },
                                sl_version_block: {
                                    sl_version: {
                                        type: 'plain_text_input',
                                        value: 'D'
                                    },
                                },
                                sl_employer_block: {
                                    sl_employer: {
                                        type: 'plain_text_input',
                                        value: 'E'
                                    },
                                },
                                sl_worker_block: {
                                    sl_worker: {
                                        type: 'plain_text_input',
                                        value: 'F'
                                    },
                                },
                                sl_listing_block: {
                                    sl_listing: {
                                        type: 'plain_text_input',
                                        value: 'G'
                                    },
                                },
                                sl_shift_block: {
                                    sl_shift: {
                                        type: 'plain_text_input',
                                        value: 'H'
                                    },
                                },
                                sl_test_data_block: {
                                    sl_test_data: {
                                        type: 'plain_text_input',
                                        value: 'I'
                                    },
                                },
                                ss_region_block: {
                                    ss_region: {
                                        type: 'static_select',
                                        selected_option: {
                                            text: { text: 'J' }
                                        }
                                    },
                                },
                                ss_device_block: {
                                    ss_device: {
                                        type: 'static_select',
                                        selected_option: {
                                            text: { text: 'K' }
                                        }
                                    },
                                },
                                sl_currently_block: {
                                    sl_currently: {
                                        type: 'plain_text_input',
                                        value: 'L'
                                    },
                                },
                                sl_expected_block: {
                                    sl_expected: {
                                        type: 'plain_text_input',
                                        value: 'M'
                                    },
                                },
                                ss_urgency_block: {
                                    ss_urgency: {
                                        type: 'static_select',
                                        selected_option: {
                                            text: { text: 'O' }
                                        }
                                    },
                                },
                            }
                        }
                    };

                    const fields = Object.keys(
                        (viewSubmissionView as ViewSubmission['view']).state.values
                    )
                        .map(key => {
                            if (key === 'sl_test_data_block') return 'test_data';
                            return key.split('_')[1];
                        });

                    it.each(fields)('includes the "%s" property', field => {
                        const featureSpy = jest.spyOn(feature, 'is_enabled');
                        featureSpy.mockImplementation(flag => flag === 'new_bug_fields');

                        const submission = config
                            .viewToSubmission(
                                viewSubmissionView as ViewSubmission['view'], 'bug'
                            );

                        expect(submission[field]).toBeDefined();

                        featureSpy.mockRestore();
                    });
                });
            });

            describe('data request submission', () => {
                const viewSubmissionView: Partial<ViewSubmission['view']> = {
                    state: {
                        values: {
                            sl_title_block: {
                                sl_title: {
                                    type: 'plain_text_input',
                                    value: 'Test A'
                                },
                            },
                            ml_description_block: {
                                ml_description: {
                                    type: 'plain_text_input',
                                    value: 'Test B'
                                },
                            },
                            ml_reason_block: {
                                ml_reason: {
                                    type: 'plain_text_input',
                                    value: 'Test C'
                                },
                            },
                        }
                    }
                };

                const submission = config
                    .viewToSubmission(
                        viewSubmissionView as ViewSubmission['view'], 'data'
                    );

                it('contains all data request fields', () => {
                    expect(submission.title).toEqual('Test A');
                    expect(submission.description).toEqual('Test B');
                    expect(submission.reason).toEqual('Test C');
                });
            });
        });
    });
});
