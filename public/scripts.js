document.addEventListener("DOMContentLoaded", () => {
    const siteHeaderHTML = `
        <nav class="site-nav">
            <a href="/" class="logo">NJS.dev</a>
            <div class="nav-links">
                <a href="/applications">Applications</a>
                <a href="/projects">Projects</a>
                <a href="/other">Other</a>
            </div>
        </nav>

        <!-- GOOGLE ADS PLACEHOLDER -->
        <!-- Paste your Google AdSense script tag in the <head> above, and your ad unit code here -->
        <div class="ad-container">
            <div class="ad-label">Advertisement</div>
            <div class="ad-placeholder-text">Google Ads Unit (Insert script here)</div>
        </div>
    `;

    // Check if there's a container to inject into, otherwise inject into body
    const container = document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('afterbegin', siteHeaderHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', siteHeaderHTML);
    }
});
