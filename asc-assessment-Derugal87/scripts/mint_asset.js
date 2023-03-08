const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // write your code here
    const master = deployer.accountsByName.get("master");
    /*
    // First app
    */
    await deployer.deployApp(
        master,
        {
            metaType: types.MetaType.FILE,
            approvalProgramFilename: "mint_approval.py",
            clearProgramFilename: "mint_clearstate.py",
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
            appArgs: [],
            appName: 'mintApp'
        },
        { totalFee: 1000 }
    )

    // get app info
    const mintApp = deployer.getApp("mintApp");
    console.log(mintApp);
    const mintAppID = mintApp.appID;
    const mintAppAddr = mintApp.applicationAccount;
    console.log("mintApp account address:", mintAppAddr);

    // fund contract account
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: mintAppAddr,
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    });
  
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: mintAppID,
        payFlags: { totalFee: 1000 },
        appArgs: ["createAsset"].map(convert.stringToBytes),
    });

    let mintAppAcc = await deployer.algodClient.accountInformation(mintAppAddr).do();
    console.log(mintAppAcc);


     /*
    // Second app
    */
    let globalState = await readAppGlobalState(deployer, master.addr, mintAppID);
    console.log(globalState);
    const assetID = globalState.get("teslaID");
    await deployer.deployApp(
        master,
        {
            metaType: types.MetaType.FILE,
            approvalProgramFilename: "holdings_approval.py",
            clearProgramFilename: "holdings_clearstate.py",
            localInts: 0,
            localBytes: 0,
            globalInts: 2,
            globalBytes: 0,
            appArgs: [convert.uint64ToBigEndian(assetID)],
            appName: 'holdApp'
        },
        { totalFee: 1000 }
    )
    
    // get app info
    const holdApp = deployer.getApp("holdApp");
    console.log(holdApp);
    const holdAppID = holdApp.appID;
    const holdAppAddr = holdApp.applicationAccount;
    console.log("holdApp account address:", holdAppAddr);
    deployer.addCheckpointKV('holdAppID',holdAppID)
    deployer.addCheckpointKV('holdAppAddr',holdAppAddr)
    let holdAppAcc = await deployer.algodClient.accountInformation(holdAppAddr).do();
    console.log(holdAppAcc);

     /*
    // third app
    */
    await deployer.deployApp(
        master,
        {
            metaType: types.MetaType.FILE,
            approvalProgramFilename: "burn_approval.py",
            clearProgramFilename: "burn_clearstate.py",
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
            appArgs: [convert.uint64ToBigEndian(assetID)],
            appName: 'burnApp'
        },
        { totalFee: 1000 }
    )

    // get app info
    const burnApp = deployer.getApp("burnApp");
    console.log(burnApp);
    const burnAppAddr = burnApp.applicationAccount;
    console.log("burnApp account address:", burnAppAddr);
    let burnAppAcc = await deployer.algodClient.accountInformation(burnAppAddr).do();
    console.log(burnAppAcc);

}

module.exports = { default: run };
