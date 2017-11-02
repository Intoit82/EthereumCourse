import React from 'react'
//import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
//import getWeb3 from './utils/getWeb3'
import BlockChainApp from './BlockChainApp'
//import blockchainUtils from './utils/blockchainUtils'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends BlockChainApp {
  constructor(props) {
    super(props)

    this.state = {
      isRegistered: "",
      web3: null,
      storageContractInstance: null,
      account: null
    }
  }
 

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Ads Exchange Proof Of Concept !</h1>
              <p>This DApp will connect Advertisers, Publisher and Trustees to the blockchain Ads Campaign.</p>
              <h2>Advertisers Interface</h2>
              <p>Create new Ads Campaign</p>
              <p>The stored value is: {this.state.isRegistered.toString()}</p>
              <button className="changeButton" onClick={ () => this.createCampaign() }>Create Campaign</button>      
              <button className="trusteeRegisterButton" onClick={ () => this.uploadViews() }>Upload Views</button> 
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
