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
                const submission = {
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
                    const request_type = 'bug';
                    const submission = {
                        title: 'A',
                        description: 'B',
                        currently: 'C',
                        expected: 'D',
                        component: 'E',
                        version: 'F',
                        employer: 'G',
                        worker: 'H',
                        listing: 'I',
                        shift: 'J',
                        test_data: 'K',
                        region: 'L',
                        device: 'M'
                    };

                    const fieldLabels = [
                        'Component/Platform',
                        'App version',
                        'Employer ID',
                        'Worker ID',
                        'Listing ID',
                        'Shift ID',
                        'Test data',
                        'Region/Country',
                        'Device'
                    ];

                    it.each(fieldLabels)('sends the "%s" label in the description', label => {
                        const featureSpy = jest.spyOn(feature, 'is_enabled');
                        featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                        const { description } = config
                            .issueParams(submission, slack_user, request_type).fields;
                        expect(description).toContain(label);

                        featureSpy.mockRestore();
                    });

                    const submissionValues = Object.values(submission);

                    it.each(submissionValues)('sends the "%s" value in the message', value => {
                        const featureSpy = jest.spyOn(feature, 'is_enabled');
                        featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                        const { description } = config
                            .issueParams(submission, slack_user, request_type).fields;
                        expect(description).toContain(value);

                        featureSpy.mockRestore();
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
                const submission = {
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
            });

            describe('feature: new_bug_fields', () => {
                const request_type = 'bug';
                const submission = {
                    title: 'Test A',
                    description: 'Test B',
                    currently: 'Test C',
                    expected: 'Test D',
                    component: 'Test E',
                    version: 'Test F',
                    employer: 'Test G',
                    worker: 'Test H',
                    listing: 'Test I',
                    shift: 'Test J',
                    test_data: 'Test K',
                    region: 'Test L',
                    device: 'Test M'
                };

                const fieldLabels = [
                    'Component/Platform',
                    'App version',
                    'Employer ID',
                    'Worker ID',
                    'Listing ID',
                    'Shift ID',
                    'Test data',
                    'Region/Country',
                    'Device'
                ];

                it.each(fieldLabels)('include the "%s" label in the message', (label) => {
                    const featureSpy = jest.spyOn(feature, 'is_enabled');
                    featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                    const messageText = config.messageText(
                        submission,
                        slack_user,
                        request_type
                    );
                    expect(messageText).toContain(label);

                    featureSpy.mockRestore();
                });

                const submissionValues = Object.values(submission)
                    .map((value, i) => {
                        if (i === 0) return `*${value}*`;
                        return value;
                    });

                it.each(submissionValues)('include the "%s" value in the message', (value) => {
                    const featureSpy = jest.spyOn(feature, 'is_enabled');
                    featureSpy.mockImplementationOnce(flag => flag === 'new_bug_fields');

                    const messageText = config.messageText(
                        submission,
                        slack_user,
                        request_type
                    );
                    expect(messageText).toContain(value);

                    featureSpy.mockRestore();
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
