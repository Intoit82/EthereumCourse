import getWeb3 from './getWeb3'

let componentWillMount = () => {
 
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch((error) => {
      console.log('Error finding web3.:' , error)
    })
  
};

let updateValue = function(val) {
  return this.storageContractInstance.set(val, { from: this.account });
}

let addEventListener = function(component) {
  const updateEvent = this.storageContractInstance.LogChanged();
  updateEvent.watch(function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Changed event received, value: " + result.args.value.toString(10));
    component.setState({ storageValue: result.args.value.toString(10)});
  })
}

let instantiateContract = () => {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)
    

    // Declaring this for later so we can chain functions on SimpleStorage.
    var simpleStorageInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {
        simpleStorageInstance = instance

        this.storageContractInstance = instance
        this.account = accounts[0]
        this.addEventListener(this)

        // Stores a given value, 5 by default.
        return simpleStorageInstance.set(5, {from: accounts[0]})
      }).then((result) => {
        // Get the value from the contract to prove it worked.
        return simpleStorageInstance.get.call(accounts[0])
      }).then((result) => {
        // Update state with the result.
        return this.setState({ storageValue: result.c[0] })
      })
    })
  }

export default blockchainUtils


