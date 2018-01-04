'use strict';
const shim = require('fabric-shim');
const util = require('util');

class Client{
  constructor(Name,ClientID,Asset){
      this.Name=Name;
      this.ClientID=ClientID;
      this.Asset=Asset;
      this.Status="active";
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
	constructor(TsID,CF,CT,Asset){
      this.TsID=TsID;
      this.CF=CF;
      this.CT=CT;
      this.Asset=Asset;
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
    cars.push(new Client("ZHANG Ziyu","72472ADC-6196-4BF8-A307-18694A11FE2E",asset1));

    let asset2=[];
    asset2.push(new Asset("ATVI","A1",1500));
    asset2.push(new Asset("BABA","A2",1500));
    asset2.push(new Asset("JD","A3",1500));
    asset2.push(new Asset("AMD","A4",1500));
	  asset2.push(new Asset("INTEL","A5",1500));
    cars.push(new Client("LI Siliang","99259E74-97AA-4DF2-AD8A-9EF1B322196F",asset2));
	
	  let asset3=[];
    asset3.push(new Asset("ATVI","A1",500));
    asset3.push(new Asset("BABA","A2",500));
    asset3.push(new Asset("JD","A3",500));
    asset3.push(new Asset("AMD","A4",500));
	  asset3.push(new Asset("INTEL","A5",500));
    cars.push(new Client("LI Seng","EB3E4F0A-1A47-4C95-8B07-543B69A0BC27",asset3));

	  let asset4=[];
    asset4.push(new Asset("ATVI","A1",1500));
    asset4.push(new Asset("BABA","A2",2500));
    asset4.push(new Asset("JD","A3",3500));
    cars.push(new Client("FAN Zhiyu","BB814CDE-3228-487A-A999-8F419C2DC740",asset4));

    let asset5=[];
    asset5.push(new Asset("AMD","A4",3500));
    asset5.push(new Asset("INTEL","A5",5500));
    cars.push(new Client("WANG Quan","39D5FD2B-D016-4785-9F16-5831CF5A220A",asset5));
    for (let i = 0; i < cars.length; i++) {
      await stub.putState('CLIENT' + i, Buffer.from(JSON.stringify(cars[i])));
      console.info('Added <--> ', cars[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createClient(stub, args) {
    console.info('============= START : Create Car ===========');
    if (args.length != 4) {
      throw new Error('Incorrect number of arguments. Expecting 5');
    }

    var client = new Client(args[1],args[2],args[3]);

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
          jsonRes.Record = res.value.value.toString('utf8');
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
   let allResults = [];
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
     if(asset.AssetID==args[2] && parseFloat(asset.AssetAmount)>= parseFloat(args[3])){
      asset_amount_from=asset.AssetAmount;
      asset_from=asset;
      asset.AssetAmount=parseFloat(asset.AssetAmount) - parseFloat(args[3]);
     }
   }
   if(asset_amount_from==0 || parseFloat(asset_amount_from) < parseFloat(args[3])){
    throw new Error('Incorrect number of arguments. Expecting Correct Asset'+asset_amount_from);
   }
   else{
    for(var asset_to in bankT.Asset){
      if(asset_to.AssetID==args[2]){
        asset_to.AssetAmount=parseFloat(asset_to.AssetAmount) + parseFloat(asset_amount_from);
        asset_exist_in_to=true;
      }
    }
    if(!asset_exist_in_to){
      bankT.Asset.push(new Asset(asset_from.AssetName,asset_from.AssetID,asset_amount_from));
    }
    // registre transaction
    await stub.putState(args[0], Buffer.from(JSON.stringify(bankF)));
    await stub.putState(args[1], Buffer.from(JSON.stringify(bankT)));
    await stub.putState(transaction_id, Buffer.from(JSON.stringify(new Transaction(transaction_id,args[0],args[1],asset_from))));
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
			if(findall || jsonRes.Record.CF==args[0]){
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
