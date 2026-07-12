// Request New Tool Module

/**
 * Builds the payload for requesting a new tool.
 * @param {string} desc 
 * @param {string} email 
 * @returns {Object}
 */
export function buildPayload(desc, email) {
  const payload = {
    _subject: 'tinytools - new tool request',
    _captcha: 'false',
    description: desc
  };

  if (email) {
    payload.email = email;
    payload._replyto = email;
  }

  return payload;
}

export default {
  id: 'request-new-tool',

  render(container) {
    container.innerHTML = `
      <div class="card-premium" id="requestToolCard">
        <h2 style="margin-bottom: 8px; color: var(--text-primary);">Request New Tool</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem; line-height: 1.5;">
          Is there a local, private tool you'd like to see added to tinytools? Describe it below and submit the request.
        </p>

        <form id="requestToolForm">
          <div class="form-group">
            <label for="reqDescription">Tool Description <span style="color: var(--danger);">*</span></label>
            <textarea id="reqDescription" class="input-premium" required placeholder="What should the new tool do? (e.g. 'A password generator')" style="min-height: 120px; resize: vertical; font-family: inherit;"></textarea>
          </div>

          <div class="form-group">
            <label for="reqEmail">Your Email <span style="color: var(--text-muted); font-weight: normal; font-size: 0.8rem;">(optional)</span></label>
            <input type="email" id="reqEmail" name="email" class="input-premium" placeholder="e.g. you@example.com">
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn-secondary" id="btnCancelRequest">Cancel</button>
            <button type="submit" class="btn-primary" id="btnSubmitRequest">Submit Request</button>
          </div>
        </form>
      </div>
    `;

    // Listeners
    const form = document.getElementById('requestToolForm');
    const btnSubmit = document.getElementById('btnSubmitRequest');
    const card = document.getElementById('requestToolCard');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const desc = document.getElementById('reqDescription').value.trim();
      const email = document.getElementById('reqEmail').value.trim();
      
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Submitting...';

      try {
        const payload = buildPayload(desc, email);
        const res = await fetch('https://formsubmit.co/ajax/j@crda.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Server responded with an error status.');
        }

        const data = await res.json();
        if (data.success === 'false') {
          throw new Error(data.message || 'Submission failed');
        }

        // Show success state
        card.innerHTML = `
          <div style="text-align: center; padding: 20px 0;">
            <div style="width: 56px; height: 56px; background-color: rgba(16, 185, 129, 0.1); color: rgb(16, 185, 129); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style="margin-bottom: 24px; color: var(--text-primary);">Request Submitted!</h2>
            <button class="btn-primary" id="btnSuccessOk">Back to Dashboard</button>
          </div>
        `;
        document.getElementById('btnSuccessOk').addEventListener('click', () => {
          window.location.hash = '#home';
        });

      } catch (err) {
        console.error('Submission error:', err);
        alert(err.message || 'Failed to submit request. Please try again.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Request';
      }
    });

    const btnCancel = document.getElementById('btnCancelRequest');
    btnCancel.addEventListener('click', () => {
      window.location.hash = '#home';
    });
  }
};
