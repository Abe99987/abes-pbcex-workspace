// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract PriceFeedConsumer {
    AggregatorV3Interface public immutable dataFeed;

    constructor(address aggregatorProxy) {
        require(aggregatorProxy != address(0), "invalid feed");
        dataFeed = AggregatorV3Interface(aggregatorProxy);
    }

    function latest() external view returns (
        int256 answer,
        uint8 decimals,
        uint80 roundId,
        uint256 updatedAt
    ) {
        (uint80 _roundId, int256 _answer, , uint256 _updatedAt, uint80 _answeredInRound) = dataFeed.latestRoundData();
        require(_answer > 0, "no price");
        require(_answeredInRound >= _roundId, "stale round");
        require(_updatedAt != 0, "no timestamp");
        return (_answer, dataFeed.decimals(), _roundId, _updatedAt);
    }
}
