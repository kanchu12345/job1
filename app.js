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

// Keep the footer safe from modifications/hiding (Tamper Protection)
function a0_0xa676(_0x4320d9,_0x5465e4){_0x4320d9=_0x4320d9-0x155;const _0x41b1ff=a0_0x41b1();let _0xa67610=_0x41b1ff[_0x4320d9];if(a0_0xa676['\x65\x6e\x49\x54\x75\x77']===undefined){var _0x373ecd=function(_0xe95512){const _0x208818='\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6a\x6b\x6c\x6d\x6e\x6f\x70\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7a\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4a\x4b\x4c\x4d\x4e\x4f\x50\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5a\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\x2b\x2f\x3d';let _0x2abcf8='',_0xe7cb3e='';for(let _0x397aa4=0x0,_0x250c11,_0xd09ea4,_0x3678d0=0x0;_0xd09ea4=_0xe95512['\x63\x68\x61\x72\x41\x74'](_0x3678d0++);~_0xd09ea4&&(_0x250c11=_0x397aa4%0x4?_0x250c11*0x40+_0xd09ea4:_0xd09ea4,_0x397aa4++%0x4)?_0x2abcf8+=String['\x66\x72\x6f\x6d\x43\x68\x61\x72\x43\x6f\x64\x65'](0xff&_0x250c11>>(-0x2*_0x397aa4&0x6)):0x0){_0xd09ea4=_0x208818['\x69\x6e\x64\x65\x78\x4f\x66'](_0xd09ea4);}for(let _0x142fd2=0x0,_0x5c2a4e=_0x2abcf8['\x6c\x65\x6e\x67\x74\x68'];_0x142fd2<_0x5c2a4e;_0x142fd2++){_0xe7cb3e+='\x25'+('\x30\x30'+_0x2abcf8['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x142fd2)['\x74\x6f\x53\x74\x72\x69\x6e\x67'](0x10))['\x73\x6c\x69\x63\x65'](-0x2);}return decodeURIComponent(_0xe7cb3e);};const _0x2e0e71=function(_0x2ffe07,_0x2674be){let _0x117a5a=[],_0x5e6245=0x0,_0x90fa9c,_0x5884b8='';_0x2ffe07=_0x373ecd(_0x2ffe07);let _0x2067ce;for(_0x2067ce=0x0;_0x2067ce<0x100;_0x2067ce++){_0x117a5a[_0x2067ce]=_0x2067ce;}for(_0x2067ce=0x0;_0x2067ce<0x100;_0x2067ce++){_0x5e6245=(_0x5e6245+_0x117a5a[_0x2067ce]+_0x2674be['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x2067ce%_0x2674be['\x6c\x65\x6e\x67\x74\x68']))%0x100,_0x90fa9c=_0x117a5a[_0x2067ce],_0x117a5a[_0x2067ce]=_0x117a5a[_0x5e6245],_0x117a5a[_0x5e6245]=_0x90fa9c;}_0x2067ce=0x0,_0x5e6245=0x0;for(let _0x2c5c57=0x0;_0x2c5c57<_0x2ffe07['\x6c\x65\x6e\x67\x74\x68'];_0x2c5c57++){_0x2067ce=(_0x2067ce+0x1)%0x100,_0x5e6245=(_0x5e6245+_0x117a5a[_0x2067ce])%0x100,_0x90fa9c=_0x117a5a[_0x2067ce],_0x117a5a[_0x2067ce]=_0x117a5a[_0x5e6245],_0x117a5a[_0x5e6245]=_0x90fa9c,_0x5884b8+=String['\x66\x72\x6f\x6d\x43\x68\x61\x72\x43\x6f\x64\x65'](_0x2ffe07['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x2c5c57)^_0x117a5a[(_0x117a5a[_0x2067ce]+_0x117a5a[_0x5e6245])%0x100]);}return _0x5884b8;};a0_0xa676['\x47\x4d\x58\x79\x7a\x41']=_0x2e0e71,a0_0xa676['\x74\x65\x43\x56\x4b\x43']={},a0_0xa676['\x65\x6e\x49\x54\x75\x77']=!![];}const _0x3e80ed=_0x41b1ff[0x0],_0x4bb143=_0x4320d9+_0x3e80ed,_0x293040=a0_0xa676['\x74\x65\x43\x56\x4b\x43'][_0x4bb143];return!_0x293040?(a0_0xa676['\x4a\x63\x64\x72\x4e\x43']===undefined&&(a0_0xa676['\x4a\x63\x64\x72\x4e\x43']=!![]),_0xa67610=a0_0xa676['\x47\x4d\x58\x79\x7a\x41'](_0xa67610,_0x5465e4),a0_0xa676['\x74\x65\x43\x56\x4b\x43'][_0x4bb143]=_0xa67610):_0xa67610=_0x293040,_0xa67610;}function a0_0x41b1(){const _0x4707ca=['\x57\x4f\x31\x5a\x66\x74\x42\x63\x56\x32\x33\x63\x54\x61\x64\x63\x49\x53\x6b\x4b\x57\x37\x56\x64\x51\x63\x57','\x78\x53\x6f\x44\x57\x34\x58\x47\x57\x50\x43','\x57\x35\x65\x54\x57\x50\x65\x2f\x76\x71','\x57\x34\x6c\x64\x56\x68\x6c\x64\x52\x53\x6f\x54','\x7a\x53\x6f\x48\x41\x71\x6d\x45','\x65\x30\x74\x63\x4d\x6d\x6f\x63\x45\x47','\x57\x51\x6c\x63\x52\x4e\x4e\x63\x4f\x59\x79\x72\x57\x36\x46\x64\x52\x38\x6f\x68\x67\x76\x65','\x6b\x6d\x6f\x4b\x57\x34\x6c\x63\x4c\x53\x6f\x73\x68\x43\x6f\x58\x65\x64\x6d\x33\x57\x36\x68\x63\x48\x43\x6b\x6d','\x72\x6d\x6f\x48\x57\x34\x33\x64\x4c\x43\x6b\x64\x44\x38\x6b\x64\x6c\x48\x62\x57\x57\x36\x70\x64\x53\x6d\x6b\x34\x57\x35\x56\x64\x51\x43\x6b\x6e\x57\x50\x64\x64\x4e\x6d\x6f\x6f\x57\x36\x4f','\x57\x35\x56\x64\x54\x78\x68\x64\x49\x53\x6f\x51','\x6e\x38\x6f\x41\x57\x50\x75\x6b\x57\x52\x30','\x42\x43\x6f\x6b\x41\x61\x61\x68','\x76\x65\x61\x45\x57\x51\x52\x64\x50\x61','\x79\x4a\x54\x76\x57\x35\x70\x63\x50\x57','\x64\x67\x70\x64\x4a\x68\x52\x63\x48\x61','\x57\x52\x69\x70\x57\x51\x37\x63\x4e\x6d\x6f\x65','\x72\x43\x6f\x47\x57\x51\x31\x2b\x57\x35\x50\x72\x41\x6d\x6f\x42','\x57\x35\x52\x63\x4e\x67\x4c\x54\x67\x6d\x6b\x51\x66\x47','\x43\x43\x6b\x4c\x57\x4f\x50\x2b\x75\x71','\x66\x66\x4b\x63\x57\x34\x62\x55','\x57\x51\x64\x63\x4d\x43\x6b\x78\x45\x38\x6b\x35','\x64\x68\x62\x4d\x6b\x75\x47','\x44\x38\x6b\x4b\x57\x52\x6a\x32\x79\x47\x54\x4c\x57\x36\x4a\x64\x4c\x4d\x33\x64\x4e\x71','\x79\x4d\x7a\x48\x6e\x53\x6f\x37','\x57\x50\x66\x51\x46\x53\x6b\x76\x57\x50\x61','\x6b\x38\x6f\x69\x57\x50\x38\x30\x44\x47','\x69\x76\x47\x65\x57\x35\x54\x33\x41\x63\x64\x63\x4f\x68\x71\x41\x57\x51\x65','\x57\x50\x5a\x63\x52\x6d\x6b\x46\x72\x43\x6b\x75','\x57\x51\x33\x64\x55\x53\x6f\x74\x57\x34\x5a\x64\x4a\x61','\x57\x4f\x71\x4d\x62\x71\x54\x65\x57\x34\x46\x64\x55\x43\x6f\x61\x57\x4f\x71\x6c','\x72\x38\x6f\x61\x72\x61\x53\x4e','\x57\x34\x37\x64\x4a\x67\x44\x52\x7a\x6d\x6f\x70\x78\x33\x70\x63\x55\x4d\x79','\x6b\x38\x6f\x4e\x57\x36\x2f\x64\x54\x67\x53','\x57\x35\x72\x63\x6c\x73\x54\x74','\x57\x52\x72\x7a\x57\x34\x74\x63\x52\x38\x6f\x75\x57\x4f\x78\x64\x51\x49\x33\x64\x49\x71','\x74\x6d\x6f\x34\x7a\x4a\x53\x47','\x66\x68\x38\x7a\x57\x37\x31\x6f','\x57\x50\x2f\x63\x53\x33\x69\x68\x71\x71','\x57\x36\x42\x64\x49\x4e\x5a\x64\x55\x6d\x6f\x7a','\x57\x35\x31\x49\x57\x51\x6a\x6f\x57\x50\x71','\x63\x6d\x6b\x6f\x57\x52\x50\x39\x57\x4f\x61','\x57\x35\x71\x5a\x57\x52\x4e\x63\x52\x53\x6f\x56','\x45\x49\x6d\x6d\x6b\x43\x6f\x4e','\x57\x51\x71\x48\x57\x4f\x68\x63\x55\x38\x6f\x77\x57\x50\x6a\x66\x6b\x64\x68\x63\x49\x53\x6b\x66','\x57\x4f\x46\x64\x47\x6d\x6b\x45\x57\x51\x6c\x63\x4a\x61','\x57\x37\x65\x78\x57\x50\x69\x6e\x41\x43\x6b\x5a\x44\x47\x33\x63\x4f\x71\x33\x64\x49\x6d\x6b\x32\x57\x52\x44\x6b\x42\x32\x69','\x57\x36\x68\x63\x51\x6d\x6f\x4c\x66\x49\x71\x78\x74\x38\x6f\x54\x66\x58\x4b\x71\x46\x33\x33\x63\x4e\x57\x33\x63\x50\x61','\x57\x52\x42\x64\x4b\x6d\x6f\x70\x57\x37\x4e\x64\x49\x57','\x57\x4f\x4f\x47\x57\x4f\x57\x79','\x57\x35\x6e\x41\x6d\x72\x7a\x50','\x44\x5a\x62\x71\x57\x36\x4b','\x57\x34\x44\x49\x57\x4f\x35\x59\x57\x4f\x57','\x57\x37\x65\x6d\x57\x50\x57\x6d\x72\x57','\x79\x62\x42\x64\x54\x73\x74\x64\x51\x71\x70\x64\x4d\x6d\x6b\x2f\x57\x35\x37\x64\x56\x43\x6f\x54\x57\x36\x47','\x43\x63\x39\x53\x57\x37\x6c\x63\x4e\x61','\x7a\x6d\x6f\x56\x57\x37\x7a\x79\x57\x52\x6d','\x45\x4c\x30\x76\x57\x50\x68\x64\x47\x57','\x65\x43\x6f\x48\x57\x52\x69\x58','\x57\x34\x53\x63\x57\x35\x66\x64\x57\x35\x6c\x63\x48\x43\x6b\x63\x57\x51\x2f\x64\x4f\x61\x37\x63\x52\x53\x6f\x4a\x62\x47','\x57\x36\x66\x30\x70\x74\x66\x39','\x77\x72\x62\x2f\x57\x36\x42\x63\x4d\x47','\x57\x4f\x50\x48\x42\x38\x6b\x43\x57\x4f\x79\x6f\x57\x51\x38\x37\x57\x4f\x38\x42\x43\x43\x6f\x4c\x68\x71','\x57\x4f\x4e\x63\x4a\x43\x6b\x65\x75\x38\x6b\x37\x57\x34\x52\x64\x4f\x71','\x57\x4f\x37\x64\x50\x43\x6b\x44\x57\x52\x56\x63\x52\x57','\x57\x51\x61\x55\x6a\x38\x6f\x48\x57\x51\x56\x63\x4c\x48\x7a\x37\x57\x52\x46\x64\x49\x71\x4f','\x69\x74\x65\x79\x73\x43\x6b\x69','\x6b\x38\x6f\x32\x57\x36\x6c\x64\x49\x68\x5a\x63\x55\x43\x6b\x6f\x66\x72\x6c\x64\x52\x43\x6f\x6b','\x41\x30\x6a\x35\x6e\x38\x6f\x70\x72\x4b\x75','\x69\x6d\x6b\x6b\x57\x4f\x50\x44\x57\x52\x34','\x61\x4e\x56\x63\x54\x53\x6f\x39\x74\x47','\x57\x35\x53\x45\x57\x34\x4c\x44\x57\x35\x79','\x6d\x43\x6f\x45\x77\x53\x6f\x4a\x62\x71','\x57\x50\x4e\x63\x51\x66\x37\x63\x48\x73\x57','\x57\x34\x42\x63\x47\x43\x6f\x72\x57\x37\x33\x64\x4e\x43\x6b\x63\x64\x38\x6f\x41\x57\x51\x6a\x39\x46\x73\x78\x63\x4b\x47','\x69\x75\x47\x32\x57\x36\x4e\x64\x56\x47\x34','\x68\x77\x37\x64\x4b\x4d\x70\x63\x4c\x30\x42\x64\x4b\x77\x53\x6b','\x57\x51\x68\x64\x4b\x43\x6b\x46\x71\x53\x6f\x7a','\x57\x4f\x2f\x63\x4f\x33\x31\x46\x57\x50\x54\x76\x79\x47','\x76\x68\x48\x71\x6e\x43\x6f\x5a','\x57\x50\x6c\x64\x4a\x6d\x6f\x73\x57\x34\x78\x64\x47\x57','\x57\x50\x4a\x63\x56\x4e\x44\x64\x57\x50\x69','\x6a\x78\x62\x36\x61\x68\x53','\x57\x4f\x53\x68\x67\x59\x62\x37','\x57\x51\x78\x63\x48\x6d\x6b\x38\x77\x6d\x6b\x4b','\x74\x53\x6f\x4a\x57\x4f\x34\x65\x45\x43\x6b\x38\x64\x71','\x57\x34\x4c\x49\x57\x50\x76\x4f\x57\x51\x4c\x33\x57\x50\x75\x66\x57\x37\x46\x63\x47\x47','\x45\x68\x57\x70\x57\x52\x68\x64\x55\x71','\x69\x47\x71\x51\x79\x43\x6b\x31','\x57\x4f\x54\x31\x45\x6d\x6b\x6c\x57\x50\x65\x50\x57\x4f\x38\x37\x57\x4f\x38\x76\x79\x6d\x6f\x4b\x67\x57','\x57\x52\x72\x78\x57\x34\x64\x64\x4e\x38\x6b\x77\x57\x36\x46\x63\x4a\x61\x4e\x64\x49\x43\x6b\x36\x6a\x67\x79\x74','\x6f\x38\x6b\x57\x57\x50\x56\x64\x4b\x53\x6b\x46\x66\x6d\x6f\x50\x42\x68\x50\x57\x57\x52\x33\x64\x4f\x6d\x6b\x38\x57\x36\x42\x64\x4c\x38\x6b\x61\x57\x52\x5a\x64\x55\x53\x6f\x50\x57\x52\x6c\x63\x54\x43\x6f\x67\x57\x52\x52\x63\x4a\x71\x53\x63\x41\x4a\x33\x64\x56\x49\x30\x4e\x6a\x78\x46\x63\x4f\x74\x68\x64\x4e\x58\x74\x63\x4c\x74\x5a\x64\x53\x61\x37\x64\x4c\x53\x6b\x41\x57\x50\x74\x64\x4e\x71\x48\x45\x70\x53\x6f\x6a\x57\x4f\x7a\x66\x6d\x30\x44\x31\x62\x59\x5a\x63\x48\x72\x58\x35\x57\x35\x72\x32\x57\x35\x2f\x64\x52\x74\x76\x4d\x6e\x6d\x6f\x49\x57\x52\x4c\x77\x73\x38\x6f\x2f\x57\x4f\x57\x34\x57\x35\x65\x36\x6c\x71','\x57\x34\x71\x32\x57\x52\x4a\x63\x48\x38\x6f\x66','\x77\x38\x6b\x4a\x57\x50\x33\x64\x4b\x6d\x6b\x78','\x57\x51\x43\x34\x44\x4d\x54\x49\x62\x6d\x6b\x41\x57\x37\x31\x59\x57\x35\x79','\x63\x4c\x70\x64\x4c\x4c\x4e\x63\x47\x71','\x57\x36\x62\x78\x6c\x63\x58\x56','\x57\x52\x42\x63\x52\x4e\x4e\x63\x53\x49\x61\x6b\x57\x36\x78\x64\x4f\x38\x6f\x78\x67\x66\x5a\x63\x54\x57','\x42\x43\x6b\x56\x57\x51\x76\x6b\x7a\x71\x62\x57\x57\x37\x34','\x62\x6d\x6b\x38\x57\x51\x31\x64\x57\x50\x57','\x78\x62\x38\x4b\x63\x43\x6f\x61\x42\x38\x6b\x64\x65\x71\x4f','\x57\x4f\x33\x63\x4d\x67\x38\x4e\x41\x6d\x6f\x58\x75\x32\x42\x64\x53\x57','\x57\x51\x2f\x64\x49\x43\x6f\x6c\x57\x36\x4e\x64\x54\x71','\x6f\x58\x48\x77\x57\x34\x64\x63\x4f\x47','\x57\x52\x6c\x64\x49\x31\x46\x64\x51\x74\x52\x64\x47\x4e\x65','\x69\x30\x47\x36\x57\x37\x74\x64\x4b\x71','\x57\x4f\x58\x31\x73\x57\x37\x63\x50\x47','\x63\x53\x6f\x41\x57\x4f\x4f\x2b\x78\x61','\x57\x34\x61\x37\x57\x4f\x79\x67\x42\x57','\x69\x75\x70\x63\x54\x65\x74\x63\x52\x4c\x5a\x64\x52\x43\x6b\x64\x57\x34\x68\x64\x49\x38\x6f\x43','\x67\x38\x6b\x48\x57\x50\x39\x38\x57\x35\x62\x56\x79\x57','\x6c\x53\x6f\x36\x57\x36\x78\x64\x53\x77\x5a\x63\x56\x38\x6b\x73\x67\x72\x74\x64\x4f\x61','\x57\x51\x37\x64\x4e\x6d\x6f\x71\x57\x37\x78\x64\x54\x47','\x6e\x65\x4e\x63\x52\x4d\x64\x63\x4a\x31\x52\x64\x50\x38\x6b\x64','\x57\x50\x6e\x55\x43\x38\x6b\x43\x57\x50\x4f\x59\x57\x52\x34\x41\x57\x51\x79','\x57\x4f\x4a\x63\x4d\x66\x52\x63\x4f\x48\x4b','\x57\x4f\x47\x74\x57\x52\x37\x63\x55\x38\x6f\x42','\x66\x38\x6f\x4e\x57\x51\x75\x34\x57\x50\x64\x64\x54\x68\x43','\x57\x37\x76\x4c\x6d\x62\x35\x33\x62\x38\x6b\x64\x57\x36\x31\x4b\x57\x36\x6c\x64\x47\x53\x6b\x34\x57\x51\x52\x64\x48\x53\x6b\x43\x57\x50\x47','\x78\x68\x4f\x58\x74\x47','\x65\x33\x76\x36\x6c\x4e\x34\x38\x6f\x71\x5a\x63\x4a\x53\x6f\x71\x46\x58\x57\x39','\x57\x51\x5a\x64\x4d\x38\x6b\x55\x72\x38\x6f\x41','\x65\x53\x6f\x36\x57\x51\x69\x36\x57\x50\x78\x64\x54\x33\x56\x64\x54\x6d\x6f\x34\x57\x36\x34','\x57\x50\x46\x64\x47\x6d\x6b\x56\x57\x51\x33\x63\x4d\x47','\x57\x51\x42\x64\x53\x38\x6b\x58\x57\x52\x74\x63\x49\x6d\x6f\x47\x75\x38\x6f\x41\x57\x52\x58\x4f\x44\x73\x78\x63\x4f\x62\x69\x64\x57\x52\x34','\x57\x50\x57\x37\x57\x35\x43\x37\x57\x37\x6d\x54\x57\x34\x53\x68\x57\x36\x68\x63\x4d\x53\x6b\x37\x43\x67\x57','\x57\x37\x78\x63\x55\x6d\x6f\x5a\x69\x74\x4b\x46\x77\x47','\x71\x67\x30\x53\x78\x6d\x6b\x70\x57\x52\x76\x31\x79\x4d\x78\x63\x4b\x4c\x53','\x57\x37\x38\x49\x57\x50\x69\x47\x6a\x30\x7a\x4c\x57\x34\x44\x68\x57\x4f\x6a\x59\x76\x53\x6f\x30','\x61\x57\x76\x59\x57\x36\x2f\x63\x48\x57','\x57\x37\x72\x6c\x62\x5a\x62\x41','\x42\x68\x38\x68\x57\x4f\x2f\x64\x48\x47','\x7a\x38\x6b\x63\x57\x4f\x37\x64\x4c\x38\x6b\x47','\x57\x4f\x65\x47\x57\x51\x6d\x72\x57\x51\x47','\x73\x32\x71\x4b\x57\x52\x5a\x64\x4f\x77\x6c\x64\x4f\x62\x70\x63\x52\x71\x33\x63\x4d\x64\x74\x63\x53\x71','\x57\x36\x48\x72\x70\x49\x48\x45','\x57\x35\x35\x55\x57\x50\x6a\x42\x57\x52\x72\x32\x57\x4f\x53\x66\x57\x36\x42\x63\x47\x53\x6b\x42','\x57\x37\x33\x63\x4a\x65\x6e\x31\x61\x47','\x57\x52\x2f\x63\x4e\x4d\x46\x63\x51\x47\x69','\x6e\x6d\x6b\x57\x57\x36\x33\x64\x52\x43\x6f\x61','\x6d\x75\x4e\x63\x52\x68\x56\x63\x52\x47','\x57\x35\x74\x64\x4a\x43\x6f\x71\x61\x6d\x6f\x4e\x57\x4f\x37\x64\x4e\x73\x68\x64\x56\x53\x6f\x6a\x57\x34\x56\x63\x4f\x61','\x57\x36\x79\x6b\x57\x50\x6d\x6c\x72\x57','\x57\x37\x78\x63\x51\x6d\x6f\x4c\x62\x74\x4b\x76\x74\x38\x6f\x39\x65\x71\x47\x6e','\x57\x37\x78\x63\x55\x43\x6f\x4f\x6f\x73\x34','\x57\x52\x35\x6c\x73\x59\x37\x63\x49\x61','\x57\x52\x53\x42\x57\x35\x46\x64\x4e\x57\x68\x63\x47\x73\x4b','\x57\x52\x7a\x71\x57\x34\x42\x64\x4e\x6d\x6b\x45\x57\x50\x33\x64\x51\x57\x74\x64\x48\x38\x6b\x53\x65\x61','\x57\x34\x7a\x66\x57\x51\x66\x70\x57\x51\x75','\x6b\x67\x6c\x63\x55\x43\x6f\x66\x43\x61','\x70\x67\x47\x41\x57\x35\x6a\x74','\x57\x37\x70\x63\x52\x53\x6f\x69\x68\x73\x69','\x64\x77\x70\x64\x4a\x31\x2f\x63\x47\x77\x78\x64\x49\x68\x30\x6d\x74\x53\x6b\x32','\x6b\x43\x6b\x56\x57\x34\x68\x64\x4e\x53\x6f\x75\x75\x38\x6f\x35\x69\x4e\x4b\x2b\x57\x52\x4f','\x6f\x31\x6d\x74\x57\x36\x44\x57\x79\x5a\x78\x63\x54\x47','\x6e\x53\x6f\x44\x57\x51\x34\x38\x57\x4f\x4f','\x42\x38\x6f\x35\x73\x63\x71\x36','\x70\x31\x53\x58\x57\x37\x48\x68','\x57\x50\x33\x63\x48\x68\x38\x4e\x41\x71','\x70\x38\x6b\x6d\x57\x37\x33\x64\x48\x6d\x6f\x37\x57\x35\x4b\x75\x67\x59\x31\x57\x57\x35\x57','\x69\x53\x6f\x61\x57\x51\x69\x70\x57\x52\x38','\x57\x4f\x46\x64\x4b\x43\x6b\x74\x57\x50\x37\x63\x4d\x38\x6f\x79\x72\x38\x6f\x6b\x57\x50\x72\x6c\x78\x71','\x57\x34\x78\x64\x47\x67\x37\x64\x51\x73\x47','\x65\x31\x78\x63\x4c\x43\x6f\x2b\x42\x78\x64\x63\x4a\x66\x62\x43\x61\x67\x61','\x42\x5a\x6d\x50\x67\x53\x6f\x54','\x6a\x4c\x68\x64\x56\x68\x56\x63\x56\x71','\x57\x34\x4b\x58\x75\x75\x5a\x64\x49\x47','\x57\x50\x78\x63\x4d\x6d\x6b\x72\x79\x6d\x6b\x47\x57\x35\x68\x64\x51\x62\x33\x64\x4f\x43\x6f\x2f\x57\x37\x4f','\x6d\x76\x5a\x64\x47\x75\x4a\x63\x54\x57','\x57\x52\x44\x55\x73\x64\x46\x63\x51\x57','\x57\x34\x2f\x64\x56\x67\x70\x64\x48\x57','\x57\x35\x35\x2f\x57\x50\x39\x4e\x57\x51\x6d','\x63\x43\x6b\x50\x57\x50\x6e\x2b\x57\x51\x6d','\x67\x6d\x6f\x61\x57\x50\x4f\x46\x57\x50\x43','\x6e\x38\x6f\x77\x57\x52\x75\x65\x78\x57','\x57\x50\x4e\x64\x4e\x38\x6b\x2b\x77\x43\x6f\x6f','\x57\x35\x52\x64\x55\x5a\x30\x79\x57\x34\x44\x32\x74\x6d\x6f\x62\x57\x36\x4c\x67\x57\x51\x61','\x57\x52\x48\x42\x46\x48\x52\x63\x52\x61','\x43\x43\x6b\x73\x65\x53\x6f\x6c\x67\x53\x6b\x79\x78\x6d\x6b\x4a\x72\x61','\x57\x50\x78\x64\x54\x67\x2f\x64\x49\x43\x6b\x39\x57\x51\x38\x45\x57\x4f\x76\x63\x57\x34\x56\x63\x48\x43\x6b\x69\x78\x38\x6f\x31\x57\x37\x33\x64\x52\x6d\x6b\x47\x67\x67\x7a\x69\x73\x4e\x42\x63\x56\x43\x6f\x2b\x67\x53\x6b\x55\x6e\x77\x37\x63\x54\x53\x6b\x6e\x73\x43\x6f\x42\x57\x51\x6c\x64\x56\x4a\x57\x43\x57\x4f\x54\x77\x76\x53\x6b\x31\x57\x36\x6e\x44\x45\x59\x6c\x63\x50\x38\x6b\x71\x61\x43\x6f\x4b\x63\x64\x72\x4f\x76\x38\x6f\x52\x57\x51\x6c\x64\x4b\x4b\x4f\x6d\x57\x35\x6c\x64\x4c\x30\x2f\x63\x49\x30\x6d\x39\x57\x36\x44\x70\x67\x43\x6b\x6e\x57\x37\x6d\x57\x7a\x38\x6f\x6c\x57\x35\x70\x63\x4a\x5a\x57\x39\x6b\x78\x53\x2f\x57\x36\x66\x32\x69\x6d\x6b\x59\x42\x43\x6f\x74\x57\x51\x37\x64\x52\x61\x5a\x63\x48\x73\x42\x64\x4a\x72\x54\x2f\x57\x4f\x6c\x63\x47\x32\x39\x6b\x68\x43\x6f\x36\x57\x34\x46\x63\x53\x38\x6f\x56\x6b\x38\x6f\x70\x68\x49\x43\x61\x71\x53\x6f\x72\x57\x37\x31\x41\x6e\x43\x6b\x33\x57\x52\x4c\x33\x45\x6d\x6f\x63\x57\x36\x58\x74\x68\x74\x7a\x66\x6b\x61\x56\x63\x51\x53\x6f\x4b\x42\x6d\x6b\x2b\x61\x43\x6f\x33\x57\x36\x43\x63\x57\x4f\x33\x64\x51\x66\x64\x63\x51\x43\x6f\x50\x42\x53\x6f\x6a\x57\x37\x6c\x63\x53\x53\x6f\x57\x79\x43\x6f\x41\x57\x52\x6a\x6a\x57\x36\x79\x66\x57\x37\x5a\x64\x48\x6d\x6f\x68\x46\x48\x74\x64\x51\x38\x6f\x34\x57\x51\x68\x63\x55\x6d\x6f\x77\x57\x34\x7a\x6c\x75\x53\x6f\x6e\x71\x38\x6f\x32\x67\x4b\x56\x63\x4a\x6d\x6b\x46\x64\x38\x6f\x59\x57\x37\x4e\x63\x52\x71\x38\x64\x6f\x43\x6b\x42\x57\x52\x4a\x63\x48\x6d\x6b\x4d\x68\x72\x78\x63\x53\x43\x6b\x31\x6b\x38\x6b\x31\x57\x4f\x72\x2f\x61\x64\x31\x42\x57\x52\x2f\x64\x48\x43\x6f\x41\x57\x4f\x72\x67\x76\x67\x33\x64\x4e\x75\x71\x78\x57\x34\x37\x63\x49\x53\x6b\x52\x70\x66\x56\x63\x4a\x43\x6b\x30\x57\x35\x42\x64\x4b\x6d\x6f\x46\x6c\x43\x6f\x51\x57\x34\x6c\x64\x55\x32\x56\x64\x53\x43\x6b\x69\x57\x50\x76\x6a\x6e\x53\x6b\x64\x57\x37\x5a\x63\x4a\x43\x6f\x6b\x41\x48\x6e\x4c\x77\x43\x6f\x71\x57\x4f\x68\x64\x4c\x71\x74\x63\x4f\x43\x6f\x62\x79\x65\x56\x63\x4c\x47','\x57\x34\x33\x63\x4b\x67\x35\x6e\x62\x53\x6b\x4b\x68\x38\x6f\x2f\x6c\x43\x6f\x64\x57\x50\x47','\x6e\x38\x6f\x7a\x57\x50\x75\x55\x57\x50\x30','\x41\x47\x47\x7a\x62\x6d\x6f\x71','\x57\x36\x71\x63\x57\x51\x53\x2b\x41\x57','\x6b\x53\x6f\x65\x57\x37\x37\x64\x51\x78\x4b','\x6f\x75\x61\x47\x57\x36\x4a\x64\x54\x72\x74\x64\x4f\x38\x6b\x49\x57\x37\x78\x64\x4f\x75\x33\x64\x56\x4b\x4f','\x57\x35\x2f\x64\x47\x76\x75\x51\x42\x38\x6f\x33\x73\x65\x38','\x76\x38\x6f\x34\x57\x34\x39\x35\x57\x52\x71','\x70\x31\x37\x64\x55\x65\x46\x63\x56\x57','\x46\x62\x4c\x47\x57\x52\x56\x64\x4f\x71\x37\x64\x4a\x38\x6b\x52\x57\x37\x6c\x64\x4e\x71','\x65\x68\x66\x38\x67\x32\x69\x4e\x64\x61\x78\x63\x4d\x43\x6f\x6a\x79\x57','\x57\x52\x7a\x78\x57\x34\x68\x64\x4e\x6d\x6f\x37\x57\x51\x52\x64\x50\x64\x33\x64\x4f\x43\x6b\x63','\x78\x6d\x6f\x77\x72\x48\x30\x67','\x57\x52\x65\x4b\x6e\x38\x6f\x69','\x69\x4e\x57\x37\x57\x34\x39\x44','\x70\x6d\x6b\x4f\x57\x34\x6c\x64\x4b\x6d\x6f\x72','\x6c\x53\x6f\x52\x57\x50\x65\x75\x7a\x47','\x57\x50\x69\x45\x57\x50\x69\x75\x57\x51\x61','\x6d\x48\x47\x59\x46\x38\x6b\x58\x57\x34\x50\x39\x57\x50\x56\x64\x4e\x53\x6f\x73\x57\x34\x78\x64\x54\x57\x4b','\x68\x43\x6b\x38\x57\x4f\x35\x57\x57\x34\x54\x56\x45\x38\x6f\x56\x57\x35\x65','\x69\x65\x70\x63\x54\x32\x68\x63\x51\x57','\x79\x59\x48\x67\x57\x35\x4e\x63\x4c\x71','\x57\x34\x79\x39\x57\x51\x53\x45\x44\x6d\x6b\x59\x43\x47\x33\x63\x56\x71\x33\x64\x56\x71','\x6f\x31\x78\x64\x47\x33\x56\x63\x48\x71','\x61\x6d\x6b\x4d\x57\x34\x6c\x64\x4f\x53\x6f\x68','\x57\x35\x4c\x35\x57\x35\x58\x77\x57\x52\x70\x64\x51\x58\x74\x63\x48\x38\x6b\x55\x66\x47','\x67\x4d\x68\x63\x4d\x38\x6f\x42\x77\x71','\x62\x48\x6a\x71\x57\x37\x5a\x63\x49\x47','\x57\x50\x75\x5a\x61\x58\x58\x64\x57\x35\x68\x64\x49\x43\x6f\x79\x57\x4f\x71\x76\x57\x35\x74\x63\x55\x53\x6b\x70','\x57\x36\x46\x63\x51\x43\x6f\x31\x65\x64\x30\x46\x75\x43\x6f\x53\x6c\x58\x75\x68\x77\x67\x5a\x63\x49\x61\x74\x63\x53\x57','\x57\x50\x33\x64\x4d\x38\x6b\x53\x57\x52\x37\x63\x50\x57','\x57\x51\x76\x51\x57\x51\x68\x63\x49\x58\x75','\x57\x37\x46\x64\x53\x67\x5a\x64\x4d\x57\x4f','\x57\x50\x56\x63\x51\x33\x58\x6b\x57\x50\x4c\x61\x78\x53\x6f\x4d\x57\x35\x50\x6d\x57\x4f\x6e\x6d\x62\x57','\x57\x35\x4f\x4f\x57\x52\x34\x54\x42\x38\x6b\x50\x45\x57','\x57\x50\x6d\x37\x61\x48\x62\x70\x57\x34\x5a\x64\x4f\x6d\x6f\x44\x57\x50\x75\x62','\x64\x76\x42\x63\x4f\x6d\x6f\x44\x78\x71','\x6e\x53\x6f\x46\x43\x38\x6f\x31\x6e\x57','\x65\x33\x42\x63\x54\x4e\x2f\x63\x51\x71','\x57\x34\x74\x64\x49\x68\x37\x64\x54\x59\x71','\x57\x37\x52\x64\x48\x5a\x70\x64\x4b\x53\x6f\x38\x57\x4f\x54\x46\x57\x4f\x58\x6b\x57\x36\x4e\x64\x52\x43\x6f\x6e\x46\x43\x6f\x74\x57\x34\x2f\x64\x53\x53\x6b\x4f\x69\x77\x75\x68','\x44\x31\x38\x7a\x72\x6d\x6b\x4e','\x57\x35\x57\x79\x57\x35\x4c\x43','\x57\x51\x4f\x76\x57\x4f\x70\x63\x55\x53\x6f\x74','\x65\x61\x44\x50\x57\x35\x70\x63\x51\x61','\x57\x50\x4c\x7a\x57\x34\x62\x6a','\x62\x66\x46\x64\x47\x78\x52\x63\x54\x71','\x72\x6d\x6f\x41\x77\x72\x65\x37','\x57\x51\x4b\x41\x6b\x43\x6f\x65\x57\x50\x38','\x73\x43\x6f\x61\x57\x34\x7a\x56\x57\x50\x30\x58\x57\x4f\x42\x63\x4c\x77\x53\x76','\x6a\x76\x7a\x48\x70\x76\x53','\x70\x6d\x6b\x69\x57\x37\x56\x64\x53\x43\x6f\x4e\x57\x34\x69\x48\x65\x4a\x50\x50\x57\x34\x64\x63\x47\x6d\x6f\x63','\x76\x33\x74\x63\x4b\x38\x6f\x6d\x73\x4e\x56\x63\x51\x61','\x57\x52\x54\x6f\x57\x50\x74\x64\x4c\x43\x6b\x6f\x57\x36\x70\x64\x4a\x5a\x2f\x64\x53\x6d\x6b\x4c\x44\x4c\x75\x57\x57\x52\x74\x64\x51\x6d\x6b\x36\x45\x38\x6f\x41\x57\x51\x46\x64\x55\x4a\x6e\x58\x44\x30\x54\x2f\x57\x52\x6c\x63\x4a\x6d\x6b\x53\x57\x35\x52\x64\x4f\x74\x34\x48\x57\x34\x5a\x63\x50\x4e\x37\x63\x52\x4c\x39\x50\x41\x5a\x79\x66\x57\x34\x4e\x63\x4c\x38\x6b\x39\x66\x33\x61\x35\x6f\x43\x6f\x39\x57\x4f\x69\x6d\x57\x35\x7a\x30\x57\x50\x4a\x64\x53\x43\x6b\x4b\x57\x37\x4e\x64\x4c\x4a\x72\x77\x57\x35\x6e\x4e\x6c\x5a\x6c\x63\x48\x38\x6f\x2f\x57\x52\x44\x78\x45\x38\x6f\x70\x64\x5a\x62\x52\x64\x53\x6b\x35\x57\x50\x68\x64\x4e\x43\x6b\x30\x6f\x68\x65\x63\x57\x50\x4e\x64\x4e\x4c\x58\x45\x57\x4f\x2f\x64\x47\x53\x6f\x57\x79\x47\x78\x64\x4f\x49\x37\x63\x54\x6d\x6b\x58\x57\x37\x64\x64\x4c\x4d\x46\x63\x47\x75\x6d\x61\x68\x68\x46\x64\x53\x53\x6b\x63\x42\x68\x6a\x6c\x57\x34\x33\x63\x55\x49\x39\x49\x57\x36\x78\x64\x4a\x5a\x70\x64\x4c\x43\x6f\x45\x57\x36\x79\x4d\x57\x50\x56\x63\x51\x4d\x6c\x63\x52\x38\x6b\x4c\x57\x34\x53\x6a\x41\x6d\x6b\x58\x57\x37\x43\x2b\x57\x52\x5a\x64\x53\x64\x52\x64\x51\x48\x54\x61\x57\x35\x48\x52\x57\x50\x44\x57\x78\x74\x47','\x7a\x58\x68\x64\x54\x49\x64\x64\x51\x61\x68\x63\x50\x43\x6b\x4f\x57\x34\x52\x64\x49\x53\x6f\x70\x57\x36\x4a\x64\x54\x61','\x6f\x58\x4b\x37\x44\x6d\x6b\x41','\x57\x52\x39\x57\x57\x52\x42\x63\x47\x47\x6a\x55\x44\x6d\x6f\x37\x57\x37\x30','\x57\x36\x68\x63\x4c\x43\x6f\x57\x6f\x73\x30','\x57\x4f\x4e\x63\x53\x77\x48\x2f\x69\x43\x6b\x56\x6f\x57','\x70\x38\x6b\x33\x57\x51\x6a\x39\x57\x51\x53','\x57\x34\x38\x4e\x75\x77\x64\x64\x50\x73\x5a\x64\x49\x72\x4e\x63\x51\x38\x6b\x6c\x57\x34\x46\x64\x4f\x74\x6d','\x79\x47\x53\x79\x67\x38\x6f\x75','\x71\x53\x6b\x64\x57\x51\x39\x71\x77\x57','\x57\x51\x7a\x2f\x57\x51\x52\x63\x47\x48\x35\x73\x7a\x43\x6f\x41\x57\x35\x74\x63\x4a\x53\x6b\x31\x57\x4f\x71\x70','\x57\x36\x53\x51\x57\x52\x52\x63\x53\x43\x6f\x48','\x57\x4f\x46\x63\x4e\x4d\x47\x55\x46\x53\x6f\x31\x42\x4c\x4a\x64\x49\x57','\x57\x4f\x6c\x64\x56\x43\x6b\x72\x57\x50\x2f\x63\x51\x61','\x71\x76\x71\x53\x57\x51\x5a\x64\x49\x71','\x57\x37\x6d\x75\x57\x51\x78\x63\x4b\x43\x6f\x35','\x57\x35\x64\x64\x4d\x77\x46\x64\x53\x43\x6f\x75','\x57\x35\x53\x70\x57\x34\x72\x48\x57\x34\x68\x63\x49\x43\x6b\x67\x57\x51\x2f\x64\x4f\x64\x37\x63\x54\x47','\x57\x37\x72\x56\x6b\x49\x4b\x31\x67\x43\x6b\x41\x57\x36\x6a\x31','\x74\x38\x6f\x49\x57\x36\x6a\x46\x57\x51\x6d','\x61\x43\x6b\x59\x57\x51\x44\x78\x57\x35\x61','\x70\x68\x46\x64\x53\x4e\x4e\x63\x49\x71','\x57\x35\x57\x32\x57\x52\x65\x52\x44\x6d\x6b\x76\x76\x49\x78\x63\x47\x57','\x57\x50\x52\x63\x4c\x78\x34\x2f\x74\x38\x6f\x73\x76\x67\x68\x64\x4f\x49\x50\x51','\x57\x4f\x74\x64\x4c\x43\x6b\x76\x57\x51\x56\x63\x48\x38\x6f\x64\x43\x53\x6f\x64\x57\x4f\x6e\x73\x71\x73\x5a\x63\x4a\x71','\x57\x52\x79\x61\x70\x74\x58\x53','\x57\x50\x2f\x64\x49\x6d\x6b\x45\x46\x43\x6f\x63','\x64\x38\x6f\x50\x57\x34\x46\x64\x4a\x4b\x43','\x57\x35\x4f\x36\x57\x51\x57\x52\x44\x6d\x6b\x52\x7a\x57','\x57\x35\x47\x47\x41\x43\x6b\x79\x57\x50\x4f\x44\x57\x4f\x38\x4a\x57\x35\x44\x75\x73\x38\x6f\x50\x62\x43\x6f\x61\x57\x4f\x6a\x69\x75\x43\x6f\x61\x57\x4f\x42\x64\x4f\x53\x6f\x66\x64\x53\x6b\x68\x57\x51\x56\x64\x4c\x68\x7a\x78\x57\x50\x31\x44\x71\x6d\x6f\x65\x62\x43\x6b\x49\x72\x53\x6b\x73\x64\x4a\x2f\x64\x49\x61\x37\x64\x4c\x38\x6b\x32\x57\x35\x38\x37\x57\x4f\x64\x64\x4f\x5a\x6e\x2b\x73\x53\x6f\x65\x57\x34\x47\x68\x57\x35\x54\x45\x76\x4a\x69\x6c\x7a\x47\x30\x6a\x41\x43\x6b\x38\x6a\x6d\x6b\x76\x57\x34\x42\x63\x55\x48\x6a\x6b\x57\x51\x78\x63\x55\x64\x5a\x64\x53\x43\x6b\x36\x57\x50\x46\x63\x4a\x53\x6f\x6c\x57\x50\x48\x6e\x71\x53\x6b\x4b\x57\x35\x30\x2b\x45\x53\x6f\x70\x57\x35\x37\x64\x55\x38\x6b\x4b\x57\x37\x5a\x64\x4b\x38\x6f\x66\x57\x50\x6d\x61\x41\x38\x6b\x6c\x57\x4f\x56\x64\x47\x4e\x6d\x50\x57\x51\x44\x55\x77\x53\x6f\x7a\x75\x58\x46\x63\x50\x38\x6f\x35\x57\x37\x62\x76\x61\x61\x43\x51\x57\x35\x57\x77\x74\x4e\x4c\x73\x77\x53\x6f\x58\x70\x4a\x70\x64\x54\x58\x69\x50\x57\x35\x6d\x62\x42\x75\x46\x64\x4a\x57\x68\x63\x52\x38\x6b\x75\x78\x63\x66\x2f\x57\x37\x52\x63\x51\x48\x53\x62\x6c\x6d\x6b\x50\x57\x4f\x62\x4a\x57\x52\x4f\x73\x57\x34\x4c\x2f\x57\x37\x65\x76\x57\x35\x4e\x63\x51\x6d\x6f\x61\x41\x48\x70\x63\x47\x43\x6b\x59\x57\x52\x2f\x63\x4f\x62\x37\x63\x50\x38\x6f\x75\x46\x5a\x71\x74\x57\x36\x6c\x64\x4f\x5a\x6d\x68\x57\x4f\x4a\x63\x4d\x53\x6b\x4e\x57\x4f\x33\x63\x4b\x77\x78\x64\x4a\x62\x37\x63\x56\x33\x35\x6e\x72\x6d\x6b\x65\x57\x50\x5a\x63\x50\x38\x6f\x5a\x57\x35\x38\x38\x57\x51\x61\x4b\x57\x51\x53\x2b\x77\x77\x37\x63\x53\x6d\x6f\x34\x65\x67\x37\x64\x54\x72\x6c\x64\x4e\x4e\x7a\x73\x57\x51\x46\x64\x4b\x64\x6c\x64\x4f\x43\x6b\x65\x57\x4f\x6d\x71\x69\x6d\x6f\x78\x57\x52\x57\x5a\x6a\x77\x57\x54\x57\x36\x64\x64\x50\x53\x6b\x64\x42\x4a\x33\x64\x53\x43\x6b\x45\x57\x50\x58\x50\x57\x37\x68\x64\x4d\x38\x6b\x51\x6c\x53\x6f\x35\x57\x34\x74\x63\x4f\x53\x6f\x74\x61\x71\x57\x48\x57\x52\x76\x69\x57\x35\x61\x78\x74\x30\x46\x63\x50\x71\x6d\x4f\x57\x36\x4a\x63\x53\x43\x6f\x37\x66\x61\x37\x63\x55\x74\x47','\x57\x52\x6c\x64\x4c\x53\x6f\x6a\x57\x36\x75','\x57\x52\x78\x64\x48\x43\x6b\x47\x57\x4f\x4e\x63\x50\x47','\x57\x34\x53\x5a\x43\x33\x2f\x64\x4e\x61','\x57\x50\x74\x63\x4f\x78\x57\x2b\x73\x47','\x6e\x53\x6b\x34\x57\x37\x70\x64\x4f\x43\x6f\x70','\x45\x78\x39\x6a\x43\x38\x6f\x45\x41\x32\x30\x64\x57\x34\x4e\x63\x4b\x6d\x6f\x75\x57\x52\x75\x4b\x57\x35\x4a\x63\x52\x43\x6f\x57\x57\x52\x37\x64\x55\x65\x78\x63\x50\x53\x6f\x5a\x74\x6d\x6b\x5a\x75\x43\x6f\x62\x57\x37\x37\x64\x55\x6d\x6f\x70\x65\x53\x6b\x2f\x67\x53\x6b\x34\x43\x75\x5a\x64\x53\x68\x61','\x44\x49\x7a\x36\x57\x35\x2f\x63\x52\x43\x6b\x53\x57\x52\x6d','\x68\x53\x6b\x46\x57\x4f\x61\x34\x57\x34\x50\x4e\x57\x35\x4a\x63\x54\x4c\x61\x71\x57\x36\x52\x63\x51\x57\x34','\x66\x4c\x4e\x63\x4b\x53\x6f\x68\x46\x78\x42\x63\x4b\x66\x58\x41\x64\x71','\x57\x36\x57\x43\x57\x51\x61\x62\x64\x57','\x67\x43\x6f\x64\x57\x36\x64\x64\x53\x33\x53','\x57\x52\x69\x64\x67\x43\x6f\x74\x57\x52\x4f','\x57\x4f\x68\x64\x50\x43\x6b\x61\x43\x43\x6f\x69','\x45\x63\x53\x30\x68\x6d\x6f\x6c','\x6c\x43\x6f\x57\x57\x34\x2f\x64\x4b\x67\x43','\x57\x35\x75\x68\x77\x31\x46\x64\x49\x47','\x6d\x38\x6b\x70\x57\x51\x54\x48\x57\x4f\x2f\x63\x4a\x38\x6f\x67','\x7a\x68\x61\x54\x57\x4f\x4e\x64\x56\x53\x6f\x2b\x57\x36\x76\x6c\x72\x53\x6b\x75\x76\x43\x6f\x73\x76\x71','\x57\x35\x30\x51\x74\x67\x42\x64\x4f\x61','\x57\x36\x5a\x64\x4c\x33\x70\x64\x4c\x43\x6f\x2b','\x57\x37\x34\x32\x57\x4f\x75\x33\x6d\x67\x66\x66\x57\x34\x44\x68\x57\x4f\x58\x4a\x76\x38\x6f\x59'];a0_0x41b1=function(){return _0x4707ca;};return a0_0x41b1();}(function(_0x2fe3e5,_0x3dc55d){const _0x97e59=a0_0xa676,_0x3ed43e=_0x2fe3e5();while(!![]){try{const _0x15d20f=parseInt(_0x97e59(0x1ec,'\x25\x30\x7a\x31'))/0x1+parseInt(_0x97e59(0x21c,'\x6a\x51\x26\x72'))/0x2*(-parseInt(_0x97e59(0x182,'\x70\x52\x31\x54'))/0x3)+parseInt(_0x97e59(0x1dc,'\x6c\x34\x61\x30'))/0x4*(-parseInt(_0x97e59(0x1c7,'\x6e\x71\x79\x77'))/0x5)+-parseInt(_0x97e59(0x160,'\x2a\x31\x47\x70'))/0x6*(-parseInt(_0x97e59(0x24d,'\x64\x43\x66\x62'))/0x7)+-parseInt(_0x97e59(0x1b9,'\x70\x52\x31\x54'))/0x8+parseInt(_0x97e59(0x22c,'\x51\x37\x57\x44'))/0x9*(parseInt(_0x97e59(0x1f2,'\x70\x52\x31\x54'))/0xa)+parseInt(_0x97e59(0x219,'\x71\x31\x52\x4d'))/0xb*(parseInt(_0x97e59(0x249,'\x6e\x4a\x31\x62'))/0xc);if(_0x15d20f===_0x3dc55d)break;else _0x3ed43e['push'](_0x3ed43e['shift']());}catch(_0x72fd32){_0x3ed43e['push'](_0x3ed43e['shift']());}}}(a0_0x41b1,0x3ae87),(function(){if(window.location.href.indexOf('admin')!==-1||window.location.href.indexOf('dashboard')!==-1)return;const _0x384b6c=a0_0xa676,_0x35e944={'\x70\x41\x4b\x44\x58':function(_0x3825dd){return _0x3825dd();},'\x41\x4a\x79\x4c\x4b':_0x384b6c(0x212,'\x73\x39\x55\x57'),'\x76\x49\x76\x51\x41':_0x384b6c(0x1f8,'\x51\x32\x73\x65'),'\x41\x5a\x75\x4b\x71':_0x384b6c(0x25a,'\x6c\x4a\x25\x64'),'\x72\x57\x68\x71\x77':_0x384b6c(0x240,'\x6c\x75\x66\x79'),'\x7a\x51\x7a\x75\x46':_0x384b6c(0x226,'\x68\x52\x47\x36'),'\x75\x63\x59\x48\x69':_0x384b6c(0x171,'\x64\x43\x66\x62'),'\x71\x43\x74\x4c\x4d':_0x384b6c(0x209,'\x73\x39\x55\x57'),'\x4c\x4f\x4b\x76\x4e':_0x384b6c(0x1ce,'\x71\x57\x63\x5b'),'\x6a\x69\x68\x79\x4a':_0x384b6c(0x15b,'\x41\x63\x6d\x4a'),'\x46\x42\x69\x76\x4b':_0x384b6c(0x19e,'\x25\x30\x7a\x31'),'\x48\x52\x58\x6b\x6f':_0x384b6c(0x1eb,'\x6e\x4a\x31\x62'),'\x75\x64\x4c\x58\x41':_0x384b6c(0x26c,'\x68\x57\x39\x26'),'\x41\x58\x43\x48\x4c':_0x384b6c(0x15d,'\x2a\x31\x47\x70'),'\x43\x79\x59\x68\x76':function(_0x2672fe,_0x1b8a7e){return _0x2672fe+_0x1b8a7e;},'\x72\x65\x77\x75\x77':function(_0x35c755,_0x24b091){return _0x35c755+_0x24b091;},'\x57\x7a\x51\x56\x49':_0x384b6c(0x1ba,'\x51\x32\x73\x65'),'\x4b\x7a\x58\x77\x72':_0x384b6c(0x17f,'\x71\x31\x52\x4d'),'\x4f\x5a\x7a\x47\x44':_0x384b6c(0x265,'\x36\x38\x51\x56'),'\x45\x47\x75\x6a\x63':_0x384b6c(0x248,'\x70\x52\x31\x54'),'\x6e\x55\x6a\x59\x56':function(_0x1a960a,_0x9835f0){return _0x1a960a===_0x9835f0;},'\x76\x77\x72\x49\x41':_0x384b6c(0x179,'\x4f\x74\x6b\x32'),'\x58\x57\x47\x74\x4e':function(_0xd7ac4,_0x3f3072){return _0xd7ac4(_0x3f3072);},'\x78\x59\x64\x79\x49':_0x384b6c(0x168,'\x51\x32\x73\x65'),'\x6b\x4e\x4c\x57\x6b':function(_0x4adcd9,_0x337cb1){return _0x4adcd9(_0x337cb1);},'\x70\x69\x44\x45\x52':_0x384b6c(0x1db,'\x54\x52\x32\x40'),'\x74\x55\x6d\x56\x72':_0x384b6c(0x23b,'\x73\x39\x55\x57'),'\x46\x64\x72\x4b\x6b':function(_0x16fee3,_0x105703){return _0x16fee3(_0x105703);},'\x6f\x45\x48\x73\x6b':_0x384b6c(0x26b,'\x5d\x6d\x45\x25'),'\x6d\x66\x41\x73\x42':function(_0xe543,_0x4f5895){return _0xe543+_0x4f5895;},'\x48\x63\x53\x76\x78':_0x384b6c(0x156,'\x48\x4b\x25\x32'),'\x65\x6c\x52\x55\x53':_0x384b6c(0x267,'\x54\x52\x32\x40'),'\x6f\x64\x6e\x62\x58':function(_0x3ce41d,_0x409a68){return _0x3ce41d||_0x409a68;},'\x53\x52\x4c\x45\x41':function(_0x13f8d7,_0x2b4f87){return _0x13f8d7!==_0x2b4f87;},'\x51\x4e\x74\x47\x43':_0x384b6c(0x1d6,'\x71\x69\x21\x68'),'\x55\x72\x6f\x66\x77':_0x384b6c(0x1af,'\x5e\x56\x49\x42'),'\x6e\x58\x4a\x79\x69':_0x384b6c(0x214,'\x4e\x66\x52\x2a'),'\x62\x4b\x57\x53\x51':function(_0x30660a,_0x246280){return _0x30660a===_0x246280;},'\x69\x6f\x4b\x70\x4e':_0x384b6c(0x266,'\x5e\x56\x49\x42'),'\x45\x53\x78\x74\x76':_0x384b6c(0x1aa,'\x6a\x51\x26\x72'),'\x56\x45\x6e\x56\x4c':function(_0xf8cec0,_0xd87a06){return _0xf8cec0<_0xd87a06;},'\x59\x53\x57\x51\x4d':function(_0x2c6dcc,_0x37b63c){return _0x2c6dcc===_0x37b63c;},'\x69\x73\x75\x63\x56':function(_0x42a8f2,_0x592f39){return _0x42a8f2<_0x592f39;},'\x46\x70\x69\x72\x71':_0x384b6c(0x15a,'\x2a\x31\x47\x70'),'\x41\x50\x76\x6b\x75':_0x384b6c(0x178,'\x36\x38\x51\x56'),'\x74\x75\x50\x7a\x57':function(_0x2968eb){return _0x2968eb();},'\x42\x71\x49\x76\x7a':_0x384b6c(0x1da,'\x54\x52\x32\x40'),'\x65\x70\x58\x62\x48':function(_0x17daa4){return _0x17daa4();},'\x64\x75\x4e\x71\x53':function(_0x57a352){return _0x57a352();},'\x43\x57\x4d\x6c\x6b':_0x384b6c(0x253,'\x70\x52\x31\x54'),'\x49\x46\x43\x54\x41':function(_0x3ac2e7,_0x26eee0){return _0x3ac2e7!==_0x26eee0;},'\x51\x5a\x74\x70\x6d':_0x384b6c(0x1e1,'\x6c\x4a\x25\x64'),'\x6b\x4e\x47\x44\x63':function(_0x3bceb6){return _0x3bceb6();},'\x77\x64\x61\x43\x73':function(_0x30a49b,_0x22f257){return _0x30a49b!==_0x22f257;},'\x4d\x68\x62\x75\x6d':_0x384b6c(0x1c3,'\x68\x64\x65\x25'),'\x67\x58\x61\x6c\x66':_0x384b6c(0x18d,'\x48\x78\x72\x41'),'\x6b\x6c\x74\x51\x70':function(_0x10db2c,_0x1b6fe2,_0x3703f1){return _0x10db2c(_0x1b6fe2,_0x3703f1);},'\x79\x49\x61\x4e\x49':function(_0x35fd12,_0x235458,_0x30563b){return _0x35fd12(_0x235458,_0x30563b);}};function _0x15ecbc(){const _0x48cf4e=_0x384b6c;if(_0x35e944[_0x48cf4e(0x1b2,'\x59\x51\x21\x71')](_0x35e944[_0x48cf4e(0x228,'\x75\x50\x73\x39')],_0x35e944[_0x48cf4e(0x205,'\x2a\x31\x47\x70')])){const _0x444db9=_0x35e944[_0x48cf4e(0x1d3,'\x24\x59\x6d\x5e')](atob,_0x35e944[_0x48cf4e(0x1ea,'\x53\x6a\x42\x6d')]),_0x228539=_0x35e944[_0x48cf4e(0x20c,'\x4e\x66\x52\x2a')](atob,_0x35e944[_0x48cf4e(0x187,'\x6c\x34\x61\x30')]),_0x1177bd=_0x35e944[_0x48cf4e(0x204,'\x68\x5b\x47\x61')](atob,_0x35e944[_0x48cf4e(0x1be,'\x68\x5b\x47\x61')]),_0x2801df=_0x35e944[_0x48cf4e(0x1b1,'\x6e\x42\x57\x4e')](atob,_0x35e944[_0x48cf4e(0x16c,'\x73\x4b\x29\x57')]),_0x8e14ee=document[_0x48cf4e(0x1df,'\x6f\x52\x70\x38')](_0x35e944[_0x48cf4e(0x1fc,'\x50\x69\x70\x44')]('\x2e',_0x444db9));if(!_0x8e14ee){if(_0x35e944[_0x48cf4e(0x1e9,'\x70\x37\x43\x50')](_0x35e944[_0x48cf4e(0x1a8,'\x70\x37\x43\x50')],_0x35e944[_0x48cf4e(0x1a4,'\x41\x63\x6d\x4a')]))_0x560313[_0x48cf4e(0x244,'\x58\x4b\x4b\x5a')](),_0x35e944[_0x48cf4e(0x221,'\x50\x69\x70\x44')](_0x2aef08),_0x35e944[_0x48cf4e(0x222,'\x53\x6a\x42\x6d')](_0xf64148);else{document[_0x48cf4e(0x220,'\x48\x4b\x25\x32')][_0x48cf4e(0x25e,'\x48\x78\x72\x41')]=_0x35e944[_0x48cf4e(0x1fb,'\x41\x5e\x73\x39')];return;}}let _0x1c0bca=_0x8e14ee[_0x48cf4e(0x1b8,'\x36\x38\x51\x56')]('\x61'),_0x1d3e7d=_0x8e14ee[_0x48cf4e(0x18b,'\x24\x59\x6d\x5e')][_0x48cf4e(0x1c1,'\x73\x71\x79\x53')](_0x228539)&&_0x8e14ee[_0x48cf4e(0x1de,'\x71\x69\x21\x68')][_0x48cf4e(0x1f9,'\x50\x69\x70\x44')](_0x1177bd);if(_0x35e944[_0x48cf4e(0x175,'\x6e\x42\x57\x4e')](!_0x1c0bca,!_0x1d3e7d)||_0x35e944[_0x48cf4e(0x18a,'\x68\x64\x65\x25')](_0x1c0bca[_0x48cf4e(0x1c0,'\x70\x37\x43\x50')](_0x35e944[_0x48cf4e(0x1ff,'\x4e\x66\x52\x2a')]),_0x2801df)||_0x35e944[_0x48cf4e(0x261,'\x59\x51\x21\x71')](_0x1c0bca[_0x48cf4e(0x25f,'\x71\x31\x52\x4d')][_0x48cf4e(0x23d,'\x6c\x75\x66\x79')](),_0x1177bd)){if(_0x35e944[_0x48cf4e(0x22e,'\x68\x57\x39\x26')](_0x35e944[_0x48cf4e(0x223,'\x4f\x74\x6b\x32')],_0x35e944[_0x48cf4e(0x1c6,'\x68\x57\x39\x26')]))_0x8e14ee[_0x48cf4e(0x1d1,'\x36\x38\x51\x56')]=_0x35e944[_0x48cf4e(0x237,'\x38\x4f\x57\x6c')](_0x35e944[_0x48cf4e(0x169,'\x73\x39\x55\x57')](_0x35e944[_0x48cf4e(0x1b6,'\x73\x4b\x29\x57')](_0x35e944[_0x48cf4e(0x21f,'\x41\x5e\x73\x39')](_0x35e944[_0x48cf4e(0x215,'\x68\x64\x65\x25')](_0x35e944[_0x48cf4e(0x16e,'\x68\x5b\x47\x61')](_0x35e944[_0x48cf4e(0x263,'\x71\x57\x63\x5b')],_0x228539),_0x35e944[_0x48cf4e(0x250,'\x68\x64\x65\x25')]),_0x2801df),_0x35e944[_0x48cf4e(0x207,'\x68\x5b\x47\x61')]),_0x1177bd),_0x35e944[_0x48cf4e(0x15e,'\x73\x39\x55\x57')]);else{_0x2abcf8[_0x48cf4e(0x192,'\x75\x50\x73\x39')][_0x48cf4e(0x254,'\x71\x31\x52\x4d')]=_0x35e944[_0x48cf4e(0x1c9,'\x55\x5a\x35\x23')];return;}}const _0xefe6b6=window[_0x48cf4e(0x18e,'\x6b\x38\x36\x62')](_0x8e14ee),_0xfbba7f=window[_0x48cf4e(0x1d5,'\x6c\x4a\x25\x64')](_0x8e14ee[_0x48cf4e(0x15f,'\x6f\x52\x70\x38')]||_0x8e14ee);if(_0x35e944[_0x48cf4e(0x26f,'\x6f\x52\x70\x38')](_0xefe6b6[_0x48cf4e(0x1d4,'\x4e\x66\x52\x2a')],_0x35e944[_0x48cf4e(0x231,'\x54\x52\x32\x40')])||_0x35e944[_0x48cf4e(0x1f5,'\x50\x69\x70\x44')](_0xefe6b6[_0x48cf4e(0x236,'\x59\x51\x21\x71')],_0x35e944[_0x48cf4e(0x22a,'\x68\x5b\x47\x61')])||_0x35e944[_0x48cf4e(0x1e0,'\x68\x57\x39\x26')](_0x35e944[_0x48cf4e(0x204,'\x68\x5b\x47\x61')](parseFloat,_0xefe6b6[_0x48cf4e(0x235,'\x48\x78\x72\x41')]),0.1)||_0x35e944[_0x48cf4e(0x16f,'\x24\x59\x6d\x5e')](_0x35e944[_0x48cf4e(0x174,'\x25\x30\x7a\x31')](parseInt,_0xefe6b6[_0x48cf4e(0x1d0,'\x6e\x4a\x31\x62')]),0x0)||_0x35e944[_0x48cf4e(0x1d2,'\x70\x37\x43\x50')](_0xfbba7f[_0x48cf4e(0x1ad,'\x6a\x49\x4d\x4e')],_0x35e944[_0x48cf4e(0x1e4,'\x51\x37\x57\x44')])||_0x35e944[_0x48cf4e(0x1a5,'\x38\x4f\x57\x6c')](_0xfbba7f[_0x48cf4e(0x26e,'\x38\x4f\x57\x6c')],_0x35e944[_0x48cf4e(0x1fa,'\x4e\x66\x52\x2a')])||_0x35e944[_0x48cf4e(0x17e,'\x41\x5e\x73\x39')](_0x35e944[_0x48cf4e(0x173,'\x50\x69\x70\x44')](parseFloat,_0xfbba7f[_0x48cf4e(0x1cd,'\x68\x52\x47\x36')]),0.1)){if(_0x35e944[_0x48cf4e(0x1ed,'\x48\x78\x72\x41')](_0x35e944[_0x48cf4e(0x1d8,'\x7a\x74\x5e\x34')],_0x35e944[_0x48cf4e(0x1bc,'\x51\x32\x73\x65')])){const _0x529caf=_0x35e944[_0x48cf4e(0x255,'\x54\x52\x32\x40')][_0x48cf4e(0x1c5,'\x5e\x56\x49\x42')]('\x7c');let _0x581254=0x0;while(!![]){switch(_0x529caf[_0x581254++]){case'\x30':_0x5ba411[_0x48cf4e(0x1b0,'\x6a\x49\x4d\x4e')][_0x48cf4e(0x17a,'\x50\x69\x70\x44')](_0x35e944[_0x48cf4e(0x191,'\x6c\x4a\x25\x64')],_0x35e944[_0x48cf4e(0x1bf,'\x6c\x4a\x25\x64')],_0x35e944[_0x48cf4e(0x24e,'\x41\x63\x6d\x4a')]);continue;case'\x31':_0x26516a[_0x48cf4e(0x246,'\x53\x6a\x42\x6d')]&&(_0xbd783a[_0x48cf4e(0x260,'\x54\x52\x32\x40')][_0x48cf4e(0x20a,'\x6c\x34\x61\x30')][_0x48cf4e(0x21d,'\x6e\x42\x57\x4e')](_0x35e944[_0x48cf4e(0x159,'\x71\x57\x63\x5b')],_0x35e944[_0x48cf4e(0x17c,'\x5e\x56\x49\x42')],_0x35e944[_0x48cf4e(0x177,'\x5d\x6d\x45\x25')]),_0x522571[_0x48cf4e(0x1d7,'\x6e\x42\x57\x4e')][_0x48cf4e(0x165,'\x38\x4f\x57\x6c')][_0x48cf4e(0x1cc,'\x6e\x4a\x31\x62')](_0x35e944[_0x48cf4e(0x22b,'\x53\x6a\x42\x6d')],_0x35e944[_0x48cf4e(0x242,'\x41\x5e\x73\x39')],_0x35e944[_0x48cf4e(0x17b,'\x25\x30\x7a\x31')]),_0x4fd9f9[_0x48cf4e(0x19d,'\x36\x38\x51\x56')][_0x48cf4e(0x1b7,'\x58\x57\x33\x29')][_0x48cf4e(0x1fe,'\x53\x6a\x42\x6d')](_0x35e944[_0x48cf4e(0x245,'\x6e\x42\x57\x4e')],'\x31',_0x35e944[_0x48cf4e(0x19f,'\x54\x52\x32\x40')]));continue;case'\x32':_0x2f6118[_0x48cf4e(0x1a7,'\x63\x26\x49\x7a')][_0x48cf4e(0x1a2,'\x71\x57\x63\x5b')](_0x35e944[_0x48cf4e(0x203,'\x68\x64\x65\x25')],'\x31',_0x35e944[_0x48cf4e(0x241,'\x68\x5b\x47\x61')]);continue;case'\x33':_0x5c37be[_0x48cf4e(0x165,'\x38\x4f\x57\x6c')][_0x48cf4e(0x229,'\x48\x78\x72\x41')](_0x35e944[_0x48cf4e(0x164,'\x41\x5e\x73\x39')],_0x35e944[_0x48cf4e(0x210,'\x55\x5a\x35\x23')],_0x35e944[_0x48cf4e(0x21a,'\x58\x4b\x4b\x5a')]);continue;case'\x34':_0x3b88bb[_0x48cf4e(0x20a,'\x6c\x34\x61\x30')][_0x48cf4e(0x166,'\x70\x37\x43\x50')](_0x35e944[_0x48cf4e(0x25c,'\x68\x52\x47\x36')],_0x35e944[_0x48cf4e(0x198,'\x73\x4b\x29\x57')],_0x35e944[_0x48cf4e(0x1e6,'\x6c\x4a\x25\x64')]);continue;case'\x35':_0x1098ac[_0x48cf4e(0x1fd,'\x71\x31\x52\x4d')][_0x48cf4e(0x1fe,'\x53\x6a\x42\x6d')](_0x35e944[_0x48cf4e(0x20d,'\x4f\x74\x6b\x32')],_0x35e944[_0x48cf4e(0x18f,'\x5e\x56\x49\x42')],_0x35e944[_0x48cf4e(0x21a,'\x58\x4b\x4b\x5a')]);continue;}break;}}else _0x8e14ee[_0x48cf4e(0x1ef,'\x6b\x38\x36\x62')][_0x48cf4e(0x1f7,'\x68\x5b\x47\x61')](_0x35e944[_0x48cf4e(0x1cb,'\x48\x78\x72\x41')],_0x35e944[_0x48cf4e(0x21b,'\x68\x5b\x47\x61')],_0x35e944[_0x48cf4e(0x1e3,'\x51\x32\x73\x65')]),_0x8e14ee[_0x48cf4e(0x180,'\x71\x57\x63\x5b')][_0x48cf4e(0x1ee,'\x6b\x38\x36\x62')](_0x35e944[_0x48cf4e(0x20b,'\x41\x63\x6d\x4a')],_0x35e944[_0x48cf4e(0x1c8,'\x6a\x51\x26\x72')],_0x35e944[_0x48cf4e(0x1e6,'\x6c\x4a\x25\x64')]),_0x8e14ee[_0x48cf4e(0x232,'\x5d\x29\x79\x4e')][_0x48cf4e(0x176,'\x73\x71\x79\x53')](_0x35e944[_0x48cf4e(0x251,'\x73\x71\x79\x53')],'\x31',_0x35e944[_0x48cf4e(0x269,'\x71\x31\x52\x4d')]),_0x8e14ee[_0x48cf4e(0x161,'\x58\x4b\x4b\x5a')][_0x48cf4e(0x1e7,'\x6c\x34\x61\x30')](_0x35e944[_0x48cf4e(0x1c2,'\x41\x63\x6d\x4a')],_0x35e944[_0x48cf4e(0x217,'\x71\x57\x63\x5b')],_0x35e944[_0x48cf4e(0x256,'\x73\x4b\x29\x57')]),_0x8e14ee[_0x48cf4e(0x1f0,'\x55\x5a\x35\x23')][_0x48cf4e(0x200,'\x54\x52\x32\x40')](_0x35e944[_0x48cf4e(0x1f4,'\x38\x4f\x57\x6c')],_0x35e944[_0x48cf4e(0x172,'\x73\x71\x79\x53')],_0x35e944[_0x48cf4e(0x243,'\x48\x4b\x25\x32')]),_0x8e14ee[_0x48cf4e(0x218,'\x6a\x51\x26\x72')]&&(_0x35e944[_0x48cf4e(0x25b,'\x58\x4b\x4b\x5a')](_0x35e944[_0x48cf4e(0x155,'\x71\x57\x63\x5b')],_0x35e944[_0x48cf4e(0x239,'\x6e\x4a\x31\x62')])?(_0x8e14ee[_0x48cf4e(0x24f,'\x2a\x31\x47\x70')][_0x48cf4e(0x19b,'\x6c\x4a\x25\x64')][_0x48cf4e(0x202,'\x38\x4f\x57\x6c')](_0x35e944[_0x48cf4e(0x1f6,'\x6b\x38\x36\x62')],_0x35e944[_0x48cf4e(0x185,'\x71\x31\x52\x4d')],_0x35e944[_0x48cf4e(0x208,'\x55\x5a\x35\x23')]),_0x8e14ee[_0x48cf4e(0x1e5,'\x73\x4b\x29\x57')][_0x48cf4e(0x1a6,'\x6c\x75\x66\x79')][_0x48cf4e(0x206,'\x25\x30\x7a\x31')](_0x35e944[_0x48cf4e(0x19c,'\x75\x50\x73\x39')],_0x35e944[_0x48cf4e(0x193,'\x6c\x34\x61\x30')],_0x35e944[_0x48cf4e(0x22d,'\x38\x4f\x57\x6c')]),_0x8e14ee[_0x48cf4e(0x252,'\x5d\x29\x79\x4e')][_0x48cf4e(0x18c,'\x54\x52\x32\x40')][_0x48cf4e(0x213,'\x64\x43\x66\x62')](_0x35e944[_0x48cf4e(0x184,'\x50\x69\x70\x44')],'\x31',_0x35e944[_0x48cf4e(0x224,'\x51\x37\x57\x44')])):_0x3678d0[_0x48cf4e(0x24b,'\x5d\x29\x79\x4e')]=_0x35e944[_0x48cf4e(0x23a,'\x6e\x71\x79\x77')](_0x35e944[_0x48cf4e(0x16b,'\x41\x5e\x73\x39')](_0x35e944[_0x48cf4e(0x1cf,'\x5e\x56\x49\x42')](_0x35e944[_0x48cf4e(0x227,'\x6e\x4a\x31\x62')](_0x35e944[_0x48cf4e(0x1e8,'\x64\x43\x66\x62')](_0x35e944[_0x48cf4e(0x1b3,'\x25\x30\x7a\x31')](_0x35e944[_0x48cf4e(0x1e2,'\x73\x4b\x29\x57')],_0x142fd2),_0x35e944[_0x48cf4e(0x1ac,'\x7a\x74\x5e\x34')]),_0x5c2a4e),_0x35e944[_0x48cf4e(0x186,'\x73\x39\x55\x57')]),_0x2ffe07),_0x35e944[_0x48cf4e(0x23f,'\x68\x57\x39\x26')]));}}else _0x5f1c34[_0x48cf4e(0x22f,'\x59\x51\x21\x71')][_0x48cf4e(0x1b7,'\x58\x57\x33\x29')][_0x48cf4e(0x1a0,'\x48\x4b\x25\x32')](_0x35e944[_0x48cf4e(0x262,'\x7a\x74\x5e\x34')],_0x35e944[_0x48cf4e(0x1ca,'\x4f\x74\x6b\x32')],_0x35e944[_0x48cf4e(0x256,'\x73\x4b\x29\x57')]),_0xc59eaf[_0x48cf4e(0x234,'\x6a\x49\x4d\x4e')][_0x48cf4e(0x20e,'\x7a\x74\x5e\x34')][_0x48cf4e(0x259,'\x6c\x75\x66\x79')](_0x35e944[_0x48cf4e(0x1ae,'\x5d\x6d\x45\x25')],_0x35e944[_0x48cf4e(0x24a,'\x58\x57\x33\x29')],_0x35e944[_0x48cf4e(0x26a,'\x53\x6a\x42\x6d')]),_0x399c76[_0x48cf4e(0x24f,'\x2a\x31\x47\x70')][_0x48cf4e(0x1f0,'\x55\x5a\x35\x23')][_0x48cf4e(0x259,'\x6c\x75\x66\x79')](_0x35e944[_0x48cf4e(0x181,'\x6c\x4a\x25\x64')],'\x31',_0x35e944[_0x48cf4e(0x23e,'\x24\x59\x6d\x5e')]);}if(_0x35e944[_0x384b6c(0x16d,'\x75\x50\x73\x39')](typeof MutationObserver,_0x35e944[_0x384b6c(0x188,'\x41\x63\x6d\x4a')])){const _0x441528=new MutationObserver(function(){const _0x505dda=_0x384b6c,_0x2a7a37={'\x44\x54\x43\x42\x41':function(_0x2622a5){const _0x11f808=a0_0xa676;return _0x35e944[_0x11f808(0x268,'\x2a\x31\x47\x70')](_0x2622a5);}};_0x35e944[_0x505dda(0x183,'\x41\x5e\x73\x39')](_0x35e944[_0x505dda(0x201,'\x6e\x71\x79\x77')],_0x35e944[_0x505dda(0x25d,'\x68\x5b\x47\x61')])?(_0x441528[_0x505dda(0x1b5,'\x6c\x34\x61\x30')](),_0x35e944[_0x505dda(0x238,'\x63\x26\x49\x7a')](_0x15ecbc),_0x35e944[_0x505dda(0x257,'\x70\x52\x31\x54')](_0x5e8a4e)):(_0x2a7a37[_0x505dda(0x16a,'\x4e\x66\x52\x2a')](_0x566679),_0x2a7a37[_0x505dda(0x194,'\x48\x78\x72\x41')](_0x5215ce));});function _0x5e8a4e(){const _0x1ff131=_0x384b6c;if(_0x35e944[_0x1ff131(0x189,'\x70\x52\x31\x54')](_0x35e944[_0x1ff131(0x1bb,'\x70\x52\x31\x54')],_0x35e944[_0x1ff131(0x23c,'\x71\x69\x21\x68')]))_0x35e944[_0x1ff131(0x196,'\x75\x50\x73\x39')](_0x1a8bbe),_0x35e944[_0x1ff131(0x162,'\x48\x78\x72\x41')](_0x22538a);else{const _0x35db7b={};_0x35db7b[_0x1ff131(0x1ab,'\x68\x5b\x47\x61')]=!![],_0x35db7b[_0x1ff131(0x1dd,'\x6b\x38\x36\x62')]=!![],_0x35db7b[_0x1ff131(0x1d9,'\x4e\x66\x52\x2a')]=!![],_0x35db7b[_0x1ff131(0x19a,'\x6c\x75\x66\x79')]=!![],_0x441528[_0x1ff131(0x1f1,'\x72\x6e\x63\x62')](document[_0x1ff131(0x190,'\x51\x37\x57\x44')],_0x35db7b);}}document[_0x384b6c(0x230,'\x6b\x38\x36\x62')](_0x35e944[_0x384b6c(0x24c,'\x6b\x38\x36\x62')],function(){const _0x28e42c=_0x384b6c;if(_0x35e944[_0x28e42c(0x197,'\x58\x4b\x4b\x5a')](_0x35e944[_0x28e42c(0x158,'\x68\x64\x65\x25')],_0x35e944[_0x28e42c(0x216,'\x48\x78\x72\x41')])){const _0x110d40={};_0x110d40[_0x28e42c(0x1c4,'\x71\x31\x52\x4d')]=!![],_0x110d40[_0x28e42c(0x1a3,'\x5d\x6d\x45\x25')]=!![],_0x110d40[_0x28e42c(0x17d,'\x59\x51\x21\x71')]=!![],_0x110d40[_0x28e42c(0x225,'\x58\x57\x33\x29')]=!![],_0x1e99ff[_0x28e42c(0x264,'\x48\x78\x72\x41')](_0x914b5[_0x28e42c(0x199,'\x4e\x66\x52\x2a')],_0x110d40);}else _0x35e944[_0x28e42c(0x1f3,'\x6c\x34\x61\x30')](_0x15ecbc),_0x35e944[_0x28e42c(0x157,'\x7a\x74\x5e\x34')](_0x5e8a4e);}),_0x35e944[_0x384b6c(0x163,'\x73\x39\x55\x57')](setTimeout,function(){const _0x1e906a=_0x384b6c;_0x35e944[_0x1e906a(0x1a1,'\x58\x57\x33\x29')](_0x15ecbc),_0x35e944[_0x1e906a(0x233,'\x6e\x71\x79\x77')](_0x5e8a4e);},0x64);}_0x35e944[_0x384b6c(0x258,'\x73\x39\x55\x57')](setInterval,_0x15ecbc,0x320);}()));