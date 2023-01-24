import {
    ChannelThreadFileShareEvent,
    SlackFile,
    Submission,
    isSlackImageFile,
    ViewSubmission,
    ViewSubmissionInputValue,
    ViewSubmissionSelectValue,
    ViewSubmissionMultiSelectValue
} from './slack/api_interfaces';
import {
    IssueChangelog
} from './jira/api_interfaces';

function fileShareEventToIssueComment(
    event: ChannelThreadFileShareEvent,
    url: string,
    user_name: string
): string {
    const files_str = event.files.map(slackFileToText).join('\n\n');

    return `${user_name}: ${event.text}\n\n${files_str}\n \n${url}\n`;
}

interface SlackCommand {
    name: string,
    desc: string,
    example: string
}

function commandsNames(commands: Array<SlackCommand>): Array<string> {
    return commands.map((cmd) => { return cmd.name; });
}

// Unfortunaly preview slack images does not work as explained here:
// https://community.atlassian.com/t5/Jira-Questions/ \
// How-to-embed-images-by-URL-in-new-Markdown-Jira-editor/qaq-p/1126329
// > in the New editor and the editing view used in Next-gen Projects,
// > is moving away from using wiki style markup to a WYSIWYG editing approach,
// if (isSlackImageFile(file)) {
//     f = `!${file.url_private}!\n` +
//         `[Download](${file.url_private_download}) or ` +
//         `[See on Slack](${file.permalink})`;
// } else {
// }
function slackFileToText(file: SlackFile): string {
    if (isSlackImageFile(file)) {
        return `${file.name}\n` +
            `Preview: ${file.thumb_360}\n` +
            `Show: ${file.url_private}\n` +
            `Download: ${file.url_private_download}`;
    } else {
        return `${file.name}\n` +
            `Download: ${file.url_private_download}`;
    }
}

function plain_text_input(
    elm: ViewSubmissionInputValue
): ViewSubmissionInputValue['value'] {
    return elm.value;
}

function multi_static_select(
    elm: ViewSubmissionMultiSelectValue
): Array<string> {
    return elm.selected_options.map((option) => {
        return option.text.text;
    });
}

function static_select(
    elm: ViewSubmissionSelectValue
): string | undefined {
    if (elm.selected_option) {
        return elm.selected_option.text.text;
    }

    return undefined;
}

function extractValue(
    elm: ViewSubmissionInputValue | ViewSubmissionSelectValue | ViewSubmissionMultiSelectValue
): string | Array<string> | null | undefined {
    // TODO: Replace switch with polymorphism
    switch (elm.type) {
        case 'plain_text_input':
            return plain_text_input(elm as ViewSubmissionInputValue);
        case 'static_select':
            return static_select(elm as ViewSubmissionSelectValue);
        case 'multi_static_select':
            return multi_static_select(elm as ViewSubmissionMultiSelectValue);
        default:
            throw new Error(`Unexpected element type: ${elm.type}`);
    }
}

function viewToSubmission(
    view: ViewSubmission['view']
): Submission {
    return Object.values(view.state.values).reduce((acc, block) => {
        Object.keys(block).forEach((key) => {
            const field = key.replace(/^\w{2}_/, '');

            acc[field] = extractValue(block[key]);
        });

        return acc;
    }, {} as Submission);
}

function statusChangeMessage(
    changelog: IssueChangelog
): string | null {
    const status_change = changelog.items.find((el) => el.field === 'status');
    const resolution_change = changelog.items.find((el) => el.field === 'resolution');
    if (!status_change) {
        return null;
    }

    const changed_from = status_change.fromString;
    const changed_to = status_change.toString;
    const ignored_to_resolutions = [null, 'Done'];
    let message = `Status changed from *${changed_from}* to *${changed_to}*`;

    if (resolution_change && !ignored_to_resolutions.includes(resolution_change.toString)) {
        message = `${message}\nResolution: ${resolution_change.toString}`;
    }

    return message;
}

function normalisedTitleAndDesc(
    submission: Submission
): { title: string, desc: string } {
    let title = submission.title as string;
    let desc = submission.description as string;
    if (title.length > 128) {
        const first_part_of_title = title.slice(0, 128);
        const second_part_of_title = title.slice(128, -1);

        title = first_part_of_title;
        desc = `${second_part_of_title}\n\n${desc}`;
    }

    return {
        title: title,
        desc: desc
    };
}

export {
    commandsNames,
    fileShareEventToIssueComment,
    SlackCommand,
    slackFileToText,
    statusChangeMessage,
    viewToSubmission,
    normalisedTitleAndDesc
};
