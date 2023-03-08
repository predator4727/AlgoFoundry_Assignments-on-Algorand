const { assert } = require("chai");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const commonfn = require("./common/commonfn");

describe("Success Flow", function () {
    // Write your code here
    let master;
    let runtime;
    let mintAppInfo;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(100e6); //100 Algos
        runtime = new Runtime([master]);
    });

    it("Deploy mint contract is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        // verify app created
        assert.isDefined(mintAppID);
        // verify app funded
        const appAccount = runtime.getAccount(mintAppInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    }).timeout(10000);

    it("Deploy hold contract is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        const holdAppID = holdAppInfo.appID;
        // verify app created
        assert.isDefined(holdAppID);
        // verify app funded
        const appAccount = runtime.getAccount(holdAppInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    }).timeout(10000);

    it("Deploy burn contract is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        const burnAppID = burnAppInfo.appID;
        // verify app created
        assert.isDefined(burnAppID);
        // verify app funded
        const appAccount = runtime.getAccount(burnAppInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    }).timeout(10000);

    it("Hold contract optin is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, holdAppInfo.appID, assetID, "asset_optIn");
    }).timeout(10000);

    it("Burn contract optin is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, burnAppInfo.appID, assetID, "asset_optIn_burn");
    }).timeout(10000);

    it("Transfer is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, holdAppInfo.appID, assetID, "asset_optIn");
        commonfn.transferType(
            runtime,
            master.account,
            mintAppInfo.appID,
            holdAppInfo.applicationAccount,
            assetID,
            "transfer",
            1_000_000,
        );
        const appAccount = runtime.getAccount(holdAppInfo.applicationAccount);
        assert.equal(Number(appAccount.assets.get(assetID).amount), 1_000_000);
    }).timeout(10000);

    it("Burn is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, burnAppInfo.appID, assetID, "asset_optIn_burn");
        commonfn.transferType(
            runtime,
            master.account,
            mintAppInfo.appID,
            burnAppInfo.applicationAccount,
            assetID,
            "burn",
            50_000,
        );
        const appAccount = runtime.getAccount(burnAppInfo.applicationAccount);
        assert.equal(Number(appAccount.assets.get(assetID).amount), 50_000);
    }).timeout(10000);

    it("Asset create is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        // verify assetID
        assert.isDefined(assetID);
    }).timeout(10000);

    it("Price update is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        //update price
        commonfn.updatePrice(runtime, master.account, holdAppInfo.appID, 1000);
        const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);
        //check new price
        assert.equal(getGlobal(holdAppInfo.appID, "purchase_price"), 1000);
    }).timeout(10000);
});