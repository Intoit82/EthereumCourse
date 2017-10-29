// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
	build: "./node_modules/.bin/webpack",
  //	deploy: [
  //  "MyGlobalRegistrar"
  //],
  //after_deploy: [
  //  "environments/development/deploy_and_register_url_hint.js"
  //]
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    }
  }
}
