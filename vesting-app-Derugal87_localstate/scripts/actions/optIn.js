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

    //opt in to Asset and App
    await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: advisors_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

    await deployer.executeTx({
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: advisors_address,
        appID: vestAppID,
        payFlags: { totalFee: 1000 }
    });

    console.log("advisors are optedIn ASA and App");
    

	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: private_investors_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

    await deployer.executeTx({
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: private_investors_address,
        appID: vestAppID,
        payFlags: { totalFee: 1000 }
    });

    console.log("private_investors are optedIn ASA and App");


	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: company_reserve,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

    await deployer.executeTx({
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: company_reserve,
        appID: vestAppID,
        payFlags: { totalFee: 1000 }
    });

    console.log("company_reserve are optedIn ASA and App");


	await deployer.executeTx({
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: team_address,
        assetID: assetID,
        payFlags: { totalFee: 1000 }
    });

    await deployer.executeTx({
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: team_address,
        appID: vestAppID,
        payFlags: { totalFee: 1000 }
    });

    console.log("team are optedIn ASA and App");

    
	globalState = await readAppGlobalState(deployer, master.addr, vestAppID);
    console.log(globalState);
	let globalStateVest = await readAppGlobalState(deployer, master.addr, vestAppID);
    console.log(globalStateVest);
    // get stakeholders' state
    let advisorsState = await readAppLocalState(deployer, advisors_address.addr, vestAppID);
    console.log(advisorsState);
	let privateInvestorsState = await readAppLocalState(deployer, private_investors_address.addr, vestAppID);
    console.log(privateInvestorsState);
	let companyReserveState = await readAppLocalState(deployer, company_reserve.addr, vestAppID);
    console.log(companyReserveState);
	let teamState = await readAppLocalState(deployer, team_address.addr, vestAppID);
    console.log(teamState);
}

module.exports = { default: run };