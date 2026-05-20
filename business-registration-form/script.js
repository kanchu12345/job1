// script.js - Handles multi-step navigation, validation, progress, toast, storage, payment code, sticky submit.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const sections = Array.from(form.querySelectorAll('section[data-step]'));
  const progressSteps = document.querySelectorAll('.progress-step > div');
  const progressLabels = document.querySelectorAll('.progress-step > p');

  let currentStep = 0;

  const showStep = (index) => {
    sections.forEach((sec, i) => sec.classList.toggle('hidden', i !== index));
    updateProgress(index);
    currentStep = index;
  };

  const updateProgress = (activeIdx) => {
    progressSteps.forEach((circle, idx) => {
      if (idx <= activeIdx) {
        circle.classList.replace('bg-gray-200', 'bg-accent');
        circle.classList.replace('text-gray-600', 'text-white');
        if (progressLabels[idx]) progressLabels[idx].classList.replace('text-gray-500', 'text-gray-700');
      } else {
        circle.classList.replace('bg-accent', 'bg-gray-200');
        circle.classList.replace('text-white', 'text-gray-600');
        if (progressLabels[idx]) progressLabels[idx].classList.replace('text-gray-700', 'text-gray-500');
      }
    });
  };

  const validateSection = (section) => {
    const inputs = Array.from(section.querySelectorAll('input, select, textarea'));
    for (const el of inputs) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  };

  // Live phone validation
  const phoneInput = document.getElementById('contactPhone');
  const phoneError = document.getElementById('phoneError');
  if (phoneInput && phoneError) {
    phoneInput.addEventListener('input', () => {
      phoneError.classList.toggle('hidden', phoneInput.checkValidity());
    });
  }

  // Navigation buttons
  document.querySelectorAll('button[id^="nextToStep"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateSection(sections[currentStep])) {
        showStep(currentStep + 1);
      }
    });
  });

  document.querySelectorAll('button[id^="backToStep"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) showStep(currentStep - 1);
    });
  });

  // Payment code generator
  const generatePaymentCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `INV-${rand}`;
  };

  const collectFormData = () => {
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.name) return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else data[el.name] = el.value;
    });
    return data;
  };

  // Submit handling
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateSection(sections[currentStep])) return;

    const paymentCode = generatePaymentCode();
    const formData = collectFormData();
    formData.paymentCode = paymentCode;

    const stored = JSON.parse(localStorage.getItem('registrations') || '[]');
    stored.push(formData);
    localStorage.setItem('registrations', JSON.stringify(stored));

    const toast = document.getElementById('toastSuccess');
    const toastMsg = toast.querySelector('p.text-lg');
    if (toastMsg) toastMsg.textContent = `Submission Successful! Code: ${paymentCode}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 6000);

    form.reset();
    showStep(0);
  });

  // Toast close
  const closeToast = document.getElementById('closeToast');
  if (closeToast) closeToast.addEventListener('click', () => {
    document.getElementById('toastSuccess').classList.add('hidden');
  });

  // Tooltip fallback
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.setAttribute('title', el.getAttribute('data-tooltip'));
  });

  // Sticky submit container
  const submitContainer = document.getElementById('submitBtn')?.parentElement;
  if (submitContainer) {
    submitContainer.classList.add('sticky', 'bottom-0', 'bg-white', 'p-4', 'shadow-inner');
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const sections = Array.from(form.querySelectorAll('section[data-step]'));
  const progressSteps = document.querySelectorAll('.progress-step > div');
  const progressLabels = document.querySelectorAll('.progress-step > p');

  let currentStep = 0; // zero‑based index

  // Utility: show step, hide others
  const showStep = (index) => {
    sections.forEach((sec, i) => {
      sec.classList.toggle('hidden', i !== index);
    });
    updateProgress(index);
    currentStep = index;
  };

  // Update progress indicator UI
  const updateProgress = (activeIdx) => {
    progressSteps.forEach((circle, idx) => {
      if (idx <= activeIdx) {
        circle.classList.replace('bg-gray-200', 'bg-accent');
        circle.classList.replace('text-gray-600', 'text-white');
        if (progressLabels[idx]) {
          progressLabels[idx].classList.replace('text-gray-500', 'text-gray-700');
        }
      } else {
        circle.classList.replace('bg-accent', 'bg-gray-200');
        circle.classList.replace('text-white', 'text-gray-600');
        if (progressLabels[idx]) {
          progressLabels[idx].classList.replace('text-gray-700', 'text-gray-500');
        }
      }
    });
  };

  // Validate fields in a given section
  const validateSection = (section) => {
    const inputs = Array.from(section.querySelectorAll('input, select, textarea'));
    for (const el of inputs) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  };

  // Phone field live validation
  const phoneInput = document.getElementById('contactPhone');
  const phoneError = document.getElementById('phoneError');
  if (phoneInput && phoneError) {
    phoneInput.addEventListener('input', () => {
      const valid = phoneInput.checkValidity();
      phoneError.classList.toggle('hidden', valid);
    });
  }

  // Button handlers
  const nextButtons = form.querySelectorAll('button[id^="nextToStep"]');
  nextButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetIdx = currentStep + 1;
      if (validateSection(sections[currentStep])) {
        showStep(targetIdx);
      }
    });
  });

  const backButtons = form.querySelectorAll('button[id^="backToStep"]');
  backButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetIdx = currentStep - 1;
      if (targetIdx >= 0) {
        showStep(targetIdx);
      }
    });
  });

  // Helper: generate random payment code (e.g., INV-XXXXXX)
  const generatePaymentCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `INV-${rand}`;
  };

  // Collect form data into an object
  const collectFormData = () => {
    const data = {};
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach((el) => {
      if (el.name) {
        if (el.type === 'checkbox') {
          data[el.name] = el.checked;
        } else if (el.type === 'radio') {
          if (el.checked) data[el.name] = el.value;
        } else {
          data[el.name] = el.value;
        }
      }
    });
    return data;
  };

  // Submit handling – show toast, store submission, generate code
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Final validation of the current (last) step
    if (!validateSection(sections[currentStep])) return;

    const paymentCode = generatePaymentCode();
    const formData = collectFormData();
    formData.paymentCode = paymentCode;
    // Persist to localStorage (simple mock backend)
    const existing = JSON.parse(localStorage.getItem('registrations') || '[]');
    existing.push(formData);
    localStorage.setItem('registrations', JSON.stringify(existing));

    const toast = document.getElementById('toastSuccess');
    const toastMsg = toast.querySelector('p.text-lg');
    if (toastMsg) toastMsg.textContent = `Submission Successful! Code: ${paymentCode}`;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 6000);

    // Reset form for next entry (optional)
    form.reset();
    showStep(0);
  });

  // Close toast button
  const closeToast = document.getElementById('closeToast');
  if (closeToast) {
    closeToast.addEventListener('click', () => {
      document.getElementById('toastSuccess').classList.add('hidden');
    });
  }

  // Tooltip initialization – simple title attribute fallback
  document.querySelectorAll('[data-tooltip]').forEach((el) => {
    const tooltipText = el.getAttribute('data-tooltip');
    el.setAttribute('title', tooltipText);
  });

  // Make submit button sticky at bottom of viewport
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.parentElement.classList.add('sticky', 'bottom-0', 'bg-white', 'p-4', 'shadow-inner');
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const sections = Array.from(form.querySelectorAll('section[data-step]'));
  const progressSteps = document.querySelectorAll('.progress-step > div');
  const progressLabels = document.querySelectorAll('.progress-step > p');

  let currentStep = 0; // zero‑based index

  // Utility: show step, hide others
  const showStep = (index) => {
    sections.forEach((sec, i) => {
      sec.classList.toggle('hidden', i !== index);
    });
    updateProgress(index);
    currentStep = index;
  };

  // Update progress indicator UI
  const updateProgress = (activeIdx) => {
    progressSteps.forEach((circle, idx) => {
      if (idx <= activeIdx) {
        circle.classList.replace('bg-gray-200', 'bg-accent');
        circle.classList.replace('text-gray-600', 'text-white');
        // label color
        if (progressLabels[idx]) {
          progressLabels[idx].classList.replace('text-gray-500', 'text-gray-700');
        }
      } else {
        circle.classList.replace('bg-accent', 'bg-gray-200');
        circle.classList.replace('text-white', 'text-gray-600');
        if (progressLabels[idx]) {
          progressLabels[idx].classList.replace('text-gray-700', 'text-gray-500');
        }
      }
    });
  };

  // Validate fields in a given section
  const validateSection = (section) => {
    const inputs = Array.from(section.querySelectorAll('input, select, textarea'));
    for (const el of inputs) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  };

  // Button handlers
  const nextButtons = form.querySelectorAll('button[id^="nextToStep"]');
  nextButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetIdx = currentStep + 1;
      if (validateSection(sections[currentStep])) {
        showStep(targetIdx);
      }
    });
  });

  const backButtons = form.querySelectorAll('button[id^="backToStep"]');
  backButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetIdx = currentStep - 1;
      if (targetIdx >= 0) {
        showStep(targetIdx);
      }
    });
  });

  // Submit handling – show toast instead of real post
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // final validation of the whole form
    if (!validateSection(sections[currentStep])) return;
    const toast = document.getElementById('toastSuccess');
    toast.classList.remove('hidden');
    // optional auto‑close after 4s
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  });

  // Close toast button
  const closeToast = document.getElementById('closeToast');
  if (closeToast) {
    closeToast.addEventListener('click', () => {
      document.getElementById('toastSuccess').classList.add('hidden');
    });
  }

  // Tooltip initialization – simple title attribute fallback
  document.querySelectorAll('[data-tooltip]').forEach((el) => {
    const tooltipText = el.getAttribute('data-tooltip');
    el.setAttribute('title', tooltipText);
  });
});
