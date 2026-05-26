// Safe localStorage wrapper to prevent crashes in private browsing or file:// protocol
const SafeStorage = {
  data: {},
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem not available, using in-memory store for: " + key, e);
      return this.data[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem not available, using in-memory store for: " + key, e);
      this.data[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage.removeItem not available, using in-memory store for: " + key, e);
      delete this.data[key];
    }
  }
};

// Data model for listings
class ListingStore {
  constructor() {
    this.localKey = 'hela_local_listings';
    this.defaultDummyListings = [
      {
        id: "dummy-1",
        businessName: "Eco-Friendly Packaging Mfg",
        shortDescription: "Profitable eco-friendly packaging manufacturing company in Colombo.",
        fullDescription: "An established manufacturing unit producing biodegradable packaging materials for local and export markets. Equipped with modern semi-automated machinery. Low overheads and high margins.",
        industry: "Manufacturing",
        district: "Colombo",
        businessStage: "SME",
        investmentRequired: 25000000,
        status: "published",
        boosted: true,
        submittedAt: "2026-05-20T10:00:00.000Z"
      },
      {
        id: "dummy-2",
        businessName: "AgriTech Startup",
        shortDescription: "Innovative drone-based crop monitoring solution.",
        fullDescription: "A smart farming startup using IoT sensors and AI-driven drone analysis to optimize crop yields. Highly scalable subscription model for large plantation sectors and cooperative farmers.",
        industry: "Agriculture",
        district: "Kandy",
        businessStage: "Startup",
        investmentRequired: 5000000,
        status: "published",
        boosted: false,
        submittedAt: "2026-05-18T12:00:00.000Z"
      },
      {
        id: "dummy-3",
        businessName: "City Center Cafe",
        shortDescription: "Popular cafe in prime location seeking expansion capital.",
        fullDescription: "A trendy, highly profitable cafe operating in a high-footfall area of Gampaha. Famous for custom blends and artisanal pastries. Seeking funds to open a second branch.",
        industry: "Food & Beverage",
        district: "Gampaha",
        businessStage: "Growth",
        investmentRequired: 12000000,
        status: "published",
        boosted: true,
        submittedAt: "2026-05-22T08:30:00.000Z"
      },
      {
        id: "dummy-4",
        businessName: "Boutique Hotel Project",
        shortDescription: "Partially completed 15-room boutique hotel near the beach.",
        fullDescription: "Prime beachfront property in Galle with 70% of civil construction completed. Architectural plans, environmental approvals, and tourism board certifications are fully active.",
        industry: "Construction & Real Estate",
        district: "Galle",
        businessStage: "Idea",
        investmentRequired: 80000000,
        status: "published",
        boosted: false,
        submittedAt: "2026-05-15T15:45:00.000Z"
      },
      {
        id: "dummy-5",
        businessName: "Healthcare Diagnostic Lab",
        shortDescription: "Fully equipped diagnostic laboratory in Kurunegala.",
        fullDescription: "An accredited diagnostic center offering blood tests, ECG, ultrasound, and radiology services. Partnered with major hospitals and insurance providers. Steady daily walk-ins.",
        industry: "Healthcare",
        district: "Kurunegala",
        businessStage: "SME",
        investmentRequired: 18000000,
        status: "published",
        boosted: false,
        submittedAt: "2026-05-19T09:15:00.000Z"
      },
      {
        id: "dummy-6",
        businessName: "SaaS Retail POS Platform",
        shortDescription: "Cloud-based retail and inventory management software.",
        fullDescription: "An established software-as-a-service (SaaS) POS solution used by over 300 retail stores across Sri Lanka. High recurring revenue and strong customer retention rate.",
        industry: "Technology",
        district: "Colombo",
        businessStage: "Growth",
        investmentRequired: 8500000,
        status: "published",
        boosted: true,
        submittedAt: "2026-05-21T14:20:00.000Z"
      }
    ];
    this.initLocalStore();
  }

  initLocalStore() {
    if (!SafeStorage.getItem(this.localKey)) {
      SafeStorage.setItem(this.localKey, JSON.stringify(this.defaultDummyListings));
    }
  }

  getLocalListings() {
    try {
      const stored = SafeStorage.getItem(this.localKey);
      return stored ? JSON.parse(stored) : this.defaultDummyListings;
    } catch(e) {
      console.error("Error reading local listings, resetting...", e);
      SafeStorage.setItem(this.localKey, JSON.stringify(this.defaultDummyListings));
      return this.defaultDummyListings;
    }
  }

  saveLocalListing(listing) {
    const list = this.getLocalListings();
    if (listing.id) {
      const idx = list.findIndex(l => l.id === listing.id);
      if (idx !== -1) {
        list[idx] = listing;
      } else {
        list.push(listing);
      }
    } else {
      listing.id = 'local-' + Date.now();
      list.push(listing);
    }
    SafeStorage.setItem(this.localKey, JSON.stringify(list));
    return listing;
  }

  async getAll() {
    if (window.db) {
      try {
        const snapshot = await window.db.collection('listings').get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.error("Firestore getAll failed, falling back to localStorage:", e);
      }
    }
    return this.getLocalListings();
  }

  async getPublished() {
    if (window.db) {
      try {
        const snapshot = await window.db.collection('listings').where('status', '==', 'published').get();
        if (!snapshot.empty) {
          const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return listings.sort((a, b) => {
              if (a.boosted && !b.boosted) return -1;
              if (!a.boosted && b.boosted) return 1;
              return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
          });
        }
      } catch (e) {
        console.error("Firestore getPublished failed, falling back to localStorage:", e);
      }
    }
    const local = this.getLocalListings();
    const published = local.filter(l => l.status === 'published');
    return published.sort((a, b) => {
        if (a.boosted && !b.boosted) return -1;
        if (!a.boosted && b.boosted) return 1;
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }

  async getById(id) {
    if (window.db) {
      try {
        const doc = await window.db.collection('listings').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (e) {
        console.error("Firestore getById failed, falling back to localStorage:", e);
      }
    }
    const local = this.getLocalListings();
    return local.find(l => l.id === id) || null;
  }

  async save(listing) {
    const shortDesc = listing.shortdesc || listing.shortDescription || '';
    const industry  = listing.industry || 'Business Opportunity';
    const district  = listing.district || 'Sri Lanka';
    const stage     = listing.businessStage || '';
    
    listing.status = listing.status || 'pending';
    listing.submittedAt = listing.submittedAt || new Date().toISOString();
    
    if (window.db) {
      try {
        let docRef;
        if (listing.id) {
            docRef = window.db.collection('listings').doc(listing.id);
        } else {
            docRef = window.db.collection('listings').doc();
            listing.id = docRef.id;
        }
        await docRef.set(listing);
        return listing;
      } catch (e) {
        console.error("Firestore save failed, saving to localStorage:", e);
      }
    }
    return this.saveLocalListing(listing);
  }

  async update(id, updates) {
    updates.updatedAt = new Date().toISOString();
    if (window.db) {
      try {
        await window.db.collection('listings').doc(id).update(updates);
        return;
      } catch (e) {
        console.error("Firestore update failed, updating locally:", e);
        alert("Database update failed (Check Firebase Permissions): " + e.message);
        throw e;
      }
    }
    const local = this.getLocalListings();
    const idx = local.findIndex(l => l.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates };
      SafeStorage.setItem(this.localKey, JSON.stringify(local));
    }
  }

  async delete(id) {
    if (window.db) {
      try {
        await window.db.collection('listings').doc(id).delete();
        return;
      } catch (e) {
        console.error("Firestore delete failed, deleting locally:", e);
      }
    }
    let local = this.getLocalListings();
    local = local.filter(l => l.id !== id);
    SafeStorage.setItem(this.localKey, JSON.stringify(local));
  }

  formatCurrency(amount) {
    const num = Number(amount);
    if (isNaN(num)) return 'LKR 0';
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(num);
  }

  async seedDummyListings() {
    if (window.db) {
      try {
        const snapshot = await window.db.collection('listings').limit(1).get();
        if (snapshot.empty) {
          console.log("Seeding dummy listings to Firestore...");
          for (const item of this.defaultDummyListings) {
            const firestoreItem = { ...item };
            delete firestoreItem.id; // Let Firestore auto-generate ID
            await window.db.collection('listings').add(firestoreItem);
          }
          console.log("Dummy listings seeded to Firestore!");
          return true;
        }
      } catch(e) {
        console.error("Error seeding dummy data to Firestore:", e);
      }
    }
    return false;
  }
}

const store = new ListingStore();

function formatLKR(amount) {
  return store.formatCurrency(amount);
}

// ----------------------------------------------------------------------------
// Authentication Store
// ----------------------------------------------------------------------------
class AuthStore {
  constructor() {
    this.sessionKey = 'hela_session';
    this.initFirebaseAuthListener();
  }

  initFirebaseAuthListener() {
    if (window.auth) {
      window.auth.onAuthStateChanged(async (user) => {
        try {
          if (user) {
            const role = await this.getUserRoleLocally(user.uid) || 'client';
            const sessionUser = {
              id: user.uid,
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              role: role
            };
            SafeStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
            if (typeof updateGlobalAuthUI === 'function') updateGlobalAuthUI();
          } else {
            SafeStorage.removeItem(this.sessionKey);
            if (typeof updateGlobalAuthUI === 'function') updateGlobalAuthUI();
          }
        } catch (e) {
          console.error("Error handling auth state change:", e);
        }
      });
    }
  }

  async getUserRoleLocally(uid) {
    if (!window.db) return null;
    try {
      const doc = await window.db.collection('users').doc(uid).get();
      return doc.exists ? doc.data().role : null;
    } catch(e) {
      console.error("Error fetching user role from Firestore:", e);
      return null;
    }
  }

  async getUsers() {
    if (!window.db) return [];
    try {
      const snapshot = await window.db.collection('users').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error fetching users from Firestore:", e);
      return [];
    }
  }

  getCurrentUser() {
    try {
      const stored = SafeStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  async register(name, email, password, role) {
    if (window.auth && window.db) {
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: name });
      
      const newUser = { name, email, role };
      await window.db.collection('users').doc(user.uid).set(newUser);
      return { id: user.uid, ...newUser };
    }
    throw new Error("Firebase not initialized");
  }

  async login(email, password) {
    if (window.auth) {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const role = await this.getUserRoleLocally(userCredential.user.uid);
      return Object.assign(userCredential.user, { role: role });
    }
    throw new Error("Firebase not initialized");
  }

  async loginWithGoogle(role = 'client') {
    if (window.auth && window.db) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await window.auth.signInWithPopup(provider);
      const user = userCredential.user;
      
      const doc = await window.db.collection('users').doc(user.uid).get();
      if (!doc.exists) {
        await window.db.collection('users').doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          role: role
        });
      }
      return user;
    }
    throw new Error("Firebase not initialized");
  }

  async logout() {
    if (window.auth) {
      try {
        await window.auth.signOut();
      } catch (e) {
        console.error("Error during firebase logout:", e);
      }
    }
    SafeStorage.removeItem(this.sessionKey);
  }
}

const authStore = new AuthStore();

// ----------------------------------------------------------------------------
// Shared Global UI Logic
// ----------------------------------------------------------------------------

function updateGlobalAuthUI() {
  const user = authStore.getCurrentUser();
  const topAuth = document.getElementById('topbar-auth');
  const headerAuth = document.getElementById('header-auth');
  
  // Logic hook for listing page specific elements
  if(document.getElementById('btn-send-enquiry')) {
    document.getElementById('btn-send-enquiry').onclick = () => {
        // Existing enquiry logic
    };

    // Image upload handling
    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('preview-container');
    const btnUpload = document.getElementById('btn-upload-images');

    if (imageInput) {
        imageInput.addEventListener('change', () => {
            previewContainer.innerHTML = '';
            Array.from(imageInput.files).forEach(file => {
                const url = URL.createObjectURL(file);
                const img = document.createElement('img');
                img.src = url;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '6px';
                previewContainer.appendChild(img);
            });
        });
    }

    if (btnUpload && window.currentListing) {
        btnUpload.addEventListener('click', async () => {
            if (!imageInput.files.length) { alert('Select images to upload'); return; }
            const storage = firebase.storage();
            const promises = Array.from(imageInput.files).map(file => {
                const ref = storage.ref(`listings/${window.currentListing.id}/${file.name}`);
                return ref.put(file).then(snap => snap.ref.getDownloadURL());
            });
            try {
                const urls = await Promise.all(promises);
                // Append URLs to listing.images and update Firestore
                const newImages = (window.currentListing.images || []).concat(urls);
                await store.update(window.currentListing.id, { images: newImages });
                alert('Images uploaded successfully');
                // Refresh page to show new images
                window.location.reload();
            } catch (e) {
                console.error(e);
                alert('Upload failed');
            }
        });
    }
  }

  const postAdBtn = ``;
  
  if (user) {
      const roleLabel = user.role === 'publisher' ? '(Publisher)' : '(Client)';
      const displayName = user.name ? user.name.split(' ')[0] : (user.email ? user.email.substring(0, 8) : 'User');
      const dashLink = user.role === 'publisher' ? 'publisher-dashboard.html' : 'dashboard.html';
      const loggedInHTML = `
          <a href="${dashLink}" style="color:#003399; font-weight:700; font-size:0.8rem; margin-right:10px; text-decoration:none;">
              Hi, ${displayName} ${roleLabel}
          </a>
          ${postAdBtn}
          <a href="#" onclick="logoutUser(event)" style="color:#cc0000; padding:0; text-decoration:none; font-size:0.8rem; font-weight:600;">Logout</a>
      `;
      if (topAuth) topAuth.innerHTML = loggedInHTML;
      if (headerAuth) headerAuth.innerHTML = loggedInHTML;
  } else {
      const loggedOutHTML = `
          <a href="login.html" class="login-link-new">Login</a>
          <a href="register.html" class="btn-register-new">Register</a>
          ${postAdBtn}
      `;
      const topLoggedOutHTML = `<a href="login.html" class="login-link-new" style="font-size:0.78rem;">Login</a>`;
      if (topAuth) topAuth.innerHTML = topLoggedOutHTML;
      if (headerAuth) headerAuth.innerHTML = loggedOutHTML;
  }
}

async function logoutUser(e) {
  if (e) e.preventDefault();
  await authStore.logout();
  window.location.href = 'index.html';
}

function handlePostListing(e) {
  if (e) e.preventDefault();
  const user = authStore.getCurrentUser();
  if (!user) {
      alert("You must be logged in to post a listing. Please login or register first.");
      window.location.href = 'login.html';
      return;
  }
  if (user.role === 'publisher') {
      window.location.href = 'publisher-dashboard.html';
  } else {
      window.location.href = 'dashboard.html';
  }
}

// --- PDF Generation ---
async function generateListingPDF(listingId) {
  const l = await store.getById(listingId);
  if (!l) { alert('Listing not found.'); return; }

  const fmtMoney = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? store.formatCurrency(n) : 'N/A';
  };

  const statusLabels = {
    'pending': 'Pending Review',
    'pending_payment': 'Pending',
    'review': 'Under Review',
    'published': 'Published / Approved',
    'rejected': 'Rejected',
    'expired': 'Expired',
    'needs_revision': 'Needs Revision'
  };

  const statusText = statusLabels[l.status] || l.status;
  const submittedDate = l.submittedAt ? new Date(l.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  // Format professional services list safely
  let servicesHTML = '';
  if (l.services && l.services.length > 0) {
    servicesHTML = `
      <div class="full-width">
        <label class="form-label">Selected Professional Services</label>
        <div class="form-input-box" style="background:#fff;">
          ${l.services.map(s => '<div>☑ ' + s + '</div>').join('')}
        </div>
      </div>
    `;
  }

  // Format rejection reason safely
  let rejectionHTML = '';
  if (l.rejectionReason) {
    rejectionHTML = `
      <div class="full-width">
        <label class="form-label" style="color:#b91c1c;">Rejection Reason</label>
        <div class="form-input-box" style="background:#fef2f2; border-color:#f87171; color:#991b1b;">
          ${l.rejectionReason}
        </div>
      </div>
    `;
  }

  const pdfHTML = `<!DOCTYPE html>
<html><head><title>HelaInvest - ${l.businessName || 'Business Proposal'}</title>
<style>
  * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { padding: 40px; color: #1f2937; margin: 0; }
  .pdf-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
  .pdf-header h1 { margin: 0; color: #003399; font-size: 24px; }
  .pdf-header h1 span { color: #cc9900; }
  .pdf-meta { text-align: right; font-size: 14px; color: #6b7280; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-top: 5px; }
  .status-published { background: #dcfce7; color: #166534; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-pending { background: #fef9c3; color: #854d0e; }
  
  .step-section { margin-bottom: 40px; }
  .step-title { font-size: 18px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .full-width { grid-column: span 2; }
  
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 6px; }
  .form-input-box { border: 1px solid #d1d5db; padding: 10px 14px; border-radius: 6px; background-color: #f9fafb; font-size: 14px; color: #111827; min-height: 42px; white-space: pre-wrap; word-break: break-word; }
  
  .pdf-footer { text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="pdf-header">
    <div>
      <h1>Hela<span>Invest</span></h1>
      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Business Submission Details</div>
    </div>
    <div class="pdf-meta">
      <div>Ref: <strong>${l.refCode || 'N/A'}</strong></div>
      <div>Date: ${submittedDate}</div>
      <div class="status-badge status-${l.status === 'published' ? 'published' : l.status === 'rejected' ? 'rejected' : 'pending'}">${statusText}</div>
    </div>
  </div>

  <div class="step-section">
    <div class="step-title">Step 1: Business Information</div>
    <div class="form-grid">
      <div><label class="form-label">You are a/an</label><div class="form-input-box">${l.role || ''}</div></div>
      <div><label class="form-label">You are interested in</label><div class="form-input-box">${l.interest || ''}</div></div>
      <div><label class="form-label">When was the business established?</label><div class="form-input-box">${l.established || ''}</div></div>
      <div><label class="form-label">Select Business Industry</label><div class="form-input-box">${l.industry || ''}</div></div>
      <div class="full-width"><label class="form-label">Where is the business located/headquartered?</label><div class="form-input-box">${l.district || ''}</div></div>
      <div><label class="form-label">How many permanent employees does the business have?</label><div class="form-input-box">${l.employees || ''}</div></div>
      <div><label class="form-label">Select Business Legal Entity Type</label><div class="form-input-box">${l.entity || l.entityType || ''}</div></div>
      <div class="full-width"><label class="form-label">Business Name</label><div class="form-input-box">${l.businessName || ''}</div></div>
      <div class="full-width"><label class="form-label">Describe the business in a single line</label><div class="form-input-box">${l.shortDescription || l.shortdesc || ''}</div></div>
    </div>
  </div>

  <div class="step-section">
    <div class="step-title">Contact Information</div>
    <div class="form-grid">
      <div><label class="form-label">Contact Person Name</label><div class="form-input-box">${l.contactName || l.contactname || ''}</div></div>
      <div><label class="form-label">Contact Number</label><div class="form-input-box">${l.phone || ''}</div></div>
      <div class="full-width"><label class="form-label">Business Email Address</label><div class="form-input-box">${l.email || ''}</div></div>
    </div>
  </div>

  <div class="step-section">
    <div class="step-title">Step 2: Financial Details</div>
    <div class="form-grid">
      <div><label class="form-label">Average Monthly Sales</label><div class="form-input-box">${fmtMoney(l.monthlySales || l.monthlysales)}</div></div>
      <div><label class="form-label">Average Yearly Sales</label><div class="form-input-box">${fmtMoney(l.yearlySales || l.yearlysales)}</div></div>
      <div><label class="form-label">Investment Required</label><div class="form-input-box">${fmtMoney(l.investmentRequired)}</div></div>
      <div><label class="form-label">% Willing to Sell</label><div class="form-input-box">${l.percentToSell || l.percent || ''}%</div></div>
      <div class="full-width"><label class="form-label">Value of Physical Assets</label><div class="form-input-box">${fmtMoney(l.assetValue || l.assetvalue)}</div></div>
      <div class="full-width"><label class="form-label">Products & Services</label><div class="form-input-box" style="min-height: 80px;">${l.products || ''}</div></div>
      <div class="full-width"><label class="form-label">Business Highlights</label><div class="form-input-box" style="min-height: 80px;">${l.highlights || ''}</div></div>
    </div>
  </div>

  <div id="gallery-card" class="ld-card" style="display:none;">
    <div class="ld-card-body" style="padding:16px;">
        <div id="gallery-inner"></div>
    </div>
</div>
<!-- Image Upload Card (visible to owners) -->
<div id="upload-card" class="ld-card" style="display:none;">
    <div class="ld-card-header">
        <i class="fas fa-upload"></i>
        <h2>Upload Photos</h2>
    </div>
    <div class="ld-card-body">
        <input type="file" id="image-input" accept="image/*" multiple style="margin-bottom:12px;" />
        <div id="preview-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;"></div>
        <button class="ld-btn-enquire" id="btn-upload-images"><i class="fas fa-cloud-upload-alt"></i> Upload Selected</button>
    </div>
</div> class="form-grid">
      <div class="full-width"><label class="form-label">Facility Details</label><div class="form-input-box" style="min-height: 80px;">${l.facility || ''}</div></div>
      <div class="full-width"><label class="form-label">Funding Details</label><div class="form-input-box" style="min-height: 80px;">${l.funding || ''}</div></div>
      <div class="full-width"><label class="form-label">Assets Details</label><div class="form-input-box" style="min-height: 80px;">${l.assets || ''}</div></div>
      ${servicesHTML}
      ${rejectionHTML}
    </div>
  </div>

  <div class="pdf-footer">
    Generated securely via HelaInvest Platform
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;

  const pdfWindow = window.open('', '_blank');
  if (pdfWindow) {
    pdfWindow.document.write(pdfHTML);
    pdfWindow.document.close();
  } else {
    alert('Pop-up blocked. Please allow pop-ups for this site to download PDF.');
  }
}

// Auto-run UI sync on DOM load if elements exist
document.addEventListener('DOMContentLoaded', async () => {
  try {
    updateGlobalAuthUI();
  } catch (e) {
    console.error("Error updating global auth UI:", e);
  }
});

// ----------------------------------------------------------------------------
// Category Store (For Dynamic Service Categories)
// ----------------------------------------------------------------------------
class CategoryStore {
  constructor() {
    this.categoriesKey = 'hela_categories';
    this.initSeedData();
  }

  initSeedData() {
    const versionKey = 'hela_categories_v6';
    try {
      if (!SafeStorage.getItem(versionKey) || !SafeStorage.getItem(this.categoriesKey)) {
        const seedData = [
          {
            id: '1',
            name: "PRIMARY SECTORS & PRODUCTION",
            active: true,
            subgroups: [{
              name: "Agriculture & Farming",
              items: ["Crop Farming", "Organic Agriculture", "Livestock & Poultry", "Fisheries & Aquaculture", "Tea & Rubber Plantations", "Other Primary Production"]
            }]
          },
          {
            id: '2',
            name: "TECHNOLOGY & DIGITAL INFRASTRUCTURE",
            active: true,
            subgroups: [{
              name: "Tech & E-Commerce",
              items: ["Software & SaaS", "E-commerce & Online Stores", "IT Services & Consulting", "FinTech Solutions", "Telecommunications", "Other Digital Infrastructure"]
            }]
          },
          {
            id: '3',
            name: "MANUFACTURING & HEAVY INDUSTRIAL",
            active: true,
            subgroups: [{
              name: "Production & Heavy Industry",
              items: ["Garments & Textiles", "Machinery & Equipment", "Chemical & Plastics", "Construction Materials", "Paper & Packaging", "Other Manufacturing"]
            }]
          },
          {
            id: '4',
            name: "HOSPITALITY, TOURISM & LEISURE",
            active: true,
            subgroups: [{
              name: "Leisure & Dining",
              items: ["Restaurants & Cafes", "Boutique Hotels & Resorts", "Food Processing & Packaged Foods", "Catering & Cloud Kitchens", "Other Hospitality"]
            }]
          },
          {
            id: '5',
            name: "TRADE, LOGISTICS & INFRASTRUCTURE",
            active: true,
            subgroups: [{
              name: "Trade & Supply Chain",
              items: ["Supermarkets & Grocery", "Wholesale & Distribution", "Fashion Retail", "Logistics & Transport", "E-commerce Delivery", "Other Logistics"]
            }]
          },
          {
            id: '6',
            name: "SERVICES, FINANCE & HEALTHCARE",
            active: true,
            subgroups: [{
              name: "Professional & Care",
              items: ["Healthcare & Clinics", "Ayurveda & Wellness", "Financial & Accounting", "Legal Services", "Marketing & Advertising", "HR & Education", "Other Professional Services"]
            }]
          }
        ];
        SafeStorage.setItem(this.categoriesKey, JSON.stringify(seedData));
        SafeStorage.setItem(versionKey, 'true');
      }
    } catch(e) {
      console.error("Error seeding categories:", e);
    }
  }

  getAll() {
    try {
      const data = SafeStorage.getItem(this.categoriesKey);
      if (!data) {
        this.initSeedData();
        return JSON.parse(SafeStorage.getItem(this.categoriesKey)) || [];
      }
      return JSON.parse(data) || [];
    } catch (e) {
      console.error("Error parsing categories, resetting to seed data:", e);
      SafeStorage.removeItem(this.categoriesKey);
      SafeStorage.removeItem('hela_categories_v6');
      this.initSeedData();
      try {
        return JSON.parse(SafeStorage.getItem(this.categoriesKey)) || [];
      } catch (err) {
        return [];
      }
    }
  }

  save(name) {
    const categories = this.getAll();
    categories.push({ id: Date.now().toString(), name, active: true, subgroups: [{ name: "General", items: [] }] });
    SafeStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }

  delete(id) {
    let categories = this.getAll();
    categories = categories.filter(c => c.id !== id);
    SafeStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }

  addSubCategory(categoryId, subCategoryName) {
    const categories = this.getAll();
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      if (!cat.subgroups) cat.subgroups = [{ name: "General", items: [] }];
      if (cat.subgroups.length === 0) cat.subgroups.push({ name: "General", items: [] });
      if (!cat.subgroups[0].items) cat.subgroups[0].items = [];
      cat.subgroups[0].items.push(subCategoryName);
      SafeStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    }
  }

  deleteSubCategory(categoryId, subCategoryName) {
    const categories = this.getAll();
    const cat = categories.find(c => c.id === categoryId);
    if (cat && cat.subgroups && cat.subgroups.length > 0 && cat.subgroups[0].items) {
      cat.subgroups[0].items = cat.subgroups[0].items.filter(item => item !== subCategoryName);
      SafeStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    }
  }
}

const categoryStore = new CategoryStore();

// ----------------------------------------------------------------------------
// Settings Store (For Dynamic Site Content)
// ----------------------------------------------------------------------------
class SettingsStore {
  constructor() {
    this.settingsKey = 'hela_settings';
    this.initSeedData();
  }

  initSeedData() {
    try {
      if (!SafeStorage.getItem(this.settingsKey)) {
        const defaultSettings = {
          adRates: 'LKR 6,400 per vacancy. Duration: 14 days.\nInternational clients: USD 35 per vacancy (includes bank charges).\nSignificant discount for more than 2 vacancies.',
          adRules: 'Vacancy art work can be of unlimited size, full color.\nTerms and Conditions will be applied.',
          paymentInstructions: 'We accept cash/cheque deposits, bank transfer, credit card payment (visa/mastercard) and other convenient methods.\n\nOnce the payment is made, Please send the scanned copy/photo of the deposited slip via email. For payments using fund transfer, You can send the screenshot of the receipt.'
        };
        SafeStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
      }
    } catch (e) {
      console.error("Error seeding settings:", e);
    }
  }
  
  getSettings() {
    try {
      const stored = SafeStorage.getItem(this.settingsKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  updateSettings(newSettings) {
    SafeStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
  }
}

// Initialize Settings Store
const settingsStore = new SettingsStore();
