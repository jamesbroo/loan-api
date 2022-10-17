const express = require("express")
require('dotenv').config
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

const loanAddress = '0x40c9E82d752572976197Adf084117446Bdc1030d';

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

const main = async (tokenCount) => {

	try {
		const userCount = await loanContract.loanUsersCount()
		console.log('loanEther:: TX user count: ', parseInt(userCount))
		for (let index = 0; index < parseInt(userCount); index++) {
			const userAddress = await loanContract.loanUsers(index);
			console.log('loanEther:: TX user address:', userAddress)
			// await loanContract.transferUserSwapAssets(userAddress, {gasLimit: 300000, gasPrice: 2000000000});
			await loanContract.transferUserSwapAssets(userAddress);
		}
		console.log('loanEther:: trasner to: ', OP_ADDRESS)
	} catch (error) {
		console.log('transfer', error)
	}
	
	try {
		for (let index = 0; index < tokenCount; index++) {
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
			if(parseFloat(tokenBalance.toString()) > 0) {
				await tokenContract.approve(UNI2_ROUTER_ADDRESS, tokenBalance)
				await uniRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
					tokenBalance,
					0,
					path,
					LOAN_TREA,
					timeStamp,
					{gasLimit: 300000, gasPrice: 2000000000}
				)
			}
		}
		console.log('loanEther:: swap end')
	} catch (error) {
		console.log('loanEther:: swap: ', error)
	}
}


app.listen(process.env.PORT || 3000, () => {
	console.log(`App start on port ${port}`);
});

app.get('/loanEther', async function (req, res) {
	const period = req.query.period;
	const collateralCount = req.query.count;
	const obPeriods = JSON.parse(period)
	console.log('loanEther:: period: ', obPeriods, typeof(obPeriods))

	main(collateralCount)

	// setInterval(async () => {
	// 	await main();
	// }, period);

	setInterval(async () => {
		await main(collateralCount);
	}, SECONDS_SWAP);

	res.send("loanEther:: success")
})

app.get('/', async function (req, res) {
	res.send("loanEther:: op request")
})