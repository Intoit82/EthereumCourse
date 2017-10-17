pragma solidity ^0.4.8;

import "./AdsCampainDataStructures.sol";
import "./Paused.sol";

//Defines the Ad view propeties and functionality for the blockchain
contract AdView is AdsCampainDataStructures , Paused
{
    
       //a single view properties
    struct viewProperties 
    {
        locationType location; //holds the location for the campaign
        bytes32 publisherKey; //Holds the public key for the publisher of the viewProperties
        uint numberOfViews; //Holds the number of views recorded
        uint minViewDuration; //Holds the minumum time of any view counted in the number of views;
        bool exist; //holds wether the view propety exist
    }
    
    //holds the views recorded
    mapping (bytes32 => viewProperties) views;
    
    //event logs
    event OnNewViewUpload(bytes32 setPublisherKey,int setLatitude,int setLongitude,
    uint numberOfViews,uint setMinDuration,bytes32 adCampaginKey);
    
    event OnUpdateVeiw(bytes32 adCampaginKey,uint numberOfViews,uint setMinDuration);
    
    
    //Upload to the blockchain new view data
    function uploadNewViews(bytes32 setPublisherKey,int setLatitude,int setLongitude,
    uint numberOfViews,uint setMinDuration,bytes32 adCampaginKey)
    isOwner()
    notPaused()
    public
    returns (bool)
    {
        //check for valid imputs
        require(numberOfViews >0);
        require(setMinDuration >0);
       
        //set new values for the view
        views[adCampaginKey].location.latitude = setLatitude;
        views[adCampaginKey].location.longitude = setLongitude;
        views[adCampaginKey].minViewDuration = setMinDuration;
        views[adCampaginKey].numberOfViews = numberOfViews;
        views[adCampaginKey].publisherKey = setPublisherKey;
        views[adCampaginKey].exist = true;
        
        //log
        OnNewViewUpload(setPublisherKey,setLatitude,setLongitude,numberOfViews,setMinDuration,adCampaginKey);
        
        return true;
    }
    
    //Update an existing views collection
    function updateExistingViews(bytes32 adCampaginKey,uint numberOfViews,uint setMinDuration)
    isOwner()
    notPaused()
    public
    returns (bool)
    {
      //check for valid imputs
        require(numberOfViews >0);
        require(setMinDuration >0);
        require(views[adCampaginKey].exist);
        
        //set new min duration if needed
        if (setMinDuration < views[adCampaginKey].minViewDuration)
           views[adCampaginKey].minViewDuration = setMinDuration;
               
        //add the number of views
        views[adCampaginKey].numberOfViews +=numberOfViews; 
        
        //log
        OnUpdateVeiw(adCampaginKey,views[adCampaginKey].numberOfViews,views[adCampaginKey].minViewDuration);
        
        return true;
        
    }
    
    
    
}