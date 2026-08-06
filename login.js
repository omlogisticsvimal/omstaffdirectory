// Supabase Configuration
const SUPABASE_URL = "https://npiketzhgsckkacbxxqb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5waWtldHpoZ3Nja2thY2J4eHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzY5MTYsImV4cCI6MjEwMTYxMjkxNn0.QeXDPFLKiFgbBYJ1nGY4Hw17LJba53-4hD7cYfoaf10";

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Auto-redirect if already logged in
if (localStorage.getItem("login") === "yes") {
    window.location.href = "dashboard.html";
}

async function login() {
    let u = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value.trim();
    let msgEl = document.getElementById("msg");

    if (msgEl) {
        msgEl.style.color = "#2563eb";
        msgEl.innerText = "Checking credentials...";
    }

    try {
        // Query app_users table from Supabase using ilike for username matching
        const { data, error } = await supabaseClient
            .from('app_users')
            .select('*')
            .ilike('username', u)
            .eq('password', p);

        if (error || !data || data.length === 0) {
            if (msgEl) {
                msgEl.style.color = "#dc2626";
                msgEl.innerText = "Invalid Username or Password!";
            }
            return;
        }

        const userRecord = data[0];

        // Save session data
        localStorage.setItem("login", "yes");
        localStorage.setItem("currentUser", userRecord.username);
        localStorage.setItem("userRole", userRecord.role || "User");

        // Redirect to dashboard
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Login System Error:", err);
        if (msgEl) {
            msgEl.style.color = "#dc2626";
            msgEl.innerText = "Login failed. Check internet connection!";
        }
    }
}