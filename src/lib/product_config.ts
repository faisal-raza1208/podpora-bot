import fs from 'fs';
import path from 'path';
import slugify from '@sindresorhus/slugify';
import { View } from '@slack/web-api';
import {
    SlackUser,
    Submission,
    ViewSubmission,
    RequestType
} from './slack/api_interfaces';
import {
    normalisedTitleAndDesc,
    viewInputVal,
    viewSelectedVal,
    SlackCommand
} from './slack_jira_helpers';
import {
    CreateIssue
} from './jira/api_interfaces';
import Config from './config';

interface Views {
    [index: string]: View
}

const viewsDirectoryPath = path.join(__dirname, '..', 'views', 'product', 'default');
const views: Views = {};
fs.readdirSync(viewsDirectoryPath).reduce((acc, name: string) => {
    const fpath = path.join(viewsDirectoryPath, name);
    acc[path.parse(fpath).name] = JSON.parse(
        fs.readFileSync(fpath).toString()
    );
    return acc;
}, views);

function commandsHelpText(commands: Array<SlackCommand>): string {
    return '👋 Need help with product bot?\n\n' + commands.map(
        (cmd) => {
            return `> ${cmd.desc}:\n>\`${cmd.example}\``;
        }).join('\n\n');
}

function viewToSubmission(
    view: ViewSubmission['view'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request_type: RequestType
): Submission {
    const values = view.state.values;
    const submission: Submission = {};
    submission.title = viewInputVal('sl_title', values);
    submission.description = viewInputVal('ml_description', values);
    submission.affected_users = viewInputVal('sl_affected_users', values);
    const prod_area_value = viewSelectedVal('sl_product_area', values);
    const urgency_value = viewSelectedVal('sl_urgency', values);

    if (prod_area_value) {
        submission.product_area = prod_area_value;
    }
    if (urgency_value) {
        submission.urgency = urgency_value;
    }

    return submission;
}

const configs: { [index: string]: Config } = {};

configs.default = {
    commands: [
        {
            name: 'idea',
            desc: 'Submit new product idea',
            example: '/idea'
        }
    ],
    commandsHelpText: function(): string {
        return commandsHelpText(this.commands);
    },
    view: function(key: string): View {
        return views[key];
    },
    viewToSubmission: viewToSubmission,
    issueParams: function(
        submission: Submission,
        user: SlackUser,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request_type: RequestType,
    ): CreateIssue {
        const title_and_desc = normalisedTitleAndDesc(submission);
        const title = title_and_desc.title;
        let desc = title_and_desc.desc;
        const board = 'IDEA';
        const issue_type = 'Idea';
        desc = `${desc}

Affected Users: ${submission.affected_users}
Product Area: ${submission.product_area}
Urgency: ${submission.urgency}

Submitted by: ${user.name}`;
        const labels = [];

        labels.push('product');

        if (submission.urgency) {
            labels.push(slugify(submission.urgency));
        }
        if (submission.product_area) {
            labels.push(slugify(submission.product_area));
        }

        return {
            fields: {
                project: { key: board },
                summary: title,
                issuetype: { name: issue_type },
                description: desc,
                labels: labels
            }
        };
    },
    messageText(
        submission: Submission,
        user: SlackUser,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request_type: RequestType
    ): string {
        return `<@${user.id}> has submitted a new product idea:\n\n` +
            `*${submission.title}*\n\n${submission.description}\n\n` +
            `Affected Users: ${submission.affected_users}\n` +
            `Product Area: ${submission.product_area}\n` +
            `Urgency: ${submission.urgency}`;
    }
};

export default function productConfig(key: string): Config {
    return configs[key];
}
