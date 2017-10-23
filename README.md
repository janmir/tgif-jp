# :japanese_castle:Japanese Holiday API
## Overview
Web api for listing all Japanese Holidays and Checking if a certain date is a holiday.
Holidays are based on http://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv. 
Source and data is updated monthly via scheduling and information is automatically translated to english language.
## Getting Started
You don't need to clone the source to use the api, it is already publicly available via this url: https://api.janmir.me/holidays. Please refer to `Requests` section below for more details.
## Request
> Request must be in REST-GET format. Request body is defined below.
```json
{
    type: "list" | "check"
    yy: <default-current>
    mm: <default-current>
    dd: <default-today>
}
```
## Response
Expected respose in JSON format.
```json
{
    result: true | false,
    data: Array | boolean
}
```
> Data can either be in array format or boolean, this depends on the request. Array data is defined below.
```json
[{
    date: <date when the holiday is>,
    description: <A short description of the holiday>
},...]
```
## Versioning & Tracking
- `v0.0.1`: Initial Project Sources
    -  [] Scheduled data fetch and store.
    -  [] Data translation.
    -  [] Handling GET requests.
        - [] GET request for date checking.
        - [] GET request for holiday list.
## Acknowledgements
- Got my source idea from here https://github.com/suzuki-shunsuke/japanese-holiday-api, thank you so much. どうもありがとうございました!
- Translation from Japanese to English using *Google Translation API*
