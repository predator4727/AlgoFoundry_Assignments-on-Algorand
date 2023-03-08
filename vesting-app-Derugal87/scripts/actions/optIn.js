const { readAppGlobalState, readAppLocalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const master = deployer.accountsByName.get("master");
	const advisors_address = deployer.accountsByName.get("advisors");
	const private_investors_address = deployer.accountsByName.get("private_investors");
	const company_reserve = deployer.accountsByName.get("company_reserves");
	const team_address = deployer.accountsByName.get("team");

    // get app info
    const vestApp = deployer.getApp('vestApp');
    const vestAppID = vestApp.appID;
	const vestAppAddr = vestApp.applicationAccount;
    let globalState = await readAppGlobalState(deployer, master.addr, vestAppID);
    console.log(globalState);
    const assetID = globalState.get("assetID");

    //opt in to Asset
    await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: advisors_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: private_investors_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: company_reserve,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: team_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

	globalState = await readAppGlobalState(deployer, master.addr, vestAppID);
    console.log(globalState);
	let globalStateVest = await readAppGlobalState(deployer, master.addr, vestAppID);
    console.log(globalStateVest);
}

module.exports = { default: run };