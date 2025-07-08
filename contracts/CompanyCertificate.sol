// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CompanyCertificate is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct Certificate {
        uint256 tokenId;
        address recipient;
        string recipientName;
        string courseName;
        string ipfsHash;
        uint256 issueDate;
        bool isPublic;
        bool isSoulbound; // SBT functionality
    }
    
    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public recipientCertificates;
    mapping(string => bool) public usedHashes;
    
    uint256[] public publicCertificates;
    
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string recipientName,
        string courseName,
        string ipfsHash,
        bool isPublic,
        bool isSoulbound
    );
    
    event CertificateVisibilityChanged(
        uint256 indexed tokenId,
        bool isPublic
    );
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) ERC721(_name, _symbol) {
        _transferOwnership(_owner);
    }
    
    function issueCertificate(
        address _recipient,
        string memory _recipientName,
        string memory _courseName,
        string memory _ipfsHash,
        bool _isPublic,
        bool _isSoulbound
    ) external onlyOwner returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_recipientName).length > 0, "Recipient name required");
        require(bytes(_courseName).length > 0, "Course name required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(!usedHashes[_ipfsHash], "IPFS hash already used");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, _ipfsHash);
        
        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            recipient: _recipient,
            recipientName: _recipientName,
            courseName: _courseName,
            ipfsHash: _ipfsHash,
            issueDate: block.timestamp,
            isPublic: _isPublic,
            isSoulbound: _isSoulbound
        });
        
        recipientCertificates[_recipient].push(tokenId);
        usedHashes[_ipfsHash] = true;
        
        if (_isPublic) {
            publicCertificates.push(tokenId);
        }
        
        emit CertificateIssued(
            tokenId,
            _recipient,
            _recipientName,
            _courseName,
            _ipfsHash,
            _isPublic,
            _isSoulbound
        );
        
        return tokenId;
    }
    
    function getCertificate(uint256 _tokenId) external view returns (Certificate memory) {
        require(_exists(_tokenId), "Certificate does not exist");
        return certificates[_tokenId];
    }
    
    function getRecipientCertificates(address _recipient) external view returns (uint256[] memory) {
        return recipientCertificates[_recipient];
    }
    
    function getPublicCertificates() external view returns (uint256[] memory) {
        return publicCertificates;
    }
    
    function toggleCertificateVisibility(uint256 _tokenId) external {
        require(_exists(_tokenId), "Certificate does not exist");
        require(
            ownerOf(_tokenId) == msg.sender || owner() == msg.sender,
            "Not authorized"
        );
        
        Certificate storage cert = certificates[_tokenId];
        cert.isPublic = !cert.isPublic;
        
        if (cert.isPublic) {
            publicCertificates.push(_tokenId);
        } else {
            // Remove from public certificates
            for (uint256 i = 0; i < publicCertificates.length; i++) {
                if (publicCertificates[i] == _tokenId) {
                    publicCertificates[i] = publicCertificates[publicCertificates.length - 1];
                    publicCertificates.pop();
                    break;
                }
            }
        }
        
        emit CertificateVisibilityChanged(_tokenId, cert.isPublic);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Override transfer functions for Soulbound tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        if (from != address(0) && to != address(0)) {
            require(!certificates[tokenId].isSoulbound, "Soulbound token cannot be transferred");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function approve(address to, uint256 tokenId) public override {
        require(!certificates[tokenId].isSoulbound, "Soulbound token cannot be approved");
        super.approve(to, tokenId);
    }
    
    function setApprovalForAll(address operator, bool approved) public override {
        // Allow setting approval for all, but individual transfers will be blocked for SBTs
        super.setApprovalForAll(operator, approved);
    }
    
    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}