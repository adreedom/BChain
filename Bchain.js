'use strict';
const shim = require('fabric-shim');
const util = require('util');

class Client{
  constructor(Name,ClientID,clientType,SkAccountNumber,Currency,Asset){
      this.Name=Name;
      this.ClientID=ClientID;
      this.clientType=clientType;
      this.SkAccountNumber=SkAccountNumber;
      this.Currency=Currency;
      this.Asset=Asset;
      this.Status="active";985B32676EB9A4B9ED0B5D03907065D788E265387C7563C7BFA436DCEC5CEFB0
  }
}

class Asset{
	constructor(AssetName,AssetID,AssetAmount){
      this.AssetName=AssetName;
      this.AssetID=AssetID;
      this.AssetAmount=AssetAmount;
      }	
}

class Transaction{
	constructor(TsID,CF,CT,Asset,TimeStamp){
      this.TsID=TsID;
      this.CF=CF;
      this.CT=CT;
      this.Asset=Asset;
      this.TimeStamp=TimeStamp
  }
}

let Chaincode = class {
  async Init(stub) {
    console.info('=========== Instantiated fabcar chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async queryClientInfo(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting CarNumber ex: CAR01');
    }
    let carNumber = args[0];

    let carAsBytes = await stub.getState(carNumber); //get the car from chaincode state
    if (!carAsBytes || carAsBytes.toString().length <= 0) {
      throw new Error(carNumber + ' does not exist: ');
    }
    console.log(carAsBytes.toString());
    return carAsBytes;
  }

  async initLedger(stub, args) {
    console.info('============= START : Initialize Ledger ===========');
    let cars = [];
	  let asset1=[];
    asset1.push(new Asset("ATVI","A1",2500));
    asset1.push(new Asset("BABA","A2",2500));
    asset1.push(new Asset("JD","A3",2500));
    asset1.push(new Asset("AMD","A4",2500));
	  asset1.push(new Asset("INTEL","A5",2500));
    cars.push(new Client("CITI ADMINISTRATION","AD000001","Admin","USD","348912452",asset1));

    let asset2=[];
    asset2.push(new Asset("ATVI","A1",1500));
    asset2.push(new Asset("BABA","A2",1500));
    asset2.push(new Asset("JD","A3",1500));
    asset2.push(new Asset("AMD","A4",1500));
	  asset2.push(new Asset("INTEL","A5",1500));
    cars.push(new Client("THE GREENWALL FOUNDATION","20180001","Regular","USD","348912975",asset2));
	
	  let asset3=[];
    asset3.push(new Asset("ATVI","A1",500));
    asset3.push(new Asset("BABA","A2",500));
    asset3.push(new Asset("JD","A3",500));
    asset3.push(new Asset("AMD","A4",500));
	  asset3.push(new Asset("INTEL","A5",500));
    cars.push(new Client("SOLAR CAPITAL LTD","20180002","Regular","USD","348912325",asset3));

	  let asset4=[];
    asset4.push(new Asset("ATVI","A1",1500));
    asset4.push(new Asset("BABA","A2",2500));
    asset4.push(new Asset("JD","A3",3500));
    cars.push(new Client("PFPC-DFA FUNDS-IRISH","20180003","Regular","USD","348912345",asset4));

    let asset5=[];
    asset5.push(new Asset("AMD","A4",3500));
    asset5.push(new Asset("INTEL","A5",5500));
    cars.push(new Client("ORBIS GROUP","20180004","Regular","USD","348912790",asset5));
    for (let i = 0; i < cars.length; i++) {
      await stub.putState('CLIENT' + i, Buffer.from(JSON.stringify(cars[i])));
      console.info('Added <--> ', cars[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createClient(stub, args) {
    console.info('============= START : Create Car ===========');
    if (args.length != 7) {
      throw new Error('Incorrect number of arguments. Expecting 7');
    }

    var client = new Client(args[1],args[2],args[3],args[4],args[5],args[6]);

    await stub.putState(args[0], Buffer.from(JSON.stringify(client)));
    console.info('============= END : Create Car ===========');
  }

  async queryAllAsset(stub, args) {

    let startKey = 'CLIENT0';
    let endKey = 'CLIENT999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toStringAssetID('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

  async doInnerTransaction(stub, args) {
    //CF client key//CT //Asset ID/Amount
    if (args.length != 4) {
      throw new Error('Incorrect number of arguments:'+args.length+'. Expecting 4:[BankIDFrom,BankIDTo,AssetName,AssetAmount]');
    }
    let startKey = 'TRANC1';
	  let endKey = 'TRANC999';
	  let iterator = await stub.getStateByRange(startKey, endKey);
    let count=1;
	  while (true) {
     let res = await iterator.next();
     if (res.value && res.value.value.toString()) {
        count=parseInt(count)+1;
     }
     else{
       break;
     }
    }
    let transaction_id='TRANC'+count;

    let bankFAsBytes = await stub.getState(args[0]);
    let bankTAsBytes = await stub.getState(args[1]);
    let bankF = JSON.parse(bankFAsBytes);
    let bankT = JSON.parse(bankTAsBytes);
    let asset_amount_from=0;
    var asset_from;
    let asset_exist_in_to=false;
    for(var asset in bankF.Asset){
     if(bankF.Asset[asset].AssetID==args[2] && parseFloat(bankF.Asset[asset].AssetAmount)>= parseFloat(args[3])){
      asset_amount_from=bankF.Asset[asset].AssetAmount;
      asset_from=bankF.Asset[asset];
      bankF.Asset[asset].AssetAmount=parseFloat(bankF.Asset[asset].AssetAmount) - parseFloat(args[3]);
     }
    }
    if(asset_amount_from==0 || parseFloat(asset_amount_from) < parseFloat(args[3])){
     throw new Error('Incorrect number of arguments. Expecting Correct Asset'+asset_amount_from);
    }
    else{
     for(var asset_to in bankT.Asset){
      if(bankT.Asset[asset_to].AssetID==args[2]){
        bankT.Asset[asset_to].AssetAmount=parseFloat(bankT.Asset[asset_to].AssetAmount) + parseFloat(args[3]);
        asset_exist_in_to=true;
      }
     }
     if(!asset_exist_in_to){
      bankT.Asset.push(new Asset(asset_from.AssetName,asset_from.AssetID,args[3]));
     }
     // registre transaction
     await stub.putState(args[0], Buffer.from(JSON.stringify(bankF)));
     await stub.putState(args[1], Buffer.from(JSON.stringify(bankT)));
     await stub.putState(transaction_id, Buffer.from(JSON.stringify( new Transaction(transaction_id,args[0],args[1],new Asset(asset_from.AssetName,asset_from.AssetID,args[3]),new Date()))));
    }
    console.info('============= END : changeCarowner ===========');
  }

  async changeClientStatus(stub, args) {
    console.info('============= START : changeCarowner ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let carAsBytes = await stub.getState(args[0]);
    let car = JSON.parse(carAsBytes);
    car.Status = args[1];

    await stub.putState(args[0], Buffer.from(JSON.stringify(car)));
    console.info('============= END : changeCarowner ===========');
  }

  async queryTransactions(stub, args) {
    console.info('============= START : queryTransactions ===========');
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting ID like :CLIENT0');
    }
    let findall=false;
    if(args[0]=="ALL"){
      findall=true;
    }
	  let startKey = 'TRANC1';
	  let endKey = 'TRANC999';
	  let iterator = await stub.getStateByRange(startKey, endKey);
	  let allResults = [];
	  while (true) {
		  let res = await iterator.next();
		  if (res.value && res.value.value.toString()) {
			let jsonRes = {};
			console.log(res.value.value.toString('utf8'));

			jsonRes.TransactionID = res.value.key;
			try {
			  jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
			} catch (err) {
			  console.log(err);
			  jsonRes.Record = res.value.value.toString('utf8');
			}
			if(findall || jsonRes.Record.CF==args[0] || jsonRes.Record.CT==args[0]){
                 allResults.push(jsonRes);
			  }
		  }
		  if (res.done) {
			console.log('end of data');
			await iterator.close();
			console.info(allResults);
			return Buffer.from(JSON.stringify(allResults));
		  }
	  }
  }
};

shim.start(new Chaincode());
