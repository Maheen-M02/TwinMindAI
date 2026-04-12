// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MaintenanceLedger — immutable on-chain log for TwinMind AI
contract MaintenanceLedger {
    struct FailureEvent {
        uint256 timestamp;
        string  machineId;
        string  severity;
        uint256 failureProbBps;   // basis points: 10000 = 100%
        uint256 predictedRUL;
        bytes32 dataHash;
        bool    resolved;
    }

    FailureEvent[] public events;

    event MaintenanceAlert(
        uint256 indexed eventId,
        string  machineId,
        string  severity,
        uint256 failureProbBps,
        uint256 predictedRUL,
        bytes32 dataHash
    );

    event EventResolved(uint256 indexed eventId, string machineId);

    function logFailure(
        string  calldata machineId,
        string  calldata severity,
        uint256 failureProbBps,
        uint256 predictedRUL,
        bytes32 dataHash
    ) external returns (uint256 eventId) {
        eventId = events.length;
        events.push(FailureEvent({
            timestamp:      block.timestamp,
            machineId:      machineId,
            severity:       severity,
            failureProbBps: failureProbBps,
            predictedRUL:   predictedRUL,
            dataHash:       dataHash,
            resolved:       false
        }));
        emit MaintenanceAlert(eventId, machineId, severity, failureProbBps, predictedRUL, dataHash);
    }

    function resolveEvent(uint256 eventId) external {
        require(eventId < events.length, "Event does not exist");
        require(!events[eventId].resolved, "Already resolved");
        events[eventId].resolved = true;
        emit EventResolved(eventId, events[eventId].machineId);
    }

    function getEventsCount() external view returns (uint256) {
        return events.length;
    }

    function getEvent(uint256 eventId) external view returns (
        uint256 timestamp,
        string memory machineId,
        string memory severity,
        uint256 failureProbBps,
        uint256 predictedRUL,
        bytes32 dataHash,
        bool resolved
    ) {
        require(eventId < events.length, "Event does not exist");
        FailureEvent storage ev = events[eventId];
        return (ev.timestamp, ev.machineId, ev.severity, ev.failureProbBps, ev.predictedRUL, ev.dataHash, ev.resolved);
    }
}
