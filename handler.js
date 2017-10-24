'use strict';

const yaml = require('js-yaml');
const aws = require('aws-sdk');
const fs = require('fs');
const request = require("request");
const moment = require('moment-timezone');
const now = require("performance-now");
const $ = require('fast-html-parser');
const sync = require('deasync');

var data = {
  performance:{
    start: 0,
    end: 0,
    execution: 0
  },
  ls: null
};

const URL = process.env.URL || "";
const EMAIL = process.env.EMAIL || "";
const EMAIL_REGION = process.env.EMAIL_REGION || "";
const DEPLOY = process.env.DEPLOY === "true" || false;
const DEBUG = process.env.DEBUG || false;
const YAML_FILE = process.env.YAML_FILE || "";
const BUCKET = process.env.BUCKET || "";
const JSON_FILE = process.env.JSON_FILE || "untitled"

//Array extend
Array.prototype.last = function(offset = 1) {
  return this[this.length - offset];
}

//String Extend
String.prototype.padStart = function(len, padding) {
  if(this.length < len){
    let diff = len - this.length;

    var arr = Array(diff).fill(padding);
    arr.push(this);
    return arr.join("");
  }else{
    return this;
  }
}

//Master Function
const fn = {
  jsonObj: null,
  callback: null,
  sexyback: (events, response) => {
    if(fn.callback !== null){
      console.log("---------Response-----------");            
      console.log(response);

      fn.callback(null, response);
    }else{
      console.log("Error: Callback is Null.")
    }
  },
  log: (str)=>{
    if(DEBUG){
      console.log(str);
    }
  },
  perfStart:() => {
    data.performance.start = now();
  },
  perfEnd:() => {
    data.performance.end = now();
    data.performance.execution = (data.performance.end - data.performance.start).toFixed(2);

    return data.performance.execution;
  },
  s3Save: (bucket, key, data) => {
    var s3 = new aws.S3();
    var params = {
      Bucket : bucket,
      Key : key,
      Body : data
    }

    s3.putObject(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  },
  formatMessage: (message)=>{
    return "<html><body><div>" + message + "</div></body></html>";
  },
  sendMail: (email, message)=>{
      //Send email
      if(email !== ""){
      
      let ses = new aws.SES({
        region:EMAIL_REGION
      });

      message = fn.formatMessage(message);

      let params = {
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Body: {
              Html: {
                  Charset: 'UTF-8',
                  Data: message
              }
            },
            Subject: {
            Charset: 'UTF-8',
            Data: 'SES Mail'
            }
        },
        ReturnPath: email,
        Source: email
      }

      fn.log("-----------Email------------");
      fn.log(message);
      
      if(DEPLOY){
        ses.sendEmail(params, (err, data) => {
          if (err) fn.log(err, err.stack)
          else fn.log(data)
        });
      }
    }
  },
  validateDate: (format) => {
    let m =  format.match(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s[0-3]*[0-9]|[0-3]*[0-9]\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/g);
    return m !== null && m.length == 1;
  },
  validateFormat: (format) => {
    let m =  format.match(/(\bM\b)|(\bd+\b)|(\bW\b)|(\bD\b)/g);
    return m !== null && m.length > 0 && m.length < 5;
  },
  validateData: (data_list)=>{    
    try {
      data_list.forEach((element)=>{
        let matches = element.match(/^[0-3]*[0-9],(Sun|Mon|Tue|Wed|Thu|Fri|Sat),(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec),[ -\.\w\W\d]+$/gi);
        if (matches === null){
          throw {
            message:"The string \"" + element + "\" is invalid."
          };
      }
      });

      return true;
    } catch (e) {
      throw e;
    }
  },
  checkch: (date)=>{
    //Validate date
    if(date !== null && fn.validateDate(date)){
      let newObj = {};
      let obj = fn.getch("M dd", false);

      newObj.holiday = obj.holidays.includes(date);
      newObj.result = true;
      newObj.execution = fn.perfEnd();

      fn.sexyback(null, newObj);
    }else{
      throw {message: "Date invalid. Format must be <M><Space><dd>."};
    }
  },
  getch: (format, async = true)=>{
    var obj = {};
    var done = false;

    //Get from S3
    let s3 = new aws.S3();
    var params = {
        Bucket: BUCKET,
        Key: JSON_FILE
    }
    var done = false;
    s3.getObject(params, function(err, local_data) {
        try{
          if(!err){ 
              done = true;
              let strData = local_data.Body.toString('utf-8');
              let data = JSON.parse(strData);
              

              //Parse and format
              if(format !== null && fn.validateFormat(format)){
                obj.holidays = data.holidays.map(e=>{
                  e = e.split(",");
                  let newStr = format;

                  //match d -> day
                  let d = format.match(/d+/g);
                  if(d !== undefined){
                    let nd = e[0] + "";
                    let p = d[0];
                    nd = nd.padStart(p.length, "0");

                    //replace
                    newStr = newStr.replace(p, nd);
                  }

                  //replace M -> Month
                  newStr = newStr.replace(/\bM\b/g, e[2]);

                  //replace W -> Week
                  newStr = newStr.replace(/\bW\b/g, e[1]);
                                    
                  //replace D -> description
                  newStr = newStr.replace(/\bD\b/g, e[3]);
                  
                  return newStr;
                });
              }else{
                obj.holidays = data.holidays;
              }
      
              if(async){
                //Add performance and result
                obj.result = true;
                obj.execution = fn.perfEnd();

                //Call callback
                fn.sexyback(null, obj);
              }
          }else{
              throw {message: err.message};
          } 
        }catch(err){
          throw {message: err.message};
        }
    });

    if(!async){
      //Wait
      while(!done) {
        sync.runLoopOnce();
      }

      //return
      return obj;    
    }
  },
  fetch: () => {
    //Get yaml list of sources
    if(fn.jsonObj === null){

      if(!DEPLOY){
        console.log("//From Local");
  
        //Get from local file
        let file = fs.readFileSync(__dirname +'/' + YAML_FILE, 'utf8')
        let config = yaml.safeLoad(file);
        let indentedJson = JSON.stringify(config, null, 4);
  
        fn.jsonObj = JSON.parse(indentedJson).reverse();
      }else{
        console.log("//From Bucket");
  
        //Get from S3
        let s3 = new aws.S3();
        var params = {
            Bucket: BUCKET,
            Key: YAML_FILE
        }
        var done = false;
        s3.getObject(params, function(err, data) {
            if(!err){ 
                let file = data.Body.toString('utf-8');
                let config = yaml.safeLoad(file);
                let indentedJson = JSON.stringify(config, null, 4);
    
                fn.jsonObj = JSON.parse(indentedJson).reverse();

                //End Wait loop
                done = true;
              }else{
                throw {message:err.message};
            } 
        });

        //Wait for s3 task to finish
        while(!done) {
            sync.runLoopOnce();
        }
      }
    }

    //Log content
    fn.log("//Data");
    fn.log(fn.jsonObj);

    if(fn.jsonObj !== null){
      let obj = fn.jsonObj.pop();

      //Log content
      fn.log("//Object");
      fn.log(obj);

      if(obj !== undefined){
        let url = obj.url;
        let selector = obj.selector;
        let child = obj.child;
        
        //Get the data
        request.get({
          uri:url,
          encoding: 'utf8'
        }, 
        function (error, response, body){
          try{
            let html = $.parse(body);
            let table = html.querySelectorAll(selector);
            
            if(table.length > 0){              
              var i = $.parse("<i>,</i>");

              //log
              fn.log("//Parsing");

              //Format return data
              data.ls = table.map((element)=>{                
                let out = ['','',''];

                //Add comma to each td
                element.querySelectorAll(child).forEach(e=>{
                  e.appendChild(i);
                });

                //remove all dates
                let str = element.text.replace(/[\d]{4}-[0-1][0-9]-[0-2][0-9]/g,"");

                //remove all double space
                str = str.replace(/(\s\s)+/gi, "");

                //remove pre-post
                str = str.trim();

                fn.log("Input: " + str);

                //Matches
                let date = str.match(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s[0-3]*[0-9]|[0-3]*[0-9]\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/g);
                let week = str.match(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/g);

                if(date !== undefined && week !== undefined){
                  //get the day
                  out[0] = date[0].match(/([0-3]*[0-9])/g).last();

                  //get the month
                  out[2] = date[0].match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g).last();
                  
                  //get week
                  out[1] = week[0]; //Sunday ~ Saturday 

                  //get description
                  out[3] = str.split(",").filter(e=>{e = e.trim();return e.length;}).last().trim();
                }else{
                  throw {message: "String does not match required data pattern."}
                }

                fn.log("Output: " + out.join(","));
                
                return out.join(",");
              });

              //Performance end
              fn.perfEnd();

              //Validate data
              if(fn.validateData(data.ls)){
                
                //Save the data to s3
                fn.s3Save(BUCKET, JSON_FILE, JSON.stringify({holidays:data.ls}));
                
                fn.sexyback(null, {
                    result: true,
                    data:data
                  }
                );    
              }
            }else{
              throw {message:"Source has no content."}
            }      
          }catch(error){
            console.log("//Error: " + error.message);

            //Fetch again to continue on next
            fn.fetch();
          }
        });
      }else{
        throw {message:"Unable to fetch data from sources."};
      }
    }
  }
};

module.exports.main = (events, context, callback) => {
  console.log("----------Request-----------");
  console.log(events);
  console.log("------------Logs------------");      
  
  //performance check start
  fn.perfStart();

  //Set Callback function
  fn.callback = callback;

  //inits
  fn.jsonObj = null;
  let action = events.action || "FETCH";
  let format = events.format || null;
  let date = events.date || null;
  
  try{
    switch(action){
      case "FETCH":{
        fn.fetch();
      }break;
      case "LIST":{
        fn.getch(format);
      }break;
      case "CHECK":{
        fn.checkch(date);
      }break;
      default:{
        throw {message: "I did nothing. Incorrect [action]?"};
      }
    }
  }catch(error){
    fn.sendMail(EMAIL, "<span style='color:red;font-weight:bold'>An Error Occured:</span> <br/>"+ error.message);
    fn.sexyback(null, {result: false, error:error.message});
  }
};
