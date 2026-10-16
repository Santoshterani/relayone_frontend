// Provider presets and "how do I get the password" guides for the Channels screen.
// Hosts, ports and links are the providers' public defaults; check them if a provider changes its setup.
export const PROVIDERS = {
  gmail: {
    label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, encryption: 'starttls',
    usernameHelp: 'Your full Gmail address, e.g. you@gmail.com',
    passwordHelp: 'A 16-character App Password, not your Gmail password',
    guide: {
      title: 'Get a Gmail App Password',
      steps: [
        'Turn on 2-Step Verification for the Google account (Google Account > Security). App Passwords do not appear without it.',
        'Open the App Passwords page, type a name such as "RelayOne" and click Create.',
        'Copy the 16-character password Google shows. It is shown only once. Spaces do not matter.',
        'Paste it in the Password field. Use your full Gmail address as the username and as the From email.'
      ],
      link: { label: 'Open App Passwords', url: 'https://myaccount.google.com/apppasswords' },
      notes: [
        'A passkey or your normal Gmail password will not work for SMTP.',
        'If the App Passwords page is missing on a company (Workspace) account, the Workspace admin has to allow it.',
        'Gmail allows about 500 emails a day (personal) or 2,000 (Workspace). Set the daily limit below to match.'
      ]
    }
  },
  m365: {
    label: 'Microsoft 365 / Outlook', host: 'smtp.office365.com', port: 587, encryption: 'starttls',
    usernameHelp: 'The full mailbox address, e.g. mail@yourcompany.com',
    passwordHelp: 'The mailbox password or app password, if your admin allows it',
    guide: {
      title: 'Before you use Microsoft 365',
      steps: [
        'Microsoft is moving away from username and password SMTP. Ask your Microsoft 365 admin whether "Authenticated SMTP" (SMTP AUTH) is allowed for the sending mailbox.',
        'If it is allowed, use that mailbox address as the username and its password as the password. If the account has multi-factor sign-in, create an app password under My Account > Security info.',
        'If it is not allowed, the connection will be rejected. In that case use one of the providers below instead (Amazon SES, SendGrid, Brevo, Mailgun and so on).'
      ],
      link: { label: 'Microsoft: enable SMTP AUTH', url: 'https://learn.microsoft.com/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission' },
      notes: ['RelayOne signs in with username and password only. It cannot use Microsoft sign-in (OAuth) yet.']
    }
  },
  ses: {
    label: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, encryption: 'starttls',
    usernameHelp: 'The SMTP username from the SES console (not your AWS login)',
    passwordHelp: 'The SMTP password from the SES console (not your AWS secret key)',
    guide: {
      title: 'Get Amazon SES SMTP credentials',
      steps: [
        'In the AWS console open Amazon SES and choose the region you will send from. Note its name, e.g. ap-south-1.',
        'Under Identities, verify your sending domain or email address (follow the DNS steps it shows).',
        'Open SMTP settings and click Create SMTP credentials. Download or copy the username and password. The password is shown only once.',
        'Replace the region in the SMTP host above, e.g. email-smtp.ap-south-1.amazonaws.com. It must match the region where you verified.',
        'Use the SMTP username and password here, and the verified address as the From email.'
      ],
      link: { label: 'Open Amazon SES', url: 'https://console.aws.amazon.com/ses/' },
      notes: ['New SES accounts start in sandbox mode and can only send to verified addresses. Request production access in the SES console to send to anyone.']
    }
  },
  sendgrid: {
    label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, encryption: 'starttls', username: 'apikey',
    usernameHelp: 'Always the exact word apikey',
    passwordHelp: 'A SendGrid API key with "Mail Send" permission',
    guide: {
      title: 'Create a SendGrid API key',
      steps: [
        'In SendGrid open Settings > Sender Authentication and verify a single sender address or your domain.',
        'Open Settings > API Keys and click Create API Key. Choose Restricted Access and switch on Mail Send.',
        'Copy the key (it starts with SG.). It is shown only once.',
        'The username is the exact word apikey. Paste the key as the password.'
      ],
      link: { label: 'Open SendGrid API keys', url: 'https://app.sendgrid.com/settings/api_keys' },
      notes: ['The From email must be the verified sender or on the verified domain, or SendGrid rejects the mail.']
    }
  },
  mailgun: {
    label: 'Mailgun', host: 'smtp.mailgun.org', port: 587, encryption: 'starttls',
    usernameHelp: 'postmaster@ followed by your sending domain, e.g. postmaster@mg.yourcompany.com',
    passwordHelp: 'The SMTP password for that domain',
    guide: {
      title: 'Get Mailgun SMTP credentials',
      steps: [
        'In Mailgun open Sending > Domains and add your sending domain. Add the DNS records it shows and wait until it is verified.',
        'Open the domain, then the SMTP credentials section (Domain settings > SMTP credentials).',
        'Use the default postmaster user or create a new one, then set or reset its password and copy it.',
        'Username is the full login, e.g. postmaster@mg.yourcompany.com. Paste the password here.'
      ],
      link: { label: 'Open Mailgun domains', url: 'https://app.mailgun.com/mg/sending/domains' },
      notes: ['EU accounts use smtp.eu.mailgun.org as the host.']
    }
  },
  brevo: {
    label: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, encryption: 'starttls',
    usernameHelp: 'The login email or SMTP login shown on Brevo\'s SMTP page',
    passwordHelp: 'An SMTP key generated in Brevo (not your account password)',
    guide: {
      title: 'Create a Brevo SMTP key',
      steps: [
        'In Brevo open SMTP & API (under your account menu), then the SMTP tab.',
        'Copy the Login shown there. This is the username.',
        'Click Generate a new SMTP key, give it a name and copy the key. It is shown only once.',
        'Add and verify your sender or domain under Senders, Domains & Dedicated IPs, and use it as the From email.'
      ],
      link: { label: 'Open Brevo SMTP & API', url: 'https://app.brevo.com/settings/keys/smtp' },
      notes: []
    }
  },
  postmark: {
    label: 'Postmark', host: 'smtp.postmarkapp.com', port: 587, encryption: 'starttls',
    usernameHelp: 'Your Postmark Server API token',
    passwordHelp: 'The same Server API token',
    guide: {
      title: 'Find your Postmark token',
      steps: [
        'In Postmark open your Server, then the API Tokens tab.',
        'Copy the Server API token.',
        'Paste the same token as both the username and the password.',
        'Add a Sender Signature or domain under Sender Signatures and use it as the From email.'
      ],
      link: { label: 'Open Postmark', url: 'https://account.postmarkapp.com/servers' },
      notes: ['Postmark has a separate stream for broadcast mail. This setup uses the default transactional stream.']
    }
  },
  resend: {
    label: 'Resend', host: 'smtp.resend.com', port: 465, encryption: 'ssl', username: 'resend',
    usernameHelp: 'Always the exact word resend',
    passwordHelp: 'A Resend API key (starts with re_)',
    guide: {
      title: 'Create a Resend API key',
      steps: [
        'In Resend open Domains, add your domain and add the DNS records until it shows Verified.',
        'Open API Keys and click Create API Key with "Sending access".',
        'Copy the key (it starts with re_). It is shown only once.',
        'The username is the exact word resend. Paste the key as the password.'
      ],
      link: { label: 'Open Resend API keys', url: 'https://resend.com/api-keys' },
      notes: ['The From email must be on the verified domain.']
    }
  },
  zoho: {
    label: 'Zoho Mail', host: 'smtp.zoho.com', port: 465, encryption: 'ssl',
    usernameHelp: 'Your full Zoho email address',
    passwordHelp: 'A Zoho application-specific password',
    guide: {
      title: 'Get a Zoho app password',
      steps: [
        'Turn on two-factor authentication in Zoho Accounts (Security).',
        'Open Security > App Passwords and click Generate New Password. Name it "RelayOne".',
        'Copy the password. It is shown only once.',
        'Use your full Zoho email as the username and the From email.'
      ],
      link: { label: 'Open Zoho Accounts', url: 'https://accounts.zoho.com/home#security/security_pwd' },
      notes: ['Accounts in India use smtp.zoho.in, and EU accounts use smtp.zoho.eu, as the host.']
    }
  },
  custom: {
    label: 'Other SMTP server',
    usernameHelp: 'The SMTP login given by your provider',
    passwordHelp: 'The SMTP password given by your provider',
    guide: {
      title: 'Using another SMTP server',
      steps: [
        'Ask your email provider or IT team for the SMTP host, port, encryption (STARTTLS on 587 or SSL on 465), username and password.',
        'Many providers need an app password or SMTP key instead of the normal login password. Look for "app password" or "SMTP credentials" in their security settings.',
        'Use a From email that your provider allows you to send as.'
      ],
      link: null,
      notes: []
    }
  }
};
