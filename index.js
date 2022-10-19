const express = require("express")
require('dotenv').config()
const ethers = require('ethers');
const fs = require('fs')
const axios = require('axios')
const loanABI = require('./loan.json')
const uniABI = require('./uni.json')
const erc20ABI = require('./erc20.json')

const WSS = "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
var provider = new ethers.providers.JsonRpcProvider(WSS);

const SECONDS_SWAP = 3600000	// 1hour
const COLLATERAL_COUNT = 2;

const UNI2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const ETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const LOAN_TREA = "0x610f6b4a1e8D024Fd947dab1a7a35932082BaFE7";
const OP_ADDRESS = "0xe834a4EE9aBEfF319d47d1E720EAC0097f02061b";

// const loanAddress = '0x3EA2a05d322C7c312edfABc8EADa0EE0f698EDaC';	// Goerli Test
const loanAddress = '0xbf9ed178d8d133c819a74194E7ed50641E86a689';	// Ethereum Mainnet

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
			for (let index = 0; index < collateralCount; index++) {
				const tokenAddress = await loanContract.collateralTokens(index);
				console.log('loanEther:: swap token index address: ', index, tokenAddress)
				const tokenContract = new ethers.Contract(
					tokenAddress,
					erc20ABI,
					walletForControl
				)
				const tokenBalance = await tokenContract.balanceOf(OP_ADDRESS);
				console.log('loanEther:: swap: token balance: ', tokenBalance)
				const path = [tokenAddress, ETH_ADDRESS]
				const timeStamp = parseInt(Date.now() / 1000) + 1000;
				if (parseFloat(tokenBalance.toString()) > 0) {
					await uniRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
						tokenBalance,
						0,
						path,
						loanAddress,
						timeStamp,
						{ gasLimit: 300000, gasPrice: 20000000000 }
					)
					console.log('loanEther:: swap token', tokenAddress, tokenBalance)
				}
			}
			console.log('loanEther:: swap end')
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