const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('i:/job/admin.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });

// Mock alert
dom.window.alert = function(msg) {
    console.log("ALERT CALLED:", msg);
};

// Fire the login
setTimeout(() => {
    try {
        const pinInput = dom.window.document.getElementById('admin-pin');
        pinInput.value = 'hela2024';
        
        const btn = dom.window.document.getElementById('login-btn');
        btn.click();

        console.log("Login screen display:", dom.window.document.getElementById('login-screen').style.display);
    } catch (e) {
        console.log("Error in test:", e);
    }
}, 500);
