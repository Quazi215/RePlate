# Issue tracker: GitHub

Issues and specs live in GitHub Issues for Quazi215/RePlate.
Use the `gh` CLI from this repository.

- Create: `gh issue create --title "..." --body-file <file>`
- Read: `gh issue view <number> --json number,title,body,labels,comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body-file <file>`
- Label: `gh issue edit <number> --add-label "<label>"`
- Remove a label: `gh issue edit <number> --remove-label "<label>"`
- Close: `gh issue close <number> --comment "..."`

When a skill says to publish to the issue tracker, create a GitHub issue.
When it says to fetch a ticket, read the referenced GitHub issue.

PRs as a request surface: no.
