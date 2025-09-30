const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of HK Retail NFT Platform contracts...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy CouponNFT contract
  console.log("\n1. Deploying CouponNFT contract...");
  const CouponNFT = await hre.ethers.getContractFactory("CouponNFT");
  const couponNFT = await CouponNFT.deploy(deployer.address);
  await couponNFT.waitForDeployment();
  console.log("CouponNFT deployed to:", await couponNFT.getAddress());

  // Chainlink VRF configuration for Mumbai testnet
  const VRF_COORDINATOR_V2 = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed"; // Mumbai
  const SUBSCRIPTION_ID = process.env.CHAINLINK_SUBSCRIPTION_ID || "1"; // You need to create this
  const GAS_LANE = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f"; // Mumbai 500 gwei
  const CALLBACK_GAS_LIMIT = "500000";

  // Deploy LotterySystem contract
  console.log("\n2. Deploying LotterySystem contract...");
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = await LotterySystem.deploy(
    VRF_COORDINATOR_V2,
    SUBSCRIPTION_ID,
    GAS_LANE,
    CALLBACK_GAS_LIMIT,
    await couponNFT.getAddress(),
    deployer.address
  );
  await lotterySystem.waitForDeployment();
  console.log("LotterySystem deployed to:", await lotterySystem.getAddress());

  // Verify deployment
  console.log("\n3. Verifying deployments...");
  
  // Check CouponNFT
  const nftName = await couponNFT.name();
  const nftSymbol = await couponNFT.symbol();
  console.log(`CouponNFT - Name: ${nftName}, Symbol: ${nftSymbol}`);
  
  // Check LotterySystem
  const totalLotteries = await lotterySystem.getTotalLotteries();
  console.log(`LotterySystem - Total lotteries: ${totalLotteries}`);

  // Save deployment addresses
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      CouponNFT: await couponNFT.getAddress(),
      LotterySystem: await lotterySystem.getAddress()
    },
    vrfConfig: {
      coordinator: VRF_COORDINATOR_V2,
      subscriptionId: SUBSCRIPTION_ID,
      gasLane: GAS_LANE,
      callbackGasLimit: CALLBACK_GAS_LIMIT
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n4. Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions for next steps
  console.log("\n5. Next Steps:");
  console.log("- Update your .env file with the contract addresses:");
  console.log(`CONTRACT_COUPON_NFT=${await couponNFT.getAddress()}`);
  console.log(`CONTRACT_LOTTERY=${await lotterySystem.getAddress()}`);
  console.log("- Create a Chainlink VRF subscription and add the LotterySystem contract as a consumer");
  console.log("- Fund the VRF subscription with LINK tokens");
  console.log("- Authorize merchants to mint coupons using couponNFT.authorizeMerchant()");

  return deploymentInfo;
}

main()
  .then((deploymentInfo) => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });