document.addEventListener('DOMContentLoaded', () => {
    // Initialize Socket.io connection
    const socket = io(window.location.origin, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
    });

    // DOM Elements
    const customEmailInput = document.getElementById('custom-email');
    const domainSelect = document.getElementById('domain-select');
    const createEmailBtn = document.getElementById('create-email');
    const randomEmailBtn = document.getElementById('random-email');
    const copyEmailBtn = document.getElementById('copy-email');
    const currentEmailSection = document.getElementById('current-email-section');
    const currentEmailDisplay = document.getElementById('current-email');
    const emailInbox = document.getElementById('email-inbox');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // Modal Elements
    const apiDocModal = document.getElementById('apiDocModal');
    const domainModal = document.getElementById('domainModal');
    const apiDocTrigger = document.getElementById('apiDocTrigger');
    const domainModalTrigger = document.getElementById('domainModalTrigger');
    const closeApiDocModal = document.getElementById('closeApiDocModal');
    const closeDomainModal = document.getElementById('closeDomainModal');

    let currentEmail = '';

    // Socket event handlers
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        showNotification('Connection error. Some features may be limited.', 'error');
    });

    socket.on('connect', () => {
        console.log('Socket connected successfully');
    });

    socket.on('newEmail', (message) => {
        console.log('New email received:', message);
        displayEmailMessage(message);
        showNotification('New email received!');
    });

    // Handle new domain detection
    socket.on('newDomain', (domain) => {
        console.log('New domain detected:', domain);
        addDomainToSelect(domain);
        showNotification(`New domain detected: ${domain}`);
    });

    // Add domain to select dropdown
    function addDomainToSelect(domain) {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = `@${domain}`;
        domainSelect.appendChild(option);
    }

    // Modal handlers
    function openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Close modals when clicking outside
    [apiDocModal, domainModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Modal event listeners
    apiDocTrigger.addEventListener('click', () => openModal(apiDocModal));
    domainModalTrigger.addEventListener('click', () => openModal(domainModal));
    closeApiDocModal.addEventListener('click', () => closeModal(apiDocModal));
    closeDomainModal.addEventListener('click', () => closeModal(domainModal));

    // Show notification
    function showNotification(message, type = 'success') {
        console.log('Showing notification:', message, type);
        notificationMessage.textContent = message;
        notification.classList.remove('hidden');
        notification.classList.remove('bg-black', 'bg-red-500');
        notification.classList.add(type === 'success' ? 'bg-black' : 'bg-red-500');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Create custom email
    async function createCustomEmail() {
        const alias = customEmailInput.value.trim();
        const domain = domainSelect.value;

        if (!alias) {
            showNotification('Please enter an email alias', 'error');
            return;
        }

        createEmailBtn.classList.add('loading');
        try {
            console.log('Creating custom email:', { alias, domain });
            const response = await fetch('/api/create-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ alias, domain }),
            });

            const data = await response.json();
            console.log('Create email response:', data);

            if (data.success) {
                currentEmail = data.email;
                displayCurrentEmail(data.email);
                showNotification('Email created successfully!');
                setupEmailSocket(data.email);
                customEmailInput.value = '';
            } else {
                showNotification(data.message || 'Failed to create email', 'error');
            }
        } catch (error) {
            console.error('Error creating email:', error);
            showNotification('Error creating email', 'error');
        } finally {
            createEmailBtn.classList.remove('loading');
        }
    }

    // Generate random email
    async function generateRandomEmail() {
        randomEmailBtn.classList.add('loading');
        try {
            console.log('Generating random email');
            const response = await fetch('/api/create-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ random: true }),
            });

            const data = await response.json();
            console.log('Random email response:', data);

            if (data.success) {
                currentEmail = data.email;
                displayCurrentEmail(data.email);
                showNotification('Random email generated!');
                setupEmailSocket(data.email);
            } else {
                showNotification(data.message || 'Failed to generate email', 'error');
            }
        } catch (error) {
            console.error('Error generating email:', error);
            showNotification('Error generating email', 'error');
        } finally {
            randomEmailBtn.classList.remove('loading');
        }
    }

    // Display current email
    function displayCurrentEmail(email) {
        console.log('Displaying email:', email);
        currentEmailDisplay.textContent = email;
        currentEmailSection.classList.remove('hidden');
        document.querySelector('#emailSection').scrollIntoView({ behavior: 'smooth' });
    }

    // Copy email to clipboard
    async function copyEmailToClipboard() {
        try {
            await navigator.clipboard.writeText(currentEmail);
            showNotification('Email copied to clipboard!');
        } catch (error) {
            console.error('Error copying email:', error);
            showNotification('Failed to copy email', 'error');
        }
    }

    // Display email message
    function displayEmailMessage(message) {
        const emailItem = document.createElement('div');
        emailItem.className = 'email-item bg-white p-6 rounded-lg shadow-sm border border-gray-200';
        
        emailItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="space-y-1">
                    <p class="font-medium text-gray-900">${escapeHtml(message.from)}</p>
                    <p class="text-sm text-gray-600">${escapeHtml(message.subject)}</p>
                </div>
                <span class="text-xs text-gray-500">${new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <div class="mt-4 text-gray-700 whitespace-pre-wrap">
                ${escapeHtml(message.body)}
            </div>
        `;

        if (emailInbox.firstChild.classList.contains('text-center')) {
            emailInbox.innerHTML = '';
        }
        
        emailInbox.insertBefore(emailItem, emailInbox.firstChild);
    }

    // Setup WebSocket connection for real-time emails
    function setupEmailSocket(email) {
        console.log('Setting up socket for email:', email);
        socket.emit('subscribe', { email });
        emailInbox.innerHTML = '<div class="text-center text-gray-500 py-8">No messages yet</div>';
    }

    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }

    // Refresh inbox periodically
    async function refreshInbox() {
        if (!currentEmail) return;
        
        try {
            console.log('Refreshing inbox for:', currentEmail);
            const response = await fetch(`/api/get-email?email=${encodeURIComponent(currentEmail)}`);
            const data = await response.json();
            console.log('Refresh inbox response:', data);
            
            if (data.success) {
                emailInbox.innerHTML = '';
                if (data.messages.length === 0) {
                    emailInbox.innerHTML = '<div class="text-center text-gray-500 py-8">No messages yet</div>';
                } else {
                    data.messages.forEach(message => displayEmailMessage(message));
                }
            }
        } catch (error) {
            console.error('Error refreshing inbox:', error);
        }
    }

    // Event listeners
    createEmailBtn.addEventListener('click', createCustomEmail);
    randomEmailBtn.addEventListener('click', generateRandomEmail);
    copyEmailBtn.addEventListener('click', copyEmailToClipboard);
    
    customEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createCustomEmail();
        }
    });

    // Keyboard shortcuts for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(apiDocModal);
            closeModal(domainModal);
        }
    });

    // Auto-refresh inbox every 30 seconds
    setInterval(refreshInbox, 30000);

    // Load available domains
    console.log('Loading available domains');
    fetch('/api/domains')
        .then(response => response.json())
        .then(data => {
            console.log('Domains loaded:', data);
            if (data.success && Array.isArray(data.domains)) {
                domainSelect.innerHTML = data.domains
                    .map(domain => `<option value="${domain}">@${domain}</option>`)
                    .join('');
            }
        })
        .catch(error => console.error('Error loading domains:', error));
});
