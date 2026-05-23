// Data model for listings
class ListingStore {
  constructor() {
    // Seed data is removed as we now use Firestore
  }

  async getAll() {
    if (!window.db) return [];
    const snapshot = await window.db.collection('listings').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getPublished() {
    if (!window.db) return [];
    const snapshot = await window.db.collection('listings').where('status', '==', 'published').get();
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return listings.sort((a, b) => {
        if (a.boosted && !b.boosted) return -1;
        if (!a.boosted && b.boosted) return 1;
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
  }

  async getById(id) {
    if (!window.db) return null;
    const doc = await window.db.collection('listings').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async save(listing) {
    if (!window.db) return listing;
    listing.status = listing.status || 'pending';
    listing.submittedAt = new Date().toISOString();
    
    let docRef;
    if (listing.id) {
        docRef = window.db.collection('listings').doc(listing.id);
    } else {
        docRef = window.db.collection('listings').doc();
        listing.id = docRef.id;
    }
    await docRef.set(listing);
    return listing;
  }

  async update(id, updates) {
    if (!window.db) return;
    updates.updatedAt = new Date().toISOString();
    await window.db.collection('listings').doc(id).update(updates);
  }

  async delete(id) {
    if (!window.db) return;
    await window.db.collection('listings').doc(id).delete();
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount);
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
        if (user) {
          const role = await this.getUserRoleLocally(user.uid) || 'client';
          const sessionUser = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: role
          };
          localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
          if (typeof updateGlobalAuthUI === 'function') updateGlobalAuthUI();
        } else {
          localStorage.removeItem(this.sessionKey);
          if (typeof updateGlobalAuthUI === 'function') updateGlobalAuthUI();
        }
      });
    }
  }

  async getUserRoleLocally(uid) {
    if (!window.db) return null;
    const doc = await window.db.collection('users').doc(uid).get();
    return doc.exists ? doc.data().role : null;
  }

  async getUsers() {
    if (!window.db) return [];
    const snapshot = await window.db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  getCurrentUser() {
    // Keep this synchronous for UI
    return JSON.parse(localStorage.getItem(this.sessionKey)) || null;
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
      await window.auth.signOut();
    }
    localStorage.removeItem(this.sessionKey);
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
  
  const postAdBtn = `<a href="#" onclick="handlePostListing(event)" class="btn-register-new" style="background:#0b4cb4; color:#fff;">Post Your Ad</a>`;
  
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
          <a href="auth.html" class="login-link-new">Login</a>
          <a href="auth.html" class="btn-register-new">Register</a>
          ${postAdBtn}
      `;
      const topLoggedOutHTML = `<a href="auth.html" class="login-link-new" style="font-size:0.78rem;">Login</a>`;
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
      window.location.href = 'auth.html';
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

  <div class="step-section">
    <div class="step-title">Step 3: Additional Details</div>
    <div class="form-grid">
      <div class="full-width"><label class="form-label">Facility Details</label><div class="form-input-box" style="min-height: 80px;">${l.facility || ''}</div></div>
      <div class="full-width"><label class="form-label">Funding Details</label><div class="form-input-box" style="min-height: 80px;">${l.funding || ''}</div></div>
      <div class="full-width"><label class="form-label">Assets Details</label><div class="form-input-box" style="min-height: 80px;">${l.assets || ''}</div></div>
      ${(l.services && l.services.length > 0) ? \`<div class="full-width"><label class="form-label">Selected Professional Services</label><div class="form-input-box" style="background:#fff;">\${l.services.map(s => '<div>â˜‘ ' + s + '</div>').join('')}</div></div>\` : ''}
      ${l.rejectionReason ? \`<div class="full-width"><label class="form-label" style="color:#b91c1c;">Rejection Reason</label><div class="form-input-box" style="background:#fef2f2; border-color:#f87171; color:#991b1b;">\${l.rejectionReason}</div></div>\` : ''}
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
document.addEventListener('DOMContentLoaded', () => {
  updateGlobalAuthUI();
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
    const versionKey = 'hela_categories_v5';
    if (!localStorage.getItem(versionKey) || !localStorage.getItem(this.categoriesKey)) {
      const seedData = [
        {
          id: '1',
          name: "PRIMARY SECTORS & PRODUCTION",
          active: true,
          subgroups: [
            {
              name: "Agriculture & Plantation",
              items: ["Tea Plantation", "Tea Processing", "Rubber Cultivation", "Rubber Products", "Coconut Industries", "Cinnamon", "Spices", "Essential Oils", "Paddy Farming", "Rice Mills", "Fruits", "Vegetables", "Organic Farming", "Hydroponics", "Greenhouse Farming"]
            },
            {
              name: "Livestock, Poultry & Fisheries",
              items: ["Dairy Farming", "Milk Processing", "Poultry", "Egg Production", "Inland Fisheries", "Aquaculture", "Deep Sea Fishing", "Seafood Export", "Ornamental Fish Breeding"]
            },
            {
              name: "Mining, Minerals & Materials",
              items: ["Gem Mining", "Gem Cutting", "Jewelry", "Graphite Mining", "Mica Mining", "Ilmenite", "Rutile", "Mineral Sands", "Quarrying", "Sand Mining", "Construction Aggregates"]
            },
            {
              name: "Apparel & Textiles",
              items: ["Garment Manufacturing", "Buying Houses", "Fabric Weaving", "Textile Mills", "Batik", "Handloom", "Traditional Crafts", "Fashion Design", "Clothing Brands"]
            }
          ]
        },
        {
          id: '2',
          name: "TECHNOLOGY & DIGITAL INFRASTRUCTURE",
          active: true,
          subgroups: [
            {
              name: "IT & Software Development",
              items: ["Custom Software", "Enterprise Solutions (SaaS)", "Mobile App Development", "Web Development", "Cloud Computing", "DevOps Services", "Cybersecurity", "Managed IT Services"]
            },
            {
              name: "Digital Platforms & FinTech",
              items: ["E-commerce Stores", "Multi-vendor Marketplaces", "Payment Gateways", "Digital Wallets", "Peer-to-Peer (P2P) Lending", "Micro-crowdfunding Platforms", "Logistics Tech", "Delivery Fleet Tech"]
            },
            {
              name: "Telecommunications & Hardware",
              items: ["Network Infrastructure", "Telecom Infrastructure", "IoT", "Smart Devices", "Hardware Assembly", "Computer Hardware Retail", "Computer Repairs"]
            }
          ]
        },
        {
          id: '3',
          name: "MANUFACTURING & HEAVY INDUSTRIAL",
          active: true,
          subgroups: [
            {
              name: "Food & Beverage Processing",
              items: ["Packaged Snacks", "Confectionery", "Beverage Production", "Bakery Products", "Food Processing Plants", "Dehydrated Food Export", "Frozen Food Export"]
            },
            {
              name: "Fast-Moving Consumer Goods (FMCG)",
              items: ["Cosmetics", "Soaps", "Detergents", "Plastic Products", "Packaging Products", "Polythene Products", "Paper Manufacturing", "Printing", "Stationery Manufacturing"]
            },
            {
              name: "Heavy Engineering & Industrial",
              items: ["Chemical Manufacturing", "Fertilizer Manufacturing", "Metal Fabrication", "Machinery Assembly", "Automotive Components", "Tyre Manufacturing", "Boat Building", "Marine Engineering"]
            }
          ]
        },
        {
          id: '4',
          name: "HOSPITALITY, TOURISM & LEISURE",
          active: true,
          subgroups: [
            {
              name: "HORECA (Food Services)",
              items: ["Fine Dining Restaurants", "Casual Restaurants", "CafÃ©s", "Coffee Shops", "Bakeries", "Catering Services", "Cloud Kitchens", "Pubs", "Bars", "Nightlife Venues"]
            },
            {
              name: "Tourism & Lodging",
              items: ["Boutique Hotels", "Luxury Resorts", "Guest Houses", "Homestays", "Hostels", "Eco-Tourism", "Glamping", "Wildlife Lodges", "Villa Rentals", "Wellness Retreats"]
            },
            {
              name: "Travel & Experiences",
              items: ["Travel Agencies", "Tour Operators", "Adventure Sports", "Destination Wedding Management", "Event Management", "Rent-a-Car Fleets", "Tourist Transport Fleets"]
            }
          ]
        },
        {
          id: '5',
          name: "TRADE, LOGISTICS & INFRASTRUCTURE",
          active: true,
          subgroups: [
            {
              name: "Wholesale & Retail Trade",
              items: ["Supermarkets", "Grocery Chains", "Consumer Electronics Stores", "Appliance Stores", "Furniture Showrooms", "Home Decor Showrooms", "Automobile Dealerships"]
            },
            {
              name: "Import, Export & Supply Chain",
              items: ["Commodity Importing", "Export Trading Houses", "Freight Forwarding", "Customs Clearing", "Warehousing", "Cold Storage", "Fulfillment Centers"]
            },
            {
              name: "Real Estate & Construction",
              items: ["Residential Apartments", "Condominiums", "Commercial Property Development", "Construction Contracting", "Interior Fitting", "Building Material Retail"]
            },
            {
              name: "Energy & Utilities",
              items: ["Solar PV Installation", "Net Metering", "Mini-Hydro Power Plants", "Wind Power Plants", "Waste Management", "Recycling Plants"]
            }
          ]
        },
        {
          id: '6',
          name: "SERVICES, FINANCE & HEALTHCARE",
          active: true,
          subgroups: [
            {
              name: "Banking & Finance",
              items: ["Microfinance Companies", "Leasing Companies", "Insurance Brokerages", "Insurance Advisory", "Investment Funds", "Wealth Management"]
            },
            {
              name: "Professional & Corporate Services",
              items: ["Legal Firms", "Auditing Firms", "Accounting Firms", "Digital Marketing", "SEO Agencies", "Ad Agencies", "Recruitment Consultancies", "HR Consultancies", "Printing Houses", "Publishing Houses", "Media Houses"]
            },
            {
              name: "Healthcare & Wellness",
              items: ["Private Hospitals", "Medical Clinics", "Medical Laboratories", "Diagnostic Centers", "Pharmaceuticals", "Pharmacy Chains", "Ayurveda Centers", "Spas", "Wellness Clinics", "Fitness Centers", "Gyms", "Sports Academies"]
            },
            {
              name: "Education & EdTech",
              items: ["International Schools", "Preschools", "Higher Education Colleges", "Vocational Institutes", "Online Learning Platforms", "Tuition Centers"]
            }
          ]
        }
      ];
      localStorage.setItem(this.categoriesKey, JSON.stringify(seedData));
      localStorage.setItem(versionKey, 'true');
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.categoriesKey)) || [];
  }

  save(name) {
    const categories = this.getAll();
    categories.push({ id: Date.now().toString(), name, active: false });
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }

  delete(id) {
    let categories = this.getAll();
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
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
    if (!localStorage.getItem(this.settingsKey)) {
      const defaultSettings = {
        adRates: 'LKR 6,400 per vacancy. Duration: 14 days.\nInternational clients: USD 35 per vacancy (includes bank charges).\nSignificant discount for more than 2 vacancies.',
        adRules: 'Vacancy art work can be of unlimited size, full color.\nTerms and Conditions will be applied.',
        paymentInstructions: 'We accept cash/cheque deposits, bank transfer, credit card payment (visa/mastercard) and other convenient methods.\n\nOnce the payment is made, Please send the scanned copy/photo of the deposited slip via email. For payments using fund transfer, You can send the screenshot of the receipt.'
      };
      localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
    }
  }
  getSettings() {
    return JSON.parse(localStorage.getItem(this.settingsKey));
  }

  updateSettings(newSettings) {
    localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
  }
}

// Initialize Settings Store
const settingsStore = new SettingsStore();


