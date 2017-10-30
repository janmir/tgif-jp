# :maple_leaf::japan::japanese_castle:Japanese Holiday API
## :mount_fuji:Overview
Web api for listing all Japanese Holidays of the current year and Checking if a certain date is a holiday.
Holidays are based on holiday listing sites like [publicholidays.jp](https://publicholidays.jp). In this release I have provided at least 2 sources. 
Data is periodically updated *(Atleast once a month)*. Okay now let's :bullettrain_side:.
## :tokyo_tower:Getting Started
You don't need to clone the source to use the api, it is already publicly available via this url: https://api.janmir.me/holiday. Please refer to `Query` section below for more details about api usage.
## :octocat:Query
> Request must be in REST-GET format.
Request payload body is defined below.
```json
{
    "action": "list",
    "format": "M/dd, D",
    "date": "Mar-15"
}
```
> **Note:** *This is a GET request, so you can't directly use the example payload above. But don't be sad I have provided example Request-URLs below*
### Action
> *Actions* determines what you want the API to do for you :stuck_out_tongue_winking_eye:. An usage example is provided below.
```url
exempli gratia:
https://api.janmir.me/holiday/list
https://api.janmir.me/holiday/check
https://api.janmir.me/holiday/fetch
```
Action | Definition
------------ | -------------
**/fetch** | Fetches and stores holiday data from various site defined in [source.yaml](https://github.com/janmir/tgif-jp/blob/master/source.yaml). I discourage using this one as it is already automatically being called once a month. Thanks! :heart_eyes:
**/list** | Lists all holidays in Japan so we can travel more! yeah!
**/check** | Checks if a certain date is a holiday or not.
**/today** | Checks if today is a holiday.
**/tomorrow** | Umm should I still explain this?
### Parameters
> *Parameters* gives you the ability to pass data to the api. And also to customize the response it sends back.
```url
exempli gratia:
https://api.janmir.me/holiday/list?format=M/dd-%3ED
https://api.janmir.me/holiday/check?date=Mar-15
```
Parameter | Applicable| Definition
------------ | ------------- | -------------
**?format** | **/list** | Fetches and stores holiday data from various site defined in [source.yaml](https://github.com/janmir/tgif-jp/blob/master/source.yaml). Available format flags are; `'M' - Month(String - e.g. Jan, Feb, etc.)`, `'W' - Week(String - e.g. Mon, Tue, etc.)`, `'d' - Day(Number - 'dd' with padding)`, `'D' - Description`<br/>**Example:**<br/>`M/dd->D` = *Jan/01->New Year's Day*<br/>`M/d,W,D` = *Jan/1,Sun,New Year's Day*
**?date** | **/check** | The date to check, strictly should be in `M-dd` format.
### Responses
> Expected responses are in **valid** JSON format.
#### Action - Fetch `https://api.janmir.me/holiday/fetch`
```json
{
    "result": true,
    "data": {
        "performance": {
            "start": 1899955.510722,
            "end": 1902836.063255,
            "execution": 2880.55
        },
        "ls": [
            "1,Sun,Jan,New Year's Day",
            "2,Mon,Jan,New Year Holiday",
            "9,Mon,Jan,Coming of Age Day",
            "11,Sat,Feb,National Foundation Day",
            "20,Mon,Mar,Vernal Equinox Day",
        ]
    }
}
```
Key | Type | Definition
------------ | ------------- | -------------
*result* | bool | Result of the API request.
*data* | Object | Contains parsed and performance data.
*performance* | Object | Contains performance data.
*start* | float | Start of execution.
*end* | float | End of execution.
*execution* | float | Time took to perform the action.
*ls* | Array | List of stored holiday.
#### Action - List `https://api.janmir.me/holiday/list?format=M/dd-%3ED`
```json
{
    "result": true,
    "holidays": [
        "Jan/01->New Year's Day",
        "Jan/02->New Year Holiday",
        "Jan/09->Coming of Age Day",
        "Feb/11->National Foundation Day",
        "Mar/20->Vernal Equinox Day"
    ],
    "execution": 0100.0010
}
```
Key | Type | Definition
------------ | ------------- | -------------
*result* | bool | Result of the API request.
*holidays* | Array | Lists of all holidays.
*execution* | float | Time took to perform the action.
#### Action - Check `https://api.janmir.me/holiday/check?date=Mar-15`
```json
{
    "holiday": false,
    "result": true,
    "execution": 0100.0010,
    "description": "It's my birthday!",
    "date": "Mar-15"
}
```
Key | Type | Definition
------------ | ------------- | -------------
*result* | bool | Result of the API request.
*holiday* | Array | If given date is a holiday.
*execution* | float | Time took to perform the action.
*description* | String | Holiday description.
*date* | String | The date that was passed. In the case of tomorrow/today actions the corresponding date is returned.
### Error Handling
> If errors occurs while performing the action you asked a response JSON like the one below is sent.
```json
{
    "result": false,
    "error": "I did nothing. Incorrect [action]?"
}
```
Key | Type | Definition
------------ | ------------- | -------------
*result* | bool | Result of the API request.
*error* | String | Error Message.
## :cherry_blossom:Versioning & Tracking
- `v0.0.1`: Alpha Version `but I'll still release it`:hankey:
    - [x] Scheduled data fetch.
    - [x] Parse web data.
    - [x] Parsed information store.
    - [x] Handling GET requests.
        - [x] GET request for data fetch.
        - [x] GET request for date checking.
        - [x] GET request for holiday list.
    - [ ] External Documentation Page
- `v0.0.2`: Alpha 2
    - [x] Added `Today`.
    - [x] Added `Tomorrow`.    
    - [x] Added `date` as a response to /check action.
    - [x] Added `description` of holiday on check requests.
## :cat2:Acknowledgements
- Thanks for my data sources.
    - https://publicholidays.jp
    - http://www.officeholidays.com/countries/japan/index.php
- Got my source idea from here [Japanese Holiday API](https://github.com/suzuki-shunsuke/japanese-holiday-api) by **Suzuki-san**, thank you so much. どうもありがとうございました!