# TempMail Service (Auto Domain Detection)

A temporary email service with automatic domain detection through DNS verification.

## Features

- Automatic domain detection through DNS verification
- Real-time domain updates without server restart
- DNS-based domain validation
- WebSocket notifications for new domains
- Modern, responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

## Adding New Domains

To add a new domain, simply configure your DNS records. The server will automatically detect and add your domain when proper DNS configuration is found.

### DNS Configuration Steps

1. Add MX Record:
```
Host: @ (or blank)
Type: MX
Priority: 1
Value: mail.yourdomain.com
TTL: 86400
```

2. Add A Record:
```
Host: mail
Type: A
Value: YOUR_SERVER_IP
TTL: 86400
```

3. (Recommended) Add SPF Record:
```
Host: @ (or blank)
Type: TXT
Value: v=spf1 ip4:YOUR_SERVER_IP -all
TTL: 86400
```

The server will:
- Automatically detect these DNS records
- Verify the configuration
- Add the domain to available domains
- Notify all connected clients

## How Auto-Detection Works

1. DNS Verification:
   - Checks MX record points to mail.yourdomain.com
   - Verifies A record for mail subdomain exists
   - Validates record configurations

2. Real-time Updates:
   - Periodic DNS checks (every 5 minutes)
   - Immediate domain availability after verification
   - WebSocket notifications to all clients

3. Domain Management:
   - Automatic domain addition when valid DNS found
   - Real-time domain list updates
   - No server restart required

## API Endpoints

1. List Available Domains:
```
GET /api/domains
```

2. Create Email:
```
POST /api/create-email
Content-Type: application/json

{
    "alias": "yourname",     // Optional
    "domain": "tempmail.com" // Optional
    "random": true          // Optional, generates random email if true
}
```

3. Get Email Messages:
```
GET /api/get-email?email=yourname@tempmail.com
```

## Directory Structure

```
tempmail-auto/
├── config/
│   └── domains.json     # Initial domains & auto-detect settings
├── css/
│   └── style.css       # Custom styles
├── js/
│   └── main.js         # Frontend JavaScript
├── index.html          # Main webpage
├── package.json        # Dependencies
├── README.md          # This file
└── server.js          # Server with auto-detection
```

## Key Benefits

1. Automated Management:
   - No manual configuration needed
   - Real-time domain detection
   - Automatic updates without restart

2. DNS-Based Security:
   - Domain ownership verification
   - Proper mail server configuration check
   - SPF record validation

3. Scalability:
   - Easy domain addition
   - No configuration files to manage
   - Unlimited domain support

## Verification Process

The server verifies:
1. MX Record:
   - Existence
   - Correct priority
   - Points to mail subdomain

2. A Record:
   - mail subdomain exists
   - Valid IP configuration

3. Optional SPF:
   - Proper format
   - Server IP inclusion

## WebSocket Events

1. New Domain Detection:
```javascript
socket.on('newDomain', (domain) => {
    console.log('New domain detected:', domain);
    // Domain is automatically added to selection
});
```

## Recommended Use Cases

- Public email services
- Multi-domain environments
- Dynamic domain management
- Large scale deployments
- Automated systems

## Limitations

- Requires proper DNS configuration
- Initial DNS propagation delay
- Higher server resource usage for DNS checks
