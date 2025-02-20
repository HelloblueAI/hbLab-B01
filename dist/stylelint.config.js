module.exports = {
  extends: 'stylelint-config-standard',
  rules: {
    'selector-id-pattern': '^[a-z]+(-[a-z]+)*$',
    'selector-class-pattern': '^[a-z]+(-[a-z]+)*$',
    'keyframes-name-pattern': '^[a-z]+(-[a-z]+)*$',
    'alpha-value-notation': 'percentage',
    'color-function-notation': 'modern',
    'declaration-block-no-duplicate-properties': true,
    'no-duplicate-selectors': true,
    'media-feature-range-notation': 'context',
    'shorthand-property-no-redundant-values': true,
    'rule-empty-line-before': 'always',
    'font-family-name-quotes': 'always-unless-keyword',
    'declaration-block-single-line-max-declarations': 1,
  },
};
