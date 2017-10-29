var registrar = GlobalRegistrar.at("0xc3394b3f2ad042ebe6ed5e4d1db6ecef29cffe44");
registrar.reserve(
        "MetaCoin",
        {from: web3.eth.accounts[0]})
    .then(function (txn1) {
        console.log(txn1)
        return registrar
            .setAddress(
                "MetaCoin", 
                MetaCoin.deployed().address,
                true,
                {from: web3.eth.accounts[0]});
    })
    .then(function (txn2) {
        console.log(txn2);
        process.exit(0);
    })
    .catch(function (e) {
        console.error(e);
        process.exit(1);
    });