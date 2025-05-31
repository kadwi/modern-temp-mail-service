const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const dns = require('dns').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory storage
const emailBoxes = new Map();
let availableDomains = new Set();

// Function to verify MX and A records for a domain
async function verifyDomainRecords(domain) {
    try {
        // Check MX records
        const mxRecords = await dns.resolveMx(domain);
        const hasMxRecord = mxRecords.some(record => 
            record.exchange.includes('mail.' + domain) && record.priority === 1
        );

        if (!hasMxRecord) {
            console.log(`Domain ${domain} - MX record not properly configured`);
            return false;
        }

        // Check A record for mail subdomain
        const mailServer = 'mail.' + domain;
        try {
            await dns.resolve4(mailServer);
            console.log(`Domain ${domain} - Valid configuration detected`);
            return true;
        } catch (err) {
            console.log(`Domain ${domain} - A record for ${mailServer} not found`);
            return false;
        }
    } catch (err) {
        console.log(`Domain ${domain} - DNS verification failed:`, err.code);
        return false;
    }
}

// Function to discover and verify new domains
async function discoverDomains() {
    try {
        // Load domains from config file
        const domainsFile = await fs.readFile(path.join(__dirname, 'config', 'domains.json'), 'utf8');
        const configuredDomains = JSON.parse(domainsFile).domains;
        
        for (const domain of configuredDomains) {
            if (!availableDomains.has(domain)) {
                const isValid = await verifyDomainRecords(domain);
                if (isValid) {
                    availableDomains.add(domain);
                    console.log(`Added configured domain: ${domain}`);
                }
            }
        }
    } catch (error) {
        console.error('Error loading configured domains:', error);
    }
}

// Function to check new domain
async function checkNewDomain(domain) {
    if (!availableDomains.has(domain)) {
        const isValid = await verifyDomainRecords(domain);
        if (isValid) {
            availableDomains.add(domain);
            console.log(`Auto-detected new domain: ${domain}`);
            // Notify connected clients about new domain
            io.emit('newDomain', domain);
            return true;
        }
    }
    return false;
}

// Generate random string for email aliases
function generateRandomAlias(length = 10) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// API Endpoints
app.get('/api/domains', async (req, res) => {
    try {
        // Auto-discover domains
        await discoverDomains();
        
        const domainsConfig = await fs.readFile(path.join(__dirname, 'config', 'domains.json'), 'utf8');
        const config = JSON.parse(domainsConfig);
        
        res.json({ 
            success: true, 
            domains: Array.from(availableDomains),
            instructions: config.instructions 
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post('/api/create-email', async (req, res) => {
    try {
        let { alias, domain } = req.body;
        
        if (req.body.random) {
            alias = generateRandomAlias();
            domain = Array.from(availableDomains)[Math.floor(Math.random() * availableDomains.size)];
        }

        if (!alias) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email parameters' 
            });
        }

        // Check if domain is new and valid
        if (!availableDomains.has(domain)) {
            const isValid = await checkNewDomain(domain);
            if (!isValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or improperly configured domain' 
                });
            }
        }

        const email = `${alias}@${domain}`.toLowerCase();
        
        // Initialize email box if it doesn't exist
        if (!emailBoxes.has(email)) {
            emailBoxes.set(email, []);
        }

        res.json({ 
            success: true, 
            email 
        });
    } catch (error) {
        console.error('Error creating email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get('/api/get-email', (req, res) => {
    try {
        const email = req.query.email?.toLowerCase();
        
        if (!email || !emailBoxes.has(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email address' 
            });
        }

        res.json({ 
            success: true, 
            messages: emailBoxes.get(email) 
        });
    } catch (error) {
        console.error('Error retrieving emails:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// WebSocket handling
io.on('connection', (socket) => {
    console.log('Client connected');
    let currentRoom = null;

    socket.on('subscribe', ({ email }) => {
        if (email && emailBoxes.has(email)) {
            if (currentRoom) {
                socket.leave(currentRoom);
            }
            currentRoom = email.toLowerCase();
            socket.join(currentRoom);
            console.log(`Client subscribed to ${currentRoom}`);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.leave(currentRoom);
            console.log(`Client unsubscribed from ${currentRoom}`);
        }
        console.log('Client disconnected');
    });
});

// Initialize domains and start server
async function initializeServer() {
    try {
        // Initial domain discovery
        await discoverDomains();
        
        // Start periodic domain discovery (every 5 minutes)
        setInterval(discoverDomains, 5 * 60 * 1000);

        const HTTP_PORT = process.env.PORT || 8000;
        server.listen(HTTP_PORT, () => {
            console.log(`Server running on port ${HTTP_PORT}`);
            console.log('Available domains:', Array.from(availableDomains));
        });
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
initializeServer();
