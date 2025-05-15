document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const themeToggleButton = document.getElementById('theme-toggle');
    const chatInterface = document.getElementById('chat-interface');
    const britannicaDisguise = document.getElementById('britannica-disguise');
    const britannicaSearchInput = document.getElementById('britannica-search');
    const emergencyButton = document.getElementById('emergency-button');
    const controlsArea = document.getElementById('controls-area');
    const newChatControl = document.getElementById('new-chat-control'); // Keep ref even if hidden
    const briLogoLink = document.getElementById('bri-logo-link');
    const faviconLink = document.getElementById('favicon-link');
    const mainChatLog = document.getElementById('chat-log');
    const briChatLogArea = document.getElementById('bri-chat-log-area');
    const mainUserInput = document.getElementById('userInput');
    const mainSendButton = document.getElementById('send-button');
    const modelSelector = document.getElementById('model-selector'); // <-- Added model selector
    const initialStateContainer = document.getElementById('initial-state');
    const examplePromptsContainer = document.querySelector('.initial-state-examples');
    const briCommentInput = document.getElementById('bri-comment-input');
    const briCommentSend = document.getElementById('bri-comment-send');
    const briTitleInput = document.getElementById('bri-title-input');
    const briSidebarTitle = document.getElementById('bri-sidebar-title');
    const briBreadcrumbLink = document.getElementById('bri-breadcrumb-link');
    const briPlaceholderContent = document.getElementById('bri-placeholder-content'); // Placeholder

    // --- State ---
    let chatHistory = [];
    let currentView = 'chat'; // 'chat' or 'britannica'

    // --- Config ---
    const mainTitle = "Encyclopedia Britannica | Britannica";
    const mainFavicon = "photos/favicon.png";
    const educationalTitle = "World War II | Britannica";
    const educationalFavicon = "photos/favicon-britannica.png";
    const defaultDisguiseTopic = "World War II";
    const defaultDisguiseBreadcrumb = "Wars, Battles & Armed Conflicts";

    const examplePromptsList = [
        "Explain the concept of quantum entanglement in simple terms.",
        "Write a short story about a time traveler visiting ancient Rome.",
        "What are the pros and cons of renewable energy sources?",
        "Generate a recipe for a vegan chocolate cake.",
        "Give me 5 ideas for a weekend trip near London.",
        "Summarize the main points of the theory of relativity.",
        "Translate 'Hello, how are you?' into French and Spanish.",
        "Write a Python function to check if a number is prime.",
        "What was the significance of the Silk Road?",
        "Compose a short poem about the changing seasons."
    ];
    const numberOfExamplesToShow = 4;

    const API_KEY = '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'; // Replace with your key
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    // Default/Pro model (used when 'pro' is selected in dropdown)
    const DEFAULT_PRO_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

    // --- Theme Handling ---
    const sunIcon = '<i class="fas fa-sun"></i>';
    const moonIcon = '<i class="fas fa-moon"></i>';

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleButton.innerHTML = sunIcon; // Show sun in dark mode
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggleButton.innerHTML = moonIcon; // Show moon in light mode
            localStorage.setItem('theme', 'light');
        }
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    }

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggleButton.addEventListener('click', toggleTheme);
    // --- End Theme Handling ---

    // --- View Switching ---
    function syncLogs(sourceLogContainerId, destinationLogContainerId) {
        const sourceLog = document.getElementById(sourceLogContainerId);
        const destinationLog = document.getElementById(destinationLogContainerId);
        if (!sourceLog || !destinationLog) {
            console.error("Log container not found during sync");
            return;
        }
        console.log(`Syncing from ${sourceLogContainerId} to ${destinationLogContainerId}`);

        // Clear destination log before re-rendering
        destinationLog.innerHTML = '';

        // Re-render chat history in the destination log format
        chatHistory.forEach(message => {
            let contentForDisplay = message.content;
            // Parse markdown only for AI messages before creating element
            if (message.role === 'assistant' && typeof marked !== 'undefined') {
                 try {
                     contentForDisplay = marked.parse(message.content);
                 } catch (e) {
                     console.error("Markdown parsing error during sync:", e);
                     // Use raw content as fallback
                     contentForDisplay = message.content.replace(/</g, "<").replace(/>/g, ">");
                 }
            } else {
                 // Basic escaping for user messages to prevent accidental HTML injection
                 contentForDisplay = message.content.replace(/</g, "<").replace(/>/g, ">");
            }
            createMessageElement(message.role === 'user' ? 'user' : 'ai', contentForDisplay, true, destinationLog); // Treat as HTML after potential parsing
        });

        // Ensure scroll position is correct after syncing
        scrollToBottom(destinationLog);
    }


    function switchToEducational() {
        if (currentView === 'britannica') return;
        console.log("Switching to Britannica view");
        currentView = 'britannica';

        // Update titles and favicon for disguise
        document.title = educationalTitle;
        faviconLink.href = educationalFavicon;
        if (briTitleInput) briTitleInput.value = defaultDisguiseTopic;
        if (briSidebarTitle) briSidebarTitle.textContent = defaultDisguiseTopic;
        if (briBreadcrumbLink) briBreadcrumbLink.textContent = defaultDisguiseBreadcrumb;


        // Show/Hide placeholder based on chat history
        if (chatHistory.length === 0) {
            console.log("Chat empty, showing placeholder");
            // Ensure messages are cleared before showing placeholder
            briChatLogArea.querySelectorAll('.message').forEach(msg => msg.remove());
            if (briPlaceholderContent) briPlaceholderContent.classList.remove('hidden'); // Show placeholder
        } else {
            console.log("Chat has history, syncing logs to Britannica view");
            if (briPlaceholderContent) briPlaceholderContent.classList.add('hidden'); // Hide placeholder
            syncLogs('chat-log', 'bri-chat-log-area'); // Sync messages FROM main TO bri
        }

        // Toggle visibility of interfaces and controls
        chatInterface.style.display = 'none';
        britannicaDisguise.style.display = 'flex'; // Use flex for bri layout
        controlsArea.classList.add('hidden'); // Hide theme/emergency buttons
        newChatControl.classList.add('hidden'); // Ensure new chat is hidden
        body.style.overflow = 'hidden'; // Keep body overflow hidden

        // Focus the disguise input
        if(briCommentInput) briCommentInput.focus();
    }

    function switchToMain() {
        if (currentView === 'chat') return;
        console.log("Switching to Main chat view");
        currentView = 'chat';

        // Update title and favicon for main chat
        document.title = mainTitle;
        faviconLink.href = mainFavicon;

        // Hide placeholder before syncing back (if it was visible)
        if (briPlaceholderContent) briPlaceholderContent.classList.add('hidden');

        // Sync logs FROM bri TO main
        syncLogs('bri-chat-log-area', 'chat-log');

        // Toggle visibility of interfaces and controls
        britannicaDisguise.style.display = 'none';
        chatInterface.style.display = 'flex'; // Use flex for chat layout
        controlsArea.classList.remove('hidden'); // Show theme/emergency buttons
        newChatControl.classList.add('hidden'); // Keep new chat hidden for now

        if(britannicaSearchInput) britannicaSearchInput.value = ''; // Clear search
        body.style.overflow = 'hidden'; // Keep body overflow hidden

        // Show initial state in main view only if history is empty
        if (chatHistory.length === 0 && initialStateContainer) {
           initialStateContainer.classList.remove('hidden');
           // Ensure initial state is prepended if somehow removed
           if (!mainChatLog.contains(initialStateContainer)) mainChatLog.prepend(initialStateContainer);
        } else if (initialStateContainer) {
            // Hide initial state if there's history
            initialStateContainer.classList.add('hidden');
        }

        // Focus the main input
        mainUserInput.focus();
    }
    // Make switch functions globally accessible for onclick attributes
    window.switchToEducational = switchToEducational;
    window.switchToMain = switchToMain;

    // Function to check search input (for potential future use or simple switch back)
    window.checkSearch = () => {
        if (britannicaSearchInput && britannicaSearchInput.value.trim().toLowerCase() === 'exit') {
            switchToMain();
            britannicaSearchInput.value = ''; // Clear after switching
        }
    };
    // Listener attached via oninput in HTML for search input

    // --- End View Switching ---

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (event) => {
        const isCmdOrCtrl = event.metaKey || event.ctrlKey;
        const isInputFocused = document.activeElement === mainUserInput || document.activeElement === briCommentInput;

        // Toggle Theme: Ctrl/Cmd + T (only if not typing in input)
        if (isCmdOrCtrl && event.key.toLowerCase() === 't' && !isInputFocused) {
            event.preventDefault();
            toggleTheme();
        }

        // Switch View: Ctrl/Cmd + M (only if not typing in input)
        if (isCmdOrCtrl && event.key.toLowerCase() === 'm' && !isInputFocused) {
            event.preventDefault();
            if (currentView === 'chat') {
                switchToEducational();
            } else {
                switchToMain();
            }
        }

        // Focus Input: Ctrl/Cmd + I (or just Escape to focus appropriate input)
         if (isCmdOrCtrl && event.key.toLowerCase() === 'i') {
             event.preventDefault();
             if (currentView === 'chat') {
                 mainUserInput.focus();
             } else {
                 briCommentInput.focus();
             }
         }
         // Focus input with Escape key
         if (event.key === 'Escape') {
              event.preventDefault();
             if (currentView === 'chat') {
                 mainUserInput.focus();
             } else {
                 briCommentInput.focus();
             }
         }
    });
    // --- End Keyboard Shortcuts ---

    // --- Title Input Handling ---
    function handleTitleChange(event) {
        const newTitle = event.target.value;
        // Update sidebar title and breadcrumb if they exist
        if (briSidebarTitle) {
            briSidebarTitle.textContent = newTitle || defaultDisguiseTopic;
        }
        if (briBreadcrumbLink) {
            // Keep breadcrumb category general for simplicity, or update based on title
             briBreadcrumbLink.textContent = defaultDisguiseBreadcrumb; // Resetting for now
        }
         // Optionally update document title as well, though maybe confusing
         // document.title = newTitle + " | Britannica";
    }
    // Make handler globally accessible for oninput attribute
    window.handleTitleChange = handleTitleChange;
    // Listener attached via oninput in HTML for title input

    // --- End Title Input Handling ---


    // --- Chat Functionality ---
    function clearChat() {
        console.log("Clearing chat in view:", currentView);
        // Clear visual logs
        // Remove only .message elements, keep #initial-state if present
        mainChatLog.querySelectorAll('.message').forEach(msg => msg.remove());
        briChatLogArea.querySelectorAll('.message').forEach(msg => msg.remove());

        // Clear history data
        chatHistory = [];

        // Reset initial/placeholder state visibility for the CURRENT view
        if (currentView === 'chat' && initialStateContainer) {
            initialStateContainer.classList.remove('hidden');
             // Ensure initial state is present and first child
             if (!mainChatLog.contains(initialStateContainer)) {
                 mainChatLog.prepend(initialStateContainer);
             } else if (mainChatLog.firstChild !== initialStateContainer) {
                 mainChatLog.prepend(initialStateContainer);
             }
             // Optionally regenerate example prompts
             const randomPrompts = getRandomPrompts(examplePromptsList, numberOfExamplesToShow);
             displayExamplePrompts(randomPrompts);
        } else if (currentView === 'britannica' && briPlaceholderContent) {
             briPlaceholderContent.classList.remove('hidden'); // Show placeholder in bri view
        }

        // Clear and focus the relevant input
        if (currentView === 'chat') {
            mainUserInput.value = '';
            autoResizeTextarea(mainUserInput);
            mainUserInput.focus();
        } else {
            briCommentInput.value = '';
            // briCommentInput doesn't auto-resize in this setup, just focus
            briCommentInput.focus();
        }
         console.log("Chat cleared. History:", chatHistory);
    }

    function getActiveChatLog() {
        return currentView === 'chat' ? mainChatLog : briChatLogArea;
    }

    function scrollToBottom(targetLog = null) {
        const log = targetLog || getActiveChatLog();
        if (!log) return;
        // Use a small timeout to ensure DOM update before scrolling
        clearTimeout(scrollToBottom.timeoutId); // Clear previous timeout if any
        scrollToBottom.timeoutId = setTimeout(() => {
            // Check if scrolling is needed (prevent unnecessary scrolls)
            if (log.scrollHeight > log.clientHeight) {
                 log.scrollTop = log.scrollHeight;
            }
        }, 50); // 50ms delay seems reasonable
    }
    scrollToBottom.timeoutId = null; // Initialize timeout ID


    function createMessageElement(sender, contentForDisplay = '', isHtml = false, targetLog = null) {
         const log = targetLog || getActiveChatLog();
         if (!log) {
             console.error("Target log not found for creating message element.");
             return null; // Return null if log doesn't exist
         }

         // Hide initial state only if adding to main log and it's visible
         if (log === mainChatLog && initialStateContainer && !initialStateContainer.classList.contains('hidden')) {
             initialStateContainer.classList.add('hidden');
         }
         // Hide bri placeholder only if adding to bri log and it's visible
         if (log === briChatLogArea && briPlaceholderContent && !briPlaceholderContent.classList.contains('hidden')) {
              briPlaceholderContent.classList.add('hidden');
         }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        // Apply fade-in only for the default chat view
        if (log === mainChatLog) {
             messageDiv.classList.add('fade-in');
        }

        const textDiv = document.createElement('div');
        textDiv.classList.add('text');

        // --- View-Specific Rendering ---
        if (log === mainChatLog) { // Default View
            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('avatar');
            avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

            if (isHtml) {
                // Sanitize HTML slightly before inserting if needed, but marked.parse should be safe
                // For user input that isn't markdown, ensure basic escaping happened before calling this
                textDiv.innerHTML = contentForDisplay;
            } else {
                textDiv.textContent = contentForDisplay; // Use textContent for plain text (safer default)
            }

            // Append in correct order (text then avatar for user, avatar then text for AI)
             if (sender === 'user') {
                messageDiv.appendChild(textDiv);
                messageDiv.appendChild(avatarDiv);
            } else {
                messageDiv.appendChild(avatarDiv);
                messageDiv.appendChild(textDiv);
            }

        } else { // Britannica Disguise View
             // No avatar needed
             if (isHtml) {
                 textDiv.innerHTML = contentForDisplay; // Assumes content is safe (parsed markdown or escaped user text)
             } else {
                 textDiv.textContent = contentForDisplay;
             }
             // Styling for user/ai is handled by CSS in this view
             messageDiv.appendChild(textDiv);
        }
        // --- End View-Specific Rendering ---


        log.appendChild(messageDiv);
        scrollToBottom(log);
        return messageDiv; // Return the created element
    }

    // --- Textarea Handling ---
    function handleInputKeydown(event, inputElement) {
        // Send on Enter (unless Shift is pressed)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent newline
            triggerSendMessage(); // Use the unified trigger function
        }
    }

    function autoResizeTextarea(element = mainUserInput) {
         if (!element) return;
        // Reset height to auto to get the natural scroll height
        element.style.height = 'auto';
        // Set height to scroll height, but respect max-height from CSS
        const maxHeight = parseInt(window.getComputedStyle(element).maxHeight, 10) || Infinity;
        let newHeight = element.scrollHeight;

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            element.style.overflowY = 'auto'; // Ensure scrollbar appears if needed
        } else {
            element.style.overflowY = 'hidden'; // Hide scrollbar if not needed
        }
         // Only set height if it's different to avoid minor layout shifts
         if (element.style.height !== `${newHeight}px`) {
             element.style.height = `${newHeight}px`;
         }


        // Adjust send button visibility/state based on content (for main input)
        if (element === mainUserInput && mainSendButton) {
             const hasText = element.value.trim().length > 0;
             mainSendButton.style.opacity = hasText ? '1' : '0.5';
             // Button 'disabled' state is handled during the API call process
         }
    }

    mainUserInput.addEventListener('keydown', (event) => { handleInputKeydown(event, mainUserInput); });
    mainUserInput.addEventListener('input', () => autoResizeTextarea(mainUserInput));
    briCommentInput.addEventListener('keydown', (event) => { handleInputKeydown(event, briCommentInput); });
    // briCommentInput doesn't need auto-resize in this design
    // --- End Textarea Handling ---

    // --- Random Prompt Generation ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    function getRandomPrompts(list, count) {
        if (!list || list.length === 0) return [];
        const numToSelect = Math.min(count, list.length);
        const shuffledList = [...list]; // Create a copy to avoid modifying original
        shuffleArray(shuffledList);
        return shuffledList.slice(0, numToSelect);
    }

    function displayExamplePrompts(prompts) {
        if (!examplePromptsContainer) return;
        examplePromptsContainer.innerHTML = ''; // Clear existing prompts
        prompts.forEach(promptText => {
            const button = document.createElement('button');
            button.classList.add('example-prompt');
            // Truncate long prompts for display, show full in title
            const displayText = promptText.length > 50 ? promptText.substring(0, 47) + '...' : promptText;
            button.textContent = displayText;
            button.setAttribute('data-prompt', promptText);
            button.setAttribute('title', promptText); // Tooltip shows full prompt
            button.addEventListener('click', () => {
                mainUserInput.value = button.getAttribute('data-prompt');
                mainUserInput.focus();
                autoResizeTextarea(mainUserInput); // Resize after setting value
                // Optionally trigger send immediately:
                triggerSendMessage();
            });
            examplePromptsContainer.appendChild(button);
        });
    }
    // --- End Random Prompt Generation ---

    // --- Unified Send Trigger ---
    // Made globally accessible for onclick attributes
    window.triggerSendMessage = () => {
        let inputText = '';
        let inputElement;
        let sendButtonElement;

        if (currentView === 'chat') {
            inputText = mainUserInput.value.trim();
            inputElement = mainUserInput;
            sendButtonElement = mainSendButton;
        } else {
            inputText = briCommentInput.value.trim();
            inputElement = briCommentInput;
            sendButtonElement = briCommentSend;
        }

        if (inputText && sendButtonElement && !sendButtonElement.disabled) {
            // Hide placeholder content if needed (also handled in createMessageElement, but good safety)
            if (currentView === 'britannica' && briPlaceholderContent && !briPlaceholderContent.classList.contains('hidden')) {
                console.log("Hiding placeholder content on send");
                briPlaceholderContent.classList.add('hidden');
            }
            // Hide initial state if needed (also handled in createMessageElement)
             if (currentView === 'chat' && initialStateContainer && !initialStateContainer.classList.contains('hidden')) {
                 initialStateContainer.classList.add('hidden');
             }

            sendMessage(inputText); // Call the async API function
            inputElement.value = ''; // Clear the input field
            if (inputElement === mainUserInput) {
                autoResizeTextarea(mainUserInput); // Resize main textarea after clearing
                mainSendButton.style.opacity = '0.5'; // Reset button opacity
            }
            inputElement.focus(); // Keep focus on the input
        } else {
             console.log("Send triggered but no input or button disabled.");
        }
    };
    // Attach via JS as well (redundant with onclick but good practice)
    if (mainSendButton) mainSendButton.addEventListener('click', triggerSendMessage);
    if (briCommentSend) briCommentSend.addEventListener('click', triggerSendMessage);
    // --- End Unified Send Trigger ---

    // --- API Call (sendMessage) ---
    async function sendMessage(inputText) {
        // Add user message to history and display it (escape basic HTML)
        const escapedInputText = inputText.replace(/</g, "<").replace(/>/g, ">");
        chatHistory.push({ role: 'user', content: inputText }); // Store raw text in history
        const userMsgElement = createMessageElement('user', escapedInputText, true); // Display escaped text

        // Disable the correct send button
        const sendButton = currentView === 'chat' ? mainSendButton : briCommentSend;
        if (sendButton) sendButton.disabled = true;
        if (currentView === 'chat' && mainSendButton) mainSendButton.style.opacity = '0.5'; // Visually indicate disabled state for main chat

        // --- Determine Model ---
        let apiModelIdentifier = DEFAULT_PRO_MODEL; // Default
        if (modelSelector) { // Check if selector exists
            const selectedModelValue = modelSelector.value;
            if (selectedModelValue === "pro") {
                apiModelIdentifier = DEFAULT_PRO_MODEL;
            } else {
                apiModelIdentifier = selectedModelValue; // Use the value directly (e.g., "google/gemini-2.0-flash-001")
            }
        } else {
            console.warn("Model selector element not found. Using default model.");
        }
        console.log("Using model:", apiModelIdentifier);
        // --- End Determine Model ---


        // Prepare payload for API (send current history)
        const messagesPayload = [...chatHistory]; // Send a copy

        // Create placeholder for AI response
        const aiMessageElement = createMessageElement('ai', '', true); // Prepare for HTML content
        const aiTextDiv = aiMessageElement ? aiMessageElement.querySelector('.text') : null;

        if (!aiTextDiv) {
            console.error("Could not find AI message text div. Aborting API call.");
            // Re-enable button if something went wrong early
            if (sendButton) sendButton.disabled = false;
            if (currentView === 'chat' && mainSendButton) mainSendButton.style.opacity = '1';
            // Consider removing the user message added just before
            if (chatHistory.length > 0 && chatHistory[chatHistory.length-1].role === 'user') {
                chatHistory.pop();
                if (userMsgElement) userMsgElement.remove(); // Also remove visually
            }
            return;
        }

        aiTextDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...'; // Loading indicator
        scrollToBottom();

        let fullAiResponseText = "";

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: apiModelIdentifier, // Use the determined model here
                    messages: messagesPayload,
                    stream: true, // Request streaming response
                    // Add other parameters if needed (temperature, max_tokens, etc.)
                    provider: {
                        sort: "throughput"
                    }
                }),
            });

             if (!response.ok) {
                 let errorDetail = `API Error (${response.status})`;
                 try {
                     const errorData = await response.json();
                     errorDetail = errorData.error?.message || JSON.stringify(errorData);
                 } catch (e) {
                     try { errorDetail = await response.text(); } catch (e2) {}
                 }
                 // Error occurred - DO NOT add AI response to history, remove user message
                 if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user' && chatHistory[chatHistory.length - 1].content === inputText) {
                      console.warn("Removing last user message from history due to API error.");
                      chatHistory.pop();
                 }
                 // We don't remove the visual user message here, as the error is shown in the AI bubble
                 throw new Error(errorDetail);
             }

            if (!response.body) {
                 // Error occurred - DO NOT add AI response to history, remove user message
                 if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user' && chatHistory[chatHistory.length - 1].content === inputText) {
                      console.warn("Removing last user message from history due to missing response body.");
                      chatHistory.pop();
                 }
                 throw new Error("Response body is undefined.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            aiTextDiv.innerHTML = ''; // Clear the "Thinking..." indicator

            // Process the stream
            while (true) {
                const { value, done } = await reader.read();
                if (done) break; // Stream finished

                buffer += decoder.decode(value, { stream: true });

                // Process Server-Sent Events (SSE) chunks
                let boundary = buffer.indexOf('\n\n');
                while (boundary !== -1) {
                    const chunk = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 2); // Move past the '\n\n'

                     const lines = chunk.split('\n');
                     for (const line of lines) {
                         if (line.startsWith('data:')) {
                             const jsonString = line.substring(5).trim();
                              if (jsonString === '[DONE]') {
                                 continue;
                             }
                             try {
                                 const data = JSON.parse(jsonString);
                                 const deltaContent = data.choices?.[0]?.delta?.content;

                                 if (deltaContent) {
                                     fullAiResponseText += deltaContent;
                                     // Update the message element incrementally with basic escaping/formatting
                                     // Avoid full markdown parsing on every chunk for performance
                                     aiTextDiv.innerHTML += deltaContent
                                         .replace(/&/g, "&") // Use proper escaping
                                         .replace(/</g, "<")
                                         .replace(/>/g, ">")
                                         .replace(/\n/g, "<br>");
                                     scrollToBottom(); // Scroll as content arrives
                                 }
                             } catch (e) {
                                 console.error('Error parsing SSE JSON:', e, 'Chunk:', jsonString);
                             }
                         }
                     } // End for each line
                    boundary = buffer.indexOf('\n\n'); // Look for next chunk boundary
                } // End while boundary
            } // End while reader loop

            // Final processing after stream ends
            let finalHtmlContent = fullAiResponseText.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/\n/g, "<br>"); // Default fallback
            if (typeof marked !== 'undefined') {
                 try {
                     finalHtmlContent = marked.parse(fullAiResponseText); // Apply Markdown
                 } catch(e) {
                     console.error("Markdown parsing error on final content:", e);
                     // Keep the basic escaped version if parsing fails
                 }
            }
            aiTextDiv.innerHTML = finalHtmlContent; // Set final parsed content


            // Add the complete AI response to history
            if (fullAiResponseText) {
                chatHistory.push({ role: 'assistant', content: fullAiResponseText }); // Store raw AI response
            } else {
                // Handle cases where the stream finished but no content was received
                 aiTextDiv.innerHTML = "<i>(Empty response received)</i>";
                 // Optionally remove the placeholder from history if it's truly empty
                 // chatHistory.push({ role: 'assistant', content: "" }); // Add empty string? Or nothing?
            }
            scrollToBottom(); // Final scroll

        } catch (error) {
            console.error('Streaming Fetch Error:', error);
             // Display error in the AI message bubble
             if (aiMessageElement && aiTextDiv) {
                 const errorHtml = (typeof marked !== 'undefined')
                     ? marked.parse(`⚠️ **Error:** ${error.message}`)
                     : `<strong>⚠️ Error:</strong> ${error.message.replace(/</g, "<").replace(/>/g, ">")}`;
                 aiTextDiv.innerHTML = errorHtml;
             } else {
                 // If bubble wasn't created (unlikely with checks), add a new error message
                 createMessageElement('ai', `⚠️ Error: ${error.message}`, true);
             }
             // History cleanup for user message already happened when error was thrown/caught

        } finally {
            // Re-enable the correct send button regardless of success or error
            if (sendButton) sendButton.disabled = false;
            const inputToFocus = currentView === 'chat' ? mainUserInput : briCommentInput;
            if (inputToFocus) inputToFocus.focus(); // Restore focus
             if (currentView === 'chat' && mainSendButton && mainUserInput) {
                 autoResizeTextarea(mainUserInput); // Recalculate size (might not be needed if cleared)
                 mainSendButton.style.opacity = mainUserInput.value.trim() ? '1' : '0.5'; // Update opacity based on content
             }
        }
    }
    // Make sendMessage globally available if needed for debugging or other triggers
    window.sendMessage = sendMessage;
    // --- End API Call ---

    // --- Initial Setup ---
    // Clear chat via logo click in Britannica view
    if (briLogoLink) {
        briLogoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigation
            // Only clear if in Britannica view, otherwise it's confusing
            if (currentView === 'britannica') {
                clearChat();
                 // Reset titles after clearing in disguise mode
                 if (briTitleInput) briTitleInput.value = defaultDisguiseTopic;
                 if (briSidebarTitle) briSidebarTitle.textContent = defaultDisguiseTopic;
                 if (briBreadcrumbLink) briBreadcrumbLink.textContent = defaultDisguiseBreadcrumb;
            }
        });
    } else { console.error("Britannica logo link not found!"); }

    // Start in main chat view
    chatInterface.style.display = 'flex';
    britannicaDisguise.style.display = 'none';
    currentView = 'chat';
    newChatControl.classList.add('hidden'); // Hide new chat button initially

    // Setup initial state for main chat view
    if (initialStateContainer) {
        const randomPrompts = getRandomPrompts(examplePromptsList, numberOfExamplesToShow);
        displayExamplePrompts(randomPrompts);
        initialStateContainer.classList.remove('hidden'); // Show it
    }
    // Ensure Britannica placeholder starts hidden
    if (briPlaceholderContent) { briPlaceholderContent.classList.add('hidden'); }

    mainUserInput.focus(); // Focus main input on load
    autoResizeTextarea(mainUserInput); // Initial resize
    body.style.overflow = 'hidden'; // Prevent body scrolling
    // --- End Initial Setup ---


}); // End DOMContentLoaded
