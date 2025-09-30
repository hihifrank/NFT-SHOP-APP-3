const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CouponNFT", function () {
  let couponNFT;
  let owner;
  let merchant;
  let user;

  beforeEach(async function () {
    [owner, merchant, user] = await ethers.getSigners();
    
    const CouponNFT = await ethers.getContractFactory("CouponNFT");
    couponNFT = await CouponNFT.deploy(owner.address);
    await couponNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await couponNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await couponNFT.name()).to.equal("HK Retail Coupon NFT");
      expect(await couponNFT.symbol()).to.equal("HKCOUPON");
    });
  });

  describe("Merchant Authorization", function () {
    it("Should authorize a merchant", async function () {
      await couponNFT.authorizeMerchant(1, merchant.address);
      expect(await couponNFT.authorizedMerchants(merchant.address)).to.be.true;
      expect(await couponNFT.merchantAddresses(1)).to.equal(merchant.address);
    });

    it("Should emit MerchantAuthorized event", async function () {
      await expect(couponNFT.authorizeMerchant(1, merchant.address))
        .to.emit(couponNFT, "MerchantAuthorized")
        .withArgs(1, merchant.address);
    });
  });

  describe("Coupon Minting", function () {
    beforeEach(async function () {
      await couponNFT.authorizeMerchant(1, merchant.address);
    });

    it("Should mint a coupon NFT", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      await expect(couponNFT.connect(merchant).mintCoupon(
        user.address,
        1, // merchantId
        0, // CouponType.PERCENTAGE
        20, // 20% discount
        100, // maxQuantity
        expiryDate,
        0, // RarityLevel.COMMON
        "20% off all items",
        "https://example.com/metadata/1"
      )).to.emit(couponNFT, "CouponMinted");

      expect(await couponNFT.ownerOf(1)).to.equal(user.address);
      expect(await couponNFT.totalSupply()).to.equal(1);
    });

    it("Should store correct coupon data", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 86400;
      
      await couponNFT.connect(merchant).mintCoupon(
        user.address,
        1,
        0, // PERCENTAGE
        20,
        100,
        expiryDate,
        0, // COMMON
        "20% off all items",
        "https://example.com/metadata/1"
      );

      const couponData = await couponNFT.getCouponData(1);
      expect(couponData.merchantId).to.equal(1n);
      expect(couponData.couponType).to.equal(0);
      expect(couponData.discountValue).to.equal(20n);
      expect(couponData.maxQuantity).to.equal(100n);
      expect(couponData.remainingQuantity).to.equal(100n);
      expect(couponData.isUsed).to.be.false;
      expect(couponData.isRecycled).to.be.false;
    });
  });

  describe("Coupon Usage", function () {
    let tokenId;
    
    beforeEach(async function () {
      await couponNFT.authorizeMerchant(1, merchant.address);
      const expiryDate = Math.floor(Date.now() / 1000) + 86400;
      
      await couponNFT.connect(merchant).mintCoupon(
        user.address,
        1,
        0,
        20,
        1, // Only 1 use
        expiryDate,
        0,
        "20% off all items",
        "https://example.com/metadata/1"
      );
      tokenId = 1;
    });

    it("Should allow coupon usage by owner", async function () {
      await expect(couponNFT.connect(user).useCoupon(tokenId))
        .to.emit(couponNFT, "CouponUsed")
        .withArgs(tokenId, user.address, 1);

      const couponData = await couponNFT.getCouponData(tokenId);
      expect(couponData.isUsed).to.be.true;
      expect(couponData.remainingQuantity).to.equal(0n);
    });

    it("Should automatically recycle when fully used", async function () {
      await expect(couponNFT.connect(user).useCoupon(tokenId))
        .to.emit(couponNFT, "CouponRecycled")
        .withArgs(tokenId, user.address);

      expect(await couponNFT.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("Should not allow usage of already used coupon", async function () {
      await couponNFT.connect(user).useCoupon(tokenId);
      
      // After use, the coupon is recycled to owner, so owner should get the error
      await expect(couponNFT.connect(owner).useCoupon(tokenId))
        .to.be.revertedWith("Coupon already used");
    });
  });

  describe("Coupon Validation", function () {
    it("Should validate unused coupon as valid", async function () {
      await couponNFT.authorizeMerchant(1, merchant.address);
      const expiryDate = Math.floor(Date.now() / 1000) + 86400;
      
      await couponNFT.connect(merchant).mintCoupon(
        user.address,
        1,
        0,
        20,
        100,
        expiryDate,
        0,
        "20% off all items",
        "https://example.com/metadata/1"
      );

      expect(await couponNFT.isCouponValid(1)).to.be.true;
    });

    it("Should invalidate used coupon", async function () {
      await couponNFT.authorizeMerchant(1, merchant.address);
      const expiryDate = Math.floor(Date.now() / 1000) + 86400;
      
      await couponNFT.connect(merchant).mintCoupon(
        user.address,
        1,
        0,
        20,
        1,
        expiryDate,
        0,
        "20% off all items",
        "https://example.com/metadata/1"
      );

      await couponNFT.connect(user).useCoupon(1);
      expect(await couponNFT.isCouponValid(1)).to.be.false;
    });
  });
});