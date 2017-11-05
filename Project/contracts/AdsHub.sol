pragma solidity ^0.4.8;

import "./AdsCampaign.sol";
import "./TrustedViews.sol";
import "./RegisterAllParties.sol";

//Describes Hub system for creating Ads campagin
contract AdsHub is RegisterAllParties, AdsCampaignDataStructures {
    
    //Maps the advertiser to its campagin
    mapping (address => address) public AdvertiserCampaignsContractAddress;
    
    //Maps the publisher to its views
    mapping (address => address) public runningViews;
    
    //Map the active campagins
    mapping (address => bool) public existingCampaigns;
    
    //Logs
    event LogCreateCampaignsContract(address advertiser,address campaignAddress);
    event LogUploadViews(address truseeAdd,address campaignAddress,uint numberOfViews);
    event LogClaimViews(address publisher,address campaignAddress);
    event LogWithdrawApprovedFunds(address publisher,address campaignAddress);
    event LogApproveStopCampaignRequest(address approveBy,address campaignAddress,address advertiserAddr,uint id);
    
    
  
    
    modifier newAdvertiserCampaigns(address advertiser)
    {
         //check no running campagin exist
         require(AdvertiserCampaignsContractAddress[msg.sender] == address(0));
         _;
    }
    
    modifier campaignCreated (address _campaignAddress)
    {
         //check campgain is active
         require(existingCampaigns[_campaignAddress] == true);
         _;
    }
    

    //Create campagin (for advertisers)
    function createCampaignsContract() 
    running
    isAdvertiserRegistered
    newAdvertiserCampaigns(msg.sender)
    notInBlackList
    public
    returns(address campaginContractAddress)
    {
        
        //create new campagin contract
        AdsCampaign trustedCampaign = new AdsCampaign(msg.sender);
        
        AdvertiserCampaignsContractAddress[msg.sender] = trustedCampaign; //add trustedCampaign
        existingCampaigns[trustedCampaign] = true; //set active campagin
        
        LogCreateCampaignsContract(msg.sender,trustedCampaign); //log
        return trustedCampaign; 
        
    } 
    
    //Upload trusted views for a given campagin from a given publisher (for Trustees)
    function uploadCampainViews(address publisherAddress,address campaignAddress,
                                int setLatitude,int setLongitude, uint numberOfViews,uint setMinDuration)
    running
    isTrusteeRegistered
    campaignCreated(campaignAddress)
    notInBlackList
    public
    returns (bool)
    {
            
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.uploadNewViews(publisherAddress,campaignAddress,  setLatitude, setLongitude,numberOfViews, setMinDuration))
            {
              //log
              LogUploadViews(msg.sender,campaignAddress,numberOfViews);
              return true;
            }
            
            
    }
    
    
    
     //claim the views for the given campagin (for publishers)
     //The publisher needs to generate the campaignKey from the hash of (advertiser address,campaginId)
    function claimCampaignViews(address campaignAddress,bytes32 key)
    running
    isPublisherRegistered
    campaignCreated(campaignAddress)
    notInBlackList
    public
    returns (bool)
    {
        
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.claimViews(msg.sender,key))
            {
                //log
                LogClaimViews(msg.sender,campaignAddress);
                return true;
            }
              
            
            
    }
    
    //Withdraw the apporved funds (for publishers)
    function withdrawFunds(address campaignAddress)
    running
    isPublisherRegistered
    campaignCreated(campaignAddress)
    notInBlackList
    public
    returns (bool)
    {
        
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.withdrawFunds(msg.sender))
            {
                //log
                LogWithdrawApprovedFunds(msg.sender,campaignAddress);
                return true;
            }
              
            
            
    }
    
    //Approve a request to stop a single running campagin by the advertiser
    function approveSingleCampaignStopRequest(address campaignAddress,address advertiserAddr,uint id)
    isOwner
    running
    campaignCreated(campaignAddress)
    public
    returns(bool)
    {
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.approveStopCampaignRequest(advertiserAddr,id))
            {
                //log
                LogApproveStopCampaignRequest(msg.sender,campaignAddress,advertiserAddr,id);
                return true;
            }
        
    }
    
    
    
 
    
}
