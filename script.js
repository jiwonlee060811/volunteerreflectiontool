// Storage key for local storage
const STORAGE_KEY = 'sightshare_volunteer_reflections';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadStoredData();
    setMaxDate();
});

// Set max date to today for date input
function setMaxDate() {
    const dateInput = document.getElementById('volunteer-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('max', today);
    }
}

// Event Listeners
function initializeEventListeners() {
    // Survey form submission
    const surveyForm = document.getElementById('volunteer-survey-form');
    surveyForm.addEventListener('submit', handleSurveySubmit);

    // Back to survey button
    document.getElementById('back-to-survey-btn').addEventListener('click', function() {
        document.getElementById('survey-section').style.display = 'block';
        document.getElementById('ai-suggestions-section').style.display = 'none';
        surveyForm.reset();
        // Focus on first form field for accessibility
        const firstRating = document.getElementById('rating-1');
        if (firstRating) {
            firstRating.focus();
        }
    });

    // View data button
    document.getElementById('view-data-btn').addEventListener('click', displayStoredReflections);

    // Summarize button
    document.getElementById('summarize-btn').addEventListener('click', generateAISummary);

    // Clear data button
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);

    // Chat functionality
    document.getElementById('send-chat-btn').addEventListener('click', sendChatMessage);
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Keyboard navigation for rating labels
    const ratingLabels = document.querySelectorAll('.rating-label');
    ratingLabels.forEach((label, index) => {
        label.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const radio = document.getElementById(label.getAttribute('for'));
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                ratingLabels[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < ratingLabels.length - 1) {
                e.preventDefault();
                ratingLabels[index + 1].focus();
            }
        });
    });

    // Focus management for better accessibility
    document.addEventListener('keydown', function(e) {
        // Escape key to close modals or return focus
        if (e.key === 'Escape') {
            const suggestionsSection = document.getElementById('ai-suggestions-section');
            if (suggestionsSection.style.display !== 'none') {
                document.getElementById('back-to-survey-btn').click();
            }
        }
    });
}

// Handle survey form submission
function handleSurveySubmit(e) {
    e.preventDefault();
    
    // Validate tasks checkbox (at least one must be selected)
    const taskCheckboxes = document.querySelectorAll('input[name="volunteer-tasks"]:checked');
    if (taskCheckboxes.length === 0) {
        const tasksError = document.getElementById('tasks-error');
        tasksError.style.display = 'block';
        return;
    }
    document.getElementById('tasks-error').style.display = 'none';
    
    // Get all selected tasks
    const selectedTasks = Array.from(taskCheckboxes).map(cb => cb.value);
    
    const formData = {
        rating: document.querySelector('input[name="volunteer-rating"]:checked').value,
        organization: document.getElementById('organization').value,
        volunteerDate: document.getElementById('volunteer-date').value,
        studentType: document.getElementById('student-type').value,
        firstTime: document.querySelector('input[name="first-time"]:checked').value,
        duration: document.getElementById('volunteer-duration').value,
        communicationEase: document.querySelector('input[name="communication-ease"]:checked').value,
        tasks: selectedTasks,
        experience: document.getElementById('volunteer-experience').value,
        suggestions: document.getElementById('suggestions').value,
        timestamp: new Date().toISOString()
    };

    // Store the reflection (anonymously)
    saveReflection(formData);

    // Generate AI suggestions
    const aiSuggestions = generateAISuggestions(formData);
    displayAISuggestions(aiSuggestions);

    // Hide survey, show suggestions
    document.getElementById('survey-section').style.display = 'none';
    document.getElementById('ai-suggestions-section').style.display = 'block';
    
    // Focus on back button for accessibility
    setTimeout(() => {
        document.getElementById('back-to-survey-btn').focus();
    }, 100);
}

// Save reflection to local storage
function saveReflection(data) {
    let reflections = getStoredReflections();
    // Add anonymous ID (timestamp-based)
    data.id = Date.now().toString();
    reflections.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}

// Get stored reflections
function getStoredReflections() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Load stored data on page load
function loadStoredData() {
    const reflections = getStoredReflections();
    if (reflections.length > 0) {
        console.log(`Loaded ${reflections.length} stored reflection(s)`);
    }
}

// Generate AI-based suggestions
function generateAISuggestions(data) {
    const suggestions = [];
    const rating = parseInt(data.rating);

    // Rating-based suggestions
    if (rating <= 2) {
        suggestions.push({
            title: "Improving Your Volunteer Experience",
            content: "Based on your rating, it seems the experience could be improved. Consider discussing your concerns with the organization coordinator. They may be able to adjust your role or provide additional support to make your volunteering more meaningful."
        });
    } else if (rating === 3) {
        suggestions.push({
            title: "Enhancing Your Impact",
            content: "Your experience was moderate. To enhance your impact, consider setting specific goals for each volunteering session, asking for feedback from the organization, or exploring different roles that might better match your interests and skills."
        });
    } else {
        suggestions.push({
            title: "Maintaining Excellence",
            content: "Great to hear you had a positive experience! To continue making a meaningful impact, consider mentoring new volunteers, sharing your positive experiences with others, or exploring additional ways to contribute to the organization."
        });
    }

    // Duration-based suggestions
    if (data.duration === 'less-than-1' || data.duration === '1-2') {
        suggestions.push({
            title: "Extending Your Commitment",
            content: "You volunteered for a shorter duration. If possible, consider extending your volunteer time. Longer sessions often allow for deeper connections with clients and more meaningful impact. Even an extra hour can make a significant difference."
        });
    }

    // Experience text analysis
    const experienceText = data.experience.toLowerCase();
    
    if (experienceText.includes('challenging') || experienceText.includes('difficult')) {
        suggestions.push({
            title: "Managing Challenges",
            content: "Volunteering can be challenging, and that's normal. Consider seeking support from the organization's volunteer coordinator, connecting with other volunteers for advice, or taking breaks when needed. Remember, your well-being is important too."
        });
    }

    if (experienceText.includes('rewarding') || experienceText.includes('fulfilling')) {
        suggestions.push({
            title: "Building on Success",
            content: "It's wonderful that you found the experience rewarding! Consider documenting what made it meaningful for you. This can help you identify similar opportunities in the future and guide your continued volunteer journey."
        });
    }

    if (experienceText.includes('learn') || experienceText.includes('skill')) {
        suggestions.push({
            title: "Skill Development",
            content: "Volunteering is a great way to develop new skills. Consider asking the organization about additional training opportunities, workshops, or ways to expand your skill set while contributing to the cause."
        });
    }

    // Suggestions from user input
    if (data.suggestions && data.suggestions.trim().length > 0) {
        suggestions.push({
            title: "Your Suggestions Noted",
            content: "Thank you for providing suggestions! Your feedback is valuable and will be considered by the organization. Consider following up with the coordinator to discuss your ideas further."
        });
    }

    // General best practices
    suggestions.push({
        title: "Best Practices for Future Volunteering",
        content: "For future volunteering: 1) Set clear expectations with the organization, 2) Maintain open communication, 3) Reflect on your experiences regularly, 4) Take care of your own well-being, and 5) Celebrate the positive impact you're making."
    });

    return suggestions;
}

// Display AI suggestions
function displayAISuggestions(suggestions) {
    const container = document.getElementById('ai-suggestions-content');
    container.innerHTML = '';

    suggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.innerHTML = `
            <h3>${suggestion.title}</h3>
            <p>${suggestion.content}</p>
        `;
        container.appendChild(suggestionDiv);
    });
}

// Display stored reflections
function displayStoredReflections() {
    const reflections = getStoredReflections();
    const displayContainer = document.getElementById('data-display');

    if (reflections.length === 0) {
        displayContainer.innerHTML = `
            <div class="empty-state">
                <p>No reflections stored yet. Submit a reflection to see it here.</p>
            </div>
        `;
        return;
    }

    displayContainer.innerHTML = '';

    // Display in reverse order (newest first)
    reflections.reverse().forEach(reflection => {
        const card = document.createElement('div');
        card.className = 'reflection-card';
        
        const date = new Date(reflection.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        const volunteerDate = reflection.volunteerDate ? new Date(reflection.volunteerDate).toLocaleDateString() : 'Not specified';
        const studentType = reflection.studentType === 'high-school' ? 'High School Student' : reflection.studentType === 'college' ? 'College Student' : 'Not specified';
        const tasks = reflection.tasks && reflection.tasks.length > 0 ? reflection.tasks.map(t => formatTask(t)).join(', ') : 'Not specified';
        
        const firstTime = reflection.firstTime === 'yes' ? 'Yes' : reflection.firstTime === 'no' ? 'No' : 'Not specified';
        const communicationEase = reflection.communicationEase ? formatCommunicationEase(reflection.communicationEase) : 'Not specified';
        
        card.innerHTML = `
            <h3>Reflection #${reflection.id.slice(-6)}</h3>
            <p><strong>Rating:</strong> <span class="rating">${reflection.rating}/5</span></p>
            <p><strong>Organization:</strong> ${reflection.organization}</p>
            <p><strong>Volunteer Date:</strong> ${volunteerDate}</p>
            <p><strong>Student Type:</strong> ${studentType}</p>
            <p><strong>First Time Volunteering:</strong> ${firstTime}</p>
            <p><strong>Duration:</strong> ${formatDuration(reflection.duration)}</p>
            <p><strong>Communication Ease:</strong> ${communicationEase}</p>
            <p><strong>Tasks Performed:</strong> ${tasks}</p>
            <p><strong>Memorable Experience:</strong> ${reflection.experience}</p>
            ${reflection.suggestions ? `<p><strong>Suggestions:</strong> ${reflection.suggestions}</p>` : ''}
            <p class="timestamp">Submitted: ${formattedDate}</p>
        `;
        displayContainer.appendChild(card);
    });
}

// Format duration for display
function formatDuration(duration) {
    const durationMap = {
        '30-minutes': '30 minutes',
        '30-minutes-1-hour': '30 minutes - 1 hour',
        '1-2': '1-2 hours',
        '2-4': '2-4 hours',
        '4-8': '4-8 hours',
        'more-than-8': 'More than 8 hours'
    };
    return durationMap[duration] || duration;
}

// Format task for display
function formatTask(task) {
    const taskMap = {
        'technology-support': 'Technology Support',
        'walking-supermarket': 'Walking to Supermarket',
        'arts-crafts': 'Arts and Crafts',
        'reading-assistance': 'Reading Assistance',
        'companionship': 'Companionship',
        'transportation': 'Transportation Assistance',
        'education-tutoring': 'Education/Tutoring',
        'music-lessons': 'Music Lessons',
        'other': 'Other'
    };
    return taskMap[task] || task;
}

// Format communication ease for display
function formatCommunicationEase(ease) {
    const easeMap = {
        'strongly-yes': 'Strongly Yes',
        'somewhat-yes': 'Somewhat Yes',
        'medium': 'Medium',
        'somewhat-no': 'Somewhat No',
        'strongly-no': 'Strongly No'
    };
    return easeMap[ease] || ease;
}

// Clear all stored data
function clearAllData() {
    if (confirm('Are you sure you want to clear all stored reflections? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('data-display').innerHTML = `
            <div class="empty-state">
                <p>All data has been cleared.</p>
            </div>
        `;
        document.getElementById('summary-display').style.display = 'none';
    }
}

// Generate AI Summary of all reflections
async function generateAISummary() {
    const reflections = getStoredReflections();
    
    if (reflections.length === 0) {
        alert('No reflections found. Please submit at least one reflection before generating a summary.');
        return;
    }
    
    const summaryDisplay = document.getElementById('summary-display');
    summaryDisplay.style.display = 'block';
    summaryDisplay.innerHTML = '<div class="empty-state"><p>Generating AI summary... This may take a moment.</p></div>';
    
    // Calculate basic statistics
    const stats = calculateStatistics(reflections);
    
    // Generate AI summary
    try {
        const aiSummary = await generateAISummaryText(reflections, stats);
        displaySummary(stats, aiSummary);
    } catch (error) {
        console.error('Error generating AI summary:', error);
        // Display statistics even if AI fails
        displaySummary(stats, null);
    }
}

// Calculate statistics from reflections
function calculateStatistics(reflections) {
    const stats = {
        total: reflections.length,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        studentTypes: { 'high-school': 0, 'college': 0 },
        firstTimeVolunteers: { 'yes': 0, 'no': 0 },
        communicationEaseDistribution: { 'strongly-yes': 0, 'somewhat-yes': 0, 'medium': 0, 'somewhat-no': 0, 'strongly-no': 0 },
        taskFrequency: {},
        averageDuration: 0,
        organizations: {},
        totalHours: 0
    };
    
    let totalRating = 0;
    let totalDuration = 0;
    
    reflections.forEach(reflection => {
        // Rating
        const rating = parseInt(reflection.rating);
        totalRating += rating;
        stats.ratingDistribution[rating]++;
        
        // Student type
        if (reflection.studentType) {
            stats.studentTypes[reflection.studentType] = (stats.studentTypes[reflection.studentType] || 0) + 1;
        }
        
        // First time volunteering
        if (reflection.firstTime) {
            stats.firstTimeVolunteers[reflection.firstTime] = (stats.firstTimeVolunteers[reflection.firstTime] || 0) + 1;
        }
        
        // Communication ease
        if (reflection.communicationEase) {
            stats.communicationEaseDistribution[reflection.communicationEase] = (stats.communicationEaseDistribution[reflection.communicationEase] || 0) + 1;
        }
        
        // Tasks
        if (reflection.tasks && Array.isArray(reflection.tasks)) {
            reflection.tasks.forEach(task => {
                stats.taskFrequency[task] = (stats.taskFrequency[task] || 0) + 1;
            });
        }
        
        // Duration
        const durationHours = getDurationInHours(reflection.duration);
        totalDuration += durationHours;
        
        // Organizations
        if (reflection.organization) {
            stats.organizations[reflection.organization] = (stats.organizations[reflection.organization] || 0) + 1;
        }
    });
    
    stats.averageRating = (totalRating / reflections.length).toFixed(2);
    stats.averageDuration = (totalDuration / reflections.length).toFixed(2);
    stats.totalHours = totalDuration.toFixed(1);
    
    return stats;
}

// Get duration in hours for calculation
function getDurationInHours(duration) {
    const durationMap = {
        '30-minutes': 0.5,
        '30-minutes-1-hour': 0.75,
        '1-2': 1.5,
        '2-4': 3,
        '4-8': 6,
        'more-than-8': 8
    };
    return durationMap[duration] || 0;
}

// Generate AI summary text using Hugging Face API
async function generateAISummaryText(reflections, stats) {
    // Prepare data for AI analysis
    const summaryData = {
        totalReflections: stats.total,
        averageRating: stats.averageRating,
        studentTypes: stats.studentTypes,
        topTasks: Object.entries(stats.taskFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([task, count]) => ({ task: formatTask(task), count })),
        difficultyBreakdown: stats.difficultyDistribution,
        totalHours: stats.totalHours
    };
    
    // Create prompt for AI
    const firstTimeYes = stats.firstTimeVolunteers['yes'] || 0;
    const firstTimeNo = stats.firstTimeVolunteers['no'] || 0;
    const commEase = stats.communicationEaseDistribution;
    
    const prompt = `Analyze these volunteer survey results and provide a comprehensive summary:
- Total responses: ${summaryData.totalReflections}
- Average rating: ${summaryData.averageRating}/5
- High school students: ${summaryData.studentTypes['high-school'] || 0}, College students: ${summaryData.studentTypes['college'] || 0}
- First time volunteers: ${firstTimeYes}, Returning volunteers: ${firstTimeNo}
- Total volunteer hours: ${summaryData.totalHours}
- Top tasks: ${summaryData.topTasks.map(t => `${t.task} (${t.count})`).join(', ')}
- Communication ease: Strongly Yes: ${commEase['strongly-yes'] || 0}, Somewhat Yes: ${commEase['somewhat-yes'] || 0}, Medium: ${commEase['medium'] || 0}, Somewhat No: ${commEase['somewhat-no'] || 0}, Strongly No: ${commEase['strongly-no'] || 0}

Provide a professional summary highlighting key insights, trends, and recommendations for improving the volunteer experience. Keep it concise and actionable.`;

    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(HUGGING_FACE_API_KEY && { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` })
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 500,
                        temperature: 0.7,
                        return_full_text: false,
                        do_sample: true
                    }
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            let summary = '';
            if (Array.isArray(data) && data[0]?.generated_text) {
                summary = data[0].generated_text;
            } else if (data.generated_text) {
                summary = data.generated_text;
            } else if (typeof data === 'string') {
                summary = data;
            }
            return summary.trim() || generateDefaultSummary(summaryData);
        } else {
            return generateDefaultSummary(summaryData);
        }
    } catch (error) {
        console.error('AI summary generation error:', error);
        return generateDefaultSummary(summaryData);
    }
}

// Generate default summary if AI fails
function generateDefaultSummary(data) {
    return `Based on ${data.totalReflections} volunteer reflections, the average experience rating is ${data.averageRating}/5. Volunteers contributed approximately ${data.totalHours} total hours. The most common tasks performed were ${data.topTasks.map(t => t.task).join(', ')}. The volunteer program shows ${data.studentTypes['high-school'] || 0} high school students and ${data.studentTypes['college'] || 0} college students participating.`;
}

// Display summary
function displaySummary(stats, aiSummary) {
    const summaryDisplay = document.getElementById('summary-display');
    
    // Find top organization
    const topOrganization = Object.entries(stats.organizations)
        .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    
    // Find most common task
    const topTask = Object.entries(stats.taskFrequency)
        .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    
    // Find most common communication ease
    const topCommEase = Object.entries(stats.communicationEaseDistribution)
        .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    
    const firstTimeYes = stats.firstTimeVolunteers['yes'] || 0;
    const firstTimeNo = stats.firstTimeVolunteers['no'] || 0;
    
    let html = `
        <div class="summary-section">
            <h3>📊 Summary Statistics</h3>
            <div class="summary-stats">
                <div class="stat-card">
                    <h4>Total Reflections</h4>
                    <p>${stats.total}</p>
                </div>
                <div class="stat-card">
                    <h4>Average Rating</h4>
                    <p>${stats.averageRating}/5</p>
                </div>
                <div class="stat-card">
                    <h4>Total Hours</h4>
                    <p>${stats.totalHours}</p>
                </div>
                <div class="stat-card">
                    <h4>High School Students</h4>
                    <p>${stats.studentTypes['high-school'] || 0}</p>
                </div>
                <div class="stat-card">
                    <h4>College Students</h4>
                    <p>${stats.studentTypes['college'] || 0}</p>
                </div>
                <div class="stat-card">
                    <h4>First Time Volunteers</h4>
                    <p>${firstTimeYes}</p>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <h3>📈 Key Insights</h3>
            <p><strong>Most Common Task:</strong> ${formatTask(topTask[0])} (${topTask[1]} times)</p>
            <p><strong>Top Organization:</strong> ${topOrganization[0]} (${topOrganization[1]} volunteers)</p>
            <p><strong>Communication Ease:</strong> ${formatCommunicationEase(topCommEase[0])}</p>
            <p><strong>First Time vs Returning:</strong> ${firstTimeYes} first-time, ${firstTimeNo} returning volunteers</p>
            <p><strong>Rating Distribution:</strong> 1⭐: ${stats.ratingDistribution[1]}, 2⭐: ${stats.ratingDistribution[2]}, 3⭐: ${stats.ratingDistribution[3]}, 4⭐: ${stats.ratingDistribution[4]}, 5⭐: ${stats.ratingDistribution[5]}</p>
        </div>
    `;
    
    if (aiSummary) {
        html += `
            <div class="summary-section">
                <h3>🤖 AI-Generated Analysis</h3>
                <p>${aiSummary}</p>
            </div>
        `;
    }
    
    summaryDisplay.innerHTML = html;
    
    // Scroll to summary
    summaryDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Chat functionality
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) {
        input.focus();
        return;
    }

    // Disable input while processing
    input.disabled = true;
    const sendBtn = document.getElementById('send-chat-btn');
    sendBtn.disabled = true;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator for AI responses
    if (CHATBOT_TYPE !== 'RULE_BASED') {
        const typingIndicator = addTypingIndicator();
        try {
            const response = await generateChatResponse(message);
            removeTypingIndicator(typingIndicator);
            addChatMessage(response, 'bot');
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator(typingIndicator);
            const fallback = generateRuleBasedResponse(message);
            addChatMessage(fallback, 'bot');
        }
    } else {
        // Rule-based is instant, no typing indicator needed
        setTimeout(() => {
            const response = generateChatResponse(message);
            addChatMessage(response, 'bot');
        }, 300);
    }

    // Re-enable input
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
}

// Add typing indicator
function addTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<p>AI is thinking...</p>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

// Add message to chat
function addChatMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', type === 'user' ? 'Your message' : 'AI assistant response');
    messageDiv.innerHTML = `<p>${text}</p>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Announce new message for screen readers
    if (type === 'bot') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'New message received';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }
}

// ============================================
// CHATBOT CONFIGURATION
// ============================================
// Choose your chatbot type:
// 1. RULE_BASED (default) - Free, private, works offline
// 2. HUGGING_FACE - Free AI API (1000 requests/month, no credit card)
// 3. OPENAI - Paid AI API (requires credit card)
// ============================================

const CHATBOT_TYPE = 'HUGGING_FACE'; // Options: 'RULE_BASED', 'HUGGING_FACE', 'OPENAI'

// Hugging Face Configuration (FREE - 1000 requests/month)
// Get free API token at: https://huggingface.co/settings/tokens
const HUGGING_FACE_API_KEY = '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'; // API key for more human-like responses
// Using a more reliable conversational model for better responses
const HUGGING_FACE_MODEL = 'facebook/blenderbot-400M-distill'; // Reliable conversational model for human-like chat

// OpenAI Configuration (PAID)
const OPENAI_API_KEY = ''; // Requires paid account

// Generate chat response
async function generateChatResponse(userMessage) {
    console.log('💭 Generating chat response for:', userMessage);
    console.log('🔧 Chatbot type:', CHATBOT_TYPE);
    console.log('🔑 API Key present:', !!HUGGING_FACE_API_KEY);
    
    try {
        if (CHATBOT_TYPE === 'HUGGING_FACE' && HUGGING_FACE_API_KEY) {
            console.log('🚀 Using Hugging Face API');
            return await generateHuggingFaceResponse(userMessage);
        } else if (CHATBOT_TYPE === 'OPENAI' && OPENAI_API_KEY) {
            console.log('🚀 Using OpenAI API');
            return await generateOpenAIResponse(userMessage);
        } else {
            console.log('📝 Using rule-based system (no API key or wrong type)');
        }
    } catch (error) {
        console.error('❌ AI API error, using rule-based fallback:', error);
        // Fallback to rule-based if AI fails
    }
    
    // Default: Use rule-based system
    console.log('📝 Using rule-based system as default');
    return generateRuleBasedResponse(userMessage);
}

// Generate response using Hugging Face FREE API
async function generateHuggingFaceResponse(userMessage) {
    // Using Hugging Face Inference API (FREE)
    // Model: facebook/blenderbot-400M-distill (reliable conversational AI)
    const prompt = `You are a helpful and friendly assistant for Sightshare, a volunteer organization. You help volunteers with questions about volunteering, surveys, and the organization. Keep responses conversational, warm, and concise. All surveys are anonymous. User: ${userMessage} Assistant:`;
    
    console.log('🤖 Attempting to use Hugging Face API with model:', HUGGING_FACE_MODEL);
    
    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(HUGGING_FACE_API_KEY && { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` })
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        return_full_text: false,
                        do_sample: true
                    }
                })
            }
        );

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ API Error:', error);
            
            // If model is loading, wait and retry once
            if (error.error && (error.error.includes('loading') || error.error.includes('model'))) {
                console.log('⏳ Model is loading, waiting 15 seconds...');
                await new Promise(resolve => setTimeout(resolve, 15000));
                console.log('🔄 Retrying API call...');
                return generateHuggingFaceResponse(userMessage);
            }
            
            // Try fallback model
            console.warn('⚠️ Primary model issue, trying fallback model');
            return await generateHuggingFaceResponseFallback(userMessage);
        }

        const data = await response.json();
        console.log('✅ API Response data:', data);
        
        // Handle different response formats
        let answer = '';
        if (Array.isArray(data) && data[0]?.generated_text) {
            answer = data[0].generated_text;
        } else if (data.generated_text) {
            answer = data.generated_text;
        } else if (typeof data === 'string') {
            answer = data;
        }
        
        // Clean up the response (remove prompt if included)
        answer = answer.replace(prompt, '').trim();
        
        console.log('💬 Generated answer:', answer);
        
        // If response is too short or empty, use fallback
        if (!answer || answer.length < 10) {
            console.warn('⚠️ Response too short, using fallback');
            return await generateHuggingFaceResponseFallback(userMessage);
        }
        
        return answer || 'I apologize, I had trouble processing that. Could you rephrase your question?';
    } catch (error) {
        console.error('❌ Hugging Face API error:', error);
        // Try fallback model
        return await generateHuggingFaceResponseFallback(userMessage);
    }
}

// Fallback to a more reliable conversational model
async function generateHuggingFaceResponseFallback(userMessage) {
    const fallbackModel = 'google/flan-t5-large';
    const prompt = `You are a helpful assistant for Sightshare, a volunteer organization. Answer this question about volunteering or surveys in a friendly, concise way: ${userMessage}`;
    
    console.log('🔄 Trying fallback model:', fallbackModel);
    
    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${fallbackModel}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(HUGGING_FACE_API_KEY && { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` })
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        return_full_text: false
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Fallback model error:', error);
            throw new Error('Fallback model also failed');
        }

        const data = await response.json();
        console.log('✅ Fallback model response:', data);
        
        let answer = '';
        if (Array.isArray(data) && data[0]?.generated_text) {
            answer = data[0].generated_text;
        } else if (data.generated_text) {
            answer = data.generated_text;
        } else if (typeof data === 'string') {
            answer = data;
        }
        
        const finalAnswer = answer.trim();
        if (finalAnswer && finalAnswer.length > 10) {
            console.log('✅ Using fallback model response');
            return finalAnswer;
        } else {
            console.warn('⚠️ Fallback response too short, using rule-based');
            return generateRuleBasedResponse(userMessage);
        }
    } catch (error) {
        console.error('❌ Fallback model error:', error);
        console.log('📝 Falling back to rule-based system');
        return generateRuleBasedResponse(userMessage);
    }
}

// Generate response using OpenAI ChatGPT API (PAID)
async function generateOpenAIResponse(userMessage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant for Sightshare, a volunteer organization. You help volunteers with questions about volunteering, surveys, and the organization. Keep responses friendly, concise, and focused on volunteering topics. All surveys are anonymous.'
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Generate rule-based chat response (fallback)
function generateRuleBasedResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hello! I'm here to help with any questions about volunteering or the survey. What would you like to know?";
    }

    // Survey-related questions
    if (message.includes('survey') || message.includes('form') || message.includes('question')) {
        return "The survey is completely anonymous and helps us understand volunteer experiences better. You can rate your experience, share details about your volunteering work, and provide suggestions for improvement. All responses are stored securely and anonymously.";
    }

    // Privacy/anonymity questions
    if (message.includes('anonymous') || message.includes('privacy') || message.includes('data')) {
        return "Yes, all survey responses are completely anonymous. We don't collect any personal identifying information. Your responses are stored locally in your browser and can only be viewed on this device. Your privacy is our top priority.";
    }

    // Volunteering questions
    if (message.includes('volunteer') || message.includes('help') || message.includes('work')) {
        return "Volunteering with Sightshare is a wonderful way to make a positive impact. The survey helps us understand your experience and improve our programs. If you have specific questions about volunteering opportunities, I recommend contacting the organization directly.";
    }

    // Rating questions
    if (message.includes('rating') || message.includes('scale') || message.includes('1-5')) {
        return "The rating scale goes from 1 to 5, where 1 means the experience was poor and 5 means it was excellent. This helps us quickly understand overall satisfaction levels and identify areas for improvement.";
    }

    // Suggestions/questions about improvements
    if (message.includes('suggest') || message.includes('improve') || message.includes('better')) {
        return "After you submit your survey, you'll receive AI-powered suggestions based on your responses. These suggestions are designed to help you have better volunteering experiences in the future. You can also share your own suggestions in the survey form.";
    }

    // Thank you responses
    if (message.includes('thank') || message.includes('thanks')) {
        return "You're welcome! I'm here anytime you need help. Good luck with your volunteering!";
    }

    // Default response
    const defaultResponses = [
        "I understand. Could you provide more details about what you'd like to know?",
        "That's an interesting question. Let me help - are you asking about the survey, volunteering, or something else?",
        "I'm here to help! You can ask me about the survey, volunteering experiences, privacy, or anything else related to Sightshare.",
        "Feel free to ask me anything about the survey or volunteering. I'm here to assist you!"
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

