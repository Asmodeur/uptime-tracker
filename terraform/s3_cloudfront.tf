# ==============================================================================
# Amazon S3 - Mandatory Service 3: Storage Service
# + Amazon CloudFront: CDN Distribution & Edge Caching
# ==============================================================================

# 1. S3 Bucket for Hosting the Built React Frontend
resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "${var.project_name}-frontend-${random_string.suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-frontend-bucket"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_site" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# 2. S3 Bucket for Exported Health-Check Audit Logs and Reports
resource "aws_s3_bucket" "reports_bucket" {
  bucket        = "${var.project_name}-reports-${random_string.suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-reports-bucket"
  }
}

# CloudFront Origin Access Control (OAC) for Secure S3 Access
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project_name}-oac-${var.environment}"
  description                       = "OAC for Website Uptime Tracker Frontend S3 Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy allowing CloudFront OAC Read Access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

# Amazon CloudFront CDN Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "CloudFront Distribution for Website Uptime Tracker Frontend"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cdn"
  }
}
