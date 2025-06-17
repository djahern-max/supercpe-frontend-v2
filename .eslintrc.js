module.exports = {
    extends: [
        'react-app',
        'react-app/jest',
        'prettier'
    ],
    rules: {
        'no-console': 'warn',
        'no-unused-vars': 'warn',
        'react/prop-types': 'off', // Since we're not using TypeScript
    },
    overrides: [
        {
            files: ['src/services/**/*.js'],
            rules: {
                'no-console': 'off', // Allow console.log in API service for debugging
            },
        },
    ],
};
