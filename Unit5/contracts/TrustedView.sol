pragma solidity ^0.4.8;


//Defines the Ad view propeties and functionality for the blockchain
contract TrustedViews 
{
    
    //a single view properties
    struct viewProperties 
    {
        int latitude;//location of the view
        int longitude; //location of the view
        uint numberOfViews; //Holds the number of views recorded
        uint minViewDuration; //Holds the minumum time of any view counted in the number of views;
        bool exist; //holds wether the view propety exist
        uint balance; //holds the token balance reservered for the publisher
    }
    
    //holds the views recorded
    //The key is the hash of both the publisher address and the campaign contract address
    mapping (bytes32 => viewProperties) public views;
    
    
     //Holds the balances for the publishers
    mapping(bytes32 => uint) public publisherBalances;
    
    //log events
    event OnUpdateView(address publisherAddress,address adCampaginAddress,uint numberOfViews,uint setMinDuration);
    event OnAccessRightChange(address uploaderAddress,bool isAllowed);
    event OnNewViewUpload(address publisherAddress,address adCampaginAddress,int setLatitude,int setLongitude,
                          uint numberOfViews,uint setMinDuration);
                          
                          
    //Allow anyone to check the number of views from a given publisher to a given campaign
    function getNumberOfViews(address publisher)
    constant
    public
    returns (uint)
    {
        var key = keccak256(publisher,this);
        
        //check the view exist
        require(views[key].exist);
        
        return views[key].numberOfViews;
    }
          
    /*
    //sets Access rights
    function setAccess(address uploaderAddress, bool allowed)
    public
    running
    isOwner
    returns  (bool)
    {
        //act only on state change
        require(trustedUploaders[uploaderAddress] != allowed);
        trustedUploaders[uploaderAddress] = allowed;
        
        //log the change
        OnAccessRightChange(uploaderAddress,allowed);
        
        return true;
    }
    
    
    
    
    //Update an existing views collection
    function updateExistingViews(address publisherAddress,uint numberOfViews,uint setMinDuration
                                 ,address setCampaignAddress)
    isTrusteeRegistered
    running
    public
    returns (bool)
    {
      //check for valid imputs
        require(numberOfViews >0);
        require(setMinDuration >0);
        
         //create a unique key for the views
        var key = keccak256(publisherAddress,setCampaignAddress);
        
        require(views[key].exist);
        
        //set new min duration if needed
        if (setMinDuration < views[key].minViewDuration)
           views[key].minViewDuration = setMinDuration;
               
        //add the number of views
        views[key].numberOfViews +=numberOfViews; 
        
        //log
        OnUpdateView(publisherAddress,setCampaignAddress,views[key].numberOfViews,views[key].minViewDuration);
        
        return true;
        
    }
    
    */
    
}
