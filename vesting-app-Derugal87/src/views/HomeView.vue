<template>
    <div>
        <NavBar
            :sender="sender"
            :network="network"
            @setNetwork="setNetwork"
            @setSender="setSender"
            @disconnectWallet="disconnectWallet"
            @connectMyAlgo="connectMyAlgo"
            @connectToAlgoSigner="connectToAlgoSigner"
            @connectToWalletConnect="connectToWalletConnect"
        />
        <div id="home" class="container-sm mt-5">
            <send-asset-form
                v-if="this.sender !== ''"
                :connection="this.connection"
                :network="this.network"
                :sender="this.sender"
                :total_allocated_tokens="this.total_allocated_tokens"
                :asset_left="this.asset_left"
            />
        </div>
    </div>
</template>

<script>
import MyAlgoConnect from "@randlabs/myalgo-connect";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import * as helpers from '../helpers';
import vestAppConfig from "../artifacts/deploy.js.cp.yaml";
export default {
    data() {
        return {
            connection: "", // myalgo | walletconnect | algosigner
            connector: null, // wallet connector obj
            network: "SandNet", // SandNet | TestNet
            sender: "", // connected account
            total_allocated_tokens: 0,
            asset_left: 0,
            timestamp: 0,
            vestAppID: null,
        };
    },
    methods: {

        async updateAccountInfo() {
            this.vestAppID = vestAppConfig.default.metadata.vestAppID;
            this.timestamp = vestAppConfig.default.metadata.vestAppTimestamp;
            this.total_allocated_tokens = await helpers.update_sender_asset_balance(this.vestAppID, this.network, this.sender);
            this.asset_left = await helpers.update_sender_asset_amount(this.vestAppID, this.network, this.sender, this.total_allocated_tokens, this.timestamp);
        },

        setSender(sender) {
            this.disconnectWallet();
            this.sender = sender;
            this.updateAccountInfo();
        },

        setNetwork(network) {
            this.disconnectWallet();
            this.network = network
        },
       
        disconnectWallet() {
            this.connection = ""; 
            this.connector = null;
            this.sender = "";
        },
        async connectMyAlgo() {
            try {
                // force connection to TestNet
                this.network = "TestNet";
                const myAlgoWallet = new MyAlgoConnect();
                const accounts = await myAlgoWallet.connect();
                this.sender = accounts[0].address;
                this.connection = "myalgo";
            } catch (err) {
                console.error(err);
            }
        },
        async connectToAlgoSigner() {
            const algorand = window.algorand;

            if (typeof algorand !== "undefined") {
                
                const response = await algorand.enable({
                    ledger: this.network,
                });
                this.sender = response.accounts.find((acc) => {
                    if (acc === process.env.VUE_APP_ACC1_ADDR)
                        return acc === process.env.VUE_APP_ACC1_ADDR && acc;
                    else if (acc === process.env.VUE_APP_ACC2_ADDR)
                        return acc === process.env.VUE_APP_ACC2_ADDR && acc;
                    else if (acc === process.env.VUE_APP_ACC3_ADDR)
                        return acc === process.env.VUE_APP_ACC3_ADDR && acc;
                    else if (acc === process.env.VUE_APP_ACC4_ADDR)
                        return acc === process.env.VUE_APP_ACC4_ADDR && acc;
                    else
                        return acc === process.env.VUE_APP_ACC1_ADDR && acc;
                });

                this.connection = "algosigner";
            }
        },
        async connectToWalletConnect() {
            // force connection to TestNet
            this.network = "TestNet";

            // Create a connector
            this.connector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org", // Required
                qrcodeModal: QRCodeModal,
            });

            // Kill existing session
            if (this.connector.connected) {
                await this.connector.killSession();
            }

            this.connector.createSession();

            // Subscribe to connection events
            this.connector.on("connect", (error, payload) => {
                if (error) {
                    throw error;
                }

                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.connection = "walletconnect";
            });

            this.connector.on("session_update", (error, payload) => {
                if (error) {
                    throw error;
                }

                const { accounts } = payload.params[0];
                this.sender = accounts[0];
                this.connection = "walletconnect";
            });

            this.connector.on("disconnect", (error, payload) => {
                if (error) {
                    throw error;
                }

                // Delete connector
                console.log(payload);
                this.sender = "";
                this.connection = "";
            });
        },
    },
};
</script>
