// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CompanyCertificate.sol";

contract CertificateFactory {
    struct Company {
        address owner;
        address contractAddress;
        string name;
        string description;
        uint256 createdAt;
        bool isActive;
    }
    
    mapping(address => Company) public companies;
    mapping(address => address) public ownerToContract;
    address[] public deployedContracts;
    
    event CompanyRegistered(
        address indexed owner,
        address indexed contractAddress,
        string name
    );
    
    event CompanyUpdated(
        address indexed owner,
        string name,
        string description
    );
    
    modifier onlyCompanyOwner() {
        require(companies[msg.sender].owner == msg.sender, "Not company owner");
        _;
    }
    
    function registerCompany(
        string memory _name,
        string memory _description,
        string memory _symbol
    ) external {
        require(companies[msg.sender].owner == address(0), "Company already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Deploy new certificate contract for the company
        CompanyCertificate newContract = new CompanyCertificate(
            _name,
            _symbol,
            msg.sender
        );
        
        address contractAddress = address(newContract);
        
        companies[msg.sender] = Company({
            owner: msg.sender,
            contractAddress: contractAddress,
            name: _name,
            description: _description,
            createdAt: block.timestamp,
            isActive: true
        });
        
        ownerToContract[msg.sender] = contractAddress;
        deployedContracts.push(contractAddress);
        
        emit CompanyRegistered(msg.sender, contractAddress, _name);
    }
    
    function updateCompany(
        string memory _name,
        string memory _description
    ) external onlyCompanyOwner {
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        companies[msg.sender].name = _name;
        companies[msg.sender].description = _description;
        
        emit CompanyUpdated(msg.sender, _name, _description);
    }
    
    function getCompany(address _owner) external view returns (Company memory) {
        return companies[_owner];
    }
    
    function getCompanyContract(address _owner) external view returns (address) {
        return ownerToContract[_owner];
    }
    
    function getAllContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
    
    function getContractCount() external view returns (uint256) {
        return deployedContracts.length;
    }
    
    function deactivateCompany() external onlyCompanyOwner {
        companies[msg.sender].isActive = false;
    }
    
    function reactivateCompany() external onlyCompanyOwner {
        companies[msg.sender].isActive = true;
    }
}