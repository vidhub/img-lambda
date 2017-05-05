//@ts-check
'use strict';

const AWS = require('aws-sdk');
const Jimp = require('jimp');
const hash = require('object-hash');

const s3 = new AWS.S3();

module.exports.index = (event, context, callback) => {
  function handleError(error) {
    const response = {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: error.statusCode ? error : { message: error.message },
      }),
    };
    callback(null, response);
  }

  const imgKey = event.pathParameters.img;
  const headParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `originals/${imgKey}`,
  };

  s3.headObject(headParams).promise().then(headData => {
    Jimp.read(`https://s3.amazonaws.com/${process.env.S3_BUCKET}/originals/${imgKey}`).then(img => {
      const options = [
        'contain',
        'cover',
        'resize',
        'scale',
        'scaleToFit',
        'autocrop',
        'crop',
        'flip',
        'mirror',
        'rotate',
      ];
      
      options.forEach(option => {
        if (event.queryStringParameters[option]) {
          const params = event.queryStringParameters[option].split(',').map(val => {
            const num = Number(val);
            if (Number.isFinite(num)) {
              return num;
            }
            return val;
          });
          img[option].apply(img, params);
        }
      });

      img.getBuffer(headData.ContentType, (err, data) => {
        if (err) {
          handleError(err);
        } else {
          const processedKey = `processed/${hash.MD5(event.queryStringParameters)}-${imgKey}`;
          const putParams = {
            Bucket: process.env.S3_BUCKET,
            Key: processedKey,
            ACL: 'public-read',
            Body: data,
            ContentLength: data.length,
            ContentType: headData.ContentType,
            CacheControl: 'public, max-age=31536000',
          };
          s3.putObject(putParams).promise().then(() => {
            const response = {
              statusCode: 302,
              headers: {
                Location: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/${processedKey}`,
              },
            };
            callback(null, response);
          }).catch(handleError);
        }
      });
    }).catch(handleError);
  }).catch(handleError)
};
