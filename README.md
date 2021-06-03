# Janice

Your friendly neighborhood space junk worth evaluator.

This repository serves only as issue tracker for https://janice.e-351.com

# API

APIs require an api key, you can get one by sending me PM (kukki#3914). Reason for having own api key is so that I can contact/block people with excessive traffic. If you use api key not bound to your name (like the one below) you might find yourself blocked at some point without warning.

Swagger UI: https://janice.e-351.com/api/rest/docs/index.html <br />
Sample api key: `G9KwKq3465588VPd6747t95Zh94q3W2E`

# Google sheets script v2

1) Copy script in `janice-v2.gs`
2) Paste it into your sheet => tools => script editor
3) Use `JANICE_PRICER` function in your sheet

Sample sheet: https://docs.google.com/spreadsheets/d/1TPRhmsw77-vIO7QD-XlvCu9w0xzyk73iuGtto0SrQZE/edit?usp=sharing

# Google sheets script (v1 - legacy)

1) Copy script in `janice.gs`
2) Paste it into your sheet => tools => script editor
3) Use `JANICE_PRICER` function in your sheet

Sample sheet: https://docs.google.com/spreadsheets/d/1kv0b627HD6qNjr3nLw-codRY8W-3vBAvpclYFpzqnWM/edit?usp=sharing

# Excel

Sample powerquery:

```
let
    ItemList  = "Compressed Spodumain#(cr)#(lf)Carbon#(cr)#(lf)Tritanium",
    RawData = Table.FromRecords(Json.Document(Web.Contents("https://janice.e-351.com/api/rest/v1/pricer?key=G9KwKq3465588VPd6747t95Zh94q3W2E", [Headers = [#"Content-Type"="text/plain"], Content = Text.ToBinary(ItemList)]))),
    ExpandedMarket = Table.ExpandRecordColumn(RawData, "market", { "id", "name" }, { "marketId", "marketName" }),
    ExpandedItemType = Table.ExpandRecordColumn(ExpandedMarket, "itemType", { "eid", "name", "volume", "packagedVolume" }, { "itemTypeEid", "itemTypeName", "itemTypeVolume", "itemTypePackagedVolume" })
in
    ExpandedItemType
```
