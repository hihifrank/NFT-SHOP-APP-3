// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CouponNFT
 * @dev NFT contract for retail coupons with usage tracking and recycling functionality
 */
contract CouponNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    // Coupon types
    enum CouponType { PERCENTAGE, FIXED_AMOUNT, BUY_ONE_GET_ONE, SPECIAL_ITEM }
    
    // Rarity levels
    enum RarityLevel { COMMON, RARE, EPIC, LEGENDARY }

    struct CouponData {
        uint256 merchantId;
        CouponType couponType;
        uint256 discountValue; // Percentage (1-100) or fixed amount in wei
        uint256 maxQuantity;
        uint256 remainingQuantity;
        uint256 expiryDate;
        RarityLevel rarity;
        bool isUsed;
        bool isRecycled;
        string description;
    }

    // Mapping from token ID to coupon data
    mapping(uint256 => CouponData) public coupons;
    
    // Mapping from merchant ID to authorized addresses
    mapping(uint256 => address) public merchantAddresses;
    
    // Mapping to track merchant authorization
    mapping(address => bool) public authorizedMerchants;
    
    // Events
    event CouponMinted(uint256 indexed tokenId, uint256 indexed merchantId, address indexed recipient);
    event CouponUsed(uint256 indexed tokenId, address indexed user, uint256 indexed merchantId);
    event CouponRecycled(uint256 indexed tokenId, address indexed previousOwner);
    event MerchantAuthorized(uint256 indexed merchantId, address indexed merchantAddress);
    event MerchantDeauthorized(uint256 indexed merchantId, address indexed merchantAddress);

    constructor(address initialOwner) 
        ERC721("HK Retail Coupon NFT", "HKCOUPON") 
        Ownable(initialOwner) 
    {
        _tokenIdCounter = 1; // Start from token ID 1
    }

    /**
     * @dev Authorize a merchant to mint coupons
     */
    function authorizeMerchant(uint256 merchantId, address merchantAddress) external onlyOwner {
        require(merchantAddress != address(0), "Invalid merchant address");
        merchantAddresses[merchantId] = merchantAddress;
        authorizedMerchants[merchantAddress] = true;
        emit MerchantAuthorized(merchantId, merchantAddress);
    }

    /**
     * @dev Deauthorize a merchant
     */
    function deauthorizeMerchant(uint256 merchantId) external onlyOwner {
        address merchantAddress = merchantAddresses[merchantId];
        require(merchantAddress != address(0), "Merchant not found");
        
        authorizedMerchants[merchantAddress] = false;
        delete merchantAddresses[merchantId];
        emit MerchantDeauthorized(merchantId, merchantAddress);
    }

    /**
     * @dev Mint a new coupon NFT
     */
    function mintCoupon(
        address to,
        uint256 merchantId,
        CouponType couponType,
        uint256 discountValue,
        uint256 maxQuantity,
        uint256 expiryDate,
        RarityLevel rarity,
        string memory description,
        string memory uri
    ) external returns (uint256) {
        require(
            authorizedMerchants[msg.sender] || msg.sender == owner(),
            "Not authorized to mint coupons"
        );
        require(to != address(0), "Cannot mint to zero address");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        require(maxQuantity > 0, "Max quantity must be greater than 0");
        
        if (couponType == CouponType.PERCENTAGE) {
            require(discountValue > 0 && discountValue <= 100, "Invalid percentage value");
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        coupons[tokenId] = CouponData({
            merchantId: merchantId,
            couponType: couponType,
            discountValue: discountValue,
            maxQuantity: maxQuantity,
            remainingQuantity: maxQuantity,
            expiryDate: expiryDate,
            rarity: rarity,
            isUsed: false,
            isRecycled: false,
            description: description
        });

        emit CouponMinted(tokenId, merchantId, to);
        return tokenId;
    }

    /**
     * @dev Use a coupon (can only be called by the owner or authorized merchant)
     */
    function useCoupon(uint256 tokenId) external nonReentrant {
        require(_exists(tokenId), "Coupon does not exist");
        
        CouponData storage coupon = coupons[tokenId];
        address tokenOwner = ownerOf(tokenId);
        address merchantAddress = merchantAddresses[coupon.merchantId];
        
        require(
            msg.sender == tokenOwner || 
            msg.sender == merchantAddress || 
            msg.sender == owner(),
            "Not authorized to use this coupon"
        );
        require(!coupon.isUsed, "Coupon already used");
        require(!coupon.isRecycled, "Coupon is recycled");
        require(block.timestamp <= coupon.expiryDate, "Coupon has expired");
        require(coupon.remainingQuantity > 0, "No remaining quantity");

        coupon.isUsed = true;
        coupon.remainingQuantity--;

        emit CouponUsed(tokenId, tokenOwner, coupon.merchantId);

        // If this was the last use, automatically recycle the coupon
        if (coupon.remainingQuantity == 0) {
            _recycleCoupon(tokenId, tokenOwner);
        }
    }

    /**
     * @dev Recycle a used coupon back to the marketplace
     */
    function recycleCoupon(uint256 tokenId) external {
        require(_exists(tokenId), "Coupon does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this coupon");
        
        CouponData storage coupon = coupons[tokenId];
        require(coupon.isUsed, "Coupon must be used before recycling");
        require(!coupon.isRecycled, "Coupon already recycled");

        _recycleCoupon(tokenId, msg.sender);
    }

    /**
     * @dev Internal function to handle coupon recycling
     */
    function _recycleCoupon(uint256 tokenId, address previousOwner) internal {
        CouponData storage coupon = coupons[tokenId];
        coupon.isRecycled = true;

        // Transfer the NFT back to the contract owner for redistribution
        _transfer(previousOwner, owner(), tokenId);

        emit CouponRecycled(tokenId, previousOwner);
    }

    /**
     * @dev Get coupon details
     */
    function getCouponData(uint256 tokenId) external view returns (CouponData memory) {
        require(_exists(tokenId), "Coupon does not exist");
        return coupons[tokenId];
    }

    /**
     * @dev Check if a coupon is valid for use
     */
    function isCouponValid(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) return false;
        
        CouponData memory coupon = coupons[tokenId];
        return !coupon.isUsed && 
               !coupon.isRecycled && 
               block.timestamp <= coupon.expiryDate &&
               coupon.remainingQuantity > 0;
    }

    /**
     * @dev Get total number of minted coupons
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override to prevent transfers of used but not recycled coupons
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and recycling (to == owner())
        if (from != address(0) && to != owner()) {
            CouponData memory coupon = coupons[tokenId];
            require(!coupon.isUsed || coupon.isRecycled, "Cannot transfer used coupon");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}