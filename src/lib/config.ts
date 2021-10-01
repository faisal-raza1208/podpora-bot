import { View } from '@slack/web-api';
import {
    RequestType,
    SlackUser,
    Submission,
    ViewSubmission
} from './slack/api_interfaces';
import {
    SlackCommand
} from './slack_jira_helpers';
import {
    CreateIssue
} from './jira/api_interfaces';

interface Config {
    commands: Array<SlackCommand>,
    commandsHelpText: () => string,
    view: (key: string) => View,
    viewToSubmission: (
        view: ViewSubmission['view'],
        request_type: RequestType
    ) => Submission,
    issueParams: (
        submission: Submission,
        user: SlackUser,
        request_type: RequestType
    ) => CreateIssue,
    messageText: (
        submission: Submission,
        user: SlackUser,
        request_type: RequestType
    ) => string
}

export default Config;
