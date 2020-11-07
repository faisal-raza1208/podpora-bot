# Support Bot v2

Support Slack Bot in TypeScript

# Table of contents:

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Development](#development)
- [TO-DO](#todo)
- [License](#license)

# Prerequisites
- [Node.js](https://nodejs.org/en/)
- [Redis](https://redis.io)
- [Slack](https://slack.dev)
- [Jira](https://www.atlassian.com/software/jira)

# Getting started

- Clone the repository
```shell
git clone --depth=1 https://github.com/keram/podpora-bot.git

```

- Install dependencies
```shell
cd podpora-bot
npm install
```

- Build and run the project
```shell
npm run build
npm start
```

Visit `http://localhost:3000`

# Deployment

Set in production ENV variables specified in .env.example
where the key is Slack Team id

# Development

## Prerequisites
- [Node.js](https://nodejs.org/en/)
- [Overcommit](https://github.com/sds/overcommit)

- Clone the repository
```shell
git clone --depth=1 https://github.com/keram/podpora-bot.git
cd podpora-bot
```

- Install dependencies
```shell
npm install
```

- Install overcommit
```shell
gem install overcommit
overcommit -i
overcommit --sign
```

## Running tests
`npm run test`

## ESLint
```shell
npm run build   // runs full build including ESLint
npm run lint    // runs only ESLint
```

## More
Check all available tasks to use for development.
```shell
npm run --list
```

# To-do

https://github.com/Syft-Application/podpora-bot/issues

# License
Copyright (c) Marek L. All rights reserved.
Licensed under the [MIT](LICENSE) License.
