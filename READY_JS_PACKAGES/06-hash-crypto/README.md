# Hash and cryptography

The source algorithms are CryptoJS-compatible browser scripts; they are not a standalone Node module. `cli.js` loads the shared CryptoJS core and the selected algorithm in an isolated VM for `hash` and known-answer `self-test` commands.