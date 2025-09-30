const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper function to get future timestamp
async function getFutureTimestamp(secondsFromNow) {
  const currentBlock = await ethers.provider.getBlock('latest');
  return currentBlock.timestamp + secondsFromNow;
}

describe("LotterySystem", function () {
  let couponNFT;
  let lotterySystem;
  let owner;
  let merchant;
  let user1;
  let user2;
  let vrfCoordinator;

  // Mock VRF Coordinator for testing
  const MOCK_VRF_COORDINATOR = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
  const SUBSCRIPTION_ID = 1;
  const GAS_LANE = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f";
  const CALLBACK_GAS_LIMIT = 500000;

  beforeEach(async function () {
    [owner, merchant, user1, user2] = await ethers.getSigners();
    
    // Deploy CouponNFT first
    const CouponNFT = await ethers.getContractFactory("CouponNFT");
    couponNFT = await CouponNFT.deploy(owner.address);
    await couponNFT.waitForDeployment();

    // Deploy LotterySystem
    const LotterySystem = await ethers.getContractFactory("LotterySystem");
    lotterySystem = await LotterySystem.deploy(
      MOCK_VRF_COORDINATOR,
      SUBSCRIPTION_ID,
      GAS_LANE,
      CALLBACK_GAS_LIMIT,
      await couponNFT.getAddress(),
      owner.address
    );
    await lotterySystem.waitForDeployment();

    // Authorize merchant and create test NFTs
    await couponNFT.authorizeMerchant(1, merchant.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lotterySystem.owner()).to.equal(owner.address);
    });

    it("Should set the correct CouponNFT address", async function () {
      expect(await lotterySystem.couponNFT()).to.equal(await couponNFT.getAddress());
    });

    it("Should initialize with zero lotteries", async function () {
      expect(await lotterySystem.getTotalLotteries()).to.equal(0);
    });
  });

  describe("Lottery Creation", function () {
    it("Should create a new lottery", async function () {
      const startTime = await getFutureTimestamp(3600); // 1 hour from now
      const endTime = startTime + 86400; // 1 day duration
      const entryFee = ethers.parseEther("0.1");

      await expect(lotterySystem.createLottery(
        "Test Lottery",
        "A test lottery for NFT coupons",
        entryFee,
        startTime,
        endTime
      )).to.emit(lotterySystem, "LotteryCreated")
        .withArgs(1, "Test Lottery", entryFee, 0, startTime, endTime);

      expect(await lotterySystem.getTotalLotteries()).to.equal(1);
    });

    it("Should store correct lottery information", async function () {
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;
      const entryFee = ethers.parseEther("0.1");

      await lotterySystem.createLottery(
        "Test Lottery",
        "A test lottery for NFT coupons",
        entryFee,
        startTime,
        endTime
      );

      const lotteryInfo = await lotterySystem.getLotteryInfo(1);
      expect(lotteryInfo.name).to.equal("Test Lottery");
      expect(lotteryInfo.description).to.equal("A test lottery for NFT coupons");
      expect(lotteryInfo.entryFee).to.equal(entryFee);
      expect(lotteryInfo.startTime).to.equal(startTime);
      expect(lotteryInfo.endTime).to.equal(endTime);
      expect(lotteryInfo.state).to.equal(0); // OPEN
    });

    it("Should reject lottery with invalid times", async function () {
      const pastTime = await getFutureTimestamp(-3600); // 1 hour ago
      const entryFee = ethers.parseEther("0.1");

      await expect(lotterySystem.createLottery(
        "Invalid Lottery",
        "Invalid start time",
        entryFee,
        pastTime,
        pastTime + 86400
      )).to.be.revertedWith("Start time cannot be in the past");
    });
  });

  describe("Prize Management", function () {
    let lotteryId;
    let tokenId;

    beforeEach(async function () {
      // Create lottery
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;
      const entryFee = ethers.parseEther("0.1");

      await lotterySystem.createLottery(
        "Prize Test Lottery",
        "Testing prize addition",
        entryFee,
        startTime,
        endTime
      );
      lotteryId = 1;

      // Create NFT and transfer to lottery contract
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7; // 1 week
      await couponNFT.connect(merchant).mintCoupon(
        owner.address, // Mint to owner first
        1, // merchantId
        0, // PERCENTAGE
        25, // 25% discount
        50, // maxQuantity
        expiryDate,
        1, // RARE
        "25% off premium items",
        "https://example.com/metadata/prize1"
      );
      tokenId = 1;
      
      // Transfer to lottery contract
      await couponNFT.connect(owner).transferFrom(owner.address, await lotterySystem.getAddress(), tokenId);
    });

    it("Should add prizes to lottery", async function () {
      await expect(lotterySystem.addPrizes(lotteryId, [tokenId]))
        .to.emit(lotterySystem, "PrizeAdded")
        .withArgs(lotteryId, tokenId);

      const lotteryInfo = await lotterySystem.getLotteryInfo(lotteryId);
      expect(lotteryInfo.totalPrizes).to.equal(1);
      expect(lotteryInfo.remainingPrizes).to.equal(1);

      const prizes = await lotterySystem.getLotteryPrizes(lotteryId);
      expect(prizes.length).to.equal(1);
      expect(prizes[0]).to.equal(tokenId);
    });

    it("Should reject invalid NFT prizes", async function () {
      // Try to add NFT not owned by contract
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7;
      await couponNFT.connect(merchant).mintCoupon(
        user1.address, // Not owned by lottery contract
        1,
        0,
        25,
        50,
        expiryDate,
        1,
        "Invalid prize",
        "https://example.com/metadata/invalid"
      );

      await expect(lotterySystem.addPrizes(lotteryId, [2]))
        .to.be.revertedWith("Contract must own the NFT");
    });
  });

  describe("Lottery Participation", function () {
    let lotteryId;
    let tokenId;

    beforeEach(async function () {
      // Create lottery that starts in the future, then advance time
      const startTime = await getFutureTimestamp(60); // Start in 1 minute
      const endTime = startTime + 86400; // 1 day duration
      const entryFee = ethers.parseEther("0.1");

      await lotterySystem.createLottery(
        "Participation Test",
        "Testing lottery participation",
        entryFee,
        startTime,
        endTime
      );
      lotteryId = 1;

      // Create and add prize
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7;
      await couponNFT.connect(merchant).mintCoupon(
        owner.address, // Mint to owner first
        1,
        0,
        30,
        25,
        expiryDate,
        2, // EPIC
        "30% off luxury items",
        "https://example.com/metadata/luxury"
      );
      tokenId = 1;

      // Transfer to lottery contract and add as prize
      await couponNFT.connect(owner).transferFrom(owner.address, await lotterySystem.getAddress(), tokenId);
      await lotterySystem.addPrizes(lotteryId, [tokenId]);

      // Advance time to after start time for participation
      await ethers.provider.send("evm_increaseTime", [120]); // Advance 2 minutes
      await ethers.provider.send("evm_mine");
    });

    it("Should allow users to enter lottery", async function () {
      const entryFee = ethers.parseEther("0.1");
      const entries = 3;

      await expect(lotterySystem.connect(user1).enterLottery(lotteryId, entries, {
        value: entryFee * BigInt(entries)
      })).to.emit(lotterySystem, "LotteryEntered")
        .withArgs(lotteryId, user1.address, entries);

      expect(await lotterySystem.getParticipantEntries(lotteryId, user1.address)).to.equal(entries);

      const participants = await lotterySystem.getLotteryParticipants(lotteryId);
      expect(participants.length).to.equal(1);
      expect(participants[0]).to.equal(user1.address);
    });

    it("Should handle multiple participants", async function () {
      const entryFee = ethers.parseEther("0.1");

      // User1 enters with 2 entries
      await lotterySystem.connect(user1).enterLottery(lotteryId, 2, {
        value: entryFee * 2n
      });

      // User2 enters with 1 entry
      await lotterySystem.connect(user2).enterLottery(lotteryId, 1, {
        value: entryFee
      });

      expect(await lotterySystem.getParticipantEntries(lotteryId, user1.address)).to.equal(2);
      expect(await lotterySystem.getParticipantEntries(lotteryId, user2.address)).to.equal(1);

      const participants = await lotterySystem.getLotteryParticipants(lotteryId);
      expect(participants.length).to.equal(2);
    });

    it("Should reject incorrect entry fee", async function () {
      const entryFee = ethers.parseEther("0.1");
      const incorrectFee = ethers.parseEther("0.05");

      await expect(lotterySystem.connect(user1).enterLottery(lotteryId, 1, {
        value: incorrectFee
      })).to.be.revertedWith("Incorrect entry fee");
    });

    it("Should reject entry to non-existent lottery", async function () {
      const entryFee = ethers.parseEther("0.1");

      await expect(lotterySystem.connect(user1).enterLottery(999, 1, {
        value: entryFee
      })).to.be.revertedWith("Lottery does not exist");
    });
  });

  describe("Lottery Drawing", function () {
    let lotteryId;

    beforeEach(async function () {
      // Create lottery that will end soon
      const startTime = await getFutureTimestamp(60); // Start in 1 minute
      const endTime = startTime + 3600; // Run for 1 hour
      const entryFee = ethers.parseEther("0.1");

      await lotterySystem.createLottery(
        "Drawing Test",
        "Testing lottery drawing",
        entryFee,
        startTime,
        endTime
      );
      lotteryId = 1;

      // Create and add prize
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7;
      await couponNFT.connect(merchant).mintCoupon(
        owner.address, // Mint to owner first
        1,
        0,
        50,
        10,
        expiryDate,
        3, // LEGENDARY
        "50% off everything",
        "https://example.com/metadata/legendary"
      );

      // Transfer to lottery contract and add as prize
      await couponNFT.connect(owner).transferFrom(owner.address, await lotterySystem.getAddress(), 1);
      await lotterySystem.addPrizes(lotteryId, [1]);

      // Advance time to after end time for drawing tests
      await ethers.provider.send("evm_increaseTime", [3720]); // Advance past end time
      await ethers.provider.send("evm_mine");
    });

    it("Should initiate drawing for ended lottery", async function () {
      // This test would require mocking the VRF coordinator response
      // For now, we test that the function exists and has proper access control
      
      // Only owner should be able to draw
      await expect(lotterySystem.connect(user1).drawWinner(lotteryId))
        .to.be.revertedWithCustomError(lotterySystem, "OwnableUnauthorizedAccount");
    });

    it("Should reject drawing for non-existent lottery", async function () {
      await expect(lotterySystem.drawWinner(999))
        .to.be.revertedWith("Lottery does not exist");
    });
  });

  describe("Administrative Functions", function () {
    it("Should allow owner to close lottery", async function () {
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;
      const entryFee = ethers.parseEther("0.1");

      await lotterySystem.createLottery(
        "Admin Test",
        "Testing admin functions",
        entryFee,
        startTime,
        endTime
      );

      await expect(lotterySystem.closeLottery(1))
        .to.emit(lotterySystem, "LotteryClosed")
        .withArgs(1);

      const lotteryInfo = await lotterySystem.getLotteryInfo(1);
      expect(lotteryInfo.state).to.equal(2); // CLOSED
    });

    it("Should allow owner to withdraw funds", async function () {
      // Send some ETH to the contract first
      await owner.sendTransaction({
        to: await lotterySystem.getAddress(),
        value: ethers.parseEther("1.0")
      });

      const contractBalance = await ethers.provider.getBalance(await lotterySystem.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("1.0"));
      
      await expect(lotterySystem.withdraw())
        .to.not.be.reverted;

      // Contract balance should be zero after withdrawal
      const finalContractBalance = await ethers.provider.getBalance(await lotterySystem.getAddress());
      expect(finalContractBalance).to.equal(0);
    });

    it("Should allow emergency NFT recovery", async function () {
      // Create NFT and transfer to lottery contract
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7;
      await couponNFT.connect(merchant).mintCoupon(
        owner.address, // Mint to owner first
        1,
        0,
        40,
        20,
        expiryDate,
        1,
        "Emergency recovery test",
        "https://example.com/metadata/emergency"
      );

      // Transfer to lottery contract
      await couponNFT.connect(owner).transferFrom(owner.address, await lotterySystem.getAddress(), 1);

      await expect(lotterySystem.emergencyRecoverNFT(1, owner.address))
        .to.not.be.reverted;

      expect(await couponNFT.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("View Functions", function () {
    it("Should return correct lottery information", async function () {
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;
      const entryFee = ethers.parseEther("0.2");

      await lotterySystem.createLottery(
        "View Test Lottery",
        "Testing view functions",
        entryFee,
        startTime,
        endTime
      );

      const lotteryInfo = await lotterySystem.getLotteryInfo(1);
      expect(lotteryInfo.id).to.equal(1);
      expect(lotteryInfo.name).to.equal("View Test Lottery");
      expect(lotteryInfo.entryFee).to.equal(entryFee);
      expect(lotteryInfo.participantCount).to.equal(0);
    });

    it("Should return empty arrays for new lottery", async function () {
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;

      await lotterySystem.createLottery(
        "Empty Test",
        "Testing empty state",
        ethers.parseEther("0.1"),
        startTime,
        endTime
      );

      const participants = await lotterySystem.getLotteryParticipants(1);
      const prizes = await lotterySystem.getLotteryPrizes(1);

      expect(participants.length).to.equal(0);
      expect(prizes.length).to.equal(0);
    });
  });

  describe("Integration with CouponNFT", function () {
    it("Should verify coupon validity for prizes", async function () {
      const startTime = await getFutureTimestamp(3600);
      const endTime = startTime + 86400;

      await lotterySystem.createLottery(
        "Integration Test",
        "Testing NFT integration",
        ethers.parseEther("0.1"),
        startTime,
        endTime
      );

      // Create valid NFT
      const expiryDate = Math.floor(Date.now() / 1000) + 86400 * 7;
      await couponNFT.connect(merchant).mintCoupon(
        owner.address, // Mint to owner first
        1,
        0,
        35,
        15,
        expiryDate,
        2,
        "Integration test coupon",
        "https://example.com/metadata/integration"
      );

      // Transfer to lottery contract
      await couponNFT.connect(owner).transferFrom(owner.address, await lotterySystem.getAddress(), 1);

      // Should successfully add valid NFT as prize
      await expect(lotterySystem.addPrizes(1, [1]))
        .to.not.be.reverted;

      // Verify the NFT is still valid
      expect(await couponNFT.isCouponValid(1)).to.be.true;
    });
  });
});