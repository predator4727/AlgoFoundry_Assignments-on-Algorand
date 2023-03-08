const { assert } = require("chai");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const commonfn = require("./common/commonfn");


// Errors
const RUNTIME_ERR1009 = 'RUNTIME_ERR1009: TEAL runtime encountered err opcode';

describe("Negative Tests", function () {
    // Write your code here

    let master;
    let non_creator;
    let runtime;
    let mintAppInfo;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(1000e6); //1000 Algos
        non_creator = new AccountStore(1000e6); //1000 Algos
        runtime = new Runtime([master, non_creator]);
    });

    it("Double asset creation fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        // create asset  
        commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        // create asset again
        assert.throws(() => {
            commonfn.create_asset(runtime, master.account, mintAppInfo.appID)
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset creation fails when non-creator calls", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);

        // create asset 
        assert.throws(() => {
            commonfn.create_asset(runtime, non_creator.account, mintAppInfo.appID)
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset transfer fails when supply is insufficient", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, holdAppInfo.appID, assetID, "asset_optIn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                master.account,
                mintAppInfo.appID,
                holdAppInfo.applicationAccount,
                assetID,
                "transfer",
                500_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset burn fails when supply is insufficient", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, burnAppInfo.appID, assetID, "asset_optIn_burn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                master.account,
                mintAppInfo.appID,
                burnAppInfo.applicationAccount,
                assetID,
                "burn",
                500_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset transfer fails when non-creator calls", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, holdAppInfo.appID, assetID, "asset_optIn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                non_creator.account,
                mintAppInfo.appID,
                holdAppInfo.applicationAccount,
                assetID,
                "transfer",
                5_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset burn fails when non-creator calls", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, burnAppInfo.appID, assetID, "asset_optIn_burn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                non_creator.account,
                mintAppInfo.appID,
                burnAppInfo.applicationAccount,
                assetID,
                "burn",
                5_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Update price fails when called by non-creator", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        assert.throws(() => {
            commonfn.updatePrice(
                runtime,
                non_creator.account,
                holdAppInfo.appID,
                10e6
            )
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Selling token fails when supply < amount sold", () => {
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
            100
        );
        assert.throws(() => {
            commonfn.asset_selling(
                runtime,
                non_creator.account,
                assetID,
                holdAppInfo.applicationAccount,
                holdAppInfo.appID,
                150,
                (1e6) * 150,
            )
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Selling token fails when transaction is not grouped", () => {
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
            100
        );
        assert.throws(() => {
            commonfn.assetSell(
                runtime,
                non_creator,
                assetID,
                holdAppInfo.appID,
                150
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Buying 0 token fails", () => {
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
            100
        );
        assert.throws(() => {
            commonfn.asset_selling(
                runtime,
                non_creator.account,
                assetID,
                holdAppInfo.applicationAccount,
                holdAppInfo.appID,
                0,
                (4e6) * 100,
            )
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Buying tokens with insufficient algos", () => {
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
            100
        );
        assert.throws(() => {
            commonfn.asset_selling(
                runtime,
                non_creator.account,
                assetID,
                holdAppInfo.applicationAccount,
                holdAppInfo.appID,
                150,
                (10e6),
            )
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Transfer token to non holding app fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, holdAppInfo.appID, assetID, "asset_optIn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                non_creator.account,
                mintAppInfo.appID,
                burnAppInfo.applicationAccount,
                assetID,
                "transfer",
                50_000_000,
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Burn token to non burn app fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const holdAppInfo = commonfn.initHold(runtime, master.account, assetID);
        const burnAppInfo = commonfn.initBurn(runtime, master.account, assetID);
        commonfn.optInType(runtime, master.account, burnAppInfo.appID, assetID, "asset_optIn_burn");
        assert.throws(() => {
            commonfn.transferType(
                runtime,
                non_creator.account,
                mintAppInfo.appID,
                holdAppInfo.applicationAccount,
                assetID,
                "burn",
                10_000_000,
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);
});
