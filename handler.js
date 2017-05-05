'use strict';

const AWS = require('aws-sdk');
const Jimp = require('jimp');
const hash = require('object-hash');

const s3 = new AWS.S3({
  params: {
    Bucket: process.env.S3_BUCKET,
  },
});

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
  const originalKey = `originals/${imgKey}`;
  const processedKey = `processed/${hash.MD5(event.queryStringParameters)}-${imgKey}`;
  const originalPublicUrl = `https://s3.amazonaws.com/${process.env.S3_BUCKET}/originals/${imgKey}`;
  const processedPublicUrl = `https://s3.amazonaws.com/${process.env.S3_BUCKET}/${processedKey}`;

  // Check if an original object exists
  s3.headObject({ Key: originalKey }).promise().then(headData => {
    // Check if we have the processed version already
    s3.headObject({ Key: processedKey }).promise().then(() => {
      const response = {
        statusCode: 301,
        headers: {
          Location: processedPublicUrl,
          'Cache-Control': 'public, max-age=31536000',
        },
      };
      callback(null, response);
    // Will throw an error if not found
    }).catch(error => {
      if (error.statusCode !== 404) {
        return handleError(error);
      }
      // Download the original file
      Jimp.read(originalPublicUrl).then(img => {
        // JIMP options we are currently supporting
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
        
        // Apply transforms to the img object
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

        // Get the buffer data for the new image
        img.getBuffer(headData.ContentType, (err, data) => {
          if (err) {
            handleError(err);
          } else {
            const putParams = {
              Key: processedKey,
              ACL: 'public-read',
              Body: data,
              ContentLength: data.length,
              ContentType: headData.ContentType,
              CacheControl: 'public, max-age=31536000',
            };
            // Upload new image data to S3
            s3.putObject(putParams).promise().then(() => {
              // Return a 301 (which should get cached by CloudFront)
              const response = {
                statusCode: 301,
                headers: {
                  Location: processedPublicUrl,
                  'Cache-Control': 'public, max-age=31536000',
                },
              };
              callback(null, response);
            }).catch(handleError);
          }
        });
      }).catch(handleError);
    });
  }).catch(handleError)
};
