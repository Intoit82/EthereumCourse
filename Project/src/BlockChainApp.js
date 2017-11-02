import { Component } from 'react'
import adsHubContract from '../build/contracts/AdsHub.json'
//import adsCampaignContract from '../build/contracts/AdsCampaign.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class BlockChainApp extends Component {
  componentWillMount() {
 
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

createCampaign() {
      
     console.log("Registerd Advertiser address: " + this.advertiserAddr);
     return this.adsHubInstance.registeredAdvertisers.call(this.advertiserAddr)      	
     .then((result) => {
     
        // Update state with the result.
        console.log("Result:" , result);
       return this.adsHubInstance.createCampaignsContract({from: this.advertiserAddr})
       //return this.adsHubInstance.createTry({from:this.advertiserAddr})
      })
	 
        .then(function(txObject){

          /*  const event0 = txObject.logs[0];
            console.log(event0.event);
            console.log(event0.args.advertiser);
            console.log(event0.args.campaignAddress);
            console.log("Return value: ", txObject); */
            console.log("returned value: ", txObject);
         })
}

uploadViews() {
      
     console.log("Registerd Trustee address: " + this.trusteeAddr);
     return this.adsHubInstance.isRunning.call({from:this.advertiserAddr})
 
     .then(result => {
     	console.log("is running result: " + result.toString());
     })
}

addEventListener(component) {
  const updateEvent = this.adsHubInstance.LogAdvertiserRegisteration();
  updateEvent.watch(function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Changed event received, value: " + result.args.advertiserAddress.toString(10));
    component.setState({ isRegistered: result.args.advertiserAddress.toString(10)});
  })
}

instantiateContract(){
    const contract = require('truffle-contract')
    const adsHub = contract(adsHubContract)
    adsHub.setProvider(this.state.web3.currentProvider)
    

    // Declaring this for later so we can chain functions on SimpleStorage.
    var adsHubInstance;

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
        adsHub.deployed().then((instance) => {
        adsHubInstance = instance

        this.adsHubInstance = instance
        this.ownerAddr = accounts[0]
        this.advertiserAddr = accounts[1];
        this.publisherAddr = accounts[2];
        this.trusteeAddr = accounts[3];
        this.addEventListener(this)

        // Stores a given value, 5 by default.
        return adsHubInstance.registerAdvertiser({from: this.advertiserAddr})
      }).then((result) => {
        // Get the value from the contract to prove it worked.
        console.log("Successfully register advertiser" );
        return adsHubInstance.registeredAdvertisers.call(this.advertiserAddr)
      })
       .catch((error) => {
      	console.log("Advertiser " + this.advertiserAddr + " already registered" );
		return adsHubInstance.registeredAdvertisers.call(this.advertiserAddr)      	
      })
      .then((result) => {
        // Update state with the result.
        console.log("Result:" , result);
        return this.setState({ isRegistered: result })
      })

      .then(result => {
      	return adsHubInstance.registerTrustee({from: this.trusteeAddr})
      })
      .then(result => {
      	console.log("Trustee was registered Successfully");
      })

      .catch( error => {
      	console.log("Trustee " + this.trusteeAddr + " already registered" );
      })

      
     
    })
  }
}

export default BlockChainApp