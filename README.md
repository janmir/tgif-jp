# :japan::japanese_castle:Japanese Holiday API
## :mount_fuji:Overview
Web api for listing all Japanese Holidays of the current year and Checking if a certain date is a holiday.
Holidays are based on holiday listing sites like [publicholidays.jp](https://publicholidays.jp). In this release I have provided at least 2 sources. 
Data is periodically updated *(Atleast once a month)*.
## :tokyo_tower:Getting Started
You don't need to clone the source to use the api, it is already publicly available via this url: https://api.janmir.me/holiday. Please refer to `Query` section below for more details about api usage.
## Query
> Request must be in REST-GET format.
Request payload body is defined below.
```json
{
    action: "list",
    format: "M/dd, D",
    date: "Mar-15"
}
```
> **Note:** *This is a GET request, so you can't directly use the example payload above. But don't be sad I have provided exaple URLs below*
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
**/fetch** | Fetches and stores holiday data from various site defined in [source.yaml](https://github.com/janmir/tgif-jp/blob/master/source.yaml).
**/list** | Lists all holidays in Japan so we can travel more! yeah!
**/check** | Checks if a certain date is a holiday or not.
### Parameters
> *Parameters* gives you the ability to pass data to the api. And also to customize the response it sends back.
```url
exempli gratia:
https://api.janmir.me/holiday/list?format=M/dd-%3ED
https://api.janmir.me/holiday/check?date=Mar-15
```
Parameter | Applicable| Definition
------------ | ------------- | -------------
**?format** | **/list** | Fetches and stores holiday data from various site defined in [source.yaml](https://github.com/janmir/tgif-jp/blob/master/source.yaml). Available format flags are; `'M' - Month(Uppercase e.g. Jan, Feb, etc.)`, `'W' - Week(Uppercase e.g. Mon, Tue, etc.)`, `'d' - Day(Number format, 'dd' with padding)`, `'D' - Description`<br/>**Example:**<br/>`M/dd->D` = *Jan/01->New Year's Day*<br/>`M/d,W,D` = *Jan/1,Sun,New Year's Day*
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
    "execution": 0100.0010
}
```
Key | Type | Definition
------------ | ------------- | -------------
*result* | bool | Result of the API request.
*holiday* | Array | If given date is a holiday.
*execution* | float | Time took to perform the action.
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
## Versioning & Tracking
- `v0.0.1`: Initial Project Sources
    - [x] Scheduled data fetch and store.
    - [x] Handling GET requests.
        - [x] GET request for date checking.
        - [x] GET request for holiday list.
    - [ ] Documentation Page
## Acknowledgements
- Thanks for my data sources.
    - https://publicholidays.jp
    - http://www.officeholidays.com/countries/japan/index.php
- Got my source idea from here [Japanese Holiday API](https://github.com/suzuki-shunsuke/japanese-holiday-api) by **Suzuki-san**, thank you so much. どうもありがとうございました!