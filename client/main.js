document.addEventListener("DOMContentLoaded", () => {
    loadMessages(); // Load messages on page load
    document.getElementById("uploadModal").style.display = "none"; // Hide modal initially
});

// Function to send message
async function sendMessage(user) {
    let input = document.getElementById(`input${user}`);
    let fileInput = document.getElementById(`file${user}`);
    let message = input.value.trim();
    let file = fileInput.files[0];

    if (!message && !file) return; // Prevent empty messages

    let chatBox = document.getElementById(`messages${user}`);
    let otherUser = user === 1 ? 2 : 1;
    let otherChatBox = document.getElementById(`messages${otherUser}`);

    let imageUrl = null;

    if (file) {
        imageUrl = await uploadToCloudinary(file); // Upload image
    }

    let now = new Date();
    let timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let dateLabel = getDateLabel(now); // Get Today, Yesterday, or Date

    let messageData = {
        user: user,
        content: file ? imageUrl : message,
        type: file ? "image" : "text",
        timestamp: timestamp,
        date: now.toDateString() // Save full date
    };

    // Add date separator if necessary
    addDateSeparator(chatBox, messageData.date, user);

    let messageDiv = createMessageElement(user, message, imageUrl, timestamp, false);
    chatBox.appendChild(messageDiv);

    scrollToBottom(chatBox); // Auto-scroll

    setTimeout(() => {
        addDateSeparator(otherChatBox, messageData.date, otherUser);
        let receivedMessageDiv = createMessageElement(user, message, imageUrl, timestamp, true);
        otherChatBox.appendChild(receivedMessageDiv);
        updateTick(messageDiv, true); // Update sent message to ✔✔
        scrollToBottom(otherChatBox);
    }, 1000);

    // Save to MongoDB
    saveMessageToDB(messageData);

    input.value = "";
    fileInput.value = "";
}

// Function to create message elements
function createMessageElement(user, text, imageUrl, timestamp, isReceived) {
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `user${user}`);

    let messageContent = document.createElement("span");
    messageContent.classList.add("message-content");

    if (text) {
        messageContent.textContent = text;
    } else if (imageUrl) {
        let img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "200px"; // Limit image size
        messageContent.appendChild(img);
    }

    let messageInfo = document.createElement("div");
    messageInfo.classList.add("message-info");

    let timeSpan = document.createElement("span");
    timeSpan.classList.add("timestamp");
    timeSpan.textContent = timestamp;

    let tickSpan = document.createElement("span");
    tickSpan.classList.add("ticks");
    tickSpan.innerHTML = isReceived ? "✔️✔️" : "✔️"; // Single ✔️ for sent, ✔️✔️ for received

    messageInfo.appendChild(timeSpan);
    messageInfo.appendChild(tickSpan);

    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageInfo);

    return messageDiv;
}

// Function to auto-scroll chat to the bottom
function scrollToBottom(chatBox) {
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

// Function to update ticks (from ✔️ to ✔✔)
function updateTick(messageDiv, isReceived) {
    let tickSpan = messageDiv.querySelector(".ticks");
    if (tickSpan) {
        tickSpan.innerHTML = isReceived ? "✔️✔️" : "✔️";
    }
}

// Function to add "Today", "Yesterday", or date separator
function addDateSeparator(chatBox, date, user) {
    let lastDateDiv = chatBox.querySelector(".date-separator:last-of-type");

    if (!lastDateDiv || lastDateDiv.dataset.date !== date) {
        let dateDiv = document.createElement("div");
        dateDiv.classList.add("date-separator");
        dateDiv.dataset.date = date;
        dateDiv.textContent = getDateLabel(new Date(date));
        chatBox.appendChild(dateDiv);
    }
}

// Function to get "Today", "Yesterday" or actual date
function getDateLabel(date) {
    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return date.toDateString(); // Format: "Wed Mar 13 2025"
    }
}


// Upload image to Cloudinary
async function uploadToCloudinary(file) {
    let formData = new FormData();
    formData.append("file", file);
    
    let response = await fetch("https://pc-chating-api.vercel.app", {
        method: "POST",
        body: formData,
    });

    let data = await response.json();
    return data.url; // Return Cloudinary image URL
}

// Save message to MongoDB
async function saveMessageToDB(messageData) {
    try {
        let response = await fetch("https://pc-chating-api.vercel.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messageData),
        });

        let data = await response.json();
        console.log("Message saved:", data.message);
    } catch (error) {
        console.error("Error saving message:", error);
    }
}

// Create message element
function createMessageElement(user, text, imageUrl, status = "sent") {
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `user${user}`);

    // Create content container
    let contentDiv = document.createElement("div");

    if (text) {
        contentDiv.textContent = text;
    } else if (imageUrl) {
        let img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "200px"; // Limit image size
        contentDiv.appendChild(img);
    }

    // Get current time
    let timeSpan = document.createElement("span");
    let now = new Date();
    let hours = now.getHours() % 12 || 12;
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let amPm = now.getHours() >= 12 ? "PM" : "AM";
    
    timeSpan.textContent = `${hours}:${minutes} ${amPm}`;
    timeSpan.classList.add("message-time");

    // Create tick (✓, ✓✓, ✓✓ blue)
    let tickSpan = document.createElement("span");
    tickSpan.classList.add("message-tick");

    if (status === "sent") {
        tickSpan.innerHTML = "✓"; // Single tick
    } else if (status === "delivered") {
        tickSpan.innerHTML = "✓✓"; // Double tick
    } else if (status === "read") {
        tickSpan.innerHTML = "✓✓"; // Double tick blue
        tickSpan.style.color = "blue";
    }

    // Footer (time + tick)
    let footerDiv = document.createElement("div");
    footerDiv.classList.add("message-footer");
    footerDiv.appendChild(timeSpan);
    footerDiv.appendChild(tickSpan);

    // If it's an image, place the footer below the image
    if (imageUrl) {
        contentDiv.appendChild(footerDiv);
    } else {
        messageDiv.appendChild(footerDiv);
    }

    // Append elements
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

// Load messages from MongoDB
async function loadMessages() {
    try {
        let response = await fetch("https://pc-chating-api.vercel.app");
        let messages = await response.json();

        document.getElementById("messages1").innerHTML = "";
        document.getElementById("messages2").innerHTML = "";

        messages.forEach(msg => {
            let messageDiv = createMessageElement(msg.user, msg.type === "text" ? msg.content : null, msg.type === "image" ? msg.content : null);
            document.getElementById(`messages${msg.user}`).appendChild(messageDiv);
        });
    } catch (error) {
        console.error("Failed to load messages:", error);
    }
}

// Handle Enter key for sending messages
document.getElementById("input1").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage(1);
    }
});
document.getElementById("input2").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage(2);
    }
});

// Open file selection modal
function openModal(user) {
    document.getElementById("uploadModal").style.display = "flex";
    document.getElementById("uploadModal").setAttribute("data-user", user);
}

// Close modal
function closeModal() {
    document.getElementById("uploadModal").style.display = "none";
}

// Select file for upload
function selectFile(type) {
    let user = document.getElementById("uploadModal").getAttribute("data-user");
    let fileInput = document.getElementById(`file${user}`);

    if (type === "gallery" || type === "camera") {
        fileInput.accept = "image/*";
    } else if (type === "document") {
        fileInput.accept = ".pdf,.doc,.docx,.txt";
    } else if (type === "audio") {
        fileInput.accept = "audio/*";
    }

    fileInput.click();
    closeModal();
}



// for delete message both ui and database
async function clearChat(chatboxId) {
    let chatBox = document.getElementById(chatboxId);
    let user = chatboxId === "messages1" ? 1 : 2;

    // Collect all image URLs from messages
    let images = Array.from(chatBox.querySelectorAll("img")).map(img => img.src);

    // Clear messages from UI
    chatBox.innerHTML = "";

    // Delete messages from MongoDB
    await deleteMessagesFromDB(user);

    // Delete images from Cloudinary
    for (let imageUrl of images) {
        await deleteFromCloudinary(imageUrl);
    }
}

// Delete messages from MongoDB
async function deleteMessagesFromDB(user) {
    try {
        let response = await fetch(`https://pc-chating-api.vercel.app${user}`, {
            method: "DELETE",
        });
        let data = await response.json();
        console.log("Messages deleted:", data);
    } catch (error) {
        console.error("Error deleting messages:", error);
    }
}

// Delete image from Cloudinary
async function deleteFromCloudinary(imageUrl) {
    try {
        let response = await fetch("https://pc-chating-api.vercel.app/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl }),
        });

        let data = await response.json();
        console.log("Image deleted:", data);
    } catch (error) {
        console.error("Error deleting image:", error);
    }
}
