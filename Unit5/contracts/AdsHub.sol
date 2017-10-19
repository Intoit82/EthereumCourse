pragma solidity ^0.4.8;

import "./AdvertiserCampaigns.sol";
import "./PublisherViews.sol";
import "./TrustedViews.sol";


//Describes Hub system for creating Ads campagin
contract AdsHub is Runnable, AdsCampaignDataStructures {
    
    //Holds the mapping for the created advertisers
    mapping(address => bool) public registeredAdvertisers;
    
    //Holds the mapping for the created publishers
    mapping(address => bool) public registeredPublishers;

    //Maps the advertiser to its campagin
    mapping (address => address) public runningCampagins;
    
    //Maps the publisher to its views
    mapping (address => address) public runningViews;
    
    //Holds the views contract
    TrustedViews public views;
    
    //Logs
    event LogAdvertiserRegisteration(address advertiserAddress,address contractAddress);
    event LogPublisherRegisteration(address publisherAddress,address contractAddress);
    event LogDoneCampaign(address CampaignAddress, bytes32 key);
    event LogCreateTrustedView(address senser,address contractAddress);
    
    //Constructor for creating new trusted view contract
    function AdsHub()
    public
    {
        views = new TrustedViews(); //set the owner to be the uploader
        LogCreateTrustedView(msg.sender,views); //log the creation
    }
    
    //Allow to set access rights for the views contract
    function setUploaderAccess(address trustedUploader,bool allowed)
    running
    isOwner
    public 
    returns(bool)
    {
        if(!views.setAccess(trustedUploader,allowed))
            return false;
            
        return true;
       
    }
 
    //Is the advertiser registered
    modifier isAdvertiserRegistered()
    {
       //check the advertiser is registered
       require(registeredAdvertisers[msg.sender] == true);
       _;
    }
    
    //Is the Publisher registered
    modifier isPublisherRegistered()
    {
       //check the Publisher is registered
       require(registeredPublishers[msg.sender] == true);
       _;
    }
 
    //Register new advertiser
    function registerAdvertiser()
    running
    public
    returns(address campaginContractAddress)
    {
        //check existing registeration
        require(registeredAdvertisers[msg.sender] != true);
        
        //create new campagin contract
        AdvertiserCampaigns trustedCampaign = new AdvertiserCampaigns(msg.sender);
        
        registeredAdvertisers[msg.sender] = true; //add to mapping
        runningCampagins
        [msg.sender] = trustedCampaign; //add trustedCampaign
        
        LogAdvertiserRegisteration(msg.sender,trustedCampaign); //log
        return trustedCampaign; 
        
    } 
    
    //Register new publisher
    function registerPublisher(address campaginAddress)
    running
    public
    returns(address publisherContractAddress)
    {
        //check existing registeration
        require(registeredPublishers[msg.sender] != true);
        
        //TODO is really trusted?
        //create new publisher contract
        PublisherViews trustedPublisher = new PublisherViews(msg.sender,campaginAddress);
        
        registeredPublishers[msg.sender] = true; //add to mapping
        runningViews[msg.sender] = trustedPublisher;
       
       
        LogPublisherRegisteration(msg.sender,trustedPublisher); //log
        return trustedPublisher; 
        
    }
    
    
    //disable done campaigns
    function disableDoneCampaigns(address campaignAddress, bytes32 key)
    isOwner
    running
    public
    returns (bool)
    {
        AdvertiserCampaigns doneCampaign = AdvertiserCampaigns(campaignAddress);
        if (!doneCampaign.disablePassDueCampaigns(key))
           return false;
        
        //log the event
        LogDoneCampaign(campaignAddress,key);
        return true;
    }
    
     //UnRegister By Owner
    function unRegisterAdvertiser(address advertiserRegisteryAddress)
    isOwner
    running
    public
    returns (bool)
    {
        //check the advertiser is registered
       require(registeredAdvertisers[advertiserRegisteryAddress] == true);
       
       //TODO check funds and active campaigns
       
       registeredAdvertisers[advertiserRegisteryAddress] = false; // remove campagin
    }
    
      //UnRegister by Advetiser
    function unRegisterAdvertiser()
    isAdvertiserRegistered
    running
    public
    returns (bool)
    {
      
       
       //TODO check funds and active campaigns
       //TODO close the campaigns
       //TODO do the same with Owner
       
       registeredAdvertisers[msg.sender] = false; // remove campagin
    }
    
    
}
