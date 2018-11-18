const dcorejs = require('./node_modules/dcorejs');
const config = {
    dcoreNetworkWSPaths: ['wss://hackathon2.decent.ch:8090'],
    chainId: '9c54faed15d4089d3546ac5eb0f1392434a970be15f1452ce1e7764f70f02936'
};

//Objects where account informations is stored: logins, passwords, account managing objects
let storage = {};
let entities = {};


//Initialization
dcorejs.initialize(config);


//Opening connection
async function connection() {
    return await dcorejs.connection().openConnection()
};


//Getting an account info by project name. Using the function to get projects address
async function getProjectDataByName(projectName) {
    let projectData = await dcorejs.account().getAccountByName(projectName);
    return projectData
};


//Registers investors and projects, add their info to the storage
function registerEntity(accName, password, privateKey, investorType, capAmount = 0) {
    if (_checkEntity(accName)) {
        console.error('There is already such account');
        return false;}
    if (investorType == true) {
        entities[accName] = new AccountInvestor(accName, privateKey);
    } else {
        entities[accName] = new AccountProject(accName, privateKey, capAmount);
    };
    storage[accName] = password;
    return true;
};

//Private. checks if an entity exists
function _checkEntity(accName) {
    if (accName in storage){
        return true;
    };

};


//Private. checks if the passwors suits the account
function _checkPassword(accName, password) {
    if (storage[accName] != password) {
        return false;
    };

    return true;
};


//Private.Allows using entity objects
function _enterAcc(accName, password) {
    if (!_checkEntity(accName) && _checkPassword(accName, password)) {
        return entities[accName]
    };
};


//An investor object&methods
class AccountInvestor {
    constructor(userName, privateKey) {
        this.user = userName;
        this.privateKey = privateKey;
    };
    
    async sendAmount(amount, assetID, accName, toName, message) {
        return await dcorejs.account().transfer(
            amount,
            assetID,
            accName,
            toName,
            message,
            this.privateKey,
            true)
    };
    
    definePrivateKey(newPrivate) {
        this.privateKey = string(newPrivate);
    };
};


//A project object&methods 
class AccountProject {
    constructor(accName, privateKey, capAmount) {
        this.projectName = accName;
        this.privateKey = privateKey;
        this.cap = capAmount;    
    };

    init() {
        //pass
    }


}


//Funding method
function fundTheProject(accName, password, amount, assetID, toName, message, cb) {
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
            cb(result)
        })();
    } catch(error) {
        console.log(error);
    };
};

