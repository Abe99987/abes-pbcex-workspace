# Secret Rotation & History Purge Runbook

## Overview

This document provides step-by-step procedures for handling accidentally committed secrets and rotating credentials.

## Emergency Response: Secret Accidentally Committed

### Immediate Actions (within 5 minutes)

1. **Rotate the exposed secret immediately**
   ```bash
   # Example actions (adapt per service):
   # - Resend: Generate new API key, deactivate old one
   # - Twilio: Rotate Auth Token in Console
   # - FedEx: Generate new Client Secret
   # - Stripe: Rotate API keys
   # - AWS: Deactivate and create new access keys
   ```

2. **Assess the exposure scope**
   - Check if the secret was pushed to remote repository
   - Identify which branches contain the secret
   - Check if any CI/CD systems have cached the secret

### Git History Purge

#### Option 1: Using git-filter-repo (Recommended)
```bash
# Install git-filter-repo if not available
pip install git-filter-repo

# Remove secret from all history
git filter-repo --message-callback 'return message.replace(b"EXPOSED_SECRET_HERE", b"[REDACTED]")'

# Or remove entire files containing secrets
git filter-repo --path backend/.env --invert-paths

# Force push to all branches
git push --force --all
git push --force --tags
```

#### Option 2: Using BFG Repo-Cleaner
```bash
# Download BFG jar file
# Replace secrets in all files
java -jar bfg.jar --replace-text passwords.txt repo.git

# passwords.txt contains:
# EXPOSED_SECRET_HERE=>[REDACTED]

# Clean up and force push
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
```

### Post-Purge Actions

4. **Update CI/CD secrets**
   - GitHub Actions secrets
   - Any deployment pipeline credentials
   - Developer environment variables

5. **Notify team members**
   ```bash
   # Force all developers to re-clone
   echo "⚠️  SECURITY: Repository history rewritten"
   echo "🔄 Action required: Delete local repo and re-clone"
   echo "   git clone <repo-url>"
   ```

6. **Monitor for unauthorized usage**
   - Check service logs for usage of old credentials
   - Monitor for unexpected API calls or charges
   - Set up alerts for suspicious activity

## Preventive Measures

### Pre-commit Hook Testing
```bash
# Test the secret scanner with a fake secret
echo "sk_test_fake_stripe_key_12345" > temp_test_file.txt
git add temp_test_file.txt
git commit -m "test"  # Should be blocked
rm temp_test_file.txt
```

### Regular Secret Rotation Schedule
- **Quarterly**: Rotate all API keys and tokens
- **Monthly**: Review access logs and permissions
- **Weekly**: Scan for new secrets in commits

### Environment Variable Best Practices
```bash
# ✅ Good: Use environment variables
RESEND_API_KEY=${RESEND_API_KEY}

# ❌ Bad: Hardcoded secrets
const apiKey = "re_12345_abcdef";

# ✅ Good: Template files with placeholders
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# ❌ Bad: Real secrets in templates
TWILIO_AUTH_TOKEN=AC1234567890abcdef1234567890abcdef
```

## Service-Specific Rotation Procedures

### Resend Email Service
1. Login to Resend Dashboard
2. Generate new API key
3. Update `RESEND_API_KEY` environment variable
4. Delete old API key
5. Test email sending functionality

### Twilio Verify Service
1. Access Twilio Console
2. Navigate to Auth Tokens
3. Generate new Auth Token
4. Update `TWILIO_AUTH_TOKEN` environment variable
5. Delete old Auth Token
6. Test SMS verification flow

### FedEx Developer API
1. Access FedEx Developer Portal
2. Navigate to API credentials
3. Generate new Client Secret
4. Update `FEDEX_CLIENT_SECRET` environment variable
5. Revoke old Client Secret
6. Test shipping rate calculations

### Database & Cache
1. Rotate PostgreSQL passwords in Supabase
2. Update `DATABASE_URL` connection strings
3. Rotate Redis authentication if applicable
4. Update `REDIS_URL` connection strings
5. Test database connectivity

## Contact Information

- **Security Team**: security@pbcex.com
- **DevOps Lead**: devops@pbcex.com
- **On-call Engineer**: Use PagerDuty escalation

## References

- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitLeaks documentation](https://github.com/gitleaks/gitleaks)
