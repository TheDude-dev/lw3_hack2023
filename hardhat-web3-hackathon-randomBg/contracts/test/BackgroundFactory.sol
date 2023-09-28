// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

/*
 * @title A Random BackgroundFactory
 * @author Bonheur Balek's AKA The Dude
 * @notice This contract is for creating an untamperable random background generator for our web2 Game
 * @dev This implements Chainlink VRF v2 and Chainlink Keepers
 */

error BackgroundFactory__NotOpen();
error BackgroundFactory__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 backgroundFactoryState
);
error BackgroundFactory__TransferFailed();
error BackgroundFactory__NotOWner();

contract BackgroundFactory is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Types */
    enum BackgroundFactoryState {
        OPEN,
        CREATING
    }
    struct Background {
        string name;
        uint256 dna;
    }

    /* State variable */
    Background[] public s_backgrounds;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 private constant DNADIGITS = 16;
    uint256 private constant DNAMODULUS = 10 ** DNADIGITS;

    /* Factory variables */
    uint256 private s_recentRandomDna;
    BackgroundFactoryState private s_backgroundFactoryState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;
    address private s_playerAddress;
    address private immutable i_owner;
    address private s_recentWinner;

    /* Events */
    event NewBackground(uint256 indexed backgroundId, string indexed name, uint256 indexed dna);
    event RequestedRandomWord(uint256 indexed requestId);
    event WinnerPicked(address indexed winnerpicked);
    event GameEnter(address indexed player);

    /* Modifiers */
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert BackgroundFactory__NotOWner();
        }
        _;
    }

    /* functions */

    constructor(
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_owner = msg.sender;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_backgroundFactoryState = BackgroundFactoryState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    // The contract will need to have a balance
    receive() external payable {}

    fallback() external payable {}

    /* Main functions */

    // private function to create our background and emit an event
    function enterGame(address _s_playerAddress) public {
        if (s_backgroundFactoryState != BackgroundFactoryState.OPEN) {
            revert BackgroundFactory__NotOpen();
        }
        if (s_players.length >= 3) {
            revert BackgroundFactory__NotOpen();
        }
        s_players.push(payable(_s_playerAddress));
        emit GameEnter(_s_playerAddress);
    }

    function payGamer(address _s_recentWinner) public payable onlyOwner {
        (bool success, ) = _s_recentWinner.call{value: msg.value}("");
        if (!success) {
            revert BackgroundFactory__TransferFailed();
        }
    }

    function _createBackground(string memory _name, uint256 _dna) private {
        s_backgrounds.push(Background(_name, _dna));
        uint256 id = s_backgrounds.length - 1;
        emit NewBackground(id, _name, _dna);
    }

    // Generates randomness for our background
    function _generateRandomBackground(string memory _str) private pure returns (uint256) {
        // Using keccak256 (not so safe but we don't really have to worry about someone trying to hack our game right 🧐?)
        uint256 rand = uint256(keccak256(abi.encodePacked(_str)));
        return rand % DNAMODULUS;
    }

    function createRandomBackground(string memory _name) public {
        if (s_backgroundFactoryState != BackgroundFactoryState.OPEN) {
            revert BackgroundFactory__NotOpen();
        }
        uint256 randDna = _generateRandomBackground(_name);
        _createBackground(_name, randDna);
    }

    /**
     * @dev This is the function that the Chainlink keeper nodes call
     * they look for the `upkeepNeeded` to return true.
     * The following should be true in order to return true:
     * 1. Our time interval should have passed
     * 2. has at least one player and the balance is not zero
     * 2. Our subscription is funded with LINK
     * 3. The Factory should be in an "open" state.
     */

    function checkUpkeep(
        bytes memory /* checkData */
    ) public override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = (BackgroundFactoryState.OPEN == s_backgroundFactoryState);
        // (block.timeStamp - last block timeStamp) > interval
        bool timePassed = (block.timestamp - s_lastTimeStamp > i_interval);
        bool hasPlayers = (s_players.length >= 3);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert BackgroundFactory__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_backgroundFactoryState)
            );
        }
        // request the random number
        //Once we get it, do smth with it
        // 2 transaction process
        s_backgroundFactoryState = BackgroundFactoryState.CREATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRandomWord(requestId);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexedOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexedOfWinner];
        s_recentWinner = recentWinner;
        s_backgroundFactoryState = BackgroundFactoryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        emit WinnerPicked(recentWinner);
    }

    /* View / Pure functions */

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getBackgroundFactoryState() public view returns (BackgroundFactoryState) {
        return s_backgroundFactoryState;
    }

    function getNumwords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfBackgrounds() public view returns (uint256) {
        return s_backgrounds.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
}
