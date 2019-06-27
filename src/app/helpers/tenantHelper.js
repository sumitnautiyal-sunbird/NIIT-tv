const fs = require('fs')
const path = require('path')
const dateFormat = require('dateformat')
const uuidv1 = require('uuid/v1')
const envHelper = require('./environmentVariablesHelper.js')
const async = require('async')
const _ = require('lodash')
const telemetryHelper = require('./telemetryHelper')
const configHelper = require('./configServiceSDKHelper.js')
const appId = envHelper.APPID
const defaultTenant = envHelper.DEFAULT_CHANNEL
const telemtryEventConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './telemetryEventConfig.json')))
telemtryEventConfig['pdata']['id'] = appId
const successResponseStatusCode = 200
const request = require('request');
const livesessionFilePath = path.join(__dirname, '../', 'livesession.json');

function readFromFile() {
  let fileData = fs.readFileSync(livesessionFilePath, 'utf-8');
  if (fileData.length > 0) {
    try {
      fileData = JSON.parse(fileData);
      return fileData;
    } catch (e) {
      console.log('\n\nerror while reading JSON from File');
      console.log(e);
      return '';
    }
  }
  return ''
}

function createData(reqData, fileData) {
  let reqSessionDetails = reqData.sessionDetail;
  let fileSessionDetails = fileData.sessionDetail;
  console.log('\n\nREQUEST SESSION DETAILS ');
  console.log(JSON.stringify(reqSessionDetails));
  console.log('\n\nFILE SESSION DETAILS');
  console.log(JSON.stringify(fileSessionDetails));
  reqSessionDetails = reqSessionDetails.filter(function (a, b) {
    return a.contentDetails.length
  });
  console.log('\n\nfiltered REQUEST SESSION DETAILS ');
  console.log(JSON.stringify(reqSessionDetails));
  reqSessionDetails.forEach(reqSession => {
    fileSessionDetails.forEach(fileSession => {
      if (reqSession.unitId === fileSession.unitId) {
        reqSession.contentDetails.forEach(reqContent => {
          fileSession.contentDetails.forEach(fileContent => {
            if (reqContent.contentId === fileContent.contentId) {
              fileContent = reqContent;
            } else {
              console.log('adding new entry into the contentDetails of ', fileContent.contentId);
              fileSession.contentDetails.push(reqContent);
            }
          });
        });
      }
    });
  });
  fileData.sessionDetail = fileSessionDetails;
  return fileData;
}

function writeToFile(res, dataToWrite) {
  dataToWrite = JSON.stringify(dataToWrite) ? JSON.stringify(dataToWrite) : '';
  console.log('data given to write is ', JSON.stringify(dataToWrite));
  let response = fs.writeFileSync(livesessionFilePath, dataToWrite);
  if (response === false) {
    console.log('unable to write into the file');
    return res.status(500);
  }
  return res.sendStatus(200);
}

module.exports = {

  getImagePath: function (baseUrl, tenantId, image, callback) {
    if (envHelper.TENANT_CDN_URL === '' || envHelper.TENANT_CDN_URL === null) {
      module.exports.getLocalImage(baseUrl, tenantId, image, callback)
    } else {
      request
        .get(envHelper.TENANT_CDN_URL + '/' + tenantId + '/' + image)
        .on('response', function (res) {
          if (res.statusCode === 200) {
            baseUrl = envHelper.TENANT_CDN_URL
            callback(null, baseUrl + '/' + tenantId + '/' + image)
          } else {
            module.exports.getLocalImage(baseUrl, tenantId, image, callback)
          }
        })
    }
  },
  getLocalImage: function (baseUrl, tenantId, image, callback) {
    fs.stat(path.join(__dirname, '../tenant', tenantId, image), function (err, stat) {
      if (err) {
        if (envHelper.DEFAULT_CHANNEL && _.isString(envHelper.DEFAULT_CHANNEL)) {
          fs.stat(path.join(__dirname, '../tenant', envHelper.DEFAULT_CHANNEL, image), function (error, stat) {
            if (error) {
              callback(null, null)
            } else {
              callback(null, baseUrl + '/tenant/' + envHelper.DEFAULT_CHANNEL + '/' + image)
            }
          })
        } else {
          callback(null, null)
        }
      } else {
        callback(null, baseUrl + '/tenant/' + tenantId + '/' + image)
      }
    })
  },
  getInfo: function (req, res) {

    let tenantId = req.params.tenantId || envHelper.DEFAULT_CHANNEL
    let host = req.hostname
    let headerHost = req.headers.host.split(':')
    let port = headerHost[1] || ''
    let protocol = req.headers['x-forwarded-proto'] || req.protocol
    let baseUrl = protocol + '://' + host + (port === '' ? '' : ':' + port)
    let responseObj = {
      titleName: configHelper.getConfig('sunbird_instance_name')
    }
    if (tenantId) {
      async.parallel({
        logo: function (callback) {
          module.exports.getImagePath(baseUrl, tenantId, 'appLogo.png', callback)
        },
        poster: function (callback) {
          module.exports.getImagePath(baseUrl, tenantId, 'poster.png', callback)
        },
        favicon: function (callback) {
          module.exports.getImagePath(baseUrl, tenantId, 'favicon.ico', callback)
        },
        appLogo: function (callback) {
          module.exports.getImagePath(baseUrl, tenantId, 'appLogo.png', callback)
        }
      }, function (err, results) {
        if (err) {}
        console.log('eerr', err, 'resul', results);
        responseObj.logo = results.logo ?
          results.logo : baseUrl + '/assets/images/niit.png'
        responseObj.poster = results.poster ?
          results.poster : baseUrl + '/assets/images/sunbird_logo.png'
        responseObj.favicon = results.favicon ?
          results.favicon : baseUrl + '/assets/images/favicon.ico'
        responseObj.appLogo = results.appLogo ?
          results.appLogo : responseObj.logo
        module.exports.getSucessResponse(res, 'api.tenant.info', responseObj, req)
      })
    } else {
      module.exports.getSucessResponse(res, 'api.tenant.info', responseObj, req)
    }
  },
  getSucessResponse: function (res, id, result, req) {
    const userId = req.headers['x-consumer-id'] || telemtryEventConfig.default_userid
    const type = req.headers['x-consumer-username'] || telemtryEventConfig.default_username

    const telemetryData = {
      reqObj: req,
      statusCode: successResponseStatusCode,
      resp: result,
      uri: 'tenant/info',
      type: type,
      userId: userId,
      channel: envHelper.DEFAULT_CHANNEL
    }
    telemetryHelper.logAPIAccessEvent(telemetryData)
    res.status(successResponseStatusCode)
    res.send({
      'id': id,
      'ver': '1.0',
      'ts': dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
      'params': {
        'resmsgid': uuidv1(),
        'msgid': null,
        'status': 'successful',
        'err': '',
        'errmsg': ''
      },
      'responseCode': 'OK',
      'result': result
    })
    res.end()
  },
  getDefaultTenantIndexState: function () {
    if (!defaultTenant) {
      console.log('DEFAULT_CHANNEL env not set');
      return false;
    }
    try {
      var stats = fs.statSync(path.join(__dirname, '../tenant', defaultTenant, 'index.html'))
      return stats.isFile()
    } catch (e) {
      console.log('DEFAULT_CHANNEL_index_file_stats_error ', e)
      return false;
    }
  },
  getLiveSession: function (req, res) {
    console.log('get data')
    let data = fs.readFileSync(livesessionFilePath, 'utf-8');
    console.log('data is ', data);
    if (!data) {
      console.log('Error occured while reading the file');
      data = [];
      return res.send(data);
    } else {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log('An error occured while parsing data from the file  ', e);
        data = [];
      }
      return res.json(data);
    }
  },
  updateLiveSession: function (req, res) {
    console.log('update');
    console.log('\n\n ', req.body);
    //write contents in the file
    // let fileData = readFromFile(); //return json of data if exists else empty string
    // let dataToWrite;
    // if (!!fileData) {
    //combine the data
    // console.log('there is some data in the file', JSON.stringify(fileData));
    // dataToWrite = Object.assign({},req.body,fileData);
    //dataToWrite = createData(req.body, fileData);
    // console.log('\n\n\nnew data to write is ', JSON.stringify(dataToWrite));
    //writeToFile(res, dataToWrite);
    //} else {
    //console.log('no data in the file, writing new one');
    // write directly to file
    writeToFile(res, req.body);
  }
}
