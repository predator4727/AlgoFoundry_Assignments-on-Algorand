async function run (runtimeEnv, deployer) {
    
    const asaDef = {
        total: 10000,
        decimals: 0,
        defaultFrozen: false,
        unitName: "NCN",
        url: "url",
        metadataHash: "12312442142141241244444411111133",
        note: "newCoin",
        manager: "",
        reserve: "",
        freeze: "",
        clawback: "",
    };

    await deployer.deployASADef('newCoin', asaDef, {
      creator: deployer.accounts[0],
      totalFee: 1000,
      validRounds: 1002
  });

}

module.exports = { default: run };
