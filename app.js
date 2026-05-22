// Data model for listings
class ListingStore {
  constructor() {
    this.listingsKey = 'hela_listings';
    this.initSeedData();
  }

  // Seed data if empty
  initSeedData() {
    if (!localStorage.getItem(this.listingsKey)) {
      const seedData = [
        {
          id: '1',
          businessName: 'Ceylon Organic Farms',
          shortDescription: 'Export-oriented organic farm seeking expansion capital.',
          fullDescription: 'We are a certified organic farm producing spices and coconut products for European markets. We need investment to upgrade our processing facility.',
          investmentRequired: 15000000,
          minimumInvestment: 5000000,
          industry: 'Agriculture',
          businessStage: 'Expansion',
          district: 'Kurunegala',
          contactName: 'Nimal Perera',
          phone: '0771234567',
          email: 'nimal@ceylonorganic.lk',
          status: 'published',
          images: []
        },
        {
          id: '2',
          businessName: 'TechHub Colombo',
          shortDescription: 'SaaS startup providing HR solutions for SMEs.',
          fullDescription: 'Growing SaaS platform with 50+ active B2B clients. Raising seed round for marketing and adding AI features.',
          investmentRequired: 25000000,
          minimumInvestment: 10000000,
          industry: 'Technology',
          businessStage: 'Startup',
          district: 'Colombo',
          contactName: 'Sarah Silva',
          phone: '0719876543',
          email: 'sarah@techhub.lk',
          status: 'published',
          images: []
        },
        {
          id: '3',
          businessName: 'Lanka Heritage Stays',
          shortDescription: 'Boutique hotel chain in southern coast.',
          fullDescription: 'Operating 3 boutique properties. Looking for a partner to acquire a new beachfront property in Mirissa.',
          investmentRequired: 50000000,
          minimumInvestment: 50000000,
          industry: 'Hotels & Resorts',
          businessStage: 'Operating',
          district: 'Galle',
          contactName: 'Ruwan de Silva',
          phone: '0765554433',
          email: 'ruwan@heritage.lk',
          status: 'published',
          images: []
        }
      ];
      localStorage.setItem(this.listingsKey, JSON.stringify(seedData));
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.listingsKey)) || [];
  }

  getPublished() {
    return this.getAll().filter(l => l.status === 'published').sort((a, b) => {
        if (a.boosted && !b.boosted) return -1;
        if (!a.boosted && b.boosted) return 1;
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
  }

  getById(id) {
    return this.getAll().find(l => l.id === id);
  }

  save(listing) {
    const listings = this.getAll();
    listing.id = listing.id || Date.now().toString();
    listing.status = listing.status || 'pending';
    listing.submittedAt = new Date().toISOString();
    listings.push(listing);
    localStorage.setItem(this.listingsKey, JSON.stringify(listings));
    return listing;
  }

  update(id, updates) {
    let listings = this.getAll();
    const index = listings.findIndex(l => l.id === id);
    if (index !== -1) {
      listings[index] = { ...listings[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.listingsKey, JSON.stringify(listings));
    }
  }

  delete(id) {
    let listings = this.getAll();
    listings = listings.filter(l => l.id !== id);
    localStorage.setItem(this.listingsKey, JSON.stringify(listings));
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount);
  }
}

const store = new ListingStore();

// Utility for formatting LKR in UI
function formatLKR(amount) {
  return store.formatCurrency(amount);
}

// ----------------------------------------------------------------------------
// Authentication Store
// ----------------------------------------------------------------------------
class AuthStore {
  constructor() {
    this.usersKey = 'hela_users';
    this.sessionKey = 'hela_session';
    this.initFirebaseAuthListener();
  }

  initFirebaseAuthListener() {
    if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          const sessionUser = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: this.getUserRoleLocally(user.uid) || 'client'
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

  getUserRoleLocally(uid) {
    const users = this.getUsers();
    const user = users.find(u => u.id === uid);
    return user ? user.role : null;
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(this.usersKey)) || [];
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.sessionKey)) || null;
  }

  async register(name, email, password, role) {
    if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: name });
      
      const users = this.getUsers();
      const newUser = { id: user.uid, name, email, role };
      if (!users.find(u => u.id === user.uid)) {
        users.push(newUser);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
      }
      return newUser;
    } else {
      const users = this.getUsers();
      if (users.find(u => u.email === email)) {
        throw new Error("Email already registered");
      }
      const newUser = { id: Date.now().toString(), name, email, password, role };
      users.push(newUser);
      localStorage.setItem(this.usersKey, JSON.stringify(users));
      return newUser;
    }
  }

  async login(email, password) {
    if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } else {
      const users = this.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error("Invalid credentials");
      }
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
      return user;
    }
  }

  async loginWithGoogle(role = 'client') {
    if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await firebase.auth().signInWithPopup(provider);
      const user = userCredential.user;
      
      const users = this.getUsers();
      if (!users.find(u => u.id === user.uid)) {
        users.push({
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: role
        });
        localStorage.setItem(this.usersKey, JSON.stringify(users));
      }
      return user;
    } else {
      const user = {
        id: 'g_' + Date.now().toString(),
        name: 'Google User',
        email: 'user@gmail.com',
        role: role
      };
      const users = this.getUsers();
      if (!users.find(u => u.email === user.email)) {
        users.push(user);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
      }
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
      return user;
    }
  }

  async logout() {
    if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
      await firebase.auth().signOut();
    } else {
      localStorage.removeItem(this.sessionKey);
    }
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

function logoutUser(e) {
  if (e) e.preventDefault();
  authStore.logout();
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
      window.location.href = 'submit.html';
  }
}

// --- PDF Generation ---
function generateListingPDF(listingId) {
  const l = store.getById(listingId);
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
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; font-size: 14px; }
  .pdf-header { text-align: center; border-bottom: 3px solid #003399; padding-bottom: 20px; margin-bottom: 30px; }
  .pdf-header h1 { color: #003399; font-size: 28px; margin-bottom: 5px; }
  .pdf-header h1 span { color: #cc9900; }
  .pdf-header p { color: #666; font-size: 12px; }
  .pdf-meta { display: flex; justify-content: space-between; background: #f4f6f9; padding: 15px; border-radius: 4px; margin-bottom: 25px; border-left: 4px solid #003399; }
  .pdf-meta div { font-size: 13px; }
  .pdf-meta strong { color: #003399; }
  .section-title { color: #003399; font-size: 16px; font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin: 25px 0 15px; }
  .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .detail-table td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  .detail-table td:first-child { font-weight: 600; color: #555; width: 200px; }
  .detail-table td:last-child { color: #111; }
  .desc-block { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; white-space: pre-line; line-height: 1.6; }
  .pdf-footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 15px; }
  .status-label { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-published { background: #d4edda; color: #155724; }
  .status-rejected { background: #f8d7da; color: #721c24; }
  .status-expired { background: #e2e3e5; color: #383d41; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="pdf-header">
    <h1>Hela<span>Invest</span></h1>
    <p>Business Listing & Investment Platform — Sri Lanka</p>
  </div>

  <div class="pdf-meta">
    <div><strong>Rating Code:</strong> ${l.refCode || 'N/A'}</div>
    <div><strong>Submitted:</strong> ${submittedDate}</div>
    <div><strong>Status:</strong> <span class="status-label status-${l.status === 'published' ? 'published' : l.status === 'rejected' ? 'rejected' : l.status === 'expired' ? 'expired' : 'pending'}">${statusText}</span></div>
  </div>

  <h2 style="text-align:center; font-size:22px; margin-bottom:25px; color:#111;">${l.businessName || 'Business Proposal'}</h2>

  <div class="section-title">Business Information</div>
  <table class="detail-table">
    <tr><td>Role</td><td>${l.role || 'N/A'}</td></tr>
    <tr><td>Interested In</td><td>${l.interest || 'N/A'}</td></tr>
    <tr><td>Established</td><td>${l.established || 'N/A'}</td></tr>
    <tr><td>Industry</td><td>${l.industry || 'N/A'}</td></tr>
    <tr><td>Location</td><td>${l.district || 'N/A'}</td></tr>
    <tr><td>Employees</td><td>${l.employees || 'N/A'}</td></tr>
    <tr><td>Legal Entity</td><td>${l.entity || l.entityType || 'N/A'}</td></tr>
    <tr><td>Short Description</td><td>${l.shortDescription || l.shortdesc || 'N/A'}</td></tr>
  </table>

  <div class="section-title">Financial Information</div>
  <table class="detail-table">
    <tr><td>Monthly Sales</td><td>${fmtMoney(l.monthlySales || l.monthlysales)}</td></tr>
    <tr><td>Yearly Sales</td><td>${fmtMoney(l.yearlySales || l.yearlysales)}</td></tr>
    <tr><td>Investment Required</td><td>${fmtMoney(l.investmentRequired)}</td></tr>
    <tr><td>% Willing to Sell</td><td>${l.percentToSell || l.percent || 'N/A'}%</td></tr>
    <tr><td>Physical Asset Value</td><td>${fmtMoney(l.assetValue || l.assetvalue)}</td></tr>
  </table>

  ${l.products ? '<div class="section-title">Products & Services</div><div class="desc-block">' + l.products + '</div>' : ''}
  ${l.highlights ? '<div class="section-title">Business Highlights</div><div class="desc-block">' + l.highlights + '</div>' : ''}
  ${l.facility ? '<div class="section-title">Facility Details</div><div class="desc-block">' + l.facility + '</div>' : ''}
  ${l.funding ? '<div class="section-title">Funding Details</div><div class="desc-block">' + l.funding + '</div>' : ''}
  ${l.assets ? '<div class="section-title">Assets</div><div class="desc-block">' + l.assets + '</div>' : ''}

  <div class="section-title">Contact Details</div>
  <table class="detail-table">
    <tr><td>Contact Name</td><td>${l.contactName || l.contactname || 'N/A'}</td></tr>
    <tr><td>Phone</td><td>${l.phone || 'N/A'}</td></tr>
    <tr><td>Email</td><td>${l.email || 'N/A'}</td></tr>
  </table>

  ${(l.services && l.services.length > 0) ? '<div class="section-title">Selected Professional Services</div><table class="detail-table">' + l.services.map(s => '<tr><td>✓ ' + s + '</td><td></td></tr>').join('') + '</table>' : ''}

  ${l.rejectionReason ? '<div class="section-title" style="color:#dc3545;">Rejection Reason</div><div class="desc-block" style="background:#fff5f5; border-left: 4px solid #dc3545;">' + l.rejectionReason + '</div>' : ''}

  <div class="pdf-footer">
    <p>Generated by HelaInvest Platform | Rating Code: ${l.refCode || 'N/A'} | Date: ${new Date().toLocaleDateString()}</p>
    <p>This document is auto-generated and valid for reference purposes only.</p>
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
    if (!localStorage.getItem(this.categoriesKey)) {
      const seedData = [
        { id: '1', name: 'IT & Software', active: true },
        { id: '2', name: 'Finance, Accounting & Audit', active: false },
        { id: '3', name: 'Banking & Insurance', active: false },
        { id: '4', name: 'Sales, Marketing & Business Dev.', active: false },
        { id: '5', name: 'HR, Training & Recruitment', active: false },
        { id: '6', name: 'Corporate Management / Strategy', active: false },
        { id: '7', name: 'Office Admin & Secretarial', active: false },
        { id: '8', name: 'Technical, Engineering & Industrial', active: false },
        { id: '9', name: 'Hospitality, Tourism & Logistics', active: false },
        { id: '10', name: 'Medical, Nursing & Legal', active: false }
      ];
      localStorage.setItem(this.categoriesKey, JSON.stringify(seedData));
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

// Test data injection removed — production-ready
