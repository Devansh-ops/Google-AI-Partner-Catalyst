// src/inject.js - This file is loaded directly as a script, so it must be plain JavaScript
(function () {
  console.log('[LeetCode Mentor] Inject script loaded! v2.0 - Verifying all methods active...');

  var codeFound = false;
  var attempts = 0;
  var maxAttempts = 200; // Increased attempts

  function getCodeFromEditor() {
    attempts++;
    try {
      var code = null;

      // Primary Method: Recursive Shadow DOM Search (Most reliable for LeetCode's current structure)
      function findEditorText(root) {
        // 1. Check for Monaco (.view-lines)
        var lines = root.querySelectorAll ? root.querySelectorAll('.view-lines .view-line') : [];
        if (lines.length > 0) {
          var textParts = [];
          for (var j = 0; j < lines.length; j++) {
            textParts.push(lines[j].innerText || lines[j].textContent);
          }
          return textParts.join('\n');
        }

        // 2. Check for CodeMirror 6 (.cm-content)
        var cm6 = root.querySelector ? root.querySelector('.cm-content') : null;
        if (cm6) return cm6.innerText || cm6.textContent;

        // 3. Check for CodeMirror 5 (.CodeMirror)
        var cm5 = root.querySelector ? root.querySelector('.CodeMirror') : null;
        if (cm5 && cm5.CodeMirror) return cm5.CodeMirror.getValue();

        // 4. Recursively check children with shadowRoot
        var children = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (var i = 0; i < children.length; i++) {
          if (children[i].shadowRoot) {
            var text = findEditorText(children[i].shadowRoot);
            if (text) return text;
          }
        }
        return null;
      }

      code = findEditorText(document.body);

      // Fallback: Global Monaco (if available and not in Shadow DOM)
      if (!code && window.monaco && window.monaco.editor) {
        var editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
          var model = editors[0].getModel();
          if (model) code = model.getValue();
        }
      }

      if (code && code.trim().length > 0) {
        if (!codeFound || code !== lastCode) {
          console.log('[LeetCode Mentor] Code captured (Length: ' + code.length + ')');
          console.log('[LeetCode Mentor] Code captured: ' + code);
          codeFound = true;
          lastCode = code;
          window.dispatchEvent(new CustomEvent("CODE_RESPONSE", { detail: { code: code } }));
        }
        return code;
      }

    } catch (e) {
      console.error("[LeetCode Mentor] Error retrieving code:", e);
    }
    return null;
  }

  var lastCode = null;
  var intervalId = setInterval(function () {
    getCodeFromEditor();
    if (attempts >= maxAttempts) {
      console.log('[LeetCode Mentor] Max attempts reached.');
      clearInterval(intervalId);
    }
  }, 2000); // Polling every 2s

  // Also listen for manual GET_CODE events
  window.addEventListener("GET_CODE", function () {
    var code = getCodeFromEditor();
    if (code) {
      window.dispatchEvent(new CustomEvent("CODE_RESPONSE", { detail: { code: code } }));
    }
  });

  // --- Problem Title Detection ---
  function getProblemDescription() {
    try {
      // Method 1: Check for specific data attributes (often used in LeetCode)
      var content = document.querySelector('[data-track-load="description_content"]');
      if (content) return content.innerText;

      // Method 2: Check for meta description (good fallback for summary)
      var meta = document.querySelector('meta[name="description"]');
      if (meta && meta.content) return meta.content;

      // Method 3: Search for common class patterns in the DOM
      // We look for the main content area.
      var possibleContainers = document.querySelectorAll('div');
      for (var i = 0; i < possibleContainers.length; i++) {
        var el = possibleContainers[i];
        // Heuristic: Check if class contains 'description' or 'content' and has substantial text
        if ((el.className.includes && (el.className.includes('description') || el.className.includes('content'))) && el.innerText.length > 100) {
          // This is a bit loose, so we prioritize the data attribute above
          // ensuring we don't pick up the whole page
          if (el.innerText.includes('Example 1:')) {
            return el.innerText;
          }
        }
      }
    } catch (e) {
      console.log('[LeetCode Mentor] Error extracting description:', e);
    }
    return "";
  }

  function getProblemDetails() {
    var title = document.title || "";
    var parts = title.split(' - ');
    if (parts.length > 0) {
      title = parts[0];
    }

    return {
      title: title,
      url: window.location.href,
      description: getProblemDescription()
    };
  }

  function broadcastProblemDetails() {
    var details = getProblemDetails();
    if (details.title && details.title !== "LeetCode") {
      window.dispatchEvent(new CustomEvent("PROBLEM_UPDATED", { detail: details }));
    }
  }

  // Poll for title changes (SPA navigation)
  var lastUrl = location.href;
  var lastTitle = document.title;

  setInterval(function () {
    if (location.href !== lastUrl) {
      console.log('[LeetCode Mentor] URL change detected: ' + lastUrl + ' -> ' + location.href);
      lastUrl = location.href;

      // When URL changes, we expect the problem title/description to change too.
      // We monitor for the title change to ensure we have loaded the new page content.
      var checks = 0;
      var checkInterval = setInterval(function () {
        checks++;
        // title usually changes in LeetCode navigation
        if (document.title !== lastTitle || checks > 10) {
          clearInterval(checkInterval);
          lastTitle = document.title;
          console.log('[LeetCode Mentor] Content likely updated (Title match: ' + (document.title === lastTitle) + '). Broadcasting.');
          broadcastProblemDetails();

          // Extra safety broadcast for description DOM which might lag behind title
          setTimeout(broadcastProblemDetails, 1500);
        }
      }, 500);
    }
  }, 1000);

  // Listen for request from React App
  window.addEventListener("GET_PROBLEM_DETAILS", function () {
    broadcastProblemDetails();
  });

  // Initial broadcast
  setTimeout(broadcastProblemDetails, 2000);

  setTimeout(getCodeFromEditor, 1000);
})();
