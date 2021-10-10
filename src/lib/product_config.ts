import slugify from '@sindresorhus/slugify';
import { View } from '@slack/web-api';
import {
    SlackUser,
    Submission,
    RequestType
} from './slack/api_interfaces';
import {
    normalisedTitleAndDesc,
    viewToSubmission,
    SlackCommand
} from './slack_jira_helpers';
import {
    CreateIssue
} from './jira/api_interfaces';
import Config from './config';
import views from './views';

function commandsHelpText(commands: Array<SlackCommand>): string {
    return '👋 Need help with product bot?\n\n' + commands.map(
        (cmd) => {
            return `> ${cmd.desc}:\n>\`${cmd.example}\``;
        }).join('\n\n');
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
        return views.product.default[key];
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
            labels.push(slugify(submission.urgency as string));
        }
        if (submission.product_area) {
            labels.push(slugify(submission.product_area as string));
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
