/**
 * International Gemological Archive - Studio Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('certificate-form');
  const submitBtn = document.getElementById('submit-btn');
  const resetBtn = document.getElementById('reset-btn');

  // cardFlipper removed for single-sided
  // flipBtn removed
  // flipLabel removed
  const presetChips = document.querySelectorAll('.preset-chip');

  // Upload elements
  const dropZone = document.getElementById('drop-zone');
  const imageInput = document.getElementById('image-input');
  const uploadIdle = document.getElementById('upload-idle');
  const uploadPreview = document.getElementById('upload-preview');
  const previewThumb = document.getElementById('preview-thumb');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const removeImageBtn = document.getElementById('remove-image');

  // Live Card Preview Elements
  const liveName = document.getElementById('live-name');
  const liveWeight = document.getElementById('live-weight');
  const liveShape = document.getElementById('live-shape');
  const liveColour = document.getElementById('live-colour');
  const liveSpecies = document.getElementById('live-species');
  const liveSpeciesBack = null;
  const liveClarity = document.getElementById('live-clarity');
  const liveClarityBack = null;
  const liveIssued = document.getElementById('live-issued');
  const liveDate = document.getElementById('live-date');
  const liveRi = document.getElementById('live-ri');
  const liveHardness = document.getElementById('live-hardness');
  const liveComments = document.getElementById('live-comments');
  const livePhoto = document.getElementById('live-photo');
  const livePlaceholder = document.getElementById('live-placeholder');
  const liveCertNo = document.getElementById('live-cert-no');
  const liveBackNo = null;

  // Result Dialog Elements
  const resultDialog = document.getElementById('result-dialog');
  const closeDialogBtn = document.getElementById('close-dialog');
  const dialogCertNumber = document.getElementById('dialog-cert-number');
  const copyNumberBtn = document.getElementById('copy-number-btn');
  const copyText = document.getElementById('copy-text');
  const dialogDownload = document.getElementById('dialog-download');
  const dialogPrint = document.getElementById('dialog-print');
  const dialogVerifyUrl = document.getElementById('dialog-verify-url');
  const createAnotherBtn = document.getElementById('create-another-btn');
  const toastContainer = document.getElementById('toast-container');

  let currentPdfBlobUrl = null;
  let currentCertNumber = null;

  // Presets Database
  const PRESETS = {
    sapphire: {
      name: 'Natural Royal Blue Sapphire',
      weight: '3.85 ct',
      shapeCut: 'Cushion Mixed Cut',
      colour: 'Vivid Royal Blue',
      speciesGroup: 'Natural Corundum',
      refractiveIndex: '1.762 - 1.770',
      hardness: '9.0 Mohs',
      clarity: 'Eye Clean (VVS)',
      issuedTo: 'Crown Gemological Gallery Ltd.',
      comments: 'No indications of thermal treatment (Unheated). Geographic Origin: Ceylon (Sri Lanka).'
    },
    ruby: {
      name: 'Natural Pigeon Blood Ruby',
      weight: '2.42 ct',
      shapeCut: 'Oval Brilliant Cut',
      colour: 'Vivid Red (Pigeon Blood)',
      speciesGroup: 'Natural Corundum',
      refractiveIndex: '1.762 - 1.770',
      hardness: '9.0 Mohs',
      clarity: 'Eye Clean (VS1)',
      issuedTo: 'Heritage High Jewels Geneva',
      comments: 'No indications of heating observed. Origin: Mogok (Burma / Myanmar).'
    },
    emerald: {
      name: 'Natural Colombian Emerald',
      weight: '3.15 ct',
      shapeCut: 'Emerald Cut',
      colour: 'Intense Vivid Green',
      speciesGroup: 'Natural Beryl',
      refractiveIndex: '1.577 - 1.583',
      hardness: '7.5 - 8.0 Mohs',
      clarity: 'Moderate Fissures (Jardin)',
      issuedTo: 'Sovereign Gem Collection LLC',
      comments: 'Minor clarity enhancement with natural cedarwood oil. Origin: Muzo (Colombia).'
    },
    diamond: {
      name: 'Natural Fancy Vivid Yellow Diamond',
      weight: '2.08 ct',
      shapeCut: 'Round Brilliant Cut',
      colour: 'Fancy Vivid Yellow',
      speciesGroup: 'Natural Diamond',
      refractiveIndex: '2.417',
      hardness: '10.0 Mohs',
      clarity: 'Very Very Slightly Included (VVS2)',
      issuedTo: 'Vanderbilt Diamantaires New York',
      comments: 'Fluorescence: None. Natural untreated color distribution. Polish: Excellent, Symmetry: Excellent.'
    },
    alexandrite: {
      name: 'Natural Color-Change Alexandrite',
      weight: '1.76 ct',
      shapeCut: 'Cushion Brilliant Cut',
      colour: 'Teal-Green / Purple-Red',
      speciesGroup: 'Natural Chrysoberyl',
      refractiveIndex: '1.745 - 1.754',
      hardness: '8.5 Mohs',
      clarity: 'Eye Clean (VVS)',
      issuedTo: 'Imperial Mineralogical Trust',
      comments: 'Distinct color change degree: 95%. Origin: Ural Mountains (Russia). No treatment.'
    },
    tourmaline: {
      name: 'Natural Paraíba Tourmaline',
      weight: '2.89 ct',
      shapeCut: 'Pear Brilliant Cut',
      colour: 'Electric Neon Blue-Green',
      speciesGroup: 'Natural Tourmaline (Elbaite)',
      refractiveIndex: '1.624 - 1.644',
      hardness: '7.0 - 7.5 Mohs',
      clarity: 'Slightly Included (VS2)',
      issuedTo: 'Aurum & Gem Artisans London',
      comments: 'Copper (Cu) and Manganese (Mn) bearing tourmaline. Origin: Batalha, Paraíba (Brazil).'
    },
    tanzanite: {
      name: 'Natural Royal Tanzanite',
      weight: '5.60 ct',
      shapeCut: 'Trilliant Cut',
      colour: 'Deep Vivid Blue-Violet',
      speciesGroup: 'Natural Zoisite',
      refractiveIndex: '1.691 - 1.700',
      hardness: '6.5 - 7.0 Mohs',
      clarity: 'Loupe Clean (IF)',
      issuedTo: 'Kilimanjaro Gem Syndicate',
      comments: 'Pleochroism: Strong trichroic. Origin: Merelani Hills (Tanzania).'
    }
  };

  // Set default issue date in card preview
  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  if (liveDate) liveDate.textContent = todayFormatted;

  // Load Preset Function
  function loadPreset(key) {
    const data = PRESETS[key];
    if (!data) return;

    for (const [field, val] of Object.entries(data)) {
      const input = form.elements[field];
      if (input) input.value = val;
    }

    presetChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.preset === key);
    });

    syncLivePreview();
  }

  // Sync Form inputs with Live Card Preview
  function syncLivePreview() {
    if (liveName) liveName.textContent = form.elements.name.value.trim() || 'Specimen Gemstone';
    if (liveWeight) liveWeight.textContent = form.elements.weight.value.trim() || '— ct';
    if (liveShape) liveShape.textContent = form.elements.shapeCut.value.trim() || '—';
    if (liveColour) liveColour.textContent = form.elements.colour.value.trim() || '—';

    const species = form.elements.speciesGroup.value.trim() || '—';
    if (liveSpecies) liveSpecies.textContent = species;
    if (liveSpeciesBack) liveSpeciesBack.textContent = species;

    const clarity = form.elements.clarity.value.trim() || '—';
    if (liveClarity) liveClarity.textContent = clarity;
    if (liveClarityBack) liveClarityBack.textContent = clarity;

    if (liveIssued) liveIssued.textContent = form.elements.issuedTo.value.trim() || '—';
    if (liveRi) liveRi.textContent = form.elements.refractiveIndex.value.trim() || '—';
    if (liveHardness) liveHardness.textContent = form.elements.hardness.value.trim() || '—';
    if (liveComments) {
      liveComments.textContent = form.elements.comments.value.trim() ||
        'No indications of thermal treatment. Physical and optical parameters conform to laboratory registry standards.';
    }
  }

  // Listen to form input changes for real-time card updates
  form.addEventListener('input', syncLivePreview);

  // Preset Chips Event
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      loadPreset(chip.dataset.preset);
      showToast(`Loaded ${chip.textContent.trim()} preset`);
    });
  });

  // Single-sided card: No flip needed

  // Enforce pure luxury light theme
  localStorage.removeItem('iga-theme');
  document.documentElement.removeAttribute('data-theme');

  // File Upload Handlers
  function handleFileSelect(file) {
    if (!file) return;

    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      showToast('Please upload a PNG, JPEG, or WebP image.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must not exceed 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewThumb.src = e.target.result;
      previewFilename.textContent = file.name;
      previewFilesize.textContent = (file.size / 1024).toFixed(1) + ' KB';

      uploadIdle.classList.add('hidden');
      uploadPreview.classList.remove('hidden');

      // Update live card preview
      livePhoto.src = e.target.result;
      livePhoto.classList.remove('hidden');
      livePlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        imageInput.files = files;
        handleFileSelect(files[0]);
      }
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      imageInput.value = '';
      previewThumb.src = '';
      uploadPreview.classList.add('hidden');
      uploadIdle.classList.remove('hidden');

      livePhoto.src = '';
      livePhoto.classList.add('hidden');
      livePlaceholder.classList.remove('hidden');
    });
  }

  // Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      if (removeImageBtn) removeImageBtn.click();
      loadPreset('sapphire');
      showToast('Form reset to default preset');
    });
  }

  // Form Submit (Certificate Generation)
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    const originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="btn-icon-svg" style="animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      <span>ISSUING OFFICIAL CERTIFICATE…</span>
    `;

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/certificates', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errMessage = 'Certificate generation failed';
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      if (currentPdfBlobUrl) {
        URL.revokeObjectURL(currentPdfBlobUrl);
      }

      const pdfBlob = await response.blob();
      currentPdfBlobUrl = URL.createObjectURL(pdfBlob);
      currentCertNumber = response.headers.get('X-Certificate-Number') || 'JGT-' + Math.floor(100000 + Math.random() * 900000);

      // Update Live Preview with assigned Certificate Number
      if (liveCertNo) liveCertNo.textContent = `REPORT #${currentCertNumber}`;
      if (liveBackNo) liveBackNo.textContent = `OFFICIAL RECORD • ID: ${currentCertNumber}`;

      // Populate Success Dialog
      dialogCertNumber.textContent = currentCertNumber;
      dialogDownload.href = currentPdfBlobUrl;
      dialogDownload.download = `${currentCertNumber}.pdf`;

      const verifyUrl = `${window.location.origin}/verify/${currentCertNumber}`;
      dialogVerifyUrl.href = verifyUrl;
      dialogVerifyUrl.textContent = verifyUrl;

      // Show Dialog
      if (resultDialog) {
        resultDialog.showModal();
      }

      showToast(`Certificate #${currentCertNumber} issued successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  });

  // Print Action
  if (dialogPrint) {
    dialogPrint.addEventListener('click', () => {
      if (currentPdfBlobUrl) {
        window.open(currentPdfBlobUrl, '_blank');
      }
    });
  }

  // Copy Number Action
  if (copyNumberBtn) {
    copyNumberBtn.addEventListener('click', async () => {
      if (!currentCertNumber) return;
      try {
        await navigator.clipboard.writeText(currentCertNumber);
        copyText.textContent = 'Copied! ✓';
        setTimeout(() => { copyText.textContent = 'Copy Number'; }, 2000);
      } catch (_) {
        showToast('Certificate number: ' + currentCertNumber);
      }
    });
  }

  // Close Dialog Action
  if (closeDialogBtn) {
    closeDialogBtn.addEventListener('click', () => {
      resultDialog.close();
    });
  }

  if (createAnotherBtn) {
    createAnotherBtn.addEventListener('click', () => {
      resultDialog.close();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Toast Function
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
    toast.innerHTML = `<span style="font-weight: bold;">${icon}</span> <span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Initial preset load
  loadPreset('sapphire');

  // Mobile Tab & Floating Button View Switcher
  const studioLayout = document.querySelector('.studio-layout');
  const tabBtnEditor = document.getElementById('tab-btn-editor');
  const tabBtnPreview = document.getElementById('tab-btn-preview');
  const mobileFloatingBtn = document.getElementById('mobile-floating-btn');
  const floatingBtnText = document.getElementById('floating-btn-text');
  const previewSection = document.getElementById('studio-preview-col');
  const editorSection = document.getElementById('studio-editor');

  function setMobileActiveTab(target) {
    if (!studioLayout) return;
    studioLayout.setAttribute('data-active-tab', target);

    if (target === 'preview') {
      if (tabBtnPreview) tabBtnPreview.classList.add('active');
      if (tabBtnEditor) tabBtnEditor.classList.remove('active');
      if (floatingBtnText) floatingBtnText.textContent = 'Edit Form';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (tabBtnEditor) tabBtnEditor.classList.add('active');
      if (tabBtnPreview) tabBtnPreview.classList.remove('active');
      if (floatingBtnText) floatingBtnText.textContent = 'View Card';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (tabBtnEditor) {
    tabBtnEditor.addEventListener('click', () => setMobileActiveTab('editor'));
  }
  if (tabBtnPreview) {
    tabBtnPreview.addEventListener('click', () => setMobileActiveTab('preview'));
  }

  if (mobileFloatingBtn) {
    mobileFloatingBtn.addEventListener('click', () => {
      const current = studioLayout ? (studioLayout.getAttribute('data-active-tab') || 'editor') : 'editor';
      const next = current === 'preview' ? 'editor' : 'preview';
      setMobileActiveTab(next);
    });
  }

  // Set initial default tab on mobile/tablet
  if (window.innerWidth <= 1024 && studioLayout) {
    studioLayout.setAttribute('data-active-tab', 'editor');
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && studioLayout) {
      studioLayout.removeAttribute('data-active-tab');
    } else if (window.innerWidth <= 1024 && studioLayout && !studioLayout.getAttribute('data-active-tab')) {
      studioLayout.setAttribute('data-active-tab', 'editor');
    }
  });

});

