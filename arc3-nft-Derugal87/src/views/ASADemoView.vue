<template>
    <div id="sendalgo-app">
        <h3>Select wallet</h3>
        <div class="d-grid gap-2 mb-5">
            <button @click="connectToAlgoSigner()" class="btn btn-primary">
                AlgoSigner (Localhost)
            </button>
        </div>
        <div v-if="this.buyer !== ''" class="mb-5">
            <h3>Connected</h3>
            <p>
                Connection: <span>{{ this.connection }}</span>
            </p>
            <p>
                Network: <span>{{ this.network }}</span>
            </p>
            <p>
                Account: <span>{{ this.buyer }}</span>
            </p>
        </div>
        <send-asset-form
            v-if="this.connection === 'algosigner'"
            :connection="this.connection"
            :network="this.network"
            :buyer="this.buyer"
        />
    </div>
</template>

<script>
export default {
    data() {
        return {
            connection: "", // myalgo | walletconnect | algosigner
            connector: null, // wallet connector obj
            network: "Localhost", // replace with the network name added in AlgoSigner
            buyer: "", 
        };
    },
    methods: {
        async connectToAlgoSigner() {
            
            const algorand = window.algorand;
            if (typeof algorand !== 'undefined') {
                const response = await algorand.enable({
                    ledger: this.network,
                });
                const buyerAccount = response.accounts.find((acc) => {
                    return acc.address === process.env.VUE_APP_BUYER_ADDR;
                });
                if (buyerAccount) {
                    this.buyer = buyerAccount.address;
                }
                this.connection = "algosigner";
            }
        },
    },
};
</script>
