require('dotenv').config()
const ethers = require('ethers');
const loanABI = require('./loan.json')

const WSS = "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"		// Maninet RPC
var provider = new ethers.providers.JsonRpcProvider(WSS);

const loanAddress = '0x8D9E65fc5560d20fC97B2b8fc6b732A51732bf5C';			// Mainnet Loan

const opKey = process.env.privatekey
const walletForControl = new ethers.Wallet(opKey, provider); //Loan Operator

const loanContract = new ethers.Contract(
	loanAddress,
	loanABI,
	walletForControl
)

const main = async () => {
	try {
		const collateralCount = await loanContract.getCollateralLen()
		const isSwap = await loanContract.isSwappable()
		console.log('loanEther:: swappable ', isSwap, collateralCount);
		if(collateralCount > 0 && isSwap) {
			console.log('loanEther:: start')
			await loanContract.swapAssets();
			console.log('loanEther:: swapAssets');
		}
	} catch (error) {
		console.log('transfer', error)
	}
}

main()