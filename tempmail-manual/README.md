# TempMail Service (Manual Domain Management)

A temporary email service with manual domain management through configuration files.

## Features

- Manual domain management through config/domains.json
- Real-time email reception
- Custom and random email generation
- WebSocket-based live updates
- Modern, responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure domains in `config/domains.json`:
```json
{
    "domains": [
        "yourdomain.com",
        "anotherdomain.com"
    ]
}
```

3. Start the server:
```bash
npm start
```

## Adding New Domains

1. Edit `config/domains.json`
2. Add your domain to the domains array
3. Restart the server

Example:
```json
{
    "domains": [
        "tempmail.com",
        "temp.mail",
        "wxmail.com"  // Your new domain
    ]
}
```

## DNS Configuration

For each domain, set up these DNS records:

1. MX Record:
```
Host: @ (or blank)
Type: MX
Priority: 1
Value: mail.yourdomain.com
```

2. A Record:
```
Host: mail
Type: A
Value: YOUR_SERVER_IP
```

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

## Security Considerations

- Only domains listed in config/domains.json will be accepted
- All domain changes require server restart
- Admin has full control over available domains

## Directory Structure

```
tempmail-manual/
├── config/
│   └── domains.json     # Domain configuration
├── css/
│   └── style.css       # Custom styles
├── js/
│   └── main.js         # Frontend JavaScript
├── index.html          # Main webpage
├── package.json        # Dependencies
├── README.md          # This file
└── server.js          # Server implementation
```

## Key Benefits

1. Complete Control:
   - Admin manages all available domains
   - No unexpected domain additions
   - Controlled environment

2. Simple Setup:
   - No DNS verification required
   - Quick domain addition through config
   - Immediate domain availability after restart

3. Security:
   - Predictable domain list
   - No unauthorized domain usage
   - Configuration-based validation

## Limitations

- Requires server restart for new domains
- Manual domain management
- No automatic domain verification

## Recommended Use Cases

- Private email services
- Controlled testing environments
- Situations requiring strict domain control
- Small to medium scale deployments
