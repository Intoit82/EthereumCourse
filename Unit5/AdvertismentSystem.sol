pragma solidity ^0.4.8;

//Describes a bidding system within the blockchain between advertisers and publisher per location.
contract AdvertismentCampaign{
    
    address owner; //owner address
    
    //Describes a single campaign properties
    struct CampaignProperties
    {
        int latitude; // location axis - latitude 
        int longitude; // location axos - longitude
        uint durationInMinutes; // maximum duration of the campaign in Minutes if accepted
        uint offerDuration; //maximum duration of the offer in the decenterlized bidding system
        uint maxBidOffer; //defines the maximum bid offer
    }
    
    //Describes the campaigns which exist at any given time
    mapping(address => CampaignProperties[]) public campaigns;
    
    //holds the campaigns addresses for interation
    address[] campaignsAddress;
    
    //Constructor which saves the owner address
    function AdvertismentCampaign() 
    public
    {
        owner = msg.sender;
    }
    
    //Is owner modifier
    modifier isOwner()
    {
        require(msg.sender == owner);
        _;
    }
    
     //Is campaign exist modifier
    modifier campaignExist()
    {
        require(campaigns[msg.sender].length > 0); //check for number of campaigns for the sender
        _;
    }
    
   
    
    //Creates a new advertisment campaign
    function CreateNewAdvertimentCampaign(int setLatitude,int setLongitude,uint setDurationInMinutes,uint setOfferDuration,uint setMaxBidOffer)
    public
    returns (bool)
    {
        
        //get all campaign related to the sender
        for(uint i=0; i<campaigns[msg.sender].length;i++)
        {
            var singleCampaign = campaigns[msg.sender][i];
            //avoid creating a campaign in the same location
            require(singleCampaign.latitude != setLatitude || singleCampaign.longitude != setLongitude 
            || singleCampaign.offerDuration < now); // or last location campaign is due
        }
       
        require(setDurationInMinutes > 5); //check for a valid duration
        require(setOfferDuration > 5); //check for a valid duration
        require(setMaxBidOffer > 0); //check for a valid maxBidOffer
        
        
        //create a new Campaign
        CampaignProperties memory newCampaign;
        newCampaign.latitude = setLatitude;
        newCampaign.longitude = setLongitude;
        newCampaign.durationInMinutes = setDurationInMinutes;
        newCampaign.offerDuration = now + setOfferDuration; //add the offer durtion for the current time
        newCampaign.maxBidOffer = setMaxBidOffer;
        
        //TODO log the creation
        
        //add the campaign to the collection
        campaigns[msg.sender].push(newCampaign);
        campaignsAddress.push(msg.sender);
        
        return true;
        
    }
    
    //Update an existing advertisment campaign
    function updateExistingAdvertimentCampaign(int currentLatitude,int currentLongitude,uint newDurationInMinutes,uint newOfferDuration,uint newMaxBidOffer)
    public
    returns (bool)
    {
        require(newDurationInMinutes > 5); //check for a valid duration
        require(newOfferDuration > 5); //check for a valid duration
       
        //find the campaign
        var campaignArrayLocation = findCampaign(currentLatitude,currentLongitude);
        
        //update the campaign
        campaigns[msg.sender][campaignArrayLocation].durationInMinutes = newDurationInMinutes;
        campaigns[msg.sender][campaignArrayLocation].offerDuration = now + newOfferDuration; //add the offer durtion for the current time;
        campaigns[msg.sender][campaignArrayLocation].maxBidOffer = newMaxBidOffer;
        
        //TODO log the update
        
    
        
        return true;
        
    }
    
    //Stops an existing advertisment campaign
    function stopAdvertimentCampaign(int currentLatitude,int currentLongitude)
    public
    returns (bool)
    {
         //find the campaign
        var campaignArrayLocation = findCampaign(currentLatitude,currentLongitude);
       
        //avoid updating campaign which is over or not existing
        require(campaigns[msg.sender][campaignArrayLocation].offerDuration > now);
        
        //stops the campaign
        campaigns[msg.sender][campaignArrayLocation].offerDuration = now - 1;
        
        return true;
        
        //TODO log the stop
        
    }
    
    //Go over all campaigns and remove pass due campaigns
    function clearPassDueCampaigns()
    isOwner()
    public
    returns (bool)
    {
        //go over all campaigns addresses
        for(uint i=0; i<campaignsAddress.length; i++)
        {
            var addressOfCampaign = campaigns[campaignsAddress[i]];
            
             //go over all campaigns locations
            for(uint j=0; j<addressOfCampaign.length; j++)
            {
                //init the due campaigns
                if (addressOfCampaign[j].offerDuration <now)
                {
                  addressOfCampaign[j] =  emptyCampaign() ;
                  delete addressOfCampaign[j]; //delete from address
                  if(addressOfCampaign.length ==0)
                   delete campaignsAddress[i]; //delete entire campaign address
                      
                  
                  
                  //TODO log
                }
            }
             
        }
        
         return true;
        
        
    }
    
    //Check if campaign is active
    function isCampaignActive(address campaignAddress,int currentLatitude,int currentLongitude)
    constant
    public
    returns (bool)
    {
       var campaignArrayLocation = findCampaign(currentLatitude,currentLongitude);
       return campaigns[msg.sender][campaignArrayLocation].offerDuration > now;
    }

    
    //clean a single campaign
    function emptyCampaign()
    constant
    private
    returns(CampaignProperties)
    
    {
         //create a new empty Campaign
        CampaignProperties memory newCampaign;
        newCampaign.latitude = 0;
        newCampaign.longitude = 0;
        newCampaign.durationInMinutes = 0;
        newCampaign.offerDuration = 0;
        newCampaign.maxBidOffer = 0;
        
        return newCampaign;
    }
    
     //Find a given campaign by location (latitude and longitude) and returns the location in the array
    function findCampaign(int currentLatitude,int currentLongitude)
    campaignExist()
    private
    returns (uint)
    {
        CampaignProperties singleCampaign;
        
        uint i =0;
        
        //get all campaign related to the sender
        for(i=0; i<campaigns[msg.sender].length;i++)
        {
            singleCampaign = campaigns[msg.sender][i];
            
            if (singleCampaign.latitude == currentLatitude && singleCampaign.longitude == currentLongitude)
             break;
        }
        
        //exit if there is no match
        require(singleCampaign.latitude == currentLatitude && singleCampaign.longitude == currentLongitude);
        
        return i;
    }
    
    
    //to do implement settle
  

}