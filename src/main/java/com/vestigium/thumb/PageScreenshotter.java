package com.vestigium.thumb;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.Frame;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PageScreenshotter {

    private static final String UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    public byte[] screenshotPng(String url) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                    .setHeadless(true)
                    .setArgs(List.of("--disable-blink-features=AutomationControlled")));
            try {
                BrowserContext ctx = browser.newContext(new Browser.NewContextOptions()
                        .setViewportSize(1280, 720)
                        .setUserAgent(UA)
                        .setLocale("en-US")
                        .setTimezoneId("Europe/Warsaw")
                        .setExtraHTTPHeaders(Map.of("Accept-Language", "en-US,en;q=0.9")));
                try {
                    Page page = ctx.newPage();
                    // Reduce obvious automation signals.
                    page.addInitScript("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");
                    page.navigate(url, new Page.NavigateOptions()
                            .setTimeout(Duration.ofSeconds(25).toMillis())
                            .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));
                    // Small delay to let above-the-fold render.
                    page.waitForTimeout(800);

                    // Site-specific dismissals to avoid consent popups covering screenshots.
                    if (isInstagram(url)) {
                        // Instagram often shows login prompts or requires longer load times.
                        // Wait longer and try to dismiss login prompts.
                        page.waitForTimeout(2000);
                        dismissInstagramLoginPrompt(page);
                        page.waitForTimeout(1000);
                        // Try to wait for actual content to appear
                        try {
                            page.waitForSelector("article, img[src*='instagram'], [role='main']", 
                                new Page.WaitForSelectorOptions().setTimeout(3000));
                        } catch (Exception ignored) {
                            // Content might not load, continue anyway
                        }
                    } else if (isYouTube(url)) {
                        // YouTube shows cookie consent dialogs, especially for channel pages.
                        page.waitForTimeout(1000);
                        dismissYouTubeCookieConsent(page);
                        // Wait longer for content to load after accepting cookies
                        page.waitForTimeout(2000);
                        // Try to wait for actual content to appear
                        try {
                            page.waitForSelector("ytd-channel-name, ytd-video-meta-block, ytd-rich-grid-media, img[src*='ytimg'], [id='content']", 
                                new Page.WaitForSelectorOptions().setTimeout(5000));
                        } catch (Exception ignored) {
                            // Content might not load, continue anyway
                        }
                        page.waitForTimeout(1000);
                    } else if (isRedgifs(url)) {
                        dismissRedgifsConsent(page);
                        page.waitForTimeout(400);
                    } else if (isPornhub(url)) {
                        // Pornhub shows age verification popup
                        page.waitForTimeout(1000);
                        dismissPornhubConsent(page);
                        page.waitForTimeout(1000);
                    } else if (isReddit(url)) {
                        // Reddit popups can be slow to appear.
                        page.waitForTimeout(1000);
                        dismissRedditCookiePopup(page);
                        page.waitForTimeout(500);
                        // After clicking popups, Reddit sometimes shifts focus or scroll.
                        // Ensure we are back at the very top for a clean screenshot.
                        page.evaluate("window.scrollTo(0, 0)");
                        page.waitForTimeout(200);
                    } else if (isCivitai(url)) {
                        page.waitForTimeout(1000);
                        dismissCivitaiConsent(page);
                        page.waitForTimeout(800);
                    } else if (isImgur(url)) {
                        page.waitForTimeout(1000);
                        dismissImgurConsent(page);
                        page.waitForTimeout(800);
                    } else if (isGoogleSearch(url)) {
                        page.waitForTimeout(800);
                        dismissGoogleConsent(page);
                        page.waitForTimeout(800);
                    }

                    return page.screenshot(new Page.ScreenshotOptions()
                            .setFullPage(false));
                } finally {
                    ctx.close();
                }
            } finally {
                browser.close();
            }
        }
    }

    private static boolean isRedgifs(String url) {
        return host(url).map(h -> h.endsWith("redgifs.com")).orElse(false);
    }

    private static boolean isPornhub(String url) {
        return host(url).map(h -> h.contains("pornhub.com")).orElse(false);
    }

    private static boolean isInstagram(String url) {
        return host(url).map(h -> h.contains("instagram.com")).orElse(false);
    }

    private static boolean isYouTube(String url) {
        return host(url).map(h -> h.contains("youtube.com") || h.contains("youtu.be")).orElse(false);
    }

    private static boolean isReddit(String url) {
        return host(url).map(h -> h.contains("reddit.com")).orElse(false);
    }

    private static boolean isCivitai(String url) {
        return host(url).map(h -> h.contains("civitai.com")).orElse(false);
    }

    private static boolean isGoogleSearch(String url) {
        return host(url).map(h -> h.contains("google.")).orElse(false)
                && url.contains("/search");
    }

    private static boolean isImgur(String url) {
        return host(url).map(h -> h.contains("imgur.com")).orElse(false);
    }

    private static Optional<String> host(String url) {
        try {
            var uri = URI.create(url);
            var host = uri.getHost();
            if (host == null || host.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(host.toLowerCase());
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static void dismissRedgifsConsent(Page page) {
        // Best-effort; Redgifs often shows cookie + age/consent dialogs.
        tryClick(page, "button:has-text(\"Accept all\")", 2000);
        tryClick(page, "button:has-text(\"I agree\")", 2000);
        // Some variants use different wording.
        tryClick(page, "button:has-text(\"Accept\")", 1500);
        tryClick(page, "button:has-text(\"Agree\")", 1500);
    }

    private static void dismissPornhubConsent(Page page) {
        // Pornhub's age verification popup.
        // Usually contains "Enter" or "I am 18" in various languages.
        tryClick(page, "button:has-text(\"Enter\")", 2000);
        tryClick(page, "button:has-text(\"Mam ukończone 18 lat\")", 2000);
        tryClick(page, "#age-verification-container button", 1500);
        tryClick(page, ".age-verification-wrapper button", 1500);

        // Wait a bit for cookie consent to appear if it's separate
        page.waitForTimeout(500);

        // Cookie consent
        tryClick(page, "button:has-text(\"Akceptuj Wszystkie Pliki Cookie\")", 2000);
        tryClick(page, "button:has-text(\"Accept All Cookies\")", 2000);
        tryClick(page, "button:has-text(\"Accept All\")", 2000);
    }

    private static void dismissYouTubeCookieConsent(Page page) {
        // YouTube shows cookie consent dialogs, especially for channel pages.
        // Accept cookies to allow content to load properly.
        tryClick(page, "button:has-text('Accept all')", 2000);
        tryClick(page, "button:has-text('Accept All')", 2000);
        tryClick(page, "button:has-text('I agree')", 2000);
        tryClick(page, "button:has-text('I Agree')", 2000);
        // YouTube sometimes uses different button text
        tryClick(page, "button[aria-label*='Accept']", 2000);
        tryClick(page, "ytd-consent-bump-v2-lightbox button", 2000);
        // Try to find accept button in consent dialog
        tryClick(page, "[role='dialog'] button:has-text('Accept all')", 1500);
        tryClick(page, "[role='dialog'] button:has-text('I agree')", 1500);
    }

    private static void dismissInstagramLoginPrompt(Page page) {
        // Instagram often shows cookie consent dialogs first.
        // Accept cookies to allow content to load.
        tryClick(page, "button:has-text('Allow all cookies')", 2000);
        tryClick(page, "button:has-text('Allow All Cookies')", 2000);
        tryClick(page, "button:has-text('Accept all')", 2000);
        tryClick(page, "button:has-text('Accept All')", 2000);
        tryClick(page, "button:has-text('Accept')", 1500);
        
        // Instagram often shows login prompts or "Not Now" buttons.
        // Try to dismiss these to see public content.
        tryClick(page, "button:has-text('Not Now')", 2000);
        tryClick(page, "button:has-text('Not now')", 2000);
        tryClick(page, "a[href*='/accounts/login/?next=']", 1000);
        // Sometimes there's a close button on modals
        tryClick(page, "button[aria-label='Close']", 1000);
        tryClick(page, "svg[aria-label='Close']", 1000);
        // Try to find and click away from login modals
        tryClick(page, "[role='dialog'] button:has-text('Not Now')", 1500);
    }

    private static void dismissCivitaiConsent(Page page) {
        // Civitai consent banner often blocks content.
        waitForAnyVisible(page, new String[] {
                "button:has-text(\"Accept all & visit the site\")",
                "#onetrust-accept-btn-handler",
            "[aria-label=\"Accept all & visit the site\"]",
            "#sp_message_container",
            "iframe[id^='sp_message_iframe']"
        }, 4000);
        tryClick(page, "button:has-text(\"Accept all & visit the site\")", 3500);
        tryClick(page, "button:has-text(\"Accept all & visit the site\")", 3500, true);
        tryClick(page, "button#onetrust-accept-btn-handler", 3000, true);
        tryClick(page, "button[aria-label=\"Accept all & visit the site\"]", 3000, true);
        tryClick(page, "[role='dialog'] button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClick(page, ".ot-sdk-container button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClick(page, "#sp_message_container button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClick(page, "#sp_message_container button:has-text(\"Accept all\")", 2500, true);
        tryClick(page, "text=Accept all & visit the site", 3000, true);
        tryClick(page, "button:has-text(\"Accept all\")", 2000);
        tryClick(page, "button:has-text(\"Accept All\")", 2000);
        tryClick(page, "button:has-text(\"I agree\")", 2000);
        tryClick(page, "button:has-text(\"I Agree\")", 2000);
        // Sometimes rendered inside an iframe
        tryClickInFrames(page, "button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClickInFrames(page, "button#onetrust-accept-btn-handler", 3000, true);
        tryClickInFrames(page, "button[aria-label=\"Accept all & visit the site\"]", 3000, true);
        tryClickInFrames(page, "[role='dialog'] button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClickInFrames(page, ".ot-sdk-container button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClickInFrames(page, "#sp_message_container button:has-text(\"Accept all & visit the site\")", 3000, true);
        tryClickInFrames(page, "#sp_message_container button:has-text(\"Accept all\")", 2500, true);
        tryClickInFrames(page, "text=Accept all & visit the site", 3000, true);
        tryClickInFrames(page, "button:has-text(\"Accept all\")", 2000);
        tryClickInFrames(page, "button:has-text(\"I agree\")", 2000);
        clickByText(page, "Accept all & visit the site");
        clickByTextContains(page, "Accept all", "visit the site");
        clickByTextDeep(page, "Accept all & visit the site");
        clickByTextDeepInFrames(page, "Accept all & visit the site");
    }

    private static void dismissGoogleConsent(Page page) {
        // Google consent dialog on search results (EU/EEA/PL).
        tryClick(page, "button:has-text(\"Accept all\")", 2000);
        tryClick(page, "button:has-text(\"I agree\")", 2000);
        tryClick(page, "button:has-text(\"Zaakceptuj wszystko\")", 2500);
        tryClick(page, "button:has-text(\"Akceptuj wszystko\")", 2500);
        tryClick(page, "button:has-text(\"Zaakceptuj wszystko\")", 2500);
        tryClick(page, "button:has-text(\"Accept all\")", 2000);
        // Many Google consent dialogs are inside iframes.
        tryClickInFrames(page, "button:has-text(\"Accept all\")", 2000);
        tryClickInFrames(page, "button:has-text(\"I agree\")", 2000);
        tryClickInFrames(page, "button:has-text(\"Zaakceptuj wszystko\")", 2500);
        tryClickInFrames(page, "button:has-text(\"Akceptuj wszystko\")", 2500);
    }

    private static void dismissImgurConsent(Page page) {
        // Imgur consent dialog
        tryClick(page, "button:has-text(\"Consent\")", 2500);
        tryClick(page, "button:has-text(\"Accept all\")", 2500);
        tryClick(page, "button:has-text(\"I agree\")", 2500);
        tryClickInFrames(page, "button:has-text(\"Consent\")", 2500);
        tryClickInFrames(page, "button:has-text(\"Accept all\")", 2500);
    }

    private static void dismissRedditCookiePopup(Page page) {
        // Reddit's cookie banner often reloads the page if you click "Accept All".
        // The user wants to click the 'X' button in the corner of the popup.
        // We try multiple common selectors for the 'X' button or the reject button.
        tryClick(page, "button[aria-label='Close']", 2000);
        tryClick(page, "button:has-text('Reject Optional Cookies')", 1000);
        // Sometimes it's a plain 'X' in a button or a div acting as a button
        tryClick(page, "button:has-text('X')", 1000);
        tryClick(page, "div[role='button']:has-text('X')", 1000);
        // Overlays often have 'close' in their class or ID
        tryClick(page, "[class*='close']", 1000);
        // Shreddit (new Reddit) specific selectors
        tryClick(page, "shreddit-experience-tree button[aria-label='Close']", 1000);
        tryClick(page, "shreddit-experience-tree button:has-text('Reject')", 1000);
    }

    private static void tryClick(Page page, String selector, int timeoutMs) {
        tryClick(page, selector, timeoutMs, false);
    }

    private static void tryClick(Page page, String selector, int timeoutMs, boolean force) {
        try {
            Locator loc = page.locator(selector).first();
            if (loc.count() == 0) {
                return;
            }
            var opts = new Locator.ClickOptions().setTimeout(timeoutMs);
            if (force) {
                opts.setForce(true);
            }
            loc.click(opts);
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void tryClickInFrames(Page page, String selector, int timeoutMs) {
        tryClickInFrames(page, selector, timeoutMs, false);
    }

    private static void tryClickInFrames(Page page, String selector, int timeoutMs, boolean force) {
        try {
            for (Frame frame : page.frames()) {
                try {
                    Locator loc = frame.locator(selector).first();
                    if (loc.count() == 0) continue;
                    var opts = new Locator.ClickOptions().setTimeout(timeoutMs);
                    if (force) {
                        opts.setForce(true);
                    }
                    loc.click(opts);
                } catch (Exception ignored) {
                    // ignore
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void clickByText(Page page, String text) {
        try {
            page.evaluate(
                    "(t) => {" +
                            "const btns = Array.from(document.querySelectorAll('button'))" +
                            ".filter(b => (b.innerText || '').trim() === t);" +
                            "if (btns.length > 0) btns[0].click();" +
                            "}",
                    text
            );
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void clickByTextContains(Page page, String part1, String part2) {
        try {
            page.evaluate(
                    "([p1,p2]) => {" +
                            "const btns = Array.from(document.querySelectorAll('button'))" +
                            ".filter(b => {" +
                            "const t=(b.innerText||'').trim();" +
                            "return t.includes(p1) && t.includes(p2);" +
                            "});" +
                            "if (btns.length > 0) btns[0].click();" +
                            "}",
                    new String[] { part1, part2 }
            );
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void clickByTextDeep(Page page, String text) {
        try {
            page.evaluate(
                    "(t) => {" +
                            "const seen = new Set();" +
                            "const collect = (root) => {" +
                            "if (!root || seen.has(root)) return [];" +
                            "seen.add(root);" +
                            "let nodes = [];" +
                            "const tree = root.querySelectorAll ? root.querySelectorAll('*') : [];" +
                            "for (const el of tree) {" +
                            "  if (el.tagName === 'BUTTON') nodes.push(el);" +
                            "  if (el.shadowRoot) nodes = nodes.concat(collect(el.shadowRoot));" +
                            "}" +
                            "return nodes;" +
                            "};" +
                            "const buttons = collect(document);" +
                            "for (const b of buttons) {" +
                            "  const txt = (b.innerText || b.textContent || '').trim();" +
                            "  if (txt === t) { b.click(); return; }" +
                            "}" +
                            "}",
                    text
            );
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void clickByTextDeepInFrames(Page page, String text) {
        try {
            for (Frame frame : page.frames()) {
                try {
                    frame.evaluate(
                            "(t) => {" +
                                    "const seen = new Set();" +
                                    "const collect = (root) => {" +
                                    "if (!root || seen.has(root)) return [];" +
                                    "seen.add(root);" +
                                    "let nodes = [];" +
                                    "const tree = root.querySelectorAll ? root.querySelectorAll('*') : [];" +
                                    "for (const el of tree) {" +
                                    "  const role = (el.getAttribute && el.getAttribute('role')) || '';" +
                                    "  if (el.tagName === 'BUTTON' || role === 'button' || el.tagName === 'A') nodes.push(el);" +
                                    "  if (el.shadowRoot) nodes = nodes.concat(collect(el.shadowRoot));" +
                                    "}" +
                                    "return nodes;" +
                                    "};" +
                                    "const nodes = collect(document);" +
                                    "for (const n of nodes) {" +
                                    "  const txt = (n.innerText || n.textContent || '').trim();" +
                                    "  if (txt === t) { n.click(); return; }" +
                                    "}" +
                                    "}",
                            text
                    );
                } catch (Exception ignored) {
                    // ignore
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void waitForAnyVisible(Page page, String[] selectors, int timeoutMs) {
        long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start < timeoutMs) {
            for (String selector : selectors) {
                try {
                    Locator loc = page.locator(selector).first();
                    if (loc.count() > 0 && loc.isVisible()) {
                        return;
                    }
                } catch (Exception ignored) {
                    // ignore
                }
            }
            page.waitForTimeout(200);
        }
    }
}


