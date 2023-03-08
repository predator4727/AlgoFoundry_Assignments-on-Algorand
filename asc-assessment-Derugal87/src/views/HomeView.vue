<template>
    <div>
        <NavBar
            :sender="sender"
            :network="network"
            @setNetwork="setNetwork"
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
            />
        </div>
    </div>
</template>

<script>
import MyAlgoConnect from "@randlabs/myalgo-connect";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";

export default {
    data() {
        return {
            connection: "", // myalgo | walletconnect | algosigner
            connector: null, // wallet connector obj
            network: "SandNet", // SandNet | TestNet
            sender: "", // connected account
        };
    },
    methods: {
        setNetwork(network) {
            this.disconnectWallet();
            this.network = network;
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

                //this.sender = response.accounts[1].address;
                //this.sender = process.env.VUE_APP_ACC1_ADDR;

                // console.log("acc", response.accounts);
                this.sender = response.accounts.find((acc) => {
                    // console.log("acc", acc)
                    return acc === process.env.VUE_APP_ACC1_ADDR && acc;
                });


                this.connection = "algosigner";
            }

            // const AlgoSigner = window.AlgoSigner;

            // if (typeof AlgoSigner !== "undefined") {
            //     await AlgoSigner.connect();
            //     const accounts = await AlgoSigner.accounts({
            //         ledger: this.network,
            //     });

            //     this.sender = accounts[1].address;

            //     this.connection = "algosigner";
            // }
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
