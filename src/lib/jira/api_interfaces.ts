import {
    IssueBean,
    CreatedIssue,
    Fields,
    RemoteIssueLinkIdentifies,
    LinkedIssue
} from 'jira.js/out/version2/models';
import {
    CreateIssue
} from 'jira.js/out/version2/parameters';

interface IssueChangelog {
    id: string
    items: Array<{
        field: string
        fieldtype: string
        fieldId: string
        from: string | null
        fromString: string | null
        to: string | null
        toString: string | null
    }>
}

interface Attachment {
    self: string
    id: string
    filename: string
    mimeType: string
    content: string
}

interface RealIssueFields extends Fields {
    issuelinks: Array<DetailIssueLinks>
}

interface Issue extends IssueBean {
    fields: RealIssueFields
}

interface IssueLink {
    id: number
    sourceIssueId: number,
    destinationIssueId: number,
    issueLinkType: {
        id: number,
        name: string,
        outwardName: string,
        inwardName: string,
        isSubTaskLinkType: boolean,
        isSystemLinkType: boolean
    },
    systemLink: boolean
}

interface DetailIssueLink {
    id: string,
    self: string,
    type: {
        id: string,
        name: string,
        inward: string,
        outward: string,
        self: string,
    }
}

interface LinkIssue extends LinkedIssue {
    id: string,
    key: string,
    self: string,
    fields: Fields
}

interface DetailOutwardIssueLink extends DetailIssueLink {
    outwardIssue: LinkIssue
}

interface DetailInwardIssueLink extends DetailIssueLink {
    inwardIssue: LinkIssue
}

function isOutwardIssueDetailLink(
    link: DetailIssueLinks
): link is DetailOutwardIssueLink {
    return (<DetailOutwardIssueLink>link).outwardIssue !== undefined;
}

// function isInwardIssueDetailLink(
//     link: DetailIssueLinks
// ): link is DetailInwardIssueLink {
//     return (<DetailInwardIssueLink>link).inwardIssue !== undefined;
// }

type DetailIssueLinks = DetailOutwardIssueLink | DetailInwardIssueLink;

export {
    IssueChangelog,
    Attachment,
    CreateIssue,
    CreatedIssue,
    Issue,
    IssueLink,
    DetailIssueLinks,
    // isInwardIssueDetailLink,
    isOutwardIssueDetailLink,
    DetailInwardIssueLink,
    DetailOutwardIssueLink,
    RemoteIssueLinkIdentifies
};
