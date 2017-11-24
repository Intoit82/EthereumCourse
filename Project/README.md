Toll Roads project UI
===================

###### remark
This is my first (and probably the last) experience coding webpages -Js, html and angular.
Many issues like - huge app.js file are a matter of learning it for the first time.

Installation notes
-------------------
1. Run sudo npm install (not working on Win10 host machines in share folder)
2. run truffle migrate --reset
3. run testrpc
4. run npm run dev

Run the UI
-------------

### Addresses and Roles:
> - Regulator - First address
> - Vehicle - Second address
> - Operator - Support multiple operators - 3rd and 4th addresses
> - Toll Booths - will be represented by 3 other accounts

### Basic flow:
#### Regulator Portal
> 1. Select account for action (must press the button after selection).
> 2. Define a vehicle type (1 for example)
> 3. Create at least 1 operator (3rd address)
> 4. Watch for the events update as more operators are added

#### Operator Portal
> 1. select the operator you want to work with (must press the button after selection)
> 2. Unpause the operator (alert will be triggered if the operator is already unpaused).
> 3. Add 3 toll booth - one will be our entry booth and the other two will be our exit booths
> 4. Route Price - Set a route pricing between the entry booth and first exit booth , set a price the route( for example of 9 wei)
> 5. Set a multiplier for the vehicle type 1 (for example value of 2) 

#### Vehicle Portal
> 1. select the operator you want to work with (must press the button after selection)
> 2. Enter the address of the vehicle (our second address)
> 3. Enter road - enter the entry booth address, then the clear secret, for example 1 (in practice the user should add the hashed value of the secret but for the testing we can add the clear value and the hashed value should appear below. - normally it should be done outside this UI screen)
> Enter a deposit that is 20 (or try to get the deposit alert), Finally press the button
> The history of the vehicle and it's logs should appear

#### Toll Booth Portal
> 1. select the operator you want to work with (must press the button after selection)
> 2. Enter the address of the Exit booth (our first Exit booth - the one with the defined route)
> 3. Exit road - enter the secret 1,  then the fee and refund description should appear
> 4. Enter the address of the second Exit booth (our second Exit booth - the one **without** the defined route)
> 5. Exit road - enter the secret 1,  then the pending payments description should appear

### Other flows:
> 1. select the multiple operators.
> 2. try to pass invalid values
> 3. try to press buttons without operators, vehicles or Booth selected
> 4. try to pass an invalid (too low) deposits
> 5. try to interact will unregistered booths
