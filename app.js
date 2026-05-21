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
  
  if (user) {
      const roleLabel = user.role === 'publisher' ? '(Publisher)' : '(Client)';
      const displayName = user.email ? user.email.substring(0, 5) : user.name.split(' ')[0];
      const loggedInHTML = `
          <span style="color:#003399; font-weight:700; font-size:0.8rem; margin-right:10px;">
              Hi, ${displayName} ${roleLabel}
          </span>
          <a href="#" onclick="logoutUser(event)" class="tj-btn-text" style="color:#cc0000; padding:0; text-decoration:none; font-size:0.8rem;">Logout</a>
      `;
      if (topAuth) topAuth.innerHTML = loggedInHTML;
      if (headerAuth) headerAuth.innerHTML = loggedInHTML;
  } else {
      const loggedOutHTML = `
          <a href="login.html" class="login-link-new">Login</a>
          <a href="register.html" class="btn-register-new">Register</a>
      `;
      const topLoggedOutHTML = `<a href="login.html" class="login-link-new" style="font-size:0.78rem;">Login</a>`;
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
      alert("You must be logged in to post a listing.");
      window.location.href = 'login.html';
      return;
  }
  if (user.role !== 'publisher') {
      alert("Only Job Publishers can post listings. You are registered as a Normal Client.");
      return;
  }
  window.location.href = 'submit.html';
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

// Initialize Stores
const store = new ListingStore();
const authStore = new AuthStore();
const categoryStore = new CategoryStore();
const settingsStore = new SettingsStore();

// --- Inject Test Pending Post for Admin Review Testing ---
(function injectTestPost() {
    const listings = store.getAll();
    const hasTestPost = listings.find(l => l.refCode === 'TEST-999999');
    if (!hasTestPost) {
        store.save({
            id: 'test-pending-1',
            refCode: 'TEST-999999',
            status: 'review', // Ready for admin to review
            businessName: 'Lanka Tech Innovators',
            role: 'Business Owner',
            interest: 'Selling the Business',
            established: '2018',
            industry: 'IT & Software',
            district: 'Colombo',
            employees: '45',
            entity: 'Private Limited Company',
            shortdesc: 'A leading AI solutions provider in Sri Lanka.',
            contactname: 'Kasun Bandara',
            phone: '+94 77 999 8888',
            email: 'kasun@lankatech.lk',
            products: 'Enterprise AI Chatbots, Data Analytics Dashboards. Used by top banks and telecom companies.',
            highlights: 'Over 20 enterprise clients, 150M LKR Annual Recurring Revenue, Awarded Best AI Startup 2023.',
            facility: '4,000 sq ft modern office space in Orion City, Colombo 09 (Leased).',
            additionalnotes: 'Kasun (CEO) owns 70%, CTO owns 30%.',
            monthlysales: '12500000',
            yearlysales: '150000000',
            percent: '100',
            investmentRequired: '500000000',
            funding: 'Founders are relocating abroad and wish to sell the entire company.',
            assets: 'High-end server racks, 50 Apple MacBooks, Office Furniture, proprietary AI source code.',
            assetvalue: '25000000',
            plan: 'fast-track'
        });
        console.log("Injected Test Pending Post for Review.");
    }
})();
