const express = require("express")
require('dotenv').config()
const ethers = require('ethers');
const fs = require('fs')
const axios = require('axios')
const loanABI = require('./loan.json')
const uniABI = require('./uni.json')
const erc20ABI = require('./erc20.json')

const WSS = "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"		// Maninet RPC
var provider = new ethers.providers.JsonRpcProvider(WSS);

const UNI2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const ETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";			// Mainnet WETH
const LOAN_TREA = "0x610f6b4a1e8D024Fd947dab1a7a35932082BaFE7";
const OP_ADDRESS = "0xe834a4EE9aBEfF319d47d1E720EAC0097f02061b";

// const loanAddress = '0x3EA2a05d322C7c312edfABc8EADa0EE0f698EDaC';		// Goerli Test
const loanAddress = '0xbEE036e3c071E5b72e5C8d034FB0fAFdBBBb8E1D';			// Mainnet Loan

const opKey = process.env.privatekey
const walletForControl = new ethers.Wallet(opKey, provider); //Loan Operator

const loanContract = new ethers.Contract(
	loanAddress,
	loanABI,
	walletForControl
)

const uniRouter = new ethers.Contract(
	UNI2_ROUTER_ADDRESS,
	uniABI,
	walletForControl
)

const port = 3000;

const app = express();

const main = async () => {
	try {
		const collateralCount = await loanContract.getCollateralLen()
		const isSwap = await loanContract.isSwappable()
		console.log('loanEther:: swappable ', isSwap, collateralCount);
		if(collateralCount > 0 && isSwap) {
			await loanContract.swapAssets();
			console.log('loanEther:: swapAssets');
		}
	} catch (error) {
		console.log('transfer', error)
	}
}

app.listen(process.env.PORT || 3000, () => {
	console.log(`App start on port ${port}`);
});

app.get('/loanEther', async function (req, res) {

	main()
	res.send("loanEther:: success")
})

app.get('/', async function (req, res) {
	res.send("loanEther:: op request")
})