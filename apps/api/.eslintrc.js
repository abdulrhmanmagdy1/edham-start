module.exports = {
  root: true,
  extends: ['@edham/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
