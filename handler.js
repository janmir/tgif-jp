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

const fn = {
  jsonObj: null,
  callback: null,
  sexyback: (events, response) => {
    if(fn.callback !== null){
      console.log("----------Response-----------");            
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

      fn.log("----------Email-----------");
      fn.log(message);
      
      if(DEPLOY){
        ses.sendEmail(params, (err, data) => {
          if (err) fn.log(err, err.stack)
          else fn.log(data)
        });
      }
    }
  },
  validateData: (data_list)=>{    
    try {
      data_list.forEach((element)=>{
        let matches = element.match(/\w+\s\d+,(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday),[\s\w]+/gi);
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
  checkch: ()=>{
    
  },
  getch: ()=>{
    //Get from S3
    let s3 = new aws.S3();
    var params = {
        Bucket: BUCKET,
        Key: JSON_FILE
    }
    var done = false;
    s3.getObject(params, function(err, local_data) {
        if(!err){ 
            done = true;
            let strData = local_data.Body.toString('utf-8');
            let obj = JSON.parse(strData);

            //Add performance
            obj.execution = fn.perfEnd();
    
            //Call callback
            fn.sexyback(null, obj);
        }else{
            throw {message:err.message};
        } 
    });
  },
  fetch: () => {
    //Get yaml list of sources
    if(fn.jsonObj === null){

      if(DEPLOY === false){
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
                done = true;
                let file = data.Body.toString('utf-8');
                let config = yaml.safeLoad(file);
                let indentedJson = JSON.stringify(config, null, 4);
    
                fn.jsonObj = JSON.parse(indentedJson).reverse();
            }else{
                throw {message:err.message};
            } 
        });
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
        
        //Get the data
        request.get({
          uri:url,
          encoding: 'utf8'
        }, 
        function (error, response, body){
          try{
            let html = $.parse(body);
            let table = html.querySelectorAll(selector);
            
            //Format return data
            data.ls = table.map((element)=>{
              let out = [];
              let str = element.text.replace(/(\s\s)+/gi, ",");
              let splt = str.split(",").filter(e =>{return e.length});
      
              out.push(splt[2]); //Date short string        
              out.push(splt[0]); //Sunday ~ Saturday
              out.push(splt[3]); //Date description       
              
              return out.join(",");
            });
      
            //Performance end
            fn.perfEnd();
      
            //Validate data
            if(fn.validateData(data.ls)){
              
              fn.s3Save(BUCKET, JSON_FILE, JSON.stringify({holidays:data.ls}));
              
              fn.sexyback(null, {
                  result: true,
                  data:data
                }
              );    
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
  console.log("----------Logs-----------");      
  
  //performance check start
  fn.perfStart();

  //Set Callback function
  fn.callback = callback;

  let action = events.action || "FETCH";  
  try{
    switch(action){
      case "FETCH":{
        fn.fetch();
      }break;
      case "LIST":{
        fn.getch();
      }break;
      case "CHECK":{
        fn.checkch();
      }break;
    }
  }catch(error){
    fn.sendMail(EMAIL, "<span style='color:red;font-weight:bold'>An Error Occured:</span> <br/>"+ error.message);
    fn.sexyback(null, {result: false, error:error.message});
  }
};
