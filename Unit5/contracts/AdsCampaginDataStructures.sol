pragma solidity ^0.4.8;



//Describes a the shared data structure for the campaign
contract AdsCampainDataStructures 
{
    
    //Describes the campaigns which exist at any given time
    //Every key in bytes32 will point to the CampaignProperties 
    mapping(bytes32 => campaignProperties) internal campaigns;
    
    
    //a single campaign properties
    struct campaignProperties 
    {
        locationType location; //holds the location for the campaign
        uint durationInMinutes;  // maximum duration of the campaign in Minutes if accepted
        uint offerDuration; //maximum duration of the offer in the decenterlized bidding system
        uint pricePerAd; //defines the payment in tokens per a signle ad view
        bool isActive; //flag that indicates whether the comapaign is active
        bytes32 contentLink; //holds the content link for the comapaign (will be delivered to the publisher from the blockchain)
        uint balance; //balance of locked tokens
    }
    
    //Describes the location type
    struct locationType
    {
        int latitude; // location axis - latitude 
        int longitude; // location axos - longitude
    }
    
    

}