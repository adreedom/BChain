package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct {
}

type Assets struct {
	AssetName   string  `json:"assetname"`
	AssetID     string  `json:"assetid"`
	AssetAmount float64 `json:"assetamount"`
}

type Clients struct {
	Name            string   `json:"name"`
	ClientID        string   `json:"clientid"`
	ClientType      string   `json:"clienttype"`
	SkAccountNumber string   `jsoasset_ton:"skaccountnumber"`
	Currency        string   `json:"currency"`
	Asset           []Assets `json:"asset"`
	Status          string   `json:"status"`
}

type Transactions struct {
	TsID      string `json:"tsid"`
	CF        string `json:"cf"`
	CT        string `json:"ct"`
	Asset     Assets `json:"asset"`
	TimeStamp string `json:"timestamp"`
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "createClient" {
		return s.createClient(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "doInnerTransaction" {
		return s.doInnerTransaction(APIstub, args)
	} else if function == "changeClientStatus" {
		return s.changeClientStatus(APIstub, args)
	} else if function == "queryTransactions" {
		return s.queryTransactions(APIstub, args)
	} else if function == "queryClientInfo" {
		return s.queryClientInfo(APIstub, args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryClientInfo(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	carAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(carAsBytes)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	asset1 := []Assets{
		Assets{AssetName: "ATVI", AssetID: "A1", AssetAmount: 2500.00},
		Assets{AssetName: "BABA", AssetID: "A2", AssetAmount: 2500.00},
		Assets{AssetName: "JD", AssetID: "A3", AssetAmount: 2500.00},
		Assets{AssetName: "AMD", AssetID: "A4", AssetAmount: 2500.00},
		Assets{AssetName: "INTEL", AssetID: "A5", AssetAmount: 2500.00},
	}

	asset2 := []Assets{
		Assets{AssetName: "ATVI", AssetID: "A1", AssetAmount: 1500.00},
		Assets{AssetName: "BABA", AssetID: "A2", AssetAmount: 1500.00},
		Assets{AssetName: "JD", AssetID: "A3", AssetAmount: 1500.00},
		Assets{AssetName: "AMD", AssetID: "A4", AssetAmount: 1500.00},
		Assets{AssetName: "INTEL", AssetID: "A5", AssetAmount: 1500.00},
	}

	asset3 := []Assets{
		Assets{AssetName: "ATVI", AssetID: "A1", AssetAmount: 500.00},
		Assets{AssetName: "BABA", AssetID: "A2", AssetAmount: 500.00},
		Assets{AssetName: "JD", Asasset_tosetID: "A3", AssetAmount: 500.00},
		Assets{AssetName: "AMD", AssetID: "A4", AssetAmount: 500.00},
		Assets{AssetName: "INTEL", AssetID: "A5", AssetAmount: 500.00},
	}

	asset4 := []Assets{
		Assets{AssetName: "ATVI", AssetID: "A1", AssetAmount: 1500.00},
		Assets{AssetName: "BABA", AssetID: "A2", AssetAmount: 2500.00},
		Assets{AssetName: "JD", AssetID: "A3", AssetAmount: 3500.00},
	}

	asset5 := []Assets{
		Assets{AssetName: "AMD", AssetID: "A4", AssetAmount: 3500.00},
		Assets{AssetName: "INTEL", AssetID: "A5", AssetAmount: 5500.00},
	}

	var clients = []Clients{
		Clients{Name: "CITI ADMINISTRATION", ClientID: "AD000001", ClientType: "Admin", SkAccountNumber: "348912452", Currency: "USD", Asset: asset1, Status: "active"},
		Clients{Name: "THE GREENWALL FOUNDATION", ClientID: "20180001", ClientType: "Regular", SkAccountNumber: "348912975", Currency: "USD", Asset: asset2, Status: "active"},
		Clients{Name: "SOLAR CAPITAL LTD", ClientID: "20180002", ClientType: "Regular", SkAccountNumber: "348912325", Currency: "USD", Asset: asset3, Status: "active"},
		Clients{Name: "PFPC-DFA FUNDS-IRISH", ClientID: "20180003", ClientType: "Regular", SkAccountNumber: "348912345", Currency: "USD", Asset: asset4, Status: "active"},
		Clients{Name: "ORBIS GROUP", ClientID: "20180004", ClientType: "Regular", SkAccountNumber: "348912790", Currency: "USD", Asset: asset5, Status: "active"},
	}

	i := 0
	for i < len(clients) {
		fmt.Println("i is ", i)
		clientAsBytes, _ := json.Marshal(clients[i])
		APIstub.PutState("CLIENT"+strconv.Itoa(i), clientAsBytes)
		fmt.Println("Added", clients[i])
		i = i + 1
	}

	return shim.Success(nil)
}

/*func (s *SmartContract) createClient(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

  if (args.length != 7) {
    throw new Error('Incorrect number of arguments. Expecting 7');
  }

  var client = new Client(args[1],args[2],args[3],args[4],args[5],args[6]);

  await stub.putState(args[0], Buffer.from(JSON.stringify(client)));
  console.info('============= END : Create Car ===========');
}*/

func (s *SmartContract) queryAllAsset(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	startKey := "CLIENT0"
	endKey := "CLIENT999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllAsset:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) doInnerTransaction(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	//CF client key//CT //Asset ID/Amount
	if len(args) != 4 {
		//return shim.Error('Incorrect number of arguments:'+len(args)+'. Expecting 4:[BankIDFrom,BankIDTo,AssetName,AssetAmount]')
	}
	startcarKey := "TRANC1"
	endKey := "TRANC999"
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	count := 1
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		if queryResponse.Value != nil {
			count = count + 1
		} else {
			break
		}
	}
	transaction_id := "TRANC" + count

	bankFAsBytes, _ := APIstub.GetState(args[0])
	bankTAsBytes, _ := APIstub.GetState(args[1])

	bankF := Clients{}
	bankT := Clients{}
	json.Unmarshal(bankFAsBytes, &bankF)
	json.Unmarshal(bankTAsBytes, &bankT)
	var asset_amount_from float64
	asset_from := Assets{}
	var asset_exist_in_to = false
	amount, _ := strconv.ParseFloat(args[3], 64)
	for i, asset := range bankF.Asset {
		if asset.AssetID == args[2] && asset.AssetAmount >= amount {
			asset_amount_from = asset.AssetAmount
			asset_from = asset
			bankF.Asset[i].AssetAmount = asset.AssetAmount - amount
		}
	}
	if asset_amount_from == 0 || asset_amount_from < amount {
		return shim.Error("Incorrect number of arguments. Expecting Correct Asset" + asset_amount_from)
	} else {
		for i, asset_to := range bankT.Asset {
			if asset_to.AssetID == args[2] {
				asset_from = asset_to
				bankT.Asset[i].AssetAmount = asset_to.AssetAmount + amount
				asset_exist_in_to = true
			}
		}
	}
	if !asset_exist_in_to {
		bankT.Asset = append(bankT.Asset, Assets{AssetName: asset_from.AssetName, AssetID: asset_from.AssetID, AssetAmount: amount})
	}

	// registre transaction
	bankFAsBytes_after, _ := json.Marshal(bankF)
	bankTAsBytes_after, _ := json.Marshal(bankT)
	transactionAsBytes, _ = json.Marshal(Transactions{TsID: transaction_id, CF: args[0], CT: args[1], Asset: Assets{AssetName: asset_from.AssetName, AssetID: asset_from.AssetID, AssetAmount: amount}, TimeStamp: string(time.Now().Unix())})

	APIstub.PutState(args[0], bankFAsBytes_after)
	APIstub.PutState(args[1], bankTAsBytes_after)
	APIstub.PutState(transaction_id, transactionAsBytes)
}

func (s *SmartContract) queryTransactions(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting ID like :CLIENT0")
	}
	findall := false
	if args[0] == "ALL" {
		findall = true
	}
	startKey := "TRANC1"
	endKey := "TRANC999"
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	var allResults []Transactions = make([]Transactions, 5)
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		objres := Transactions{}
		if err != nil {
			return shim.Error(err.Error())
		}
		json.Unmarshal(string(queryResponse.Value), &objres)
		if findall || objres.CF == args[0] || objres.CT == args[0] {
			allResults = append(allResults, objres)
		}
	}
	transactionsAsBytes, _ = json.Marshal(allResults)
	return shim.Success(transactionsAsBytes)
}

func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
