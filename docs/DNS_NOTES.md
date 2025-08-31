# PBCEx DNS Configuration

This document provides DNS configuration requirements and setup instructions for PBCEx production deployment.

## Domain Structure

PBCEx uses a multi-subdomain architecture for security, performance, and scalability:

### Primary Domains

| Subdomain | Purpose | SSL Required | CDN |
|-----------|---------|--------------|-----|
| `app.pbcex.com` | Frontend React application | ✅ Yes | Optional |
| `api.pbcex.com` | Backend API server | ✅ Yes | No |
| `assets.pbcex.com` | Static assets (images, docs) | ✅ Yes | ✅ Recommended |

### Root Domain

| Domain | Purpose | SSL Required |
|--------|---------|--------------|
| `pbcex.com` | Marketing site / redirect to app | ✅ Yes |

---

## DNS Records Configuration

⚠️ **Status:** Placeholders - Update with actual deployment targets

### Frontend (app.pbcex.com)

```dns
# Once deployment target is determined:

# Option 1: Direct A record (IP address)
app.pbcex.com.    300    IN    A    xxx.xxx.xxx.xxx

# Option 2: CNAME to hosting provider
app.pbcex.com.    300    IN    CNAME    your-app.vercel.app.
# OR
app.pbcex.com.    300    IN    CNAME    your-app.netlify.app.
# OR  
app.pbcex.com.    300    IN    CNAME    your-cloudfront-distribution.cloudfront.net.
```

### Backend API (api.pbcex.com)

```dns
# Once deployment target is determined:

# Option 1: Direct A record
api.pbcex.com.    300    IN    A    xxx.xxx.xxx.xxx

# Option 2: CNAME to cloud provider
api.pbcex.com.    300    IN    CNAME    your-app.render.com.
# OR
api.pbcex.com.    300    IN    CNAME    your-instance.amazonaws.com.
# OR
api.pbcex.com.    300    IN    CNAME    your-app.railway.app.
```

### Assets CDN (assets.pbcex.com) - Optional

```dns
# For CDN-hosted static assets:
assets.pbcex.com.    300    IN    CNAME    your-cdn.cloudfront.net.
# OR
assets.pbcex.com.    300    IN    CNAME    your-zone.b-cdn.net.
```

### Root Domain (pbcex.com)

```dns
# Apex domain - typically redirects to app.pbcex.com
pbcex.com.    300    IN    A    xxx.xxx.xxx.xxx
www.pbcex.com.    300    IN    CNAME    pbcex.com.
```

---

## Resend DNS

**Status:** ⚠️ **Required for production email delivery**

### Overview

Resend requires DNS verification before allowing email delivery from `contact@pbcex.com`. This involves adding SPF, DKIM, and Return-Path records.

### Setup Process

1. **Access Resend Dashboard**
   - Log into [resend.com/domains](https://resend.com/domains)
   - Add domain: `pbcex.com`

2. **Get DNS Records**
   - Resend will generate three types of records:
     - SPF (TXT record for sender verification)
     - DKIM (CNAME for email signing)
     - Return-Path (CNAME for bounce handling)

3. **Add Records to Cloudflare**

   ```dns
   # Example records (replace with actual values from Resend dashboard):
   
   # SPF Record
   pbcex.com.    300    IN    TXT    "v=spf1 include:_spf.resend.com ~all"
   
   # DKIM Record  
   resend._domainkey.pbcex.com.    300    IN    CNAME    resend._domainkey.resend.com.
   
   # Return-Path Record
   bounce.pbcex.com.    300    IN    CNAME    bounce.resend.com.
   ```

4. **Verify Configuration**
   - DNS propagation takes 5-60 minutes
   - Check Resend dashboard for green verification checkmarks
   - Test email delivery once verified

### Important Notes

- **Do not send production emails until DNS is verified** ✅
- Records must be added to root domain (`pbcex.com`), not subdomain
- Use exact values provided by Resend dashboard
- Monitor Resend dashboard for any DNS issues

### Verification Checklist

- [ ] SPF record added and verified (green checkmark)
- [ ] DKIM record added and verified (green checkmark)  
- [ ] Return-Path record added and verified (green checkmark)
- [ ] Test email sent successfully from `contact@pbcex.com`
- [ ] Check email headers for proper SPF/DKIM validation

---

## SSL/TLS Configuration

### Certificate Requirements

All domains require valid SSL certificates:

- `pbcex.com` + `www.pbcex.com`
- `app.pbcex.com`  
- `api.pbcex.com`
- `assets.pbcex.com`

### Recommended Approach

**Option 1: Cloudflare Universal SSL (Recommended)**
- Automatic SSL for all subdomains
- Edge certificates managed by Cloudflare
- Origin certificates for backend security

**Option 2: Let's Encrypt + certbot**
- Free certificates with auto-renewal
- Requires server management

**Option 3: Cloud Provider SSL**
- AWS Certificate Manager
- Vercel/Netlify automatic certificates

---

## CORS Configuration

Update backend CORS settings for production domains:

```typescript
// backend/src/server.ts
const corsOrigins = env.NODE_ENV === 'production'
  ? [
      'https://pbcex.com',
      'https://www.pbcex.com', 
      'https://app.pbcex.com'
    ]
  : [/* development origins */];
```

---

## Security Headers

### Content Security Policy (CSP)

Configure CSP to allow cross-origin requests between subdomains:

```http
Content-Security-Policy: 
  default-src 'self'; 
  connect-src 'self' https://api.pbcex.com; 
  img-src 'self' https://assets.pbcex.com data:; 
  script-src 'self' 'unsafe-inline';
```

### Additional Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Health Checks & Monitoring

### DNS Monitoring

Monitor DNS resolution for all domains:

```bash
# Health check script
dig +short app.pbcex.com
dig +short api.pbcex.com  
dig +short assets.pbcex.com
```

### Application Health Checks

Configure load balancer health checks:

```http
# Backend health endpoint
GET https://api.pbcex.com/health

# Expected response
HTTP 200 OK
{
  "status": "healthy",
  "services": { /* service statuses */ }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Choose hosting providers for frontend/backend
- [ ] Configure DNS records in Cloudflare
- [ ] Set up SSL certificates
- [ ] Configure Resend domain verification
- [ ] Update CORS origins in backend
- [ ] Set production environment variables

### Post-Deployment

- [ ] Verify all domains resolve correctly
- [ ] Test HTTPS on all subdomains  
- [ ] Confirm email delivery works
- [ ] Validate CORS functionality
- [ ] Run integration tests against production URLs
- [ ] Monitor DNS resolution and SSL expiry

### Rollback Plan

- [ ] Keep old DNS records documented
- [ ] Maintain staging environment
- [ ] Monitor error rates after deployment
- [ ] Have DNS rollback procedure ready

---

## Cloudflare Configuration

### Recommended Settings

**SSL/TLS Mode:** Full (strict)
**Always Use HTTPS:** On
**HTTP Strict Transport Security:** Enable
**Minimum TLS Version:** 1.2

### DNS Settings

**Proxy Status:**
- `pbcex.com` - Proxied (orange cloud)
- `app.pbcex.com` - Proxied (orange cloud)  
- `api.pbcex.com` - DNS Only (gray cloud) for direct API access
- `assets.pbcex.com` - Proxied (orange cloud) for CDN benefits

### Page Rules

```
# Redirect root to app
pbcex.com/* → 301 Redirect → https://app.pbcex.com/$1

# Cache static assets
assets.pbcex.com/* → Cache Level: Cache Everything
```

---

## Environment-Specific Configuration

### Development

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### Staging  

```bash
NEXT_PUBLIC_API_BASE_URL=https://staging-api.pbcex.com/api
NEXT_PUBLIC_APP_URL=https://staging.pbcex.com
```

### Production

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.pbcex.com/api  
NEXT_PUBLIC_APP_URL=https://app.pbcex.com
```

---

## Troubleshooting

### Common DNS Issues

**Problem:** Domain not resolving
- **Check:** DNS propagation (use dig/nslookup)
- **Solution:** Wait 5-60 minutes for propagation

**Problem:** SSL certificate errors
- **Check:** Certificate covers all required domains
- **Solution:** Add missing domains to certificate

**Problem:** CORS errors in browser
- **Check:** Backend CORS configuration includes production domains
- **Solution:** Update corsOrigins array

**Problem:** Email delivery failing
- **Check:** Resend DNS verification status
- **Solution:** Re-verify DNS records, check SPF/DKIM

### Verification Commands

```bash
# Check DNS resolution
dig app.pbcex.com +short
dig api.pbcex.com +short

# Check SSL certificate
openssl s_client -connect app.pbcex.com:443 -servername app.pbcex.com

# Check HTTP headers
curl -I https://api.pbcex.com/health

# Verify SPF record
dig TXT pbcex.com | grep spf

# Check DKIM record  
dig CNAME resend._domainkey.pbcex.com
```

---

## Support Contacts

### DNS Management
- **Registrar:** [Domain registrar contact]
- **DNS Provider:** Cloudflare Support

### SSL Certificates
- **Provider:** Cloudflare / Let's Encrypt
- **Renewal:** Automatic

### Email Delivery
- **Provider:** Resend Support (resend.com/support)
- **Domain Verification:** Check resend.com/domains

### Hosting Providers
- **Frontend:** [Provider support contact]
- **Backend:** [Provider support contact]

---

*Last updated: [Date] - Update this document when deployment targets are finalized*
