
Built by https://www.blackbox.ai

---

# Modern Temp Mail Service

## Project Overview
**Modern Temp Mail Service** is a secure and efficient temporary email service that allows users to create disposable email addresses instantly. It provides real-time email receiving functionality while ensuring privacy protection by allowing users to stay anonymous. With a clean user interface built using Tailwind CSS and real-time updates powered by Socket.IO, this service aims to enhance the user experience when managing temporary emails.

## Installation
To get started with the Modern Temp Mail Service, follow these installation instructions:

1. Clone the repository:
   ```bash
   git clone https://github.com/<username>/modern-tempmail.git
   cd modern-tempmail
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

4. Open your web browser and visit `http://localhost:8000` to access the application.

## Usage
Users can create temporary email addresses by following these steps:
1. Enter a custom alias in the provided input field or click "Generate Random Email" to create an email address automatically.
2. Select a domain from the dropdown menu.
3. Click on "Create Email" to generate your temporary email address.
4. Access the email inbox section to view received messages.

### API Endpoints
- **Create Email**
  - **POST** `/api/create-email`
  - **Request Body:** 
    ```json
    {
      "alias": "yourname", // Optional
      "domain": "tempmail.com", // Optional
      "random": true // Optional, generates random email if true
    }
    ```

- **Get Email Messages**
  - **GET** `/api/get-email?email=yourname@tempmail.com`

- **List Available Domains**
  - **GET** `/api/domains`

## Features
- Create and manage temporary email addresses.
- View received emails in a user-friendly interface.
- Real-time updates via WebSockets.
- Support for multiple email domains.

## Dependencies
The project uses the following npm packages:
- **express**: ^4.18.2 - Web framework for Node.js.
- **socket.io**: ^4.7.2 - Enables real-time, bidirectional communication.
- **smtp-server**: ^3.13.0 - An SMTP server for handling emails.
- **mailparser**: ^3.6.5 - A library for parsing email messages.
- **nodemon**: ^3.0.1 - Development dependency for auto-restarting the server.

## Project Structure
```
/modern-tempmail
├── css
│   └── style.css        # Custom styling for the application.
├── config
│   └── domains.json     # Configuration file for email domains.
├── js
│   └── main.js          # JavaScript for front-end functionality.
├── index.html           # Main HTML file for the application layout.
├── package.json         # NPM configuration file with dependencies and scripts.
├── package-lock.json    # Automatically generated based on package.json.
└── server.js            # Main server file that sets up the Express app.
```

## License
This project is licensed under the MIT License. See the LICENSE file for details.

---

For any questions or contributions, feel free to open an issue or submit a pull request!