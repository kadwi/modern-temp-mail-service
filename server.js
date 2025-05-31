const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

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

// In-memory storage for emails and their messages
const emailBoxes = new Map();

// Load available domains
let availableDomains = [];
async function loadDomains() {
    try {
        const domainsFile = await fs.readFile(path.join(__dirname, 'config', 'domains.json'), 'utf8');
        const domainsConfig = JSON.parse(domainsFile);
        availableDomains = domainsConfig.domains;
        return domainsConfig;
    } catch (error) {
        console.error('Error loading domains:', error);
        availableDomains = ['tempmail.com', 'temp.mail']; // Fallback domains
        return { domains: availableDomains };
    }
}

// Generate random string for email aliases
function generateRandomAlias(length = 10) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// API Endpoints
app.get('/api/domains', async (req, res) => {
    try {
        const domainsConfig = await loadDomains();
        res.json({ 
            success: true, 
            domains: domainsConfig.domains,
            instructions: domainsConfig.instructions 
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post('/api/create-email', (req, res) => {
    try {
        let { alias, domain } = req.body;
        
        if (req.body.random) {
            alias = generateRandomAlias();
            domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
        }

        if (!alias || !domain) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email parameters' 
            });
        }

        if (!availableDomains.includes(domain)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid domain' 
            });
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
            // Leave previous room if any
            if (currentRoom) {
                socket.leave(currentRoom);
            }
            
            // Join new room
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

// Initialize domains before starting server
loadDomains().then(() => {
    const HTTP_PORT = process.env.PORT || 8000;

    server.listen(HTTP_PORT, () => {
        console.log(`Server running on port ${HTTP_PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
