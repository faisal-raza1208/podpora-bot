module.exports = {
    globals: {},
    moduleFileExtensions: [
        'ts',
        'js'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },
    testMatch: [
        '**/test/**/*.test.(ts|js)'
    ],
    testEnvironment: 'node',
    testTimeout: 250,
    verbose: false,
    notify: true,
    notifyMode: 'always',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    collectCoverageFrom: [
        'src/app.ts',
        'src/controllers/**/*.ts',
        'src/models/**/*.ts',
        'src/lib/**/*.ts'
    ]
};
