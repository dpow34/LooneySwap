// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// may need to remove "../node_modules/" before compilation and migration
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Aave is ERC20 {
    constructor() ERC20("Aave", "AAVE") public {
        _mint(msg.sender, 1000);
    }
}