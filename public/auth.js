// Authentication System for Nexus Bot Dashboard (Bypass Mode)

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in
    checkLoginStatus();

    // Handle routing (simplified)
    handleRouting();
});

function handleRouting() {
    const path = window.location.pathname;

    // If we somehow get to auth callback, just redirect home
    if (path === '/auth/discord/callback') {
        window.location.href = '/';
        return;
    }

    // If we try to go to auth, redirect home
    if (path === '/auth/discord') {
        window.location.href = '/';
        return;
    }
}

function checkLoginStatus() {
    // BYPASS LOGIN FOR DEVELOPMENT
    // Automatically set mock user if not present
    if (!localStorage.getItem('nexus_bot_user')) {
        const mockUser = {
            id: '123456789',
            username: 'DevUser',
            discriminator: '0000',
            avatar: null
        };
        localStorage.setItem('nexus_bot_user', JSON.stringify(mockUser));
        console.log('Dev mode: Mock user set');
    }

    // We are always "logged in" now
    if (window.location.pathname.includes('login.html')) {
        window.location.href = '/';
    }
}

function logout() {
    // Clear local storage
    localStorage.removeItem('nexus_bot_user');
    localStorage.removeItem('nexus_bot_guilds');
    localStorage.removeItem('nexus_bot_access_token');

    // Reload to re-trigger the mock login (effectively a soft reset)
    window.location.reload();
}

// Add logout functionality to dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Add logout button to dashboard header if on dashboard page
    if (document.querySelector('.container')) {
        const header = document.querySelector('header');
        if (header) {
            // Get user info
            const user = JSON.parse(localStorage.getItem('nexus_bot_user') || '{}');
            const username = user.username || 'User';

            // Create user info display
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="username">Welcome, ${username}</span>
            `;
            userInfo.style.cssText = `
                position: absolute;
                top: 20px;
                right: 120px;
                color: white;
                font-size: 14px;
            `;

            // Create logout button
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Logout';
            logoutButton.className = 'btn secondary';
            logoutButton.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 8px 16px;
                font-size: 14px;
            `;
            logoutButton.addEventListener('click', logout);

            header.appendChild(userInfo);
            header.appendChild(logoutButton);
        }
    }
});