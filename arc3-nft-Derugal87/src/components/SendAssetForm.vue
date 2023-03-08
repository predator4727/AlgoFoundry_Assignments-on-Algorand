<template>
    <div id="receiveasset" class="mb-5">
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <div class="mt-5">
            <h3>Receive NFT</h3>
            <nft-comp
                v-for="nft in nfts" :key="nft.assetIndex"
                :nft="nft"
                @receiveNFT="handleReceiveNFT"
            />
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import asa from "../asa.js";
import axios from "axios";

// uncomment these lines once you've copied the checkpoint files over
import fungibleConfig from "../artifacts/0-deploy-tokens.js.cp.yaml"; //fungible token
import nftConfig from "../artifacts/2-deploy-nft.js.cp.yaml"; //nft

export default {
    props: {
        connection: String,
        network: String,
        buyer: String,
    },
    data() {
        return {
            acsTxId: this.acsTxId,
            amount_acs: 1,
            explorerURL: "",
            nfts: [],
            fungibleTokenId: "",
            creator: process.env.VUE_APP_CREATOR_ADDR,
        };
    },
    methods: {
        async updateTxn(txId) {
            this.acsTxId = txId;
            this.setExplorerURL(this.acsTxId);
        },
        async handleReceiveNFT(thisNFT) {
            const fungibleTokenId = fungibleConfig.default.asa.newCoin.assetIndex;
            
            await asa.purchaseNFT(
                this.creator, 
                this.buyer,
                thisNFT.assetIndex, 
                fungibleTokenId,
                this.network
            );
        },
        setExplorerURL(txId) {
            switch (this.network) {
                case "TestNet":
                    this.explorerURL =
                        "https://testnet.algoexplorer.io/tx/" + txId;
                    break;
                default:
                    this.explorerURL =
                        "http://localhost:8980/v2/transactions/" +
                        txId +
                        "?pretty";
                    break;
            }
        },
        async setNFTData() {
            const nftData = nftConfig.default.asa;
            this.nfts = await Promise.all(nftData.map(async (nft) => {
                // get json metadata file
                const url = nft[1].assetDef.url.replace(
                    "ipfs://",
                    "https://gateway.moralisipfs.com/ipfs/"
                );

                const response = await axios.get(url);
                const jsonMetadata = response.data;

                // get image url
                const imgUrl = jsonMetadata.image.replace(
                    "ipfs://",
                    "https://ipfs.io/ipfs/"
                );

                // check metadata
                const validHash = asa.checkMetadataHash(
                    nft[1].assetDef.metadataHash,
                    nft[1].assetDef.url
                );

                return {
                    name: nft[0],
                    ...nft[1].assetDef,
                    assetIndex: nft[1].assetIndex,
                    creator: nft[1].creator,
                    txId: nft[1].txId,
                    jsonMetadata,
                    imgUrl,
                    validHash
                }
            }));
        },
    },
    async mounted() {
        // set NFT data on page load
        await this.setNFTData();
    },
};
</script>

