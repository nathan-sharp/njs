document.addEventListener("DOMContentLoaded", () => {
    // Inject Google AdSense script
    const adScript = document.createElement('script');
    adScript.async = true;
    adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8060016937826958";
    adScript.crossOrigin = "anonymous";
    document.head.appendChild(adScript);

    const siteHeaderHTML = `
        <nav class="site-nav">
            <a href="/" class="logo">NJS.dev</a>
            <div class="nav-links">
                <a href="/applications">Applications</a>
                <a href="/projects">Projects</a>
                <a href="/other">Other</a>
            </div>
        </nav>

        <!-- GOOGLE ADS -->
        <div class="ad-container">
            <div class="ad-label" style="font-size: 0.8em; color: #888; text-align: center; margin-bottom: 5px;">Advertisement</div>
            <!-- vertical_banner -->
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-8060016937826958"
                 data-ad-slot="7441394361"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
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
