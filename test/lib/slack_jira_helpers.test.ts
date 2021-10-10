import {
    statusChangeMessage,
    viewInputVal,
    viewSelectedVal,
    viewMultiSelectedVal,
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

describe('viewInputVal(id, values)', () => {
    describe('no input', () => {
        const values = {
            sl_title_block: {
                sl_title: {
                    type: 'plain_text_input',
                    value: null
                }
            }
        };

        it('should return undefined', () => {
            expect(viewInputVal('sl_title', values)).toBeUndefined();
        });
    });

    describe('defined value', () => {
        const values = {
            sl_title_block: {
                sl_title: {
                    type: 'plain_text_input',
                    value: 'A'
                }
            }
        };

        it('should return a string', () => {
            expect(viewInputVal('sl_title', values)).toBe('A');
        });
    });
});

describe('viewSelectedVal(id, values)', () => {
    describe('no selection', () => {
        const values = {
            ss_region_block: {
                ss_region: {
                    type: 'static_select',
                    selected_option: null
                }
            }
        };

        it('should return undefined', () => {
            expect(viewSelectedVal('ss_region', values)).toBeUndefined();
        });
    });

    describe('one selection', () => {
        const values = {
            ss_region_block: {
                ss_region: {
                    type: 'static_select',
                    selected_option: {
                        text: { text: 'A' }
                    }
                }
            }
        };

        it('should return a string', () => {
            expect(viewSelectedVal('ss_region', values)).toBe('A');
        });
    });
});

describe('viewMultiSelectedVal(id, values)', () => {
    describe('with no selection', () => {
        const values = {
            ms_component_block: {
                ms_component: {
                    type: 'multi_static_select',
                    selected_options: []
                }
            }
        };

        it('returns an empty array', () => {
            expect(viewMultiSelectedVal('ms_component', values)).toEqual([]);
        });
    });

    describe('with selections', () => {
        const values = {
            ms_component_block: {
                ms_component: {
                    type: 'multi_static_select',
                    selected_options: [
                        {
                            text: { text: 'A' }
                        },
                        {
                            text: { text: 'B' }
                        },
                        {
                            text: { text: 'C' }
                        },
                    ]
                }
            }
        };

        it('returns an array of values', () => {
            expect(viewMultiSelectedVal('ms_component', values)).toEqual(['A', 'B', 'C']);
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
            viewSubmissionView as ViewSubmission['view'], 'data'
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
                viewSubmissionView as ViewSubmission['view'], 'data'
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
                viewSubmissionView as ViewSubmission['view'], 'data'
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
                    viewSubmissionView as ViewSubmission['view'], 'data'
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
                viewSubmissionView as ViewSubmission['view'], 'data'
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
                    viewSubmissionView as ViewSubmission['view'], 'data'
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
                    viewSubmissionView as ViewSubmission['view'], 'data'
                );
            }).toThrowError();
        });
    });
});
