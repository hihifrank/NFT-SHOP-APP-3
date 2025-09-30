// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./CouponNFT.sol";

/**
 * @title LotterySystem
 * @dev Lottery contract with Chainlink VRF for fair random prize distribution
 */
contract LotterySystem is VRFConsumerBaseV2, Ownable, ReentrancyGuard, IERC721Receiver {
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    CouponNFT public immutable couponNFT;

    enum LotteryState { OPEN, CALCULATING, CLOSED }

    struct Lottery {
        uint256 id;
        string name;
        string description;
        uint256 entryFee;
        uint256 totalPrizes;
        uint256 remainingPrizes;
        uint256 startTime;
        uint256 endTime;
        LotteryState state;
        address[] participants;
        uint256[] prizeTokenIds;
        mapping(address => uint256) participantEntries;
        uint256 vrfRequestId;
    }

    struct LotteryInfo {
        uint256 id;
        string name;
        string description;
        uint256 entryFee;
        uint256 totalPrizes;
        uint256 remainingPrizes;
        uint256 startTime;
        uint256 endTime;
        LotteryState state;
        uint256 participantCount;
    }

    uint256 private _lotteryIdCounter;
    mapping(uint256 => Lottery) public lotteries;
    mapping(uint256 => uint256) private vrfRequestToLotteryId;

    // Events
    event LotteryCreated(
        uint256 indexed lotteryId,
        string name,
        uint256 entryFee,
        uint256 totalPrizes,
        uint256 startTime,
        uint256 endTime
    );
    event LotteryEntered(uint256 indexed lotteryId, address indexed participant, uint256 entries);
    event LotteryDrawStarted(uint256 indexed lotteryId, uint256 vrfRequestId);
    event LotteryWinner(uint256 indexed lotteryId, address indexed winner, uint256 prizeTokenId);
    event LotteryClosed(uint256 indexed lotteryId);
    event PrizeAdded(uint256 indexed lotteryId, uint256 tokenId);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        address couponNFTAddress,
        address initialOwner
    ) VRFConsumerBaseV2(vrfCoordinatorV2) Ownable(initialOwner) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        couponNFT = CouponNFT(couponNFTAddress);
        _lotteryIdCounter = 1;
    }

    /**
     * @dev Create a new lottery
     */
    function createLottery(
        string memory name,
        string memory description,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        require(startTime >= block.timestamp, "Start time cannot be in the past");
        require(endTime > startTime, "End time must be after start time");
        require(bytes(name).length > 0, "Name cannot be empty");

        uint256 lotteryId = _lotteryIdCounter;
        _lotteryIdCounter++;

        Lottery storage lottery = lotteries[lotteryId];
        lottery.id = lotteryId;
        lottery.name = name;
        lottery.description = description;
        lottery.entryFee = entryFee;
        lottery.totalPrizes = 0;
        lottery.remainingPrizes = 0;
        lottery.startTime = startTime;
        lottery.endTime = endTime;
        lottery.state = LotteryState.OPEN;

        emit LotteryCreated(lotteryId, name, entryFee, 0, startTime, endTime);
        return lotteryId;
    }

    /**
     * @dev Add NFT prizes to a lottery
     */
    function addPrizes(uint256 lotteryId, uint256[] memory tokenIds) external onlyOwner {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.id != 0, "Lottery does not exist");
        require(lottery.state == LotteryState.OPEN, "Lottery is not open");
        require(block.timestamp < lottery.startTime, "Cannot add prizes after lottery starts");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(couponNFT.ownerOf(tokenId) == address(this), "Contract must own the NFT");
            require(couponNFT.isCouponValid(tokenId), "Invalid coupon NFT");
            
            lottery.prizeTokenIds.push(tokenId);
            lottery.totalPrizes++;
            lottery.remainingPrizes++;
            
            emit PrizeAdded(lotteryId, tokenId);
        }
    }

    /**
     * @dev Enter a lottery
     */
    function enterLottery(uint256 lotteryId, uint256 entries) external payable nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.id != 0, "Lottery does not exist");
        require(lottery.state == LotteryState.OPEN, "Lottery is not open");
        require(block.timestamp >= lottery.startTime, "Lottery has not started");
        require(block.timestamp <= lottery.endTime, "Lottery has ended");
        require(lottery.remainingPrizes > 0, "No prizes remaining");
        require(entries > 0, "Must enter at least once");
        require(msg.value == lottery.entryFee * entries, "Incorrect entry fee");

        // Add participant if first time entering
        if (lottery.participantEntries[msg.sender] == 0) {
            lottery.participants.push(msg.sender);
        }

        lottery.participantEntries[msg.sender] += entries;

        emit LotteryEntered(lotteryId, msg.sender, entries);
    }

    /**
     * @dev Draw a winner for the lottery
     */
    function drawWinner(uint256 lotteryId) external onlyOwner {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.id != 0, "Lottery does not exist");
        require(lottery.state == LotteryState.OPEN, "Lottery is not open");
        require(block.timestamp > lottery.endTime, "Lottery has not ended");
        require(lottery.participants.length > 0, "No participants");
        require(lottery.remainingPrizes > 0, "No prizes remaining");

        lottery.state = LotteryState.CALCULATING;

        // Request random number from Chainlink VRF
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        lottery.vrfRequestId = requestId;
        vrfRequestToLotteryId[requestId] = lotteryId;

        emit LotteryDrawStarted(lotteryId, requestId);
    }

    /**
     * @dev Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 lotteryId = vrfRequestToLotteryId[requestId];
        Lottery storage lottery = lotteries[lotteryId];

        require(lottery.state == LotteryState.CALCULATING, "Lottery not in calculating state");

        // Calculate total entries
        uint256 totalEntries = 0;
        for (uint256 i = 0; i < lottery.participants.length; i++) {
            totalEntries += lottery.participantEntries[lottery.participants[i]];
        }

        // Select winner based on weighted random selection
        uint256 randomNumber = randomWords[0] % totalEntries;
        address winner = _selectWinner(lottery, randomNumber);

        // Award prize
        uint256 prizeIndex = lottery.totalPrizes - lottery.remainingPrizes;
        uint256 prizeTokenId = lottery.prizeTokenIds[prizeIndex];
        
        // Transfer NFT to winner
        couponNFT.transferFrom(address(this), winner, prizeTokenId);
        
        lottery.remainingPrizes--;

        emit LotteryWinner(lotteryId, winner, prizeTokenId);

        // Check if lottery should continue or close
        if (lottery.remainingPrizes == 0) {
            lottery.state = LotteryState.CLOSED;
            emit LotteryClosed(lotteryId);
        } else {
            lottery.state = LotteryState.OPEN;
        }
    }

    /**
     * @dev Select winner based on weighted entries
     */
    function _selectWinner(Lottery storage lottery, uint256 randomNumber) private view returns (address) {
        uint256 currentSum = 0;
        
        for (uint256 i = 0; i < lottery.participants.length; i++) {
            address participant = lottery.participants[i];
            currentSum += lottery.participantEntries[participant];
            
            if (randomNumber < currentSum) {
                return participant;
            }
        }
        
        // Fallback (should never reach here)
        return lottery.participants[lottery.participants.length - 1];
    }

    /**
     * @dev Close a lottery manually
     */
    function closeLottery(uint256 lotteryId) external onlyOwner {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.id != 0, "Lottery does not exist");
        require(lottery.state != LotteryState.CLOSED, "Lottery already closed");

        lottery.state = LotteryState.CLOSED;
        emit LotteryClosed(lotteryId);
    }

    /**
     * @dev Get lottery information
     */
    function getLotteryInfo(uint256 lotteryId) external view returns (LotteryInfo memory) {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.id != 0, "Lottery does not exist");

        return LotteryInfo({
            id: lottery.id,
            name: lottery.name,
            description: lottery.description,
            entryFee: lottery.entryFee,
            totalPrizes: lottery.totalPrizes,
            remainingPrizes: lottery.remainingPrizes,
            startTime: lottery.startTime,
            endTime: lottery.endTime,
            state: lottery.state,
            participantCount: lottery.participants.length
        });
    }

    /**
     * @dev Get participant entries for a lottery
     */
    function getParticipantEntries(uint256 lotteryId, address participant) external view returns (uint256) {
        return lotteries[lotteryId].participantEntries[participant];
    }

    /**
     * @dev Get all participants for a lottery
     */
    function getLotteryParticipants(uint256 lotteryId) external view returns (address[] memory) {
        return lotteries[lotteryId].participants;
    }

    /**
     * @dev Get prize token IDs for a lottery
     */
    function getLotteryPrizes(uint256 lotteryId) external view returns (uint256[] memory) {
        return lotteries[lotteryId].prizeTokenIds;
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get total number of lotteries created
     */
    function getTotalLotteries() external view returns (uint256) {
        return _lotteryIdCounter - 1;
    }

    /**
     * @dev Emergency function to recover stuck NFTs
     */
    function emergencyRecoverNFT(uint256 tokenId, address to) external onlyOwner {
        require(to != address(0), "Cannot recover to zero address");
        couponNFT.transferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Handle the receipt of an NFT
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}