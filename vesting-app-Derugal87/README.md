[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-c66648af7eb3fe8bc4f294546bfd86ef473780cde1dea487d3c4ff354943c9ae.svg)](https://classroom.github.com/online_ide?assignment_repo_id=10095643&assignment_repo_type=AssignmentRepo)
# Vesting Application

## Overview

Token vesting refers to a process where tokens are locked and released slowly over a period of time. If the tokens are locked, they cannot be transferred or used until they are released. This is to mitigate attempts to introduce a large supply of tokens to the market at any point in time.

Create an vesting application which involves using smart contracts to lock the tokens for a specified duration. The tokens can be retrieved progressively via your application within the vesting period.

The tokens distribution table are as follows. The vesting period is the duration which the allocated percentage of tokens will be progressively released. Cliff refers to the initial duration within the vesting period which the tokens are locked. Upon the end of the cliff, the stakeholder is able to receive a portion of the allocated stake from the subsequent month onwards.

| Stakeholder           | Percentage    | Vesting Period (months)   | Cliff (months)    | 
| --------------------- | ------------- | ------------------------- | ----------------- |
| Public				        | 25            | NA                        | NA                |
| Advisors				      | 10            | 24                        | 12                |
| Private Investors 	  | 20 			      | 24                        | 12                |
| Company Reserves	    | 30			      | NA                        | NA                |
| Team				          | 15			      | 24                        | 12                |

For example, if the advisors are allocated 1200 tokens over a vesting period of 24 months and a cliff of 12 months, the distribution will look like this,

1. Months 1 to 12 --- Advisors get 0 tokens
2. Month 13 --- Advisors get up to 12 * (1200 / 24) = 600 tokens
3. Month 14 --- Advisors get up to 13 * (1200 / 24) = 650 tokens
4. Month 15 --- Advisors get up to 14 * (1200 / 24) = 700 tokens
5. Month 16 --- Advisors get up to 15 * (1200 / 24) = 750 tokens
6. ... etc etc
7. Month 25 --- Advisors can withdraw entire allocation

## Application Details

### Fast Forward Vesting Period
In order to speed up the evaluation process, we will use 1 minute to represent 1 month. Thus, the cliff period will be 12 minutes and the vesting period will be 24 minutes instead.

### Token Creation
Create the fungible token with the following details.

1. Token name: VACoin
2. Unit name: VAC
3. Total supply: 100 million
4. Decimals: 0

### Contract initialization
Initialize the vesting contract with the following details.

1. Team address
2. Advisors address
3. Private investor address
4. Asset ID
5. Remaining amount of tokens that can be distributed per stakeholder

Once the vesting contract is deployed, proceed to transfer all the tokens (less the public allocation) to the vesting contract. This means that you should perform an asset opt in transaction before sending 75% of the token supply to it for lockup and distribution. 

### Withdraw
**Only the advisors, private investors, company reserves and team accounts can withdraw from the vesting contract.**

This is an application call to withdraw the vested tokens from the contract. This function will need to verify the sender's address, the vesting and cliff period and decide the available tokens to distribute.

As always, accounts need to be opted in before making a application calls.

### Application Frontend
Create an application frontend with the following,

1. Implement wallet connectors to allow stakeholders to connect to their wallet accounts. The Dapp needs to allow user to switch between accounts for the purposes of this assignment.
2. Display the total allocated tokens when the stakeholder account is connected.
3. Display maximum number of withdrawable tokens for the stakeholder at that point in time. Your contract will also need to verify this number as well.
4. Only allow authorized stakeholder accounts to withdraw from the application.
5. Include a form to allow stakeholders to withdraw any amount they wish, subjected to the maximum number of withdrawable tokens at that point in time.

## Testing
Write test cases to demostrate the successful flow of the auction and negative tests to demostrate if the necesssary checks are in place.

## Deployment
Include documentation on how to deploy the smart contracts and how to set up the application frontend locally.

## Setup instructions

### 1. Install packages
yarn install

### 2. Update environment variables
1. Copy `.env.example` to `.env`.
2. Add account information (address and mnemonic) into the `.env` file.
3. Create a new account or import it and get account mnemonic
To create new account in goal CLI, run this command in your sandbox directory.
```
./sandbox goal account new
```

To import an account in goal CLI, replace the `<mnemonic>` run this command in your sandbox directory.
```
./sandbox goal account import -m <mnemonic>
```

4. Fund the account with the microAlgos
To get the mnemonic of an account in goal CLI, replace the `<account address>` run this command in your sandbox directory.
```
./sandbox goal clerk send -a 123456789 -f `<account address>` -t <account address>
```

### 3. Run Algo Builder deployment script (deploy smart contracts)
yarn run algob deploy

### 4. Run Algo Builder non-deployment script (transfer)
yarn run algob run scripts/actions/transfer.js

### 5. Run tests (positive flow and negative tests)
yarn run algob test

#### Negative tests:
1. Double asset creation fails
2. Asset creation fails when non-creator calls
3. Transfer to vesting contract fails when non-creator calls
4. Transfer coins to non-Vest app fails
5. Vest app opting in asset twice fails
6. Non creator opt-in calls fail
7. Opt-in call to incorrect asset ID fails
8. Before 1 year staking, withdrawal fails (if stakeholder is not Company_reserve)
9. Overlimit withdraw amount during current month fails (case 1)
10. Overlimit withdraw amount during current month fails (more than 1 withdrawal) (case 2)
11. 0 assets withdrawal fails
12. Non stakeholder withdraw fails

#### Positive flow tests:
1. Deploy mint account is successful
2. Asset is created successfully
3. Deploy vesting contract is successful
4. Stakeholder address is optIn successful
5. Vesting contract is optIn successfully
6. Transfer to vending contract is successful
7. Withdraw all assets after 24 months
8. Withdraw 50% assets after 1 year and 1 month
9. Company_reserves is not time-sensitive stakeholder, according withdrawal opportunity

### 6. Copy the deployed checkpoint files to src folder
cp `artifacts/scripts/deploy.js.cp.yaml` to `src/artifacts/`

### 7. Run dapp on localhost
yarn serve

`!!! Be sure to add all the account stakeholders to Algosigner wallet before use the Dapp !!!`

# Cleanup artifacts folder
If you need to clear cache, you can launch this command:
yarn run algob clean

## Assesment Criteria
[https://docs.google.com/document/d/1IMHy5xnl0y8vADZF40sZLTzjgVdWKNz8sXF6McBEBSU/edit?usp=sharing](https://docs.google.com/document/d/1IMHy5xnl0y8vADZF40sZLTzjgVdWKNz8sXF6McBEBSU/edit?usp=sharing)
