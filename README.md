# IMG Lambda
Run your own version of imgix using AWS (lambda, API Gateway, S3, CloudFront)

Sometimes the engineers at [vidhub.co](https://vidhub.co) decide to spend their Sunday
developing infrastructure to use in our application.

We needed to resize user uploaded images on the frontend, and we really liked the concepts
used at imgix.com, IE. using query params to manipulate imges on a server eg.
`img.vidhub.co/img-id.png?cover=64,64`

## Basic Concepts
- creates a Lambda function to process requests to images
- searches an S3 bucket for original files
- creates a new image based on query params, saves it to S3, then returns a 301 to processes image
- CloudFront caches 301 so subsequent requests are fast
- created an API Gateway behind CloudFront to send HTTP requests to our lambda function
