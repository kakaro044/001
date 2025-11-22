// Nexus Bot Dashboard JavaScript

// API base URL for local development with dynamic ngrok
const API_BASE_URL = `${window.location.origin}/api`;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize dashboard
    initializeDashboard();

    // Set up event listeners
    setupEventListeners();

    // Load user guilds
    loadUserGuilds();
});

function initializeDashboard() {
    // Initialize any default values or load saved settings
    console.log('Nexus Bot Dashboard initialized');

    // Set up slider value display
    const multiplierSlider = document.getElementById('level-multiplier');
    const multiplierValue = document.getElementById('multiplier-value');

    if (multiplierSlider && multiplierValue) {
        multiplierValue.textContent = multiplierSlider.value + 'x';

        multiplierSlider.addEventListener('input', function () {
            multiplierValue.textContent = this.value + 'x';
        });
    }
}

function setupEventListeners() {
    // Welcome System
    document.getElementById('save-welcome')?.addEventListener('click', function () {
        saveWelcomeSettings();
    });
    document.getElementById('test-welcome')?.addEventListener('click', function () {
        testWelcome();
    });

    // Level System
    document.getElementById('save-level')?.addEventListener('click', function () {
        saveLevelSettings();
    });

    // Music System
    document.getElementById('save-music')?.addEventListener('click', function () {
        saveMusicSettings();
    });

    // VC Generator
    document.getElementById('save-vcgen')?.addEventListener('click', function () {
        saveVCGenSettings();
    });

    // Ticket System
    document.getElementById('save-ticket')?.addEventListener('click', function () {
        saveTicketSettings();
    });

    // Self Roles
    document.getElementById('save-selfrole')?.addEventListener('click', function () {
        saveSelfRoleSettings();
    });

    // YT Notify
    document.getElementById('save-yt')?.addEventListener('click', function () {
        saveYTSettings();
    });

    // Server Management
    document.getElementById('save-server')?.addEventListener('click', function () {
        saveServerSettings();
    });
    document.getElementById('copy-server')?.addEventListener('click', function () {
        copyServerSettings();
    });

    // Security System
    document.getElementById('save-security')?.addEventListener('click', function () {
        saveSecuritySettings();
    });

    // Global Actions
    document.getElementById('save-all')?.addEventListener('click', function () {
        saveAllSettings();
    });

    document.getElementById('reset-all')?.addEventListener('click', function () {
        resetAllSettings();
    });

    // Server selection change
    document.getElementById('server-select')?.addEventListener('change', function () {
        const guildId = this.value;
        if (guildId) {
            loadGuildChannels(guildId);
        } else {
            document.querySelector('.channel-selection').style.display = 'none';
        }
    });
}

async function loadUserGuilds() {
    try {
        // Check if guilds are already in localStorage
        const cachedGuilds = localStorage.getItem('nexus_bot_guilds');
        if (cachedGuilds) {
            const guilds = JSON.parse(cachedGuilds);
            populateServerSelect(guilds);
            return;
        }

        // Fetch guilds from local API
        const response = await fetch(`${API_BASE_URL}/guilds`);
        if (!response.ok) {
            throw new Error(`Failed to fetch guilds: ${response.status}`);
        }
        const guilds = await response.json();

        // Cache guilds
        localStorage.setItem('nexus_bot_guilds', JSON.stringify(guilds));

        // Populate server select
        populateServerSelect(guilds);
    } catch (error) {
        console.error('Error loading guilds:', error);
        showNotification('Failed to load servers', 'error');
    }
}

function populateServerSelect(guilds) {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect) return;

    // Clear existing options
    serverSelect.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a server';
    serverSelect.appendChild(defaultOption);

    // Check if we have any guilds
    if (!guilds || guilds.length === 0) {
        // Show a helpful message
        const helpOption = document.createElement('option');
        helpOption.value = '';
        helpOption.textContent = 'No servers available - Add bot to servers first!';
        helpOption.disabled = true;
        serverSelect.appendChild(helpOption);

        // Also show a notification
        showNotification('Please add the bot to your Discord servers first! Use the bot invitation link.', 'warning');
        return;
    }

    // Add guild options
    let hasManageableGuilds = false;
    guilds.forEach(guild => {
        // Only show guilds where the user has manage guild permissions
        if ((guild.permissions & 0x20) === 0x20) {
            hasManageableGuilds = true;
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = guild.name;
            serverSelect.appendChild(option);
        }
    });

    // If no manageable guilds, show a message
    if (!hasManageableGuilds) {
        const helpOption = document.createElement('option');
        helpOption.value = '';
        helpOption.textContent = 'No manageable servers - Need "Manage Server" permission';
        helpOption.disabled = true;
        serverSelect.appendChild(helpOption);
    }
}

async function loadGuildChannels(guildId) {
    try {
        const response = await fetch(`${API_BASE_URL}/channels/${guildId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch channels: ${response.status}`);
        }
        const channels = await response.json();

        // Populate channel select
        populateChannelSelect(channels);

        // Show channel selection
        document.querySelector('.channel-selection').style.display = 'block';

        // Also populate other selects with channels
        populateSelectsWithChannels(channels);
    } catch (error) {
        console.error('Error loading channels:', error);
        showNotification('Failed to load channels', 'error');
    }
}

function populateChannelSelect(channels) {
    const channelSelect = document.getElementById('channel-select');
    if (!channelSelect) return;

    // Clear existing options
    channelSelect.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a channel';
    channelSelect.appendChild(defaultOption);

    // Filter text channels only
    const textChannels = channels.filter(channel => channel.type === 0 || channel.type === 5);

    // Add channel options
    textChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name}`;
        channelSelect.appendChild(option);
    });
}

function populateSelectsWithChannels(channels) {
    // Filter text channels only
    const textChannels = channels.filter(channel => channel.type === 0 || channel.type === 5);
    // Filter voice channels
    const voiceChannels = channels.filter(channel => channel.type === 2);

    // Update all channel selects in the dashboard
    const channelSelects = [
        'welcome-channel',
        'level-channel',
        'level-check-channel',
        'log-channel',
        'ticket-channel',
        'selfrole-channel',
        'yt-notify-channel',
        'leave-channel'
    ];

    channelSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Save current value
            const currentValue = select.value;

            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add channel options
            textChannels.forEach(channel => {
                const option = document.createElement('option');
                option.value = channel.id;
                option.textContent = `#${channel.name}`;
                select.appendChild(option);
            });

            // Restore current value if it still exists
            if (textChannels.some(c => c.id === currentValue)) {
                select.value = currentValue;
            }
        }
    });

    // Update VC Generator select (Voice Channels)
    const vcGenSelect = document.getElementById('vcgen-channel');
    if (vcGenSelect) {
        const currentValue = vcGenSelect.value;
        while (vcGenSelect.options.length > 1) {
            vcGenSelect.remove(1);
        }
        voiceChannels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = `🔊 ${channel.name}`;
            vcGenSelect.appendChild(option);
        });
        if (voiceChannels.some(c => c.id === currentValue)) {
            vcGenSelect.value = currentValue;
        }
    }

    // Update DJ role select with roles
    const djRoleSelect = document.getElementById('dj-role');
    if (djRoleSelect) {
        // For now, we'll just add some default roles
        // In a real implementation, you would fetch roles from the Discord API
        const defaultRoles = [
            { id: 'everyone', name: '@everyone' },
            { id: 'mod', name: '@Moderator' },
            { id: 'admin', name: '@Admin' }
        ];

        // Save current value
        const currentValue = djRoleSelect.value;

        // Clear existing options except the first one
        while (djRoleSelect.options.length > 1) {
            djRoleSelect.remove(1);
        }

        // Add role options
        defaultRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            djRoleSelect.appendChild(option);
        });

        // Restore current value if it still exists
        if (defaultRoles.some(r => r.id === currentValue)) {
            djRoleSelect.value = currentValue;
        }
    }
}

function saveWelcomeSettings() {
    const settings = {
        enabled: document.getElementById('welcome-toggle')?.checked,
        channel: document.getElementById('welcome-channel')?.value,
        message: document.getElementById('welcome-message')?.value,
        autoRole: document.getElementById('auto-role')?.value,
        color: document.getElementById('welcome-color')?.value
    };

    saveSettingsForCurrentGuild('welcome', settings);
}

function saveLevelSettings() {
    const settings = {
        enabled: document.getElementById('level-toggle')?.checked,
        channel: document.getElementById('level-channel')?.value,
        checkChannel: document.getElementById('level-check-channel')?.value,
        multiplier: document.getElementById('level-multiplier')?.value
    };

    saveSettingsForCurrentGuild('level', settings);
}

function saveMusicSettings() {
    const settings = {
        enabled: document.getElementById('music-toggle')?.checked,
        djRole: document.getElementById('dj-role')?.value,
        maxQueue: document.getElementById('max-queue')?.value
    };

    saveSettingsForCurrentGuild('music', settings);
}

function saveVCGenSettings() {
    const settings = {
        enabled: document.getElementById('vcgen-toggle')?.checked,
        channel: document.getElementById('vcgen-channel')?.value
    };
    saveSettingsForCurrentGuild('vcgen', settings);
}

function saveTicketSettings() {
    const settings = {
        enabled: document.getElementById('ticket-toggle')?.checked,
        channel: document.getElementById('ticket-channel')?.value,
        category: document.getElementById('ticket-category')?.value
    };
    saveSettingsForCurrentGuild('ticket', settings);
}

function saveSelfRoleSettings() {
    const settings = {
        enabled: document.getElementById('selfrole-toggle')?.checked,
        channel: document.getElementById('selfrole-channel')?.value
    };
    saveSettingsForCurrentGuild('selfrole', settings);
}

function saveYTSettings() {
    const settings = {
        channelId: document.getElementById('yt-channel-id')?.value,
        notifyChannel: document.getElementById('yt-notify-channel')?.value,
        message: document.getElementById('yt-message')?.value
    };
    saveSettingsForCurrentGuild('yt_notify', settings);
}

function saveServerSettings() {
    const settings = {
        leaveNotify: document.getElementById('leave-notify-toggle')?.checked,
        leaveChannel: document.getElementById('leave-channel')?.value
    };
    saveSettingsForCurrentGuild('server_management', settings);
}

function saveSecuritySettings() {
    const settings = {
        antiSpam: document.getElementById('antispam-toggle')?.checked,
        banTracking: document.getElementById('bantrack-toggle')?.checked,
        logChannel: document.getElementById('log-channel')?.value
    };

    saveSettingsForCurrentGuild('security', settings);
}

async function saveSettingsForCurrentGuild(system, settings) {
    const guildId = document.getElementById('server-select')?.value;

    if (!guildId) {
        showNotification('Please select a server first', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guildId: guildId,
                settings: {
                    [system]: settings
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save settings: ${response.status}`);
        }

        const result = await response.json();
        showNotification(`${system.charAt(0).toUpperCase() + system.slice(1)} settings saved successfully!`, 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification(`Failed to save ${system} settings`, 'error');
    }
}

function testWelcome() {
    showNotification('Sending test welcome message...', 'info');
    // In a real app, this would call an API endpoint
    setTimeout(() => {
        showNotification('Test welcome message sent!', 'success');
    }, 1000);
}

function copyServerSettings() {
    showNotification('Copying server settings...', 'info');
    // In a real app, this would call an API endpoint
    setTimeout(() => {
        showNotification('Server settings copied to clipboard!', 'success');
    }, 1000);
}

function saveAllSettings() {
    // Save all settings at once
    saveWelcomeSettings();
    saveLevelSettings();
    saveMusicSettings();
    saveVCGenSettings();
    saveTicketSettings();
    saveSelfRoleSettings();
    saveYTSettings();
    saveServerSettings();
    saveSecuritySettings();

    showNotification('All settings saved successfully!', 'success');
}

function resetAllSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        // Reset all form elements to default values
        document.getElementById('welcome-toggle').checked = true;
        document.getElementById('welcome-channel').value = 'general';
        document.getElementById('welcome-message').value = '{member_mention} Welcome to {server_name}!';
        document.getElementById('welcome-color').value = '#3498db';
        document.getElementById('auto-role').value = 'none';

        document.getElementById('level-toggle').checked = true;
        document.getElementById('level-channel').value = 'general';
        document.getElementById('level-check-channel').value = 'commands';
        document.getElementById('level-multiplier').value = 1;
        document.getElementById('multiplier-value').textContent = '1x';

        document.getElementById('music-toggle').checked = true;
        document.getElementById('dj-role').value = 'everyone';
        document.getElementById('max-queue').value = 100;

        document.getElementById('vcgen-toggle').checked = false;
        document.getElementById('vcgen-channel').value = 'create-vc';

        document.getElementById('ticket-toggle').checked = false;
        document.getElementById('ticket-channel').value = 'tickets';
        document.getElementById('ticket-category').value = 'support';

        document.getElementById('selfrole-toggle').checked = false;
        document.getElementById('selfrole-channel').value = 'roles';

        document.getElementById('yt-channel-id').value = '';
        document.getElementById('yt-notify-channel').value = 'announcements';
        document.getElementById('yt-message').value = '{channel_name} just uploaded a new video! {video_link}';

        document.getElementById('leave-notify-toggle').checked = false;
        document.getElementById('leave-channel').value = 'logs';

        document.getElementById('antispam-toggle').checked = true;
        document.getElementById('bantrack-toggle').checked = true;
        document.getElementById('log-channel').value = 'logs';

        showNotification('All settings reset to defaults!', 'info');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        case 'info':
        default:
            notification.style.backgroundColor = '#3498db';
    }

    // Add to document
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add some interactive elements
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-5px)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
    });
});