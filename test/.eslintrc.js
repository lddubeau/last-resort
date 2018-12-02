module.exports = {
  extends: "lddubeau-base",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module"
  },
  overrides: [
    {
      files: ["worker.js"],
      env: {
        worker: true,
      },
      rules: {
        "no-restricted-globals": "off",
      },
    },
  ]
};
