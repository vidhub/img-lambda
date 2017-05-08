# IMG Lambda
Run your own version of imgix using AWS (lambda, API Gateway, S3, CloudFront)

Sometimes the engineers at [vidhub.co](https://vidhub.co) decide to spend their Sunday
developing infrastructure to use in our application.

We needed to resize user uploaded images on the frontend, and we really liked the concepts
used at imgix.com, IE. using query params to manipulate imges on a server eg.
`img.vidhub.co/img-id.png?cover=64,64`
