// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LooneySwap{
    using SafeMath for uint256;

    struct LQProvision {
        uint idx;       //index in the array in LPBalances mapping
        uint LPidx;     //index in the LQProviders array
        address owner;
        address token;
        uint amount;
    }

    //user address mapping to [token address mapping to LQProvision]
    mapping(address => LQProvision[]) public LPBalances;

    //holds all available liquidity provisions
    address[] LQProviders;

    function isLP(address LPAddress) private view returns(bool isIndeed) {
        return LQProviders[LPBalances[LPAddress][0].LPidx] == LPAddress;
    }

    function addLiquidity(address tokenAddress, uint amount) external {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        if(LPBalances[msg.sender][0].owner == address(0)) {
            LQProviders.push(msg.sender);
            LPBalances[msg.sender].push(LQProvision(0, LQProviders.length-1, msg.sender, tokenAddress, amount));
        } else {
            bool added = false;
            for (uint i = 0; i < LPBalances[msg.sender].length; i++) {
                if(LPBalances[msg.sender][i].token == tokenAddress) {
                    LPBalances[msg.sender][i].amount.add(amount);
                    added = true;
                }
                if(!added) {
                    LPBalances[msg.sender].push(LQProvision(LPBalances[msg.sender].length-1, LQProviders.length-1, msg.sender, tokenAddress, amount));
                }
            }
        }
    }

    function withdrawLiquidity(address tokenAddress, uint amount) external {
        bool found = false;
        for (uint i = 0; i < LPBalances[msg.sender].length; i++) {
            if(LPBalances[msg.sender][i].token == tokenAddress) {
                found = true;
                if(LPBalances[msg.sender][i].amount < amount) {
                    revert();
                }
                LPBalances[msg.sender][i].amount.sub(amount);
                if(LPBalances[msg.sender][i].amount == 0) {
                    deleteLQProvision(msg.sender, tokenAddress);
                }
                IERC20(LPBalances[msg.sender][i].token).transfer(msg.sender, amount);
            }
        }
        if(!found) revert();
    }

    function looneySwap(address tokenAddress, uint amount) external {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        uint randAddress = random() % LQProviders.length;
        uint randToken = random() % LPBalances[LQProviders[randAddress]].length;
        address tokenToTransfer = LPBalances[LQProviders[randAddress]][randToken].token;
        uint amountToTransfer = LPBalances[LQProviders[randAddress]][randToken].amount;
        LPBalances[LQProviders[randAddress]][randToken].token = tokenAddress;
        LPBalances[LQProviders[randAddress]][randToken].amount = amount;
        IERC20(tokenToTransfer).transfer(msg.sender, amountToTransfer);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, LQProviders)));
    }

    //call this function when a user withdraws liquidity for a given token
    function deleteLQProvision(address LPAddress, address tokenAddress) private returns(bool success) {
        require(isLP(LPAddress));
        require(LPBalances[LPAddress].length > 0);
        if(LPBalances[LPAddress].length == 1) {
            if(LPBalances[LPAddress][0].token == tokenAddress) {
                deleteLQProvider(LPAddress);
                LPBalances[LPAddress].pop();
                delete LPBalances[LPAddress];
                return true;
            } else {
                revert();
            }
        }
        uint toDelete = 0;
        bool found = false;
        for (uint i = 0; i < LPBalances[LPAddress].length; i++) {
            if (LPBalances[LPAddress][i].token == tokenAddress) {
                toDelete = LPBalances[LPAddress][i].idx;
                found = true;
            }
        }
        if(!found) revert();
        LQProvision memory toMove = LPBalances[LPAddress][LPBalances[LPAddress].length-1];
        LPBalances[LPAddress][toDelete] = toMove;
        return true;
    }

    //this function should only be called by deleteLQProvision. if the last LQProvision is withdrawn
    //for a given LQProvider then deleteLQProvider will be called.
    function deleteLQProvider(address LPAddress) private returns(bool success) {
        require(isLP(LPAddress));
        uint toDelete = LPBalances[LPAddress][0].LPidx;
        address toMove = LQProviders[LQProviders.length-1];
        LQProviders[toDelete] = toMove;
        for (uint i = 0; i < LPBalances[toMove].length; i++) {
            LPBalances[toMove][i].LPidx = toDelete;
        }
        LQProviders.pop();
        return true;
    }
}