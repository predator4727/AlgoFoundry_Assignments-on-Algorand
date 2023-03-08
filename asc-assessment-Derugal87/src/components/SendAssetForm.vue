<template>
    <div id="buyasset" class="mb-5">
        <h3>Buy TESLA coin</h3>
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <p>TESLA coins left: {{ this.asset_left }}</p>
        <form
            action="#"
            @submit.prevent="handleBuyAsset"
        >
            <div class="mb-3">
                <label for="asset_amount" class="form-label"
                    >Buy amount</label
                >
                <input
                    type="number"
                    class="form-control"
                    id="asset_amount"
                    v-model="asset_amount"
                />
            </div>
            <button type="submit" class="btn btn-primary">Buy</button>
        </form>
    </div>
</template>

<script>
import * as helpers from '../helpers';
import holdAppConfig from "../artifacts/mint_asset.js.cp.yaml";

export default {
    props: {
        connection: String,
        network: String,
    },
    data() {
        return {
            acsTxId: "",
            asset_left: this.asset_balance(),
            asset_amount: 0,
            explorerURL: "",
            holdAppAddr: null,
            holdAppID: null,
        };
    },
    
    methods: {

        async asset_balance() {
            this.holdAppAddr = holdAppConfig.default.metadata.holdAppAddr;
            this.holdAppID = holdAppConfig.default.metadata.holdAppID;
            // console.log("this.holdAppAddr: ", this.holdAppAddr);
            // console.log("this.holdAppID: ", this.holdAppID);
            this.asset_left = await helpers.update_asset_balance(this.holdAppAddr, this.network);
        },
        
        async updateTxn(value) {
            this.acsTxId = value;
            this.explorerURL = helpers.getExplorerURL(this.acsTxId, this.network);
        },
        async handleBuyAsset() {
            // write code here
            this.asset_balance();
            await helpers.purchaseTesla(    
                this.holdAppAddr, 
                this.holdAppID, 
                this.asset_amount, 
                this.network
            );
            this.asset_balance();
        },
    },
};
</script>
