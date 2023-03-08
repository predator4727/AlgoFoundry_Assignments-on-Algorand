const { types } = require('@algo-builder/web');
const { executeTransaction } = require('@algo-builder/algob');


async function run(runtimeEnv, deployer) {

    // query accounts from config
    const masterAccount = deployer.accountsByName.get('master');
    const buyerAccount = deployer.accountsByName.get('buyer');

    // query new coin ASA from deployer (using checkpoint information)
    const newAsset = deployer.asa.get("newCoin");
    if (newAsset === undefined) {
		  console.error("New coin was not deployed. You must run `algob deploy` first.");
		  return;
	}

    const sendAsaTx = {
        type: types.TransactionType.TransferAsset,
        sign: types.SignType.SecretKey,
        fromAccount: masterAccount,
        toAccountAddr: buyerAccount.addr,
        amount: 100,
        assetID: newAsset.assetIndex,
        payFlags: { totalFee: 1000 },
      };
    
    // const optInAsaTx = {
    //     type: types.TransactionType.OptInASA,
    //     sign: types.SignType.SecretKey,
    //     fromAccount: buyerAccount,
    //     assetID: newAsset.assetIndex,
    //     payFlags: { totalFee: 1000 }
    // }
    
    // opt in to asset
    await deployer.optInAccountToASA('newCoin', 'buyer', {});
    // await executeTransaction(deployer, optInAsaTx);
    
    //execute asset transfer transaction
    await executeTransaction(deployer, sendAsaTx);
}

module.exports = { default: run };
