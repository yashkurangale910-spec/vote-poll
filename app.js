// ===================================
// CITIZENVOICE - MAIN APPLICATION
// Community Public Opinion Poll System
// ===================================

// === Global State ===
const state = {
    currentSection: 'home',
    darkMode: false,
    polls: [],
    userVotes: [],
    userPolls: [],
    currentStep: 1,
    newPoll: {
        title: '',
        description: '',
        category: 'infrastructure',
        type: 'single',
        options: ['', ''],
        duration: 7,
        allowResultsView: true,
        featured: false
    },
    userId: null,
    stats: {
        totalVotes: 0,
        activePolls: 0,
        participants: 0,
        streakDays: 0
    }
};

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadFromLocalStorage();
    setupEventListeners();
    createParticles();
    createSamplePolls();
    renderAllSections();
    updateAllStats();
    startLiveSimulation();
});

function startLiveSimulation() {
    // Simulate someone voting every 15-30 seconds
    setInterval(() => {
        if (state.polls.length === 0) return;

        const activePolls = state.polls.filter(p => p.status === 'active');
        if (activePolls.length === 0) return;

        const randomPoll = activePolls[Math.floor(Math.random() * activePolls.length)];
        const randomOption = randomPoll.options[Math.floor(Math.random() * randomPoll.options.length)];

        randomOption.votes++;
        randomPoll.totalVotes++;
        state.stats.totalVotes++;

        // If we are currently viewing this poll modal, refresh it
        const modal = document.getElementById('pollModal');
        if (modal.classList.contains('active')) {
            const currentTitle = modal.querySelector('.poll-title')?.textContent;
            if (currentTitle === randomPoll.title) {
                openPollModal(randomPoll.id);
            }
        }

        // Only update if we are on appropriate sections
        if (state.currentSection === 'home' || state.currentSection === 'browse' || state.currentSection === 'analytics') {
            renderAllSections();
        }

        console.log(`Live Update: New vote for "${randomPoll.title}" - ${randomOption.text}`);
    }, 20000);
}

function initializeApp() {
    // Check dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        state.darkMode = true;
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀️';
    }

    // Generate or retrieve user ID
    state.userId = localStorage.getItem('userId') || generateUserId();
    localStorage.setItem('userId', state.userId);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadFromLocalStorage() {
    // Load polls
    const savedPolls = localStorage.getItem('polls');
    if (savedPolls) {
        state.polls = JSON.parse(savedPolls);
    }

    // Load user votes
    const savedVotes = localStorage.getItem('userVotes_' + state.userId);
    if (savedVotes) {
        state.userVotes = JSON.parse(savedVotes);
    }

    // Load user created polls
    const savedUserPolls = localStorage.getItem('userPolls_' + state.userId);
    if (savedUserPolls) {
        state.userPolls = JSON.parse(savedUserPolls);
    }

    // Load stats
    const savedStats = localStorage.getItem('stats');
    if (savedStats) {
        state.stats = JSON.parse(savedStats);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('polls', JSON.stringify(state.polls));
    localStorage.setItem('userVotes_' + state.userId, JSON.stringify(state.userVotes));
    localStorage.setItem('userPolls_' + state.userId, JSON.stringify(state.userPolls));
    localStorage.setItem('stats', JSON.stringify(state.stats));
}

// === Event Listeners ===
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Search and filters
    document.getElementById('searchInput')?.addEventListener('input', filterPolls);
    document.getElementById('categoryFilter')?.addEventListener('change', filterPolls);
    document.getElementById('statusFilter')?.addEventListener('change', filterPolls);
    document.getElementById('sortFilter')?.addEventListener('change', filterPolls);

    // Poll type change
    document.getElementById('pollType')?.addEventListener('change', handlePollTypeChange);

    // Scroll handler for Back to Top button
    window.addEventListener('scroll', handleScroll);

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
        });
    });

    // FAQ Search
    document.getElementById('faqSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'block' : 'none';
        });
    });
}

function handleScroll() {
    const backToTop = document.getElementById('backToTop');
    if (window.pageYOffset > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// === Navigation ===
function switchSection(sectionId) {
    // Update active section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

    state.currentSection = sectionId;

    // Render section-specific content
    if (sectionId === 'browse') {
        renderAllPolls();
    } else if (sectionId === 'analytics') {
        renderAnalytics();
    } else if (sectionId === 'activity') {
        renderActivity();
    } else if (sectionId === 'home') {
        renderHome();
    }
}

function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode');

    const icon = document.getElementById('themeToggle').querySelector('.theme-icon');
    icon.textContent = state.darkMode ? '☀️' : '🌙';

    localStorage.setItem('darkMode', state.darkMode);
}

// === Sample Data Creation ===
function createSamplePolls() {
    if (state.polls.length > 0) return; // Already have polls

    const samplePolls = [
        {
            id: 'poll_1',
            title: 'Should our city invest in more public parks?',
            description: 'Community parks provide recreation spaces, improve air quality, and increase property values. Should we allocate budget for new parks?',
            category: 'recreation',
            type: 'yesno',
            options: [
                { id: 'opt_1', text: 'Yes', votes: 342 },
                { id: 'opt_2', text: 'No', votes: 128 },
                { id: 'opt_3', text: 'Abstain', votes: 45 }
            ],
            createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 515,
            allowResultsView: true,
            featured: true,
            creator: 'admin'
        },
        {
            id: 'poll_2',
            title: 'Preferred public transportation improvements',
            description: 'Help us prioritize transportation infrastructure investments for the next fiscal year.',
            category: 'infrastructure',
            type: 'single',
            options: [
                { id: 'opt_1', text: 'More bus routes', votes: 234 },
                { id: 'opt_2', text: 'Light rail expansion', votes: 456 },
                { id: 'opt_3', text: 'Bike lanes', votes: 189 },
                { id: 'opt_4', text: 'Better sidewalks', votes: 123 }
            ],
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 1002,
            allowResultsView: true,
            featured: true,
            creator: 'admin'
        },
        {
            id: 'poll_3',
            title: 'Community center operating hours',
            description: 'When should our community center be open to best serve residents?',
            category: 'recreation',
            type: 'multiple',
            options: [
                { id: 'opt_1', text: 'Early morning (6-9 AM)', votes: 167 },
                { id: 'opt_2', text: 'Daytime (9 AM-5 PM)', votes: 289 },
                { id: 'opt_3', text: 'Evening (5-9 PM)', votes: 412 },
                { id: 'opt_4', text: 'Weekends', votes: 378 }
            ],
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 623,
            allowResultsView: true,
            featured: false,
            creator: 'admin'
        },
        {
            id: 'poll_4',
            title: 'Local environmental initiatives priority',
            description: 'Which environmental initiative should we focus on first?',
            category: 'environment',
            type: 'single',
            options: [
                { id: 'opt_1', text: 'Recycling program expansion', votes: 298 },
                { id: 'opt_2', text: 'Tree planting initiative', votes: 445 },
                { id: 'opt_3', text: 'Solar panel incentives', votes: 367 },
                { id: 'opt_4', text: 'Water conservation', votes: 201 }
            ],
            createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 1 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 1311,
            allowResultsView: true,
            featured: true,
            creator: 'admin'
        },
        {
            id: 'poll_5',
            title: 'Public safety budget allocation',
            description: 'How should we allocate the public safety budget increase?',
            category: 'safety',
            type: 'single',
            options: [
                { id: 'opt_1', text: 'More police officers', votes: 178 },
                { id: 'opt_2', text: 'Fire department equipment', votes: 234 },
                { id: 'opt_3', text: 'Emergency services', votes: 312 },
                { id: 'opt_4', text: 'Community programs', votes: 267 }
            ],
            createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 991,
            allowResultsView: true,
            featured: false,
            creator: 'admin'
        },
        {
            id: 'poll_6',
            title: 'Rate our city services quality',
            description: 'How would you rate the overall quality of city services?',
            category: 'infrastructure',
            type: 'rating',
            options: [
                { id: 'opt_1', text: '1 Star', votes: 23 },
                { id: 'opt_2', text: '2 Stars', votes: 45 },
                { id: 'opt_3', text: '3 Stars', votes: 189 },
                { id: 'opt_4', text: '4 Stars', votes: 267 },
                { id: 'opt_5', text: '5 Stars', votes: 134 }
            ],
            createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
            endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            status: 'active',
            totalVotes: 658,
            allowResultsView: true,
            featured: false,
            creator: 'admin'
        }
    ];

    state.polls = samplePolls;
    state.stats.activePolls = samplePolls.length;
    state.stats.totalVotes = samplePolls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    state.stats.participants = Math.floor(state.stats.totalVotes / 3.2); // Estimate
    state.stats.streakDays = 1;

    saveToLocalStorage();
}

// === Rendering Functions ===
function renderAllSections() {
    renderHome();
    renderAllPolls();
    renderAnalytics();
    renderActivity();
}

function renderHome() {
    // Update hero stats
    document.getElementById('totalVotesHero').textContent = state.stats.totalVotes.toLocaleString();
    document.getElementById('activePollsHero').textContent = state.stats.activePolls;
    document.getElementById('participantsHero').textContent = state.stats.participants.toLocaleString();

    // Render featured polls
    const featuredPolls = state.polls.filter(p => p.featured && p.status === 'active').slice(0, 3);
    const container = document.getElementById('featuredPolls');
    container.innerHTML = featuredPolls.map(poll => createPollCard(poll)).join('');

    // Render trending topics
    const topics = ['Infrastructure', 'Environment', 'Public Safety', 'Education', 'Recreation', 'Health'];
    const trendingContainer = document.getElementById('trendingTopics');
    trendingContainer.innerHTML = topics.map(topic =>
        `<div class="topic-tag" onclick="filterByCategory('${topic.toLowerCase()}')">#${topic}</div>`
    ).join('');
}

function filterByCategory(category) {
    switchSection('browse');
    document.getElementById('categoryFilter').value = category;
    filterPolls();
}

function createPollCard(poll) {
    const timeRemaining = getTimeRemaining(poll.endsAt);
    const hasVoted = state.userVotes.includes(poll.id);

    return `
        <div class="poll-card" onclick="openPollModal('${poll.id}')">
            <div class="poll-header">
                <span class="poll-category">${poll.category}</span>
                <span class="poll-status ${poll.status}">${poll.status}</span>
            </div>
            <h3 class="poll-title">${poll.title}</h3>
            <p class="poll-description">${poll.description}</p>
            <div class="poll-stats">
                <div class="poll-votes">
                    <span>🗳️</span>
                    <span>${poll.totalVotes} votes</span>
                    ${hasVoted ? '<span style="color: var(--success)">✓ Voted</span>' : ''}
                </div>
                <div class="poll-time">${timeRemaining}</div>
            </div>
        </div>
    `;
}

function getTimeRemaining(endsAt) {
    const now = Date.now();
    const diff = endsAt - now;

    if (diff < 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Ending soon';
}

function renderAllPolls() {
    const container = document.getElementById('allPolls');
    const skeletonHTML = Array(6).fill(`
        <div class="skeleton-card">
            <div class="skeleton-item skeleton-header"></div>
            <div class="skeleton-item skeleton-title"></div>
            <div class="skeleton-item skeleton-desc"></div>
            <div class="skeleton-item skeleton-footer"></div>
        </div>
    `).join('');

    container.innerHTML = skeletonHTML;

    setTimeout(() => {
        filterPolls();
    }, 800);
}

function filterPolls() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'active';
    const sort = document.getElementById('sortFilter')?.value || 'newest';

    let filtered = state.polls.filter(poll => {
        const matchesSearch = poll.title.toLowerCase().includes(searchTerm) ||
            poll.description.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || poll.category === category;
        const matchesStatus = status === 'all' || poll.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort
    if (sort === 'newest') {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'popular') {
        filtered.sort((a, b) => b.totalVotes - a.totalVotes);
    } else if (sort === 'ending') {
        filtered.sort((a, b) => a.endsAt - b.endsAt);
    }

    const container = document.getElementById('allPolls');
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 3rem;">No polls found</div>';
    } else {
        container.innerHTML = filtered.map(poll => createPollCard(poll)).join('');
    }
}

// === Poll Modal ===
function openPollModal(pollId) {
    const poll = state.polls.find(p => p.id === pollId);
    if (!poll) return;

    const hasVoted = state.userVotes.includes(pollId);
    const modal = document.getElementById('pollModal');
    const content = document.getElementById('pollDetailContent');

    content.innerHTML = `
        <h2 class="poll-title">${poll.title}</h2>
        <p class="poll-description" style="margin-bottom: 2rem;">${poll.description}</p>
        
        <div style="margin-bottom: 2rem;">
            <span class="poll-category">${poll.category}</span>
            <span class="poll-status ${poll.status}" style="margin-left: 1rem;">${poll.status}</span>
        </div>
        
        ${hasVoted || !poll.allowResultsView ? renderPollResults(poll) : renderVotingInterface(poll)}
        
        <div class="poll-stats" style="margin-top: 2rem; padding-top: 2rem;">
            <div class="poll-votes">
                <span>🗳️ ${poll.totalVotes} total votes</span>
            </div>
            <div class="poll-time">${getTimeRemaining(poll.endsAt)}</div>
        </div>

        <div class="share-actions" style="margin-top: 2rem; display: flex; gap: 1rem;">
            <button class="btn btn-outline" style="flex: 1;" onclick="sharePoll('${poll.id}')">
                <span>🔗</span> Share Poll
            </button>
        </div>
    `;

    modal.classList.add('active');
}

function closePollModal() {
    document.getElementById('pollModal').classList.remove('active');
}

function renderVotingInterface(poll) {
    const inputType = poll.type === 'multiple' ? 'checkbox' : 'radio';

    return `
        <div class="voting-interface">
            <h3 style="margin-bottom: 1rem;">Cast Your Vote</h3>
            ${poll.options.map((option, index) => `
                <label class="vote-option" style="display: flex; align-items: center; padding: 1rem; background: var(--bg-glass); border: 2px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.75rem; cursor: pointer; transition: all var(--transition-base);">
                    <input type="${inputType}" name="vote" value="${option.id}" style="margin-right: 1rem; width: 1.25rem; height: 1.25rem;">
                    <span style="flex: 1; font-weight: 500;">${option.text}</span>
                </label>
            `).join('')}
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="castVote('${poll.id}')">
                Cast Vote 🗳️
            </button>
        </div>
    `;
}

function renderPollResults(poll) {
    const maxVotes = Math.max(...poll.options.map(o => o.votes));

    return `
        <div class="poll-results">
            <h3 style="margin-bottom: 1rem;">Results</h3>
            ${poll.options.map(option => {
        const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes * 100).toFixed(1) : 0;
        const width = maxVotes > 0 ? (option.votes / maxVotes * 100) : 0;

        return `
                    <div class="result-item" style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600;">${option.text}</span>
                            <span style="color: var(--primary); font-weight: 700;">${percentage}%</span>
                        </div>
                        <div style="height: 2rem; background: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;">
                            <div style="height: 100%; width: ${width}%; background: var(--gradient-primary); transition: width var(--transition-slow); display: flex; align-items: center; padding: 0 1rem; color: white; font-weight: 600;">
                                ${option.votes} votes
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function castVote(pollId) {
    const poll = state.polls.find(p => p.id === pollId);
    if (!poll) return;

    const selected = Array.from(document.querySelectorAll('input[name="vote"]:checked')).map(input => input.value);

    if (selected.length === 0) {
        showToast('Please select an option');
        return;
    }

    // Update poll votes
    selected.forEach(optionId => {
        const option = poll.options.find(o => o.id === optionId);
        if (option) option.votes++;
    });

    poll.totalVotes++;

    // Update user votes
    state.userVotes.push(pollId);

    // Update stats
    state.stats.totalVotes++;

    saveToLocalStorage();
    updateAllStats();

    // Show success and results
    showToast('✅ Vote cast successfully!');

    // Animate vote particle
    createVoteParticle();

    // Refresh modal
    setTimeout(() => {
        openPollModal(pollId);
        renderAllSections();
    }, 500);
}

// === Create Poll Wizard ===
function nextStep() {
    if (state.currentStep < 4) {
        if (validateStep(state.currentStep)) {
            state.currentStep++;
            updateWizard();
        }
    }
}

function previousStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateWizard();
    }
}

function validateStep(step) {
    if (step === 1) {
        const title = document.getElementById('pollTitle').value.trim();
        if (!title) {
            showToast('Please enter a poll question');
            return false;
        }
        state.newPoll.title = title;
        state.newPoll.description = document.getElementById('pollDescription').value.trim();
        state.newPoll.category = document.getElementById('pollCategory').value;
        return true;
    } else if (step === 2) {
        const type = document.getElementById('pollType').value;
        const options = Array.from(document.querySelectorAll('.option-input'))
            .map(input => input.value.trim())
            .filter(val => val);

        if (type !== 'yesno' && type !== 'rating' && options.length < 2) {
            showToast('Please add at least 2 options');
            return false;
        }

        state.newPoll.type = type;
        state.newPoll.options = options;
        return true;
    } else if (step === 3) {
        state.newPoll.duration = parseInt(document.getElementById('pollDuration').value);
        state.newPoll.allowResultsView = document.getElementById('allowResultsView').checked;
        state.newPoll.featured = document.getElementById('featuredPoll').checked;
        return true;
    }
    return true;
}

function updateWizard() {
    // Update steps
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === state.currentStep);
    });

    // Update buttons
    document.getElementById('prevBtn').style.display = state.currentStep > 1 ? 'block' : 'none';
    document.getElementById('nextBtn').style.display = state.currentStep < 4 ? 'block' : 'none';
    document.getElementById('publishBtn').style.display = state.currentStep === 4 ? 'block' : 'none';

    // Update progress
    document.getElementById('currentStep').textContent = state.currentStep;
    document.getElementById('progressFill').style.width = (state.currentStep / 4 * 100) + '%';

    // Render preview if on step 4
    if (state.currentStep === 4) {
        renderPollPreview();
    }
}

function renderPollPreview() {
    const preview = document.getElementById('pollPreview');

    let optionsHTML = '';
    if (state.newPoll.type === 'yesno') {
        optionsHTML = '<div>✓ Yes</div><div>✗ No</div><div>○ Abstain</div>';
    } else if (state.newPoll.type === 'rating') {
        optionsHTML = '<div>⭐ 1-5 Star Rating</div>';
    } else {
        optionsHTML = state.newPoll.options.map(opt => `<div>• ${opt}</div>`).join('');
    }

    preview.innerHTML = `
        <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">${state.newPoll.title}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">${state.newPoll.description || 'No description'}</p>
        <div style="margin-bottom: 1rem;">
            <span class="poll-category">${state.newPoll.category}</span>
        </div>
        <div style="background: var(--bg-glass); padding: 1rem; border-radius: var(--radius-md);">
            <strong>Options:</strong>
            ${optionsHTML}
        </div>
        <div style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            Duration: ${state.newPoll.duration} days | 
            Results: ${state.newPoll.allowResultsView ? 'Visible after voting' : 'Hidden'} |
            ${state.newPoll.featured ? 'Featured ⭐' : 'Standard'}
        </div>
    `;
}

function handlePollTypeChange() {
    const type = document.getElementById('pollType').value;
    const container = document.getElementById('optionsContainer');

    if (type === 'yesno' || type === 'rating') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
    }
}

function addOption() {
    const list = document.getElementById('optionsList');
    const index = list.children.length;

    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <input type="text" class="option-input" placeholder="Option ${index + 1}" data-option="${index}">
        <button class="option-remove" onclick="removeOption(${index})">×</button>
    `;

    list.appendChild(optionItem);
}

function removeOption(index) {
    const list = document.getElementById('optionsList');
    if (list.children.length > 2) {
        list.children[index].remove();
        // Re-index remaining options
        Array.from(list.children).forEach((child, i) => {
            child.querySelector('.option-input').placeholder = `Option ${i + 1}`;
            child.querySelector('.option-input').dataset.option = i;
            child.querySelector('.option-remove').onclick = () => removeOption(i);
        });
    } else {
        showToast('Must have at least 2 options');
    }
}

function publishPoll() {
    if (!validateStep(3)) return;

    // Create poll object
    const poll = {
        id: 'poll_' + Date.now(),
        title: state.newPoll.title,
        description: state.newPoll.description,
        category: state.newPoll.category,
        type: state.newPoll.type,
        options: [],
        createdAt: Date.now(),
        endsAt: Date.now() + state.newPoll.duration * 24 * 60 * 60 * 1000,
        status: 'active',
        totalVotes: 0,
        allowResultsView: state.newPoll.allowResultsView,
        featured: state.newPoll.featured,
        creator: state.userId
    };

    // Create options based on type
    if (state.newPoll.type === 'yesno') {
        poll.options = [
            { id: 'opt_yes', text: 'Yes', votes: 0 },
            { id: 'opt_no', text: 'No', votes: 0 },
            { id: 'opt_abstain', text: 'Abstain', votes: 0 }
        ];
    } else if (state.newPoll.type === 'rating') {
        poll.options = [
            { id: 'opt_1', text: '1 Star', votes: 0 },
            { id: 'opt_2', text: '2 Stars', votes: 0 },
            { id: 'opt_3', text: '3 Stars', votes: 0 },
            { id: 'opt_4', text: '4 Stars', votes: 0 },
            { id: 'opt_5', text: '5 Stars', votes: 0 }
        ];
    } else {
        poll.options = state.newPoll.options.map((text, i) => ({
            id: 'opt_' + i,
            text: text,
            votes: 0
        }));
    }

    // Add to state
    state.polls.unshift(poll);
    state.userPolls.push(poll.id);
    state.stats.activePolls++;

    saveToLocalStorage();

    // Reset wizard
    state.currentStep = 1;
    state.newPoll = {
        title: '',
        description: '',
        category: 'infrastructure',
        type: 'single',
        options: ['', ''],
        duration: 7,
        allowResultsView: true,
        featured: false
    };

    // Clear form
    document.getElementById('pollTitle').value = '';
    document.getElementById('pollDescription').value = '';

    updateWizard();
    renderAllSections();

    showToast('🎉 Poll published successfully!');

    setTimeout(() => {
        switchSection('browse');
    }, 1500);
}

// === Analytics ===
function renderAnalytics() {
    // Update overview stats
    document.getElementById('totalPollsAnalytics').textContent = state.polls.length;
    document.getElementById('totalVotesAnalytics').textContent = state.stats.totalVotes.toLocaleString();
    document.getElementById('participationRate').textContent = '87%';

    const avgVotes = state.polls.length > 0 ? Math.round(state.stats.totalVotes / state.polls.length) : 0;
    document.getElementById('avgVotesPerPoll').textContent = avgVotes;

    // Render charts
    renderParticipationChart();
    renderCategoryChart();

    // Top polls
    const topPolls = [...state.polls]
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 5);

    const topPollsList = document.getElementById('topPollsList');
    topPollsList.innerHTML = topPolls.map((poll, index) => `
        <div style="display: flex; align-items: center; padding: 1rem; background: var(--bg-glass); border-radius: var(--radius-md); margin-bottom: 0.75rem; cursor: pointer;" onclick="openPollModal('${poll.id}')">
            <div style="width: 2rem; height: 2rem; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; margin-right: 1rem;">
                ${index + 1}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${poll.title}</div>
                <div style="font-size: 0.875rem; color: var(--text-tertiary);">${poll.totalVotes} votes</div>
            </div>
        </div>
    `).join('');

    // Consensus meter
    const consensus = calculateConsensus();
    document.getElementById('consensusFill').style.width = consensus + '%';
    document.getElementById('consensusValue').textContent = consensus + '%';

    let consensusDesc = 'Divided opinions';
    if (consensus > 80) consensusDesc = 'Strong consensus';
    else if (consensus > 60) consensusDesc = 'Moderate agreement';
    else if (consensus > 40) consensusDesc = 'Mixed views';

    document.getElementById('consensusDesc').textContent = consensusDesc;

    // Sentiment cloud
    renderSentimentCloud();
}

function renderSentimentCloud() {
    const container = document.getElementById('sentimentCloud');
    if (!container) return;

    // Common civic keywords from polls
    const keywords = [];
    state.polls.forEach(poll => {
        const words = (poll.title + ' ' + (poll.description || '')).toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 4);
        keywords.push(...words);
    });

    const counts = {};
    keywords.forEach(w => counts[w] = (counts[w] || 0) + 1);

    const sortedKeywords = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    container.innerHTML = sortedKeywords.map(([word, count]) => {
        const size = 0.8 + (count / sortedKeywords[0][1]) * 1.5;
        const opacity = 0.5 + (count / sortedKeywords[0][1]) * 0.5;
        return `<span style="font-size: ${size}rem; opacity: ${opacity}; margin: 0.5rem; display: inline-block; cursor: default; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${word}</span>`;
    }).join('');
}

function calculateConsensus() {
    if (state.polls.length === 0) return 0;

    let totalConsensus = 0;
    state.polls.forEach(poll => {
        if (poll.totalVotes === 0) return;

        const maxVotes = Math.max(...poll.options.map(o => o.votes));
        const consensus = (maxVotes / poll.totalVotes) * 100;
        totalConsensus += consensus;
    });

    return Math.round(totalConsensus / state.polls.length);
}

function renderParticipationChart() {
    const canvas = document.getElementById('participationChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = [234, 345, 456, 567, 678, 789, 890];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    drawLineChart(ctx, data, labels, canvas.width, canvas.height);
}

function renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Count polls by category
    const categories = {};
    state.polls.forEach(poll => {
        categories[poll.category] = (categories[poll.category] || 0) + 1;
    });

    const data = Object.values(categories);
    const labels = Object.keys(categories);

    drawPieChart(ctx, data, labels, canvas.width, canvas.height);
}

// === Activity ===
function renderActivity() {
    // Update personal stats
    document.getElementById('myVotesCount').textContent = state.userVotes.length;
    document.getElementById('myPollsCount').textContent = state.userPolls.length;
    document.getElementById('streakDays').textContent = state.stats.streakDays;

    // Render voted polls
    const votedPolls = state.polls.filter(p => state.userVotes.includes(p.id));
    const votedContainer = document.getElementById('votedPolls');

    if (votedPolls.length === 0) {
        votedContainer.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 3rem;">No votes yet</div>';
    } else {
        votedContainer.innerHTML = votedPolls.map(poll => createPollCard(poll)).join('');
    }

    // Render created polls
    const createdPolls = state.polls.filter(p => state.userPolls.includes(p.id));
    const createdContainer = document.getElementById('createdPolls');

    if (createdPolls.length === 0) {
        createdContainer.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 3rem;">No polls created yet</div>';
    } else {
        createdContainer.innerHTML = createdPolls.map(poll => createPollCard(poll)).join('');
    }
}

function switchActivityTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tab + 'Tab');
    });
}

// === Charts ===
function drawLineChart(ctx, data, labels, width, height) {
    const padding = 40;
    const stepX = (width - padding * 2) / (data.length - 1);
    const maxValue = Math.max(...data);

    ctx.clearRect(0, 0, width, height);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;

    data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (value / maxValue) * (height - padding * 2);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw points
    data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (value / maxValue) * (height - padding * 2);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();

        // Labels
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x, height - padding + 20);
    });
}

function drawPieChart(ctx, data, labels, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const total = data.reduce((a, b) => a + b, 0);

    const colors = ['#2563eb', '#7c3aed', '#14b8a6', '#10b981', '#f59e0b', '#ef4444'];

    ctx.clearRect(0, 0, width, height);

    let currentAngle = -Math.PI / 2;

    data.forEach((value, index) => {
        const sliceAngle = (value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        currentAngle += sliceAngle;
    });

    // Draw legend
    labels.forEach((label, index) => {
        const y = 20 + index * 25;

        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(10, y, 15, 15);

        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, 30, y + 12);
    });
}

// === Particles ===
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

function createVoteParticle() {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: var(--gradient-primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        animation: voteParticle 1s ease-out forwards;
    `;

    particle.textContent = '🗳️';
    particle.style.fontSize = '20px';
    particle.style.left = '50%';
    particle.style.top = '50%';

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes voteParticle {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -200px) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// === Utilities ===
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateAllStats() {
    state.stats.totalVotes = state.polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    state.stats.activePolls = state.polls.filter(p => p.status === 'active').length;
    state.stats.participants = Math.floor(state.stats.totalVotes / 3.2);

    saveToLocalStorage();
}

function sharePoll(pollId) {
    const url = window.location.origin + window.location.pathname + '?poll=' + pollId;
    navigator.clipboard.writeText(url).then(() => {
        showToast('📋 Link copied to clipboard!');
    }).catch(err => {
        showToast('❌ Failed to copy link');
    });
}

function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    if (email) {
        showToast('🎉 Thanks for subscribing!');
        e.target.reset();
    }
}

function exportAnalytics() {
    const data = {
        timestamp: new Date().toISOString(),
        totalPolls: state.polls.length,
        totalVotes: state.stats.totalVotes,
        polls: state.polls
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CitizenVoice_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📈 Report exported successfully!');
}

// Initialize wizard on load
updateWizard();
