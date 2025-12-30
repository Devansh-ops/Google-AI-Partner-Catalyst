// src/inject.js - This file is loaded directly as a script, so it must be plain JavaScript
(function () {
  console.log('[LeetCode Mentor] Inject script loaded! v2.3 - Tab Switch Schema Enforced...');

  var lastDispatchedCode = null;
  var lastCode = null;
  var codeFound = false;
  var attempts = 0;
  var maxAttempts = 200; // Increased attempts

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

  function captureCode() {
    try {
      var code = findEditorText(document.body);

      // Fallback: Global Monaco (if available and not in Shadow DOM)
      if (!code && window.monaco && window.monaco.editor) {
        var editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
          var model = editors[0].getModel();
          if (model) code = model.getValue();
        }
      }
      return code;
    } catch (e) {
      console.error("[LeetCode Mentor] Error capturing code:", e);
      return null;
    }
  }

  function getProblemDescription() {
    try {
      var content = document.querySelector('[data-track-load="description_content"]');
      if (content) return content.innerText;
      var meta = document.querySelector('meta[name="description"]');
      if (meta && meta.content) return meta.content;
      var possibleContainers = document.querySelectorAll('div');
      for (var i = 0; i < possibleContainers.length; i++) {
        var el = possibleContainers[i];
        if ((el.className.includes && (el.className.includes('description') || el.className.includes('content'))) && el.innerText.length > 100) {
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

  // --- Event Payload Helper (Strictly follows CodeChangeEvent schema) ---
  function createEventPayload(eventType, extraData) {
    extraData = extraData || {};
    var details = getProblemDetails();
    var currentCode = captureCode() || lastCode || "";

    var payload = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      session_id: null, // To be filled by extension/backend
      problem_title: details.title || "Unknown",
      code: currentCode,
      error_message: extraData.error_message || null,
      status: extraData.status || null,
      is_correct: extraData.is_correct === undefined ? null : extraData.is_correct,
      test_status: extraData.test_status || null
    };

    // Log the strictly formatted event
    console.log('[LeetCode Mentor] Structured Event Log:', JSON.stringify(payload, null, 2));

    return payload;
  }

  function checkForCodeChange(source) {
    attempts++;
    var code = captureCode();

    if (code && code.trim().length > 0) {
      // Update global lastCode for reference
      lastCode = code;

      // 1. First Load: Always dispatch
      if (!codeFound) {
        console.log('[LeetCode Mentor] Code initially captured.');
        codeFound = true;
        lastDispatchedCode = code;
        window.dispatchEvent(new CustomEvent("CODE_RESPONSE", {
          detail: createEventPayload("CODE_CHANGE")
        }));
        return code;
      }

      // 2. Updates: Only if source is ENTER_KEY
      if (code !== lastDispatchedCode) {
        if (source === 'ENTER_KEY') {
          console.log('[LeetCode Mentor] Code change detected (Trigger: Enter).');
          lastDispatchedCode = code;
          window.dispatchEvent(new CustomEvent("CODE_RESPONSE", {
            detail: createEventPayload("CODE_CHANGE")
          }));
        }
      }
      return code;
    }
    return null;
  }

  var intervalId = setInterval(function () {
    // Polling checks for initial load or existence, but doesn't trigger change events
    checkForCodeChange('POLL');

    if (attempts >= maxAttempts) {
      console.log('[LeetCode Mentor] Max polling attempts reached.');
      clearInterval(intervalId);
    }
  }, 2000);

  // Listen for Enter key to trigger code capture
  // Use capture phase to try and catch before editor swallows
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      setTimeout(function () {
        checkForCodeChange('ENTER_KEY');
      }, 300);
    }
  }, true);

  // Also listen for manual GET_CODE events (Force dispatch)
  window.addEventListener("GET_CODE", function () {
    var code = captureCode();
    if (code) {
      window.dispatchEvent(new CustomEvent("CODE_RESPONSE", {
        detail: createEventPayload("CODE_CHANGE")
      }));
    }
  });

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

      var checks = 0;
      var checkInterval = setInterval(function () {
        checks++;
        if (document.title !== lastTitle || checks > 10) {
          clearInterval(checkInterval);
          lastTitle = document.title;
          console.log('[LeetCode Mentor] Content likely updated. Broadcasting.');
          broadcastProblemDetails();
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
    var status = document.hidden ? "hidden" : "visible";
    console.log('[LeetCode Mentor] Tab switched: ' + status);
    window.dispatchEvent(new CustomEvent("TAB_SWITCH", {
      detail: createEventPayload("TAB_SWITCH", { status: status })
    }));
  });

  // --- Execution Result Monitoring ---
  var resultPoller = null;

  function monitorExecutionResult(type) {
    if (resultPoller) clearInterval(resultPoller);

    console.log('[LeetCode Mentor] Monitoring execution result for ' + type + '...');

    setTimeout(function () {
      var checks = 0;
      resultPoller = setInterval(function () {
        checks++;

        if (checks > 120) {
          clearInterval(resultPoller);
          console.log('[LeetCode Mentor] Timed out waiting for execution result (60s).');
          return;
        }

        if (checks % 4 === 0) {
          console.log('[LeetCode Mentor] Polling... (Attempt ' + checks + ')');
        }

        var foundStatus = null;
        var foundMessage = "";

        // --- Status Detection ---
        var successNode = document.querySelector('.text-green-500, .text-brand-green, .text-green-s, span[data-e2e-locator="result-header-accepted"]');
        if (successNode) {
          var t = successNode.innerText.trim();
          if (t.includes('Accepted') || t.includes('Success')) {
            foundStatus = 'Accepted';
          }
        }

        if (!foundStatus) {
          var errorNodes = document.querySelectorAll('.text-red-500, .text-brand-red, .text-red-s, .text-red-60, .text-yellow-500, [class*="error-title"]');
          for (var i = 0; i < errorNodes.length; i++) {
            var txt = errorNodes[i].innerText.trim();
            if (txt.includes('Wrong Answer')) { foundStatus = 'Wrong Answer'; break; }
            if (txt.includes('Runtime Error')) { foundStatus = 'Runtime Error'; break; }
            if (txt.includes('Compile Error')) { foundStatus = 'Compile Error'; break; }
            if (txt.includes('Time Limit Exceeded')) { foundStatus = 'Time Limit Exceeded'; break; }
            if (txt.includes('Output Limit Exceeded')) { foundStatus = 'Output Limit Exceeded'; break; }
            if (txt.includes('Memory Limit Exceeded')) { foundStatus = 'Memory Limit Exceeded'; break; }
            if (txt.includes('Error') && txt.length < 50) { foundStatus = 'Error'; break; }
          }
        }

        if (!foundStatus) {
          var detailsNode = document.querySelector('.font-menlo, pre, .whitespace-pre-wrap');
          if (detailsNode && detailsNode.innerText.includes('error:')) {
            foundStatus = 'Compile Error';
            foundMessage = detailsNode.innerText;
          }
        }

        // --- Message Extraction ---
        if (foundStatus && foundStatus !== 'Accepted') {
          if (!foundMessage) {
            var candidates = document.querySelectorAll('.font-menlo, pre, .whitespace-pre-wrap, code');
            for (var k = 0; k < candidates.length; k++) {
              var node = candidates[k];
              var t = node.innerText;
              if (t.length > 10 && (t.includes('Line') || t.includes('error') || t.includes('Exception'))) {
                foundMessage = t;
                break;
              }
            }
            if (!foundMessage) {
              var redNodes = document.querySelectorAll('.text-red-60, .text-brand-red, .text-red-500, .text-red-s');
              for (var j = 0; j < redNodes.length; j++) {
                var r = redNodes[j];
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
          var isCorrect = foundStatus === 'Accepted';
          var testStatus = isCorrect ? 'success' : 'failed';

          window.dispatchEvent(new CustomEvent("CODE_EXECUTION_RESULT", {
            detail: createEventPayload("CODE_EXECUTION_RESULT", {
              status: foundStatus,
              error_message: foundMessage || null,
              is_correct: isCorrect,
              test_status: testStatus
            })
          }));
          clearInterval(resultPoller);
        }

      }, 500);
    }, 1000);
  }

  // 2. Run / Submit Detection
  document.addEventListener("click", function (e) {
    var path = e.composedPath ? e.composedPath() : [e.target];

    for (var i = 0; i < Math.min(path.length, 7); i++) {
      var el = path[i];
      if (!el || !el.getAttribute) continue;

      var text = (el.innerText || el.textContent || "").replace(/\s+/g, ' ').trim();
      var lowerText = text.toLowerCase();
      var testId = el.getAttribute('data-e2e-locator') || el.getAttribute('data-testid') || "";
      var ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();

      // Detection Logic
      var isRun = testId.includes('console-run-button') ||
        lowerText === 'run' || lowerText === 'run code' || ariaLabel === 'run' || ariaLabel.includes('run code');

      var isSubmit = testId.includes('console-submit-button') ||
        lowerText === 'submit' || (lowerText.includes('submit') && lowerText.length < 20);

      // Broader Run check
      if (!isRun) {
        var isButtonLike = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || (el.className && typeof el.className === 'string' && el.className.includes('btn'));
        if (lowerText.includes('run') && isButtonLike && lowerText.length < 20 && !lowerText.includes('error')) {
          isRun = true;
        }
      }

      if (isRun) {
        console.log('[LeetCode Mentor] Run button clicked');
        window.dispatchEvent(new CustomEvent("TEST_RUN", {
          detail: createEventPayload("TEST_RUN")
        }));
        monitorExecutionResult('TEST_RUN');
        return;
      }

      if (isSubmit) {
        console.log('[LeetCode Mentor] Submit button clicked');
        window.dispatchEvent(new CustomEvent("SUBMIT_CODE", {
          detail: createEventPayload("SUBMIT_CODE")
        }));
        monitorExecutionResult('SUBMIT_CODE');
        return;
      }
    }
  }, true);

  setTimeout(checkForCodeChange, 1000, 'POLL');
})();
