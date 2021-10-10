import {
    statusChangeMessage,
    viewInputVal,
    viewSelectedVal,
    viewMultiSelectedVal
} from '../../src/lib/slack_jira_helpers';

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
