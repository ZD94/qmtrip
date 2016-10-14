module.exports = {
    "extends": "eslint:recommended",
    "rules": {
        "indent": ["off", 4],
        "quotes": ["off", "single", {"avoidEscape": true, "allowTemplateLiterals": true}],
        "linebreak-style": ["error", "unix"],
        "semi": ["off", "always"],
        "no-console": "off",
        "no-unused-vars": ["off", { "args": "none" }],
        "comma-dangle": ["off"]
    },
    "env": {
        "es6": true,
        "node": true,
        "browser": true,
        "mocha": true
    },
    "globals": {
        "Zone": true
    }
};