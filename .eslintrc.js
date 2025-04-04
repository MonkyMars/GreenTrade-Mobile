module.exports = {
 root: true,
 extends: [
  '@react-native',
  'prettier', // Add Prettier to extends
 ],
 plugins: ['prettier'],
 rules: {
  'prettier/prettier': 'error', // Show Prettier errors as ESLint errors
  // Other custom rules can go here
 },
}
