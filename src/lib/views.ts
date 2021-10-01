import fs from 'fs';
import path from 'path';
import { View } from '@slack/web-api';

interface ViewsOptions {
    [index: string]: {
        [index: string]: View
    }
}

interface Views {
    [index: string]: ViewsOptions
}

const viewsDirPath = path.join(__dirname, '..', 'views');

/*

Loads Slack modal views templates from file system in
tree like structure and making them available in implementation and
options namespace.

src/views/
├── product
│   └── default
│       └── idea.json
└── support
    └── default
        ├── bug.json
        └── data.json
*/
function loadViews(viewsDirPath: string): Views {
    return fs.readdirSync(viewsDirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory)
        .reduce((acc, dirent) => {
            // support, product
            const implementation = dirent.name;
            const implementation_path = path.join(viewsDirPath, implementation);
            const options: ViewsOptions = {};
            acc[implementation] = fs.readdirSync(implementation_path, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory)
                .reduce((acc, dirent) => {
                    // default, syft
                    const option = dirent.name;
                    const option_path = path.join(implementation_path, option);
                    const views: { [index: string]: View } = {};
                    acc[dirent.name] = fs.readdirSync(option_path, { withFileTypes: true })
                        .filter(dirent => dirent.isFile)
                        .reduce((acc, dirent) => {
                            // bug, data, idea
                            const view = dirent.name;
                            const view_path = path.join(option_path, view);

                            acc[path.parse(view_path).name] = JSON.parse(
                                fs.readFileSync(view_path).toString()
                            );
                            return acc;
                        }, views);

                    return acc;
                }, options);

            return acc;
        }, {} as Views);
}

export default loadViews(viewsDirPath);
