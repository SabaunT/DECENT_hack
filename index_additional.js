//Main prerequisites
const dcorejs = require('./node_modules/dcorejs');
const config = {
    dcoreNetworkWSPaths: ['wss://hackathon2.decent.ch:8090'],
    chainId: '9c54faed15d4089d3546ac5eb0f1392434a970be15f1452ce1e7764f70f02936'
};

/** 
 * Storage like objects
*/
let storage = {};
let entities = {};


/**
 * Initialization
 */
dcorejs.initialize(config);


/** 
 * Opening connection
 * @returns {Promise} resolve or reject methods return
*/
async function connection() {
    return await dcorejs.connection().openConnection();
}


/** 
 * Getting an account info by project name
 * @returns {Promise} resolve or reject methods return
*/
async function getProjectDataByName(projectName) {
    let projectData = await dcorejs.account().getAccountByName(projectName);
    return projectData;
}


/**
 * Registers entities like investors or projects
 * @param {string} accName wallet account name
 * @param {string} password 
 * @param {string} privateKey wallet private key
 * @param {boolean} investorType if true, registers an investor, otherwise registers a project
 * @param {string} id a string of a number
 * @param {number} capAmount 
 * @returns {bool} true if success, false if account exists
 */
function registerEntity(accName, password, privateKey, investorType, id, capAmount = 0) {
    if (_checkEntity()) {
        console.error('There is already such account');
        return false;}
    if (investorType == true) {
        entities[accName] = new AccountInvestor(accName, privateKey, id);
    } else {
        entities[accName] = new AccountProject(accName, privateKey, id,  capAmount);
    }
    storage[accName] = password;
    return true;
}


/**
 * Private. Checks entity in storage
 * @param {string} accName wallet account name
 * @returns {boolean} true if account exists
 */
function _checkEntity(accName) {
    if (accName in storage){
        return true;
    }
}

/**
 * Private. Checks password
 * @param {string} accName wallet account name
 * @param {string} password 
 * @returns {boolean} true. Returns false if the password is not the right one
 */
function _checkPassword(accName, password) {
    if (storage[accName] != password) {
        return false;
    }
    return true;
}


/**
 * Private. Gives access to the object management
 * @param {string} accName wallet account name
 * @param {string} password
 * @returns {object} an object of investor or project
 */
function _enterAcc(accName, password) {
    if (!_checkEntity(accName) && _checkPassword(accName, password)) {
        return entities[accName];
    }
}


/**
 * An object of investor account. Used for account management.
 */
class AccountInvestor {
    /**
     * Constructor. Defines main attributes
     * @param {string} userName same with account name
     * @param {string} privateKey investors private key
     * @param {string} id account id
     */
    constructor(userName, privateKey, id) {
        this.user = userName;
        this.privateKey = privateKey;
        this.id = id;
    };
    
    /**
     * Async sending method. Uses DECENT platform sdk - method
     * @param {number} amount sending amount
     * @param {string} assetID id of an asset
     * @param {string} accName investors account name
     * @param {string} toName project name
     * @param {string} message message
     */
    async sendAmount(amount, assetID, accName, toName, message) {
        return await dcorejs.account().transfer(
            amount,
            assetID,
            accName,
            toName,
            message,
            this.privateKey,
            true);
    }
    
    definePrivateKey(newPrivate) {
        this.privateKey = string(newPrivate);
    }
}


//A project object&methods НЕ ЗАКОНЧЕН
class AccountProject {
    constructor(accName, privateKey, id, capAmount) {
        this.projectName = accName;
        this.privateKey = privateKey;
        this.id = id;
        this.cap = capAmount;    
    }

    async currentCap(assetID) {
        return await dcorejs.account().getBalance(this.id, assetID, false);        
    }
}


//Funding method
function _fundTheProject(accName, password, amount, assetID, toName, message, cb) {
    try {
        var investMethod = _enterAcc(accName, password);
        (async function() {
            let result = await investMethod.sendAmount(
                amount,
                assetID,
                accName,
                console.log((await getProjectDataByName(toName)).options.memo_key),
                message                
            );
            cb(result);
        })();
    } catch(error) {
        console.log(error);
    }
}


//Secure funding method:
async function fundTheProjectChecked(accName, password, amount, assetID, toName, message) {
    try {
        var capCheck = entities[toName];
        if ((await capCheck.currentCap(assetID)) < capCheck.cap) {
            _fundTheProject(accName, password, amount, assetID, toName, message, function(result) {
                console.log(result);
            });
        } 
    } catch (error) {
        console.log(error);
    }
}

