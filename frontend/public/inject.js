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

  // --- Event Listeners for Run/Submit and Tab Switch ---

  // 1. Tab Switch
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      console.log('[LeetCode Mentor] Tab switched: Hidden');
      window.dispatchEvent(new CustomEvent("TAB_SWITCH", { detail: { status: "hidden" } }));
    } else {
      console.log('[LeetCode Mentor] Tab switched: Visible');
      window.dispatchEvent(new CustomEvent("TAB_SWITCH", { detail: { status: "visible" } }));
    }
  });

  // --- Execution Result Monitoring ---
  var resultPoller = null;

  function monitorExecutionResult(type) {
    if (resultPoller) clearInterval(resultPoller);

    console.log('[LeetCode Mentor] Monitoring execution result for ' + type + '...');

    // Initial delay to allow UI to update from previous state
    setTimeout(function () {
      var checks = 0;
      resultPoller = setInterval(function () {
        checks++;

        // Timeout
        if (checks > 120) {
          clearInterval(resultPoller);
          console.log('[LeetCode Mentor] Timed out waiting for execution result (60s).');
          return;
        }

        // Debug log every ~2 seconds
        if (checks % 4 === 0) {
          console.log('[LeetCode Mentor] Polling... (Attempt ' + checks + ')');
        }

        var foundStatus = null;
        var foundMessage = "";

        // --- Status Detection ---

        // 1. Success (Green Text)
        var successNode = document.querySelector('.text-green-500, .text-brand-green, .text-green-s, span[data-e2e-locator="result-header-accepted"]');
        if (successNode) {
          var t = successNode.innerText.trim();
          if (t.includes('Accepted') || t.includes('Success')) {
            foundStatus = 'Accepted';
          }
        }

        // 2. Error (Red Text Header)
        if (!foundStatus) {
          // We use a broader query for red text but validate content
          var errorNodes = document.querySelectorAll('.text-red-500, .text-brand-red, .text-red-s, .text-red-60, .text-yellow-500, [class*="error-title"]');
          for (var i = 0; i < errorNodes.length; i++) {
            var txt = errorNodes[i].innerText.trim();
            if (txt.includes('Wrong Answer')) { foundStatus = 'Wrong Answer'; break; }
            if (txt.includes('Runtime Error')) { foundStatus = 'Runtime Error'; break; }
            if (txt.includes('Compile Error')) { foundStatus = 'Compile Error'; break; }
            if (txt.includes('Time Limit Exceeded')) { foundStatus = 'Time Limit Exceeded'; break; }
            if (txt.includes('Output Limit Exceeded')) { foundStatus = 'Output Limit Exceeded'; break; }
            if (txt.includes('Memory Limit Exceeded')) { foundStatus = 'Memory Limit Exceeded'; break; }
            // Only use generic 'Error' if it looks like a header (short)
            if (txt.includes('Error') && txt.length < 50) { foundStatus = 'Error'; break; }
          }
        }

        // 3. Fallback: Content-based Detection (if no header found)
        // If we see a big block of red code text, it's likely a compile error
        if (!foundStatus) {
          var detailsNode = document.querySelector('.font-menlo, pre, .whitespace-pre-wrap');
          if (detailsNode && detailsNode.innerText.includes('error:')) {
            foundStatus = 'Compile Error'; // Infer status from content
            foundMessage = detailsNode.innerText;
          }
        }

        // --- Message Extraction ---

        if (foundStatus && foundStatus !== 'Accepted') {
          if (!foundMessage) {
            // Search all potential containers, not just the first one
            var candidates = document.querySelectorAll('.font-menlo, pre, .whitespace-pre-wrap, code');
            for (var k = 0; k < candidates.length; k++) {
              var node = candidates[k];
              var t = node.innerText;
              if (t.length > 10 && (t.includes('Line') || t.includes('error') || t.includes('Exception'))) {
                foundMessage = t;
                break;
              }
            }

            // Fallback: Check red text containers again if no code block found
            if (!foundMessage) {
              var redNodes = document.querySelectorAll('.text-red-60, .text-brand-red, .text-red-500, .text-red-s');
              for (var j = 0; j < redNodes.length; j++) {
                var r = redNodes[j];
                // Skip the header itself
                if (r.innerText.length > 30 && !r.innerText.includes(foundStatus)) {
                  foundMessage = r.innerText;
                  break;
                }
              }
            }
          }
        }

        if (foundStatus) {
          console.log('[LeetCode Mentor] Result captured: ' + foundStatus);
          if (foundMessage) {
            console.log('[LeetCode Mentor] Message captured: ' + foundMessage.substring(0, 100) + '...');
          } else {
            console.log('[LeetCode Mentor] No detailed error message found.');
          }

          window.dispatchEvent(new CustomEvent("CODE_EXECUTION_RESULT", {
            detail: {
              type: type, // 'TEST' or 'SUBMIT'
              result: foundStatus,
              errorMessage: foundMessage.substring(0, 2000)
            }
          }));
          clearInterval(resultPoller);
        }

      }, 500); // Check every 500ms
    }, 1000); // Wait 1s before first check to avoid stale results
  }

  // 2. Run / Submit Detection (Improved & Debugging)
  document.addEventListener("click", function (e) {
    var path = e.composedPath ? e.composedPath() : [e.target];

    // Inspect up to 7 levels up
    for (var i = 0; i < Math.min(path.length, 7); i++) {
      var el = path[i];
      if (!el || !el.getAttribute) continue;

      var text = (el.innerText || el.textContent || "").replace(/\s+/g, ' ').trim();
      var lowerText = text.toLowerCase();
      var testId = el.getAttribute('data-e2e-locator') || el.getAttribute('data-testid') || "";
      var ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();

      // Strategy A: Explicit Data Attributes
      if (testId.includes('console-run-button')) {
        console.log('[LeetCode Mentor] Run button clicked (detected by attribute)');
        window.dispatchEvent(new CustomEvent("TEST_RUN"));
        monitorExecutionResult('TEST_RUN');
        return;
      }
      if (testId.includes('console-submit-button')) {
        console.log('[LeetCode Mentor] Submit button clicked (detected by attribute)');
        window.dispatchEvent(new CustomEvent("SUBMIT_CODE"));
        monitorExecutionResult('SUBMIT_CODE');
        return;
      }

      // Strategy B: Text & Accessibility
      // Check for Run
      if (lowerText === 'run' || lowerText === 'run code' || ariaLabel.includes('run code') || ariaLabel === 'run') {
        console.log('[LeetCode Mentor] Run button clicked (detected by strict text/aria)');
        window.dispatchEvent(new CustomEvent("TEST_RUN"));
        monitorExecutionResult('TEST_RUN');
        return;
      }
      // Broader Run check: contains "Run" and is a button-ish thing
      var isButtonLike = el.tagName === 'BUTTON' ||
        el.getAttribute('role') === 'button' ||
        (el.className && typeof el.className === 'string' && (el.className.toLowerCase().includes('btn') || el.className.toLowerCase().includes('button')));

      if (lowerText.includes('run') && isButtonLike) {
        // Avoid "Runtime Error" or other stats by checking context or length
        // But keep it broad for now if < 20 chars
        if (lowerText.length < 20 && !lowerText.includes('error')) {
          console.log('[LeetCode Mentor] Run button clicked (detected by partial text)');
          window.dispatchEvent(new CustomEvent("TEST_RUN"));
          monitorExecutionResult('TEST_RUN');
          return;
        }
      }

      // Check for Submit
      if (lowerText === 'submit' || (lowerText.includes('submit') && lowerText.length < 20)) {
        console.log('[LeetCode Mentor] Submit button clicked (detected by text)');
        window.dispatchEvent(new CustomEvent("SUBMIT_CODE"));
        monitorExecutionResult('SUBMIT_CODE');
        return;
      }
    }
  }, true);

  setTimeout(getCodeFromEditor, 1000);
})();
