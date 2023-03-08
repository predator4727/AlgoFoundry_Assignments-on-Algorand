<template>
    <div id="buyasset" class="mb-5">
        <h3>Withdraw VACoin tokens</h3>
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <!-- <p>Account: {{ this.sender }}</p> -->
        <p>Total allocated tokens: {{ this.total_allocated_tokens }}</p>
        <p>Available withdraw amount: {{ this.asset_left }}</p>
        <form
            action="#"
            @submit.prevent="handleWithdrawAsset"
        >
            <div class="mb-3">
                <label for="asset_amount" class="form-label"
                    >Withdraw amount</label
                >
                <input
                    type="number"
                    class="form-control"
                    id="asset_amount"
                    v-model="asset_amount"
                />
            </div>
            <button type="submit" class="btn btn-primary">Withdraw</button>
        </form>
    </div>
</template>

<script>
import * as helpers from '../helpers';
import vestAppConfig from "../artifacts/deploy.js.cp.yaml";
export default {
    props: {
        connection: String,
        network: String,
        sender: String,
        total_allocated_tokens: Number,
        asset_left: Number
    },
    data() {
        return {
            acsTxId: "",
            asset_amount: 0,
            explorerURL: "",
            vestAppAddr: null,
            vestAppID: null
        };
    },
    
    methods: {
        // async sender_asset_balance() {
        //     this.vestAppAddr = vestAppConfig.default.metadata.vestAppAddr;
        //     this.vestAppID = vestAppConfig.default.metadata.vestAppID;
        //     this.total_allocated_tokens = await helpers.update_sender_asset_balance(this.vestAppAddr, this.vestAppID, this.network, this.sender);   
        // },

        // async asset_balance() {
        //     this.vestAppAddr = vestAppConfig.default.metadata.vestAppAddr;
        //     this.vestAppID = vestAppConfig.default.metadata.vestAppID;
        //     this.asset_left = await helpers.update_sender_asset_balance(this.vestAppAddr, this.network);
        // },
        
        async updateTxn(value) {
            this.acsTxId = value;
            this.explorerURL = helpers.getExplorerURL(this.acsTxId, this.network);
        },
        async handleWithdrawAsset() {
            // this.sender_asset_balance();
            // console.log("left: ", this.asset_left);
            // console.log("total: ", this.total_allocated_tokens);
            this.vestAppAddr = vestAppConfig.default.metadata.vestAppAddr;
            this.vestAppID = vestAppConfig.default.metadata.vestAppID;
            const assetID = vestAppConfig.default.metadata.assetID;
            await helpers.withdrawAsset(
                this.vestAppAddr, 
                this.vestAppID, 
                this.asset_amount, 
                this.network,
                this.sender,
                assetID

            );
            // this.sender_asset_balance();
        },
    },
};
</script>
