// Selected flower and pot
let selectedFlower = { 
    src: "images/rose.png", 
    name: 'Roses' 
};

let selectedPot = { 
    src: "images/vase.png", 
    name: 'Classic Vase' 
};

// Flower selection handler
document.querySelectorAll('.flower-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove selected class from all flowers
        document.querySelectorAll('.flower-option').forEach(o => o.classList.remove('selected'));
        
        // Add selected class to clicked flower
        this.classList.add('selected');
        
        // Update selected flower
        selectedFlower = {
            src: this.querySelector('.flower-icon').src,
            name: this.dataset.name
        };
        
        // Animate flowers into pot
        animateFlowers();
    });
});

// Set default flower selection
document.querySelector('.flower-option').classList.add('selected');

// Pot selection handler
document.querySelectorAll('.pot-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove selected class from all pots
        document.querySelectorAll('.pot-option').forEach(o => o.classList.remove('selected'));
        
        // Add selected class to clicked pot
        this.classList.add('selected');
        
        // Update selected pot
        selectedPot = {
            src: this.querySelector('.pot-icon').src,
            name: this.dataset.name
        };
        
        // Update pot in preview
        updatePot();
    });
});

// Set default pot selection
document.querySelector('.pot-option').classList.add('selected');

// Update preview when user types
document.getElementById('recipient-name').addEventListener('input', updatePreview);
document.getElementById('message').addEventListener('input', updatePreview);
document.getElementById('sender-name').addEventListener('input', updatePreview);

// Update pot image in preview
function updatePot() {
    document.getElementById('preview-pot').src = selectedPot.src;
}

// Animate flowers dropping into pot
function animateFlowers() {
    const container = document.getElementById('preview-flowers');
    
    // Clear existing flowers
    container.innerHTML = '';
    
    // Add sparkles effect
    addSparkles();
    
    // Create 5 flower instances with staggered animation
    for (let i = 0; i < 5; i++) {
        const flower = document.createElement('img');
        flower.src = selectedFlower.src;
        flower.className = 'preview-flower-img';
        flower.alt = selectedFlower.name;
        container.appendChild(flower);
    }
}

// Add sparkle animation
function addSparkles() {
    const preview = document.getElementById('preview');
    const sparkles = ['✨', '💫', '⭐', '🌟'];
    
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 60 + '%';
            preview.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => sparkle.remove(), 1000);
        }, i * 100);
    }
}

// Update message preview
function updatePreview() {
    const recipientName = document.getElementById('recipient-name').value;
    const message = document.getElementById('message').value;
    const senderName = document.getElementById('sender-name').value;

    let previewText = '';
    
    if (recipientName) {
        previewText += `Dear ${recipientName},\n\n`;
    }
    
    if (message) {
        previewText += `${message}\n\n`;
    }
    
    if (senderName) {
        previewText += `Love, ${senderName}`;
    }

    if (previewText) {
        document.getElementById('preview-text').innerHTML = previewText.replace(/\n/g, '<br>');
    } else {
        document.getElementById('preview-text').textContent = 'Select your flowers and write a message to see preview';
    }
}

// Initialize with default flowers
animateFlowers();

// Send button handler
document.getElementById('send-button').addEventListener('click', function() {
    const recipientName = document.getElementById('recipient-name').value.trim();
    const message = document.getElementById('message').value.trim();
    const senderName = document.getElementById('sender-name').value.trim();
    const recipientEmail = document.getElementById('recipient-email').value.trim();

    // Validate all fields are filled
    if (!recipientName || !message || !senderName || !recipientEmail) {
        alert('Please fill in all fields! 🌸');
        return;
    }

    // Validate email format
    if (!recipientEmail.includes('@')) {
        alert('Please enter a valid email address! 📧');
        return;
    }

    // Disable button and show loading state
    this.disabled = true;
    this.textContent = 'Sending... 💌';

    // Simulate sending (replace with actual email service later)
    setTimeout(() => {
        document.getElementById('success-message').textContent = 
            `Your ${selectedFlower.name} in a ${selectedPot.name} has been sent to ${recipientEmail}!`;
        document.getElementById('success-modal').classList.add('show');
        this.disabled = false;
        this.textContent = 'Send Bouquet 💌';
    }, 1500);
});

// Reset form function (called from modal button)
function resetForm() {
    // Clear all inputs
    document.getElementById('recipient-name').value = '';
    document.getElementById('message').value = '';
    document.getElementById('sender-name').value = '';
    document.getElementById('recipient-email').value = '';
    
    // Hide modal
    document.getElementById('success-modal').classList.remove('show');
    
    // Update preview
    updatePreview();
    
    // Reset to default selections
    document.querySelectorAll('.flower-option').forEach((o, i) => {
        o.classList.remove('selected');
        if (i === 0) o.classList.add('selected');
    });
    
    document.querySelectorAll('.pot-option').forEach((o, i) => {
        o.classList.remove('selected');
        if (i === 0) o.classList.add('selected');
    });
    
    // Reset selected flower and pot
    selectedFlower = { 
        src: document.querySelector('.flower-option .flower-icon').src,
        name: 'Roses' 
    };
    
    selectedPot = { 
        src: document.querySelector('.pot-option .pot-icon').src,
        name: 'Classic Vase' 
    };
    
    // Reanimate with defaults
    animateFlowers();
    updatePot();
}
